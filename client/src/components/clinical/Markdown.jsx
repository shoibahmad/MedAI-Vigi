import { cn } from '@/lib/utils'

/**
 * Small markdown renderer for model output.
 *
 * The models return real markdown - bold, italics, rules, numbered lists,
 * occasionally tables - and rendering it as plain text left raw ** and ---
 * markers all over the clinical report.
 *
 * Everything is parsed into React elements rather than HTML, so model output can
 * never inject markup. No markdown library is pulled in: the supported subset is
 * small and this keeps the bundle down.
 *
 * Supported: headings, horizontal rules, fenced code, blockquotes, ordered and
 * unordered lists (including nesting by indent), tables, and the inline set
 * **bold**, *italic*, `code`, ~~strike~~, [links](url).
 */

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g

/** Turn inline markdown into React nodes. */
function parseInline(text, keyPrefix = 'i') {
  if (!text) return null
  const parts = String(text).split(INLINE).filter(Boolean)

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`

    if (/^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part)) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (/^\*[^*\n]+\*$/.test(part) || /^_[^_\n]+_$/.test(part)) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code
          key={key}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    if (/^~~[^~]+~~$/.test(part)) {
      return (
        <span key={key} className="line-through opacity-70">
          {part.slice(2, -2)}
        </span>
      )
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const href = link[2]
      // Only allow safe schemes; anything else renders as plain text.
      const safe = /^(https?:|mailto:|\/)/i.test(href)
      return safe ? (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          {link[1]}
        </a>
      ) : (
        <span key={key}>{link[1]}</span>
      )
    }

    return <span key={key}>{part}</span>
  })
}

const HEADING_CLASS = {
  1: 'mt-6 text-lg font-bold tracking-tight first:mt-0',
  2: 'mt-6 text-base font-bold tracking-tight first:mt-0',
  3: 'mt-5 text-sm font-semibold tracking-tight first:mt-0',
  4: 'mt-4 text-sm font-semibold text-muted-foreground first:mt-0',
  5: 'mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0',
  6: 'mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0',
}

const isHr = (line) => /^\s*([-*_])\s*(\1\s*){2,}$/.test(line)
const isUl = (line) => /^\s*[-*+]\s+/.test(line)
const isOl = (line) => /^\s*\d+[.)]\s+/.test(line)
const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line)
const isTableDivider = (line) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes('-')

function splitRow(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())
}

export function Markdown({ children, className }) {
  const source = String(children ?? '')
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank
    if (!line.trim()) {
      i += 1
      continue
    }

    // Fenced code
    if (/^\s*```/.test(line)) {
      const body = []
      i += 1
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        body.push(lines[i])
        i += 1
      }
      i += 1
      blocks.push(
        <pre
          key={key++}
          className="my-4 overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed"
        >
          <code>{body.join('\n')}</code>
        </pre>,
      )
      continue
    }

    // Horizontal rule
    if (isHr(line)) {
      blocks.push(<hr key={key++} className="my-6 border-t" />)
      i += 1
      continue
    }

    // Heading
    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      const Tag = `h${Math.min(level + 2, 6)}`
      blocks.push(
        <Tag key={key++} className={HEADING_CLASS[level]}>
          {parseInline(heading[2], `h${key}`)}
        </Tag>,
      )
      i += 1
      continue
    }

    // Table
    if (isTableRow(line) && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const head = splitRow(line)
      i += 2
      const rows = []
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]))
        i += 1
      }
      blocks.push(
        <div key={key++} className="my-4 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {head.map((cell, c) => (
                  <th key={c} className="px-3 py-2 text-left font-semibold">
                    {parseInline(cell, `th${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r} className="border-t">
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-2 align-top text-muted-foreground">
                      {parseInline(cell, `td${r}-${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      const body = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^\s*>\s?/, ''))
        i += 1
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-4 border-l-2 border-primary/40 bg-muted/30 py-2 pl-4 text-muted-foreground"
        >
          {parseInline(body.join(' '), `bq${key}`)}
        </blockquote>,
      )
      continue
    }

    // Lists. Consecutive items of the same kind are collected into one list.
    if (isUl(line) || isOl(line)) {
      const ordered = isOl(line)
      const items = []
      while (i < lines.length && (ordered ? isOl(lines[i]) : isUl(lines[i]))) {
        let content = lines[i].replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')
        i += 1
        // Absorb wrapped continuation lines that are not a new block.
        while (
          i < lines.length &&
          lines[i].trim() &&
          !isUl(lines[i]) &&
          !isOl(lines[i]) &&
          !/^\s*(#{1,6}\s|>|```)/.test(lines[i]) &&
          !isHr(lines[i])
        ) {
          content += ` ${lines[i].trim()}`
          i += 1
        }
        items.push(content)
      }

      const ListTag = ordered ? 'ol' : 'ul'
      blocks.push(
        <ListTag
          key={key++}
          className={cn(
            'my-3 space-y-1.5 pl-5',
            ordered ? 'list-decimal' : 'list-disc',
            'marker:text-muted-foreground',
          )}
        >
          {items.map((item, index) => (
            <li key={index} className="pl-1">
              {parseInline(item, `li${key}-${index}`)}
            </li>
          ))}
        </ListTag>,
      )
      continue
    }

    // Paragraph: gather until a blank line or the start of another block.
    const para = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isUl(lines[i]) &&
      !isOl(lines[i]) &&
      !isHr(lines[i]) &&
      !/^\s*(#{1,6}\s|>|```)/.test(lines[i]) &&
      !isTableRow(lines[i])
    ) {
      para.push(lines[i].trim())
      i += 1
    }
    if (para.length) {
      blocks.push(
        <p key={key++} className="my-3 leading-relaxed first:mt-0">
          {parseInline(para.join(' '), `p${key}`)}
        </p>,
      )
    }
  }

  return (
    <div className={cn('text-sm text-muted-foreground', className)}>{blocks}</div>
  )
}
