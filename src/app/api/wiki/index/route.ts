import { NextRequest, NextResponse } from "next/server";
import { AzureWikiAdapter } from "@/adapters/azure-wiki.adapter";
import { SupabaseAdapter } from "@/adapters/supabase.adapter";
import { OpenIAAdapter } from "@/adapters/openia.adapter";
import { AdapterFactory } from "@/adapters/factory";
import {
  normalizeContent,
  hashContent,
  chunkMarkdown,
} from "@/utils/content-utils";
import { IndexResult } from "@/types/wiki-pages.types";

/**
 * POST /api/wiki/index
 * Lazy embedding endpoint with hash-based reindexing
 *
 * Request body:
 * {
 *   "pageId": "string (optional)",
 *   "path": "string"
 * }
 */
export async function POST(request: NextRequest) {
  // Store body variables at the start to avoid re-reading in error handler
  let pageId: string | undefined;
  let path: string | undefined;
  let title: string | undefined;
  let contentHash: string | undefined;

  try {
    const body = await request.json();
    const { pageId: requestPageId, path: requestPath } = body;

    if (!requestPath) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    // Use path as stable page_id if not provided
    const localPath = requestPath as string;
    const localPageId = (requestPageId || localPath) as string;
    const localTitle = (localPath.split("/").pop()?.replace(".md", "") ||
      localPath) as string;

    // Store for error handler
    path = localPath;
    pageId = localPageId;
    title = localTitle;

    console.log(`[Index] Starting indexing for page: ${localPageId}`);

    // Initialize adapters
    const azureWikiAdapter = AdapterFactory.createAdapter(
      "azure-wiki"
    ) as AzureWikiAdapter;
    const openIAAdapter = new OpenIAAdapter();
    const supabaseAdapter = new SupabaseAdapter(openIAAdapter);

    // Step 1: Fetch page from Azure Wiki
    console.log(`[Index] Fetching wiki tree to find page URL`);
    const tree = await azureWikiAdapter.getWikiTree();
    const page = findPageByPath(tree, localPath);

    if (!page || !page.url) {
      return NextResponse.json(
        { error: `Page not found: ${localPath}` },
        { status: 404 }
      );
    }

    console.log(`[Index] Fetching page content from Azure Wiki`);
    const markdown = await azureWikiAdapter.getPageContent(page.url);

    if (!markdown) {
      return NextResponse.json(
        { error: "Empty content received from Azure Wiki" },
        { status: 400 }
      );
    }

    // Step 2: Calculate content hash
    const normalizedContent = normalizeContent(markdown);
    const localContentHash = hashContent(normalizedContent);
    console.log(`[Index] Content hash: ${localContentHash}`);

    // Store for error handler
    contentHash = localContentHash;

    // Step 3: Check existing record in wiki_pages
    const existingRecord = await supabaseAdapter.getWikiPage(localPageId);

    // Step 4: Decision logic
    if (existingRecord) {
      console.log(
        `[Index] Found existing record with status: ${existingRecord.status}`
      );

      // If hash matches and status is ready, no need to reindex
      if (
        existingRecord.content_hash === localContentHash &&
        existingRecord.status === "ready"
      ) {
        console.log(`[Index] Content unchanged, skipping reindex`);
        const result: IndexResult = {
          indexed: true,
          changed: false,
          status: "ready",
          chunk_count: existingRecord.chunk_count,
        };
        return NextResponse.json(result);
      }

      console.log(`[Index] Content changed or status not ready, will reindex`);
    } else {
      console.log(`[Index] No existing record, will create and index`);
    }

    // Step 5: Update wiki_pages to processing status
    await supabaseAdapter.upsertWikiPage({
      page_id: localPageId,
      path: localPath,
      title: localTitle,
      content_hash: localContentHash,
      status: "processing",
      chunk_count: 0,
      last_error: null,
    });

    // Step 6: Reindexing - Delete old chunks
    console.log(`[Index] Deleting old chunks for page: ${localPageId}`);
    await supabaseAdapter.deleteDocumentsByPageId(localPageId);

    // Step 7: Generate chunks
    console.log(`[Index] Generating chunks from markdown`);
    const chunks = chunkMarkdown(normalizedContent);
    console.log(`[Index] Generated ${chunks.length} chunks`);

    // Step 8: Generate embeddings and insert documents
    const ingestedAt = new Date().toISOString();

    for (const chunk of chunks) {
      console.log(
        `[Index] Processing chunk ${chunk.chunk_index + 1}/${chunks.length}`
      );

      // Generate embedding
      const embedding = await openIAAdapter.embedding(chunk.content);

      // Prepare metadata
      const metadata = {
        kind: "azure_wiki",
        page_id: localPageId,
        path: localPath,
        title: localTitle,
        heading: chunk.heading,
        chunk_index: chunk.chunk_index,
        content_hash: localContentHash,
        ingested_at: ingestedAt,
      };

      // Insert document
      await supabaseAdapter.insertDocument(chunk.content, embedding, metadata);
    }

    // Step 9: Update wiki_pages to ready status
    console.log(`[Index] Updating wiki_pages to ready status`);
    await supabaseAdapter.upsertWikiPage({
      page_id: localPageId,
      path: localPath,
      title: localTitle,
      content_hash: localContentHash,
      status: "ready",
      chunk_count: chunks.length,
      last_indexed_at: new Date().toISOString(),
      last_error: null,
    });

    console.log(`[Index] Indexing completed successfully`);
    const result: IndexResult = {
      indexed: true,
      changed: true,
      status: "ready",
      chunk_count: chunks.length,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Index] Error during indexing:", error);

    // Try to update wiki_pages with error status
    try {
      if (pageId && path && title && contentHash) {
        const openIAAdapter = new OpenIAAdapter();
        const supabaseAdapter = new SupabaseAdapter(openIAAdapter);

        await supabaseAdapter.upsertWikiPage({
          page_id: pageId,
          path,
          title,
          content_hash: contentHash,
          status: "failed",
          last_error: error.message || "Unknown error during indexing",
        });
      }
    } catch (updateError) {
      console.error("[Index] Failed to update error status:", updateError);
    }

    const result: IndexResult = {
      indexed: false,
      changed: false,
      status: "failed",
      error: error.message || "Internal server error",
    };

    return NextResponse.json(result, { status: 500 });
  }
}

/**
 * Helper function to find a page by path in the wiki tree
 */
function findPageByPath(page: any, targetPath: string): any {
  if (page.path === targetPath) {
    return page;
  }

  if (page.subPages && page.subPages.length > 0) {
    for (const subPage of page.subPages) {
      const found = findPageByPath(subPage, targetPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
}
