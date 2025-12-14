import { WikiPage, AzureWikiAdapter } from "@/adapters/azure-wiki.adapter";
import { SupabaseAdapter } from "@/adapters/supabase.adapter";

export class EmbeddingService {
  constructor(
    private azureWikiAdapter: AzureWikiAdapter,
    private supabaseAdapter: SupabaseAdapter
  ) {}

  async processEmbedding(page: WikiPage, type: "page" | "tree") {
    if (type === "page") {
      await this.processPage(page);
    } else if (type === "tree") {
      await this.processTree(page);
    }
  }

  private async processPage(page: WikiPage) {
    console.log("Processing page:", page);
    if (!page.url) {
      console.warn(`Skipping page without URL: ${page.path}`);
      return;
    }

    try {
      console.log(`Processing page: ${page.path}`);
      const content = await this.azureWikiAdapter.getPageContent(page.url);

      if (!content) {
        console.warn(`Empty content for page: ${page.path}`);
        return;
      }

      const metadata = {
        path: page.path,
        url: page.url,
        gitItemPath: page.gitItemPath,
        isParentPage: page.isParentPage,
        remoteUrl: page.remoteUrl,
      };

      await this.supabaseAdapter.saveDocument(content, metadata);

      console.log(`Successfully embedded page: ${page.path}`);
    } catch (error) {
      console.error(`Error processing page ${page.path}:`, error);
    }
  }

  private async processTree(page: WikiPage) {
    await this.processPage(page);

    if (page.subPages && page.subPages.length > 0) {
      for (const subPage of page.subPages) {
        await this.processTree(subPage);
      }
    }
  }
}
