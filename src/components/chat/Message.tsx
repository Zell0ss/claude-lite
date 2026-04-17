import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  role: 'user' | 'assistant'
  content: string
}

export function Message({ role, content }: Props) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      {isUser ? (
        // User: right-aligned bubble, bg-muted (same surface as input per design system)
        <div className="max-w-[70%] bg-muted text-foreground rounded-2xl rounded-br-sm px-4 py-3 text-base leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      ) : (
        // Assistant: no bubble — text directly on background, full column width
        <div className="w-full text-foreground text-base leading-relaxed prose-custom">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
              ),
              h1: ({ children }) => (
                <h1 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold mt-6 mb-2 text-foreground">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              ul: ({ children }) => (
                <ul className="pl-6 space-y-2 mb-4 list-disc">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="pl-6 space-y-2 mb-4 list-decimal">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-border pl-4 text-foreground-muted my-4">
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="underline text-foreground hover:text-accent transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              hr: () => (
                <hr className="border-border my-6" />
              ),
              pre: ({ children }) => (
                <pre className="bg-card rounded-lg p-4 overflow-x-auto my-4 text-sm leading-relaxed">
                  {children}
                </pre>
              ),
              code: ({ children, className }) =>
                className ? (
                  // Block code (inside pre, handled by shiki)
                  <code className={className}>{children}</code>
                ) : (
                  // Inline code
                  <code className="bg-code-inline-bg text-code-inline-fg rounded px-1.5 py-0.5 text-[0.9em] font-mono">
                    {children}
                  </code>
                ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="text-sm border-collapse w-full">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-muted">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-3 py-2 text-foreground">
                  {children}
                </td>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
