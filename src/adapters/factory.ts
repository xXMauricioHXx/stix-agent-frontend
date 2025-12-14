import { AzureWikiAdapter } from "./azure-wiki.adapter";
import { OpenIAAdapter } from "./openia.adapter";
import { SupabaseAdapter } from "./supabase.adapter";

export class AdapterFactory {
  static createAdapter(
    type: string
  ): OpenIAAdapter | AzureWikiAdapter | SupabaseAdapter {
    switch (type) {
      case "openia":
        return new OpenIAAdapter();
      case "azure-wiki":
        return new AzureWikiAdapter();
      case "supabase":
        const openIAAdapter = new OpenIAAdapter();
        return new SupabaseAdapter(openIAAdapter);
      default:
        throw new Error(`Unknown adapter type: ${type}`);
    }
  }
}
