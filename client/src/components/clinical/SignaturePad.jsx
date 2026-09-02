import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

/**
 * Canvas signature capture.
 * Ported from static/js/counselling/signatures.js, with pointer events replacing
 * the separate mouse/touch handlers so pen input works too.
 */
export function SignaturePad({ label, onChange, value }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(Boolean(value))

  // Size the backing store to the device pixel ratio, otherwise strokes look soft.
  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0) return

    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio

    const ctx = canvas.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f172a'
  }, [])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [resize])

  const pointFrom = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const start = (event) => {
    event.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = pointFrom(event)
    ctx.beginPath()
    ctx.moveTo(x, y)
    drawing.current = true
    canvasRef.current.setPointerCapture(event.pointerId)
  }

  const move = (event) => {
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = pointFrom(event)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const end = (event) => {
    if (!drawing.current) return
    drawing.current = false
    try {
      canvasRef.current.releasePointerCapture(event.pointerId)
    } catch {
      // Capture may already be released when the pointer left the element.
    }
    setHasInk(true)
    onChange?.(canvasRef.current.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onChange?.(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={!hasInk}
          className="h-7 text-xs"
        >
          <Eraser className="size-3.5" />
          Clear
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-36 w-full touch-none rounded-lg border-2 border-dashed bg-card"
        aria-label={`${label} signature area`}
      />

      <p className="text-xs text-muted-foreground">
        {hasInk ? 'Signature captured.' : 'Sign above using a mouse, finger, or stylus.'}
      </p>
    </div>
  )
}
