/**
 * Convert modern CSS colours to rgb() for renderers that cannot parse them.
 *
 * html2canvas, which html2pdf uses, throws "Attempting to parse an unsupported
 * color function" on oklab() and oklch(). Tailwind v4 emits
 * color-mix(in oklab, ...) for every opacity modifier (bg-muted/40,
 * border-primary/40, bg-warning/5), and the browser resolves those to oklab() in
 * computed styles, so the report is full of them.
 *
 * Converting via canvas does not work: assigning an oklab string to
 * ctx.fillStyle returns it unchanged rather than normalising it. The transform
 * is therefore done here, using the standard Oklab -> linear sRGB matrix.
 */

const MODERN_COLOR = /oklab\(|oklch\(|color-mix\(|\blab\(|\blch\(/i

const COLOR_PROPERTIES = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'fill',
  'stroke',
  'caretColor',
  'columnRuleColor',
]

/** Linear-light channel to gamma-encoded sRGB, clamped to a byte. */
function toSrgbByte(channel) {
  const encoded =
    channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, Math.round(encoded * 255)))
}

/** Oklab -> sRGB. https://bottosson.github.io/posts/oklab/ */
export function oklabToRgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    toSrgbByte(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgbByte(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgbByte(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

/** Parse the numeric components of oklab()/oklch(), handling the "/ alpha" tail. */
function parseComponents(body) {
  const [values, alphaPart] = body.split('/')
  const nums = values
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((token) => (token.endsWith('%') ? parseFloat(token) / 100 : parseFloat(token)))

  let alpha = 1
  if (alphaPart !== undefined) {
    const raw = alphaPart.trim()
    alpha = raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw)
  }
  return { nums, alpha: Number.isFinite(alpha) ? alpha : 1 }
}

/**
 * Convert a single computed colour string to rgb()/rgba().
 * Returns null when the value needs no conversion or cannot be parsed.
 */
export function toLegacyColor(value) {
  if (!value || !MODERN_COLOR.test(value)) return null

  const oklab = value.match(/oklab\(([^)]+)\)/i)
  const oklch = value.match(/oklch\(([^)]+)\)/i)
  const match = oklab || oklch
  if (!match) return null

  const { nums, alpha } = parseComponents(match[1])
  if (nums.length < 3 || nums.some((n) => !Number.isFinite(n))) return null

  const [first, second, third] = nums
  const [r, g, b] = oklab
    ? oklabToRgb(first, second, third)
    : // oklch -> oklab: a = C*cos(H), b = C*sin(H)
      oklabToRgb(
        first,
        second * Math.cos((third * Math.PI) / 180),
        second * Math.sin((third * Math.PI) / 180),
      )

  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Inline legacy colours across a subtree, run the callback, then restore.
 *
 * Restoration happens in a finally block so a failed export cannot leave the
 * document with inline overrides baked in.
 */
export async function withLegacyColors(root, callback) {
  if (!root) return callback()

  const restore = []
  const elements = [root, ...root.querySelectorAll('*')]

  for (const element of elements) {
    const computed = getComputedStyle(element)
    for (const property of COLOR_PROPERTIES) {
      const converted = toLegacyColor(computed[property])
      if (!converted) continue
      restore.push([element, property, element.style[property]])
      element.style[property] = converted
    }
  }

  try {
    return await callback()
  } finally {
    for (const [element, property, previous] of restore) {
      element.style[property] = previous
    }
  }
}
