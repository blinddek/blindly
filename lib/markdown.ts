/**
 * Minimal markdown-to-HTML renderer.
 * Handles: headings, bold, italic, links, images, lists, blockquotes,
 * code blocks, inline code, horizontal rules, paragraphs.
 *
 * Content is admin-entered (trusted) so dangerouslySetInnerHTML is safe.
 */
export function markdownToHtml(md: string): string {
  if (!md) return "";

  let html = md
    // Code blocks (fenced)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      const cls = lang ? ` class="language-${lang}"` : "";
      return `<pre><code${cls}>${escapeHtml(code.trim())}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, (_m, code) => `<code>${escapeHtml(code)}</code>`)
    // Images (before links)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
    // Headings
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
    // Horizontal rules
    .replace(/^---$/gm, "<hr />");

  // Process blocks: split on double newlines, wrap non-HTML in <p>
  const blocks = html.split(/\n{2,}/);
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Already wrapped in an HTML tag
      if (/^<(h[1-6]|pre|blockquote|ul|ol|hr|img|div)/.test(trimmed)) {
        return trimmed;
      }
      // List items → wrap in <ul>
      if (/^<li>/.test(trimmed)) {
        return `<ul>${trimmed}</ul>`;
      }
      // Handle unordered list lines within a block
      if (/^- /.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .map((line) => line.replace(/^- (.+)$/, "<li>$1</li>"))
          .join("");
        return `<ul>${items}</ul>`;
      }
      // Handle ordered list lines
      if (/^\d+\. /.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .map((line) => line.replace(/^\d+\. (.+)$/, "<li>$1</li>"))
          .join("");
        return `<ol>${items}</ol>`;
      }
      // Convert single newlines to <br> within paragraphs
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Estimate reading time in minutes */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
