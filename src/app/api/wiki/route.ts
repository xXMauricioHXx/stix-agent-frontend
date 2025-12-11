import { NextResponse } from "next/server";
import { AzureWikiAdapter } from "@/adapters/azure-wiki.adapter";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const adapter = new AzureWikiAdapter();

  try {
    if (type === "tree") {
      const tree = await adapter.getWikiTree();
      return NextResponse.json(tree);
    } else if (type === "content") {
      const url = searchParams.get("url");
      if (!url) {
        return NextResponse.json(
          { error: "URL is required for content fetch" },
          { status: 400 }
        );
      }
      const content = await adapter.getPageContent(url);
      return NextResponse.json({ content });
    } else {
      return NextResponse.json(
        { error: "Invalid type parameter" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error fetching wiki data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
