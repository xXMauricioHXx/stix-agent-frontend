import { createHash } from "crypto";
import { ChunkResult } from "@/types/wiki-pages.types";

/**
 * Normalizes markdown content for consistent hashing
 * - Replaces \r\n with \n
 * - Collapses multiple spaces into single space
 * - Trims whitespace
 */
export function normalizeContent(markdown: string): string {
  return markdown.replace(/\r\n/g, "\n").replace(/ +/g, " ").trim();
}

/**
 * Creates SHA-256 hash of content
 */
export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Splits markdown content into chunks by headings and paragraphs
 * Strategy:
 * 1. Split by markdown headings (#, ##, ###, etc.)
 * 2. If chunk exceeds maxChunkSize, further split by paragraphs
 * 3. Return array with chunk_index, heading, and content
 */
export function chunkMarkdown(
  markdown: string,
  maxChunkSize: number = 1500
): ChunkResult[] {
  const chunks: ChunkResult[] = [];
  let chunkIndex = 0;

  // Split by headings (lines starting with #)
  const headingSections = splitByHeadings(markdown);

  for (const section of headingSections) {
    const { heading, content } = section;

    // If section is small enough, add as single chunk
    if (content.length <= maxChunkSize) {
      chunks.push({
        chunk_index: chunkIndex++,
        heading,
        content: content.trim(),
      });
    } else {
      // Split large sections by paragraphs
      const paragraphs = content.split(/\n\n+/);
      let currentChunk = "";

      for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim();
        if (!trimmedParagraph) continue;

        // If adding this paragraph exceeds limit, save current chunk and start new one
        if (
          currentChunk &&
          currentChunk.length + trimmedParagraph.length + 2 > maxChunkSize
        ) {
          chunks.push({
            chunk_index: chunkIndex++,
            heading,
            content: currentChunk.trim(),
          });
          currentChunk = trimmedParagraph;
        } else {
          currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
        }
      }

      // Add remaining content
      if (currentChunk.trim()) {
        chunks.push({
          chunk_index: chunkIndex++,
          heading,
          content: currentChunk.trim(),
        });
      }
    }
  }

  return chunks;
}

/**
 * Helper function to split markdown by headings
 */
function splitByHeadings(
  markdown: string
): Array<{ heading: string | null; content: string }> {
  const lines = markdown.split("\n");
  const sections: Array<{ heading: string | null; content: string }> = [];
  let currentHeading: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check if line is a heading (starts with #)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section if exists
      if (currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join("\n"),
        });
      }

      // Start new section
      currentHeading = headingMatch[2].trim();
      currentContent = [line]; // Include heading in content
    } else {
      currentContent.push(line);
    }
  }

  // Add final section
  if (currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join("\n"),
    });
  }

  return sections.length > 0
    ? sections
    : [{ heading: null, content: markdown }];
}
