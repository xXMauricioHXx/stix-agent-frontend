export interface WikiPage {
  path: string;
  order: number;
  isParentPage: boolean;
  gitItemPath: string;
  subPages: WikiPage[];
  url?: string;
  remoteUrl?: string;
  content?: string;
}

export class AzureWikiAdapter {
  private baseUrl =
    "https://dev.azure.com/StixFidelidade/Projetos/_apis/wiki/wikis/Projetos.wiki/pages";
  private apiVersion = "7.1";
  private authHeader = `Basic ${Buffer.from(
    `:${process.env.AZURE_WIKI_AUTH_TOKEN}`
  ).toString("base64")}`;

  private cookieHeader =
    "VstsSession=%7B%22PersistentSessionId%22%3A%224eaee6d0-e68c-4389-a9c2-112230fe907c%22%2C%22PendingAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22CurrentAuthenticationSessionId%22%3A%2200000000-0000-0000-0000-000000000000%22%2C%22SignInState%22%3A%7B%7D%7D; __RequestVerificationToken=DgInoGekDtcuEAvdmcQAren5xI-3CBMyMIrK5Q3T2gM84wdt-OrF8yj7aRksCjgSHeJ4BtLMi3uBCzSBZrBCL63xKOApN0uinkn27xeVd4g1; __RequestVerificationToken2c49194b0-08f2-4aef-a00d-c41737851a49=DgInoGekDtcuEAvdmcQAren5xI-3CBMyMIrK5Q3T2gM84wdt-OrF8yj7aRksCjgSHeJ4BtLMi3uBCzSBZrBCL63xKOApN0uinkn27xeVd4g1";

  async getWikiTree(): Promise<WikiPage> {
    const url = `${this.baseUrl}?path=%2FStix&recursionLevel=full&includeContent=true&api-version=${this.apiVersion}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: this.authHeader,
        Cookie: this.cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch wiki tree: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPageContent(pageUrl: string): Promise<string> {
    console.log(pageUrl);
    const params = new URLSearchParams({
      recursionLevel: "full",
      includeContent: "true",
      apiVersion: this.apiVersion,
    });
    const response = await fetch(`${pageUrl}?${params}`, {
      method: "GET",

      headers: {
        Accept: "application/json",
        Authorization: this.authHeader,
        Cookie: this.cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page content: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.content || "";

    // Extract IDs from the pageUrl
    // Format: https://dev.azure.com/{org}/{project}/_apis/wiki/wikis/{wikiId}/pages/...
    const urlMatch = pageUrl.match(
      /https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_apis\/wiki\/wikis\/([^\/]+)\/pages/
    );

    if (urlMatch && content) {
      const [, org, project, wikiId] = urlMatch;

      // Replace relative image paths with full authenticated URLs
      content = content.replace(
        /!\[(.*?)\]\((\/.attachments\/.+?)\)/g,
        (match: string, altText: string, imagePath: string) => {
          const imageUrl = `https://dev.azure.com/${org}/${project}/_apis/git/repositories/${wikiId}/Items?path=${imagePath}&download=false&resolveLfs=true&%24format=octetStream&api-version=5.0-preview.1&sanitize=true&versionDescriptor.version=wikiMaster`;
          return `![${altText}](${imageUrl})`;
        }
      );
    }

    return content;
  }
}
