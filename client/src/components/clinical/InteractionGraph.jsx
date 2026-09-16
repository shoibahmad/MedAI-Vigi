import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * Interaction network.
 *
 * Drugs sit on an ellipse, interactions are chords between them, coloured and
 * weighted by severity. A radial layout rather than a force simulation: it is
 * deterministic, so the same regimen always draws the same picture and a
 * clinician can compare two runs, and it needs no physics library or animation
 * frame. Regimens here are a handful of drugs, where a ring is legible and a
 * force layout would only wobble.
 *
 * Plain SVG, so it prints and survives the report's PDF export, which rasterises
 * the DOM and cannot capture canvas or WebGL.
 */

const SEVERITY = {
  contraindicated: { stroke: 'var(--risk-critical)', width: 3.5, dash: null, rank: 0, label: 'Contraindicated' },
  critical: { stroke: 'var(--risk-critical)', width: 3.5, dash: null, rank: 0, label: 'Contraindicated' },
  major: { stroke: 'var(--risk-high)', width: 3, dash: null, rank: 1, label: 'Major' },
  high: { stroke: 'var(--risk-high)', width: 3, dash: null, rank: 1, label: 'Major' },
  moderate: { stroke: 'var(--risk-moderate)', width: 2.25, dash: '7 4', rank: 2, label: 'Moderate' },
  minor: { stroke: 'var(--risk-low)', width: 1.75, dash: '3 4', rank: 3, label: 'Minor' },
  low: { stroke: 'var(--risk-low)', width: 1.75, dash: '3 4', rank: 3, label: 'Minor' },
}

const FALLBACK = { stroke: 'var(--muted-foreground)', width: 2, dash: '4 4', rank: 4, label: 'Unclassified' }

function severityOf(value) {
  return SEVERITY[String(value || '').toLowerCase()] || FALLBACK
}

// A landscape ellipse rather than a circle. Drug names are wide and hang
// horizontally off each node, so the horizontal radius has to leave room for a
// label while the vertical one does not - and a wide canvas suits the card it
// sits in far better than a square, which wasted most of its width.
const WIDTH = 640
const HEIGHT = 380
const CX = WIDTH / 2
const CY = HEIGHT / 2
const RX = CX - 108 // room for the longest drug name beside an edge node
const RY = CY - 54

function layout(drugs) {
  const n = drugs.length
  return drugs.map((name, i) => {
    // Start at 12 o'clock and go clockwise, so the first drug of the regimen is
    // where the eye lands first.
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const cos = Math.cos(angle)
    return {
      name,
      x: CX + RX * cos,
      y: CY + RY * Math.sin(angle),
      // Which side of the ellipse a node is on decides which way its label hangs.
      anchor: cos > 0.15 ? 'start' : cos < -0.15 ? 'end' : 'middle',
    }
  })
}

