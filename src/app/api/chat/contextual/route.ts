import { NextRequest, NextResponse } from "next/server";
import { SupabaseAdapter } from "@/adapters/supabase.adapter";
import { OpenIAAdapter } from "@/adapters/openia.adapter";
import { AzureWikiAdapter } from "@/adapters/azure-wiki.adapter";
import { AdapterFactory } from "@/adapters/factory";

/**
 * POST /api/chat/contextual
 * Contextual chat endpoint that filters search by page_id
 *
 * Request body:
 * {
 *   "question": "string",
 *   "pageId": "string",
 *   "path": "string (optional, used for fallback)"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, pageId, path, pageContent } = body;

    if (!question || !pageId) {
      return NextResponse.json(
        { error: "question and pageId are required" },
        { status: 400 }
      );
    }

    console.log(`[Contextual Chat] Question: ${question}, PageId: ${pageId}`);

    // Initialize adapters
    const openIAAdapter = new OpenIAAdapter();
    const supabaseAdapter = new SupabaseAdapter(openIAAdapter);

    let contextText = "";
    let usedFallback = false;

    try {
      // Try to search for similar documents filtered by page_id
      console.log(
        `[Contextual Chat] Searching for similar documents in page: ${pageId}`
      );
      const result = await supabaseAdapter.searchSimilarByPageId(
        question,
        pageId,
        5
      );

      if (result.documents && result.documents.length > 0) {
        contextText = result.contextText;
        console.log(
          `[Contextual Chat] Found ${result.documents.length} relevant chunks`
        );
      } else {
        // No indexed content found, use fallback
        console.log(
          `[Contextual Chat] No indexed content found, using fallback`
        );
        usedFallback = true;

        // Use provided pageContent if available, otherwise fetch from Azure Wiki
        if (pageContent && pageContent.trim()) {
          console.log(`[Contextual Chat] Using provided page content`);
          const limitedContent = pageContent.substring(0, 5000);
          contextText = `Conteúdo da página ${pageId}:\n\n${limitedContent}`;
        } else {
          contextText = await getFallbackContext(path || pageId);
        }
      }
    } catch (searchError) {
      console.error(
        "[Contextual Chat] Search error, using fallback:",
        searchError
      );
      usedFallback = true;

      // Use provided pageContent if available, otherwise fetch from Azure Wiki
      if (pageContent && pageContent.trim()) {
        console.log(
          `[Contextual Chat] Using provided page content (after error)`
        );
        const limitedContent = pageContent.substring(0, 5000);
        contextText = `Conteúdo da página ${pageId}:\n\n${limitedContent}`;
      } else {
        contextText = await getFallbackContext(path || pageId);
      }
    }

    // Generate answer using OpenAI
    console.log(`[Contextual Chat] Generating answer`);
    const answer = await openIAAdapter.chat(contextText, question);

    // Add note if using fallback
    let finalAnswer = answer;
    if (usedFallback) {
      finalAnswer = `${answer}\n\n---\n\n*Nota: Esta resposta foi gerada usando o conteúdo direto da página, pois a indexação ainda está em andamento.*`;
    }

    return NextResponse.json({
      answer: finalAnswer,
      usedFallback,
    });
  } catch (error: any) {
    console.error("[Contextual Chat] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Fallback: Fetch page content directly from Azure Wiki
 */
async function getFallbackContext(pathOrPageId: string): Promise<string> {
  try {
    console.log(
      `[Contextual Chat] Fetching fallback content for: ${pathOrPageId}`
    );

    const azureWikiAdapter = AdapterFactory.createAdapter(
      "azure-wiki"
    ) as AzureWikiAdapter;

    // Fetch tree to find page
    const tree = await azureWikiAdapter.getWikiTree();
    const page = findPageByPath(tree, pathOrPageId);

    if (!page || !page.url) {
      return `Não foi possível encontrar a página: ${pathOrPageId}`;
    }

    // Fetch content
    const content = await azureWikiAdapter.getPageContent(page.url);

    if (!content) {
      return `Conteúdo vazio para a página: ${pathOrPageId}`;
    }

    // Limit content to avoid token limits (keep first ~3000 chars)
    const limitedContent = content.substring(0, 3000);
    return `Conteúdo da página ${pathOrPageId}:\n\n${limitedContent}`;
  } catch (error: any) {
    console.error("[Contextual Chat] Fallback error:", error);
    return `Erro ao buscar conteúdo da página: ${error.message}`;
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
