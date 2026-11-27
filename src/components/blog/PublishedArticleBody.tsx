import type { CSSProperties } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import {
  citationIndexFromHref,
  isCitationHref,
  isExternalHttpUrl,
  type DisplaySource,
} from "../../../lib/blog/published-article-display"

const headingBase: CSSProperties = {
  color: "#111",
  lineHeight: 1.28,
  letterSpacing: "-0.02em",
  fontWeight: 700,
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1
      style={{
        ...headingBase,
        fontSize: "clamp(1.7rem, 1.2vw + 1.35rem, 2.1rem)",
        margin: "2.1rem 0 0.9rem",
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      style={{
        ...headingBase,
        fontSize: "clamp(1.35rem, 0.8vw + 1.15rem, 1.65rem)",
        margin: "2.15rem 0 0.85rem",
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      style={{
        ...headingBase,
        fontSize: "clamp(1.15rem, 0.4vw + 1.05rem, 1.3rem)",
        margin: "1.7rem 0 0.7rem",
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p
      style={{
        margin: "0 0 1.15rem",
        lineHeight: 1.78,
      }}
    >
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul
      style={{
        margin: "0 0 1.25rem",
        paddingLeft: "1.35rem",
        lineHeight: 1.78,
      }}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      style={{
        margin: "0 0 1.25rem",
        paddingLeft: "1.35rem",
        lineHeight: 1.78,
      }}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li style={{ margin: "0.4rem 0", paddingLeft: "0.15rem" }}>{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote
      style={{
        margin: "0 0 1.25rem",
        padding: "0.15rem 0 0.15rem 1rem",
        borderLeft: "3px solid #d6d6d6",
        color: "#333",
      }}
    >
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => {
    if (href && isCitationHref(href)) {
      const index = citationIndexFromHref(href)
      return (
        <sup className="article-citation">
          <a href={href} aria-label={`Source ${index}`}>
            [{index}]
          </a>
        </sup>
      )
    }

    const external = isExternalHttpUrl(href)

    return (
      <a
        href={href}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        style={{
          color: "#0b57d0",
          textDecoration: "underline",
          textUnderlineOffset: "0.18em",
        }}
      >
        {children}
      </a>
    )
  },
  img: ({ src, alt }) => (
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      style={{
        display: "block",
        maxWidth: "100%",
        height: "auto",
        objectFit: "contain",
        borderRadius: 12,
        margin: "1.25rem 0",
      }}
    />
  ),
}

export function PublishedArticleBody({
  markdown,
  sources,
}: {
  markdown: string
  sources: DisplaySource[]
}) {
  return (
    <div
      className="published-article-body"
      style={{
        maxWidth: "72ch",
        fontSize: "clamp(1.05rem, 0.28vw + 1rem, 1.175rem)",
        lineHeight: 1.78,
        color: "#1a1a1a",
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>

      {sources.length > 0 ? (
        <section
          aria-labelledby="article-sources-heading"
          data-article-sources="true"
          style={{
            marginTop: "2.75rem",
            paddingTop: "1.6rem",
            borderTop: "1px solid #e5e5e5",
          }}
        >
          <h2
            id="article-sources-heading"
            style={{
              ...headingBase,
              fontSize: "clamp(1.35rem, 0.8vw + 1.15rem, 1.65rem)",
              margin: "0 0 0.95rem",
            }}
          >
            Sources
          </h2>
          <ol
            style={{
              margin: 0,
              paddingLeft: "1.35rem",
              lineHeight: 1.55,
            }}
          >
            {sources.map((source) => (
              <li
                key={source.id}
                id={source.id}
                style={{
                  display: "list-item",
                  margin: "0.7rem 0",
                }}
              >
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#0b57d0",
                    textDecoration: "underline",
                    textUnderlineOffset: "0.18em",
                  }}
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  )
}