export function InteractionGraph({ drugs, interactions, className }) {
  const [focus, setFocus] = useState(null)

  const nodes = useMemo(() => layout(drugs), [drugs])
  const nodeByName = useMemo(
    () => Object.fromEntries(nodes.map((node) => [node.name, node])),
    [nodes],
  )

  const edges = useMemo(() => {
    const seen = new Set()
    return interactions
      .map((item) => {
        const pair = item.drugs || item.drugs_involved || []
        const [a, b] = pair
        const from = nodeByName[a]
        const to = nodeByName[b]
        if (!from || !to) return null
        const key = [a, b].sort().join('||')
        if (seen.has(key)) return null
        seen.add(key)
        return { key, from, to, severity: severityOf(item.severity), item }
      })
      .filter(Boolean)
      // Draw the least severe first so critical edges end up on top.
      .sort((x, y) => y.severity.rank - x.severity.rank)
  }, [interactions, nodeByName])

  // Degree drives node size: the drug involved in most conflicts reads largest.
  const degree = useMemo(() => {
    const counts = Object.fromEntries(drugs.map((d) => [d, 0]))
    edges.forEach(({ from, to }) => {
      counts[from.name] += 1
      counts[to.name] += 1
    })
    return counts
  }, [drugs, edges])

  const legend = useMemo(() => {
    const present = new Map()
    edges.forEach(({ severity }) => {
      if (!present.has(severity.label)) present.set(severity.label, severity)
    })
    return [...present.values()].sort((a, b) => a.rank - b.rank)
  }, [edges])

  if (drugs.length < 2) return null

  const isDimmed = (name) =>
    focus && focus !== name && !edges.some(
      ({ from, to }) =>
        (from.name === focus && to.name === name) || (to.name === focus && from.name === name),
    )

  return (
    <figure className={cn('rounded-xl border bg-card p-5', className)}>
      <figcaption className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
          Interaction network
        </h2>
        <span className="text-xs text-muted-foreground">
          {edges.length === 0
            ? 'No conflicts found between these agents'
            : `${edges.length} interacting pair${edges.length === 1 ? '' : 's'} across ${drugs.length} drugs`}
        </span>
      </figcaption>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="mx-auto h-auto w-full max-w-[640px]"
          role="img"
          aria-label={
            edges.length === 0
              ? `No interactions among ${drugs.join(', ')}`
              : `Interaction network: ${edges
                  .map((e) => `${e.from.name} and ${e.to.name}, ${e.severity.label}`)
                  .join('; ')}`
          }
        >
          {/* Chords first, so nodes sit above them. */}
          <g>
            {edges.map(({ key, from, to, severity, item }) => {
              const dim = focus && focus !== from.name && focus !== to.name
              return (
                <g key={key}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={severity.stroke}
                    strokeWidth={severity.width}
                    strokeDasharray={severity.dash || undefined}
                    strokeLinecap="round"
                    opacity={dim ? 0.12 : 0.85}
                    className="transition-opacity"
                  />
                  <title>
                    {`${from.name} + ${to.name} — ${severity.label}`}
                    {item.mechanism ? `\n${item.mechanism}` : ''}
                  </title>
                </g>
              )
            })}
          </g>

          <g>
            {nodes.map((node) => {
              const conflicts = degree[node.name] || 0
              const r = 7 + Math.min(conflicts, 4) * 1.6
              const dim = isDimmed(node.name)

              // Labels stack away from the node, never across it. A node at the
              // top of the ring has to grow its stack upwards, which means the
              // name sits above the count rather than below it.
              const labelX =
                node.x + (node.anchor === 'start' ? r + 7 : node.anchor === 'end' ? -(r + 7) : 0)
              const above = node.anchor === 'middle' && node.y < CY
              const below = node.anchor === 'middle' && node.y >= CY
              let nameY
              if (above) nameY = node.y - (r + (conflicts > 0 ? 22 : 9))
              else if (below) nameY = node.y + (r + 17)
              else nameY = node.y + 4
              const countY = above ? nameY + 13 : nameY + 13

              return (
                <g
                  key={node.name}
                  onMouseEnter={() => setFocus(node.name)}
                  onMouseLeave={() => setFocus(null)}
                  opacity={dim ? 0.3 : 1}
                  className="cursor-default transition-opacity"
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={conflicts > 0 ? 'var(--primary)' : 'var(--card)'}
                    stroke={conflicts > 0 ? 'var(--primary)' : 'var(--muted-foreground)'}
                    strokeWidth={2}
                  />
                  <text
                    x={labelX}
                    y={nameY}
                    textAnchor={node.anchor}
                    className="fill-foreground text-[12px] font-semibold"
                  >
                    {node.name}
                  </text>
                  {conflicts > 0 ? (
                    <text
                      x={labelX}
                      y={countY}
                      textAnchor={node.anchor}
                      className="fill-muted-foreground text-[10px]"
                    >
                      {conflicts} interaction{conflicts === 1 ? '' : 's'}
                    </text>
                  ) : null}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {legend.length > 0 ? (
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t pt-3">
          {legend.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg width="26" height="8" aria-hidden="true">
                <line
                  x1="1"
                  y1="4"
                  x2="25"
                  y2="4"
                  stroke={s.stroke}
                  strokeWidth={s.width}
                  strokeDasharray={s.dash || undefined}
                  strokeLinecap="round"
                />
              </svg>
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Node size reflects how many interactions involve that drug. Hover a drug to isolate its
        conflicts.
      </p>
    </figure>
  )
}
