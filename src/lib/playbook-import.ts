/**
 * Parse pasted notes into playbook candidates by splitting on headings.
 * Supports Markdown-style headings (# Title, ## Title) and plain lines as titles.
 */

export type ParsedPlaybook = {
  title: string;
  content: string;
};

/**
 * Split text by Markdown headings (# Title, ## Title, etc.).
 * Each heading becomes a playbook title; content under it becomes playbook content.
 * If no headings found, treats the whole text as one playbook (first line = title, rest = content).
 */
export function parseBulkPlaybooks(text: string): ParsedPlaybook[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const headingRegex = /^(#{1,6})\s*(.+)$/gm;
  const matches: { index: number; length: number; title: string }[] = [];
  let match;
  while ((match = headingRegex.exec(trimmed)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      title: match[2].trim(),
    });
  }

  if (matches.length === 0) {
    const lines = trimmed.split(/\n/);
    const firstLine = lines[0]?.trim() ?? "";
    const rest = lines.slice(1).join("\n").trim();
    return [{ title: firstLine || "Imported playbook", content: rest }];
  }

  const result: ParsedPlaybook[] = [];
  for (let i = 0; i < matches.length; i++) {
    const contentStart = matches[i].index + matches[i].length;
    const contentEnd =
      i + 1 < matches.length ? matches[i + 1].index : trimmed.length;
    let content = trimmed.slice(contentStart, contentEnd).trim();
    content = content.replace(/^\n+/, "").trim();
    result.push({
      title: matches[i].title,
      content,
    });
  }

  return result.filter((p) => p.title.length > 0);
}
