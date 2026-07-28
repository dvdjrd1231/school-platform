import sanitizeHtml from "sanitize-html"

/**
 * Clean rich-text lesson content before it is stored.
 *
 * Reading lessons are authored as HTML so teachers get headings, lists, tables
 * and images. That HTML is then rendered into other people's browsers, which
 * makes it an injection path: a teacher account — or anyone who gets hold of
 * one — could otherwise run script in every student's session. Sanitising on
 * the way *in* means the stored value is already safe, so no renderer has to
 * remember to escape it.
 *
 * The allowlist matches what the editor can produce. Anything else is dropped
 * rather than escaped, so pasting from Word doesn't litter the page with markup.
 */

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "pre",
  "code",
  "span",
  "div",
]

export function sanitiseLessonHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      // Only the alignment classes the editor sets; a free-for-all on class
      // would let content restyle the surrounding page.
      "*": ["class"],
    },
    allowedClasses: {
      "*": ["text-left", "text-center", "text-right"],
    },
    // http(s) and mailto only. Blocks javascript: and data: URLs, the two that
    // turn a link or an image into script execution.
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    // Anything opening a new tab gets noopener, or the opened page can navigate
    // this one via window.opener.
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
          : attribs,
      }),
    },
    // Drop the contents of anything not allowed, rather than leaving stray text
    // from a <script> body sitting in the page.
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
  })
}

/** Plain text of some rich content, for previews and search. */
export function htmlToPlainText(html: string, limit = 300): string {
  const text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim()
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text
}
