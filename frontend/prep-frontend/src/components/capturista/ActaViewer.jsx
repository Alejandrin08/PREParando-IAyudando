import { useEffect, useRef, useState } from 'react'

// Pre-parse and cache polygons so we can hit-test on click
function buildPolygons(fields, ratioX, ratioY) {
  const result = []
  fields.forEach(field => {
    if (!field.boundingRegion) return
    let region
    try { region = JSON.parse(field.boundingRegion) } catch { return }
    const flat = region.polygon
    if (!flat || flat.length < 6) return
    const points = []
    for (let i = 0; i < flat.length; i += 2) {
      points.push([flat[i] * ratioX, flat[i + 1] * ratioY])
    }
    result.push({ name: field.name, points })
  })
  return result
}

// Ray-casting point-in-polygon
function pointInPolygon(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export default function ActaViewer({ imageUrl, fields, selectedField, onFieldClick, suppressDefaults }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const polygonRef = useRef([]) // cached scaled polygons
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(null)

  const getRatios = () => {
    const img = imgRef.current
    if (!img) return { ratioX: 1, ratioY: 1 }
    return {
      ratioX: img.clientWidth / img.naturalWidth,
      ratioY: img.clientHeight / img.naturalHeight,
    }
  }

  const drawPolygons = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imgLoaded) return

    const { ratioX, ratioY } = getRatios()
    canvas.width = img.clientWidth
    canvas.height = img.clientHeight

    // Rebuild polygon cache on every redraw (ratios may have changed)
    polygonRef.current = buildPolygons(fields, ratioX, ratioY)

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    fields.forEach(field => {
      if (!field.boundingRegion) return
      let region
      try { region = JSON.parse(field.boundingRegion) } catch { return }
      const flat = region.polygon
      if (!flat || flat.length < 6) return

      const points = []
      for (let i = 0; i < flat.length; i += 2) {
        points.push([flat[i] * ratioX, flat[i + 1] * ratioY])
      }

      const isSelected = selectedField === field.name
      const isHovered = hovered === field.name && !isSelected
      const isLow = !suppressDefaults && field.confidenceLevel === 'Low'
      const isMedium = !suppressDefaults && field.confidenceLevel === 'Medium'

      let strokeColor, fillColor
      if (isSelected) {
        strokeColor = '#34d399'
        fillColor = 'rgba(52, 211, 153, 0.28)'
      } else if (isHovered) {
        strokeColor = '#818cf8'
        fillColor = 'rgba(129, 140, 248, 0.20)'
      } else if (isLow) {
        strokeColor = '#f87171'
        fillColor = 'rgba(248, 113, 113, 0.20)'
      } else if (isMedium) {
        strokeColor = '#fbbf24'
        fillColor = 'rgba(251, 191, 36, 0.18)'
      } else {
        strokeColor = 'rgba(148, 163, 184, 0.9)'
        fillColor = 'rgba(148, 163, 184, 0.12)'
      }

      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y))
      ctx.closePath()
      ctx.fillStyle = fillColor
      ctx.fill()
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5
      ctx.stroke()

      if (isSelected || isLow || isHovered) {
        const labelX = points[0][0]
        const labelY = points[0][1] - 5
        ctx.font = 'bold 10px monospace'
        const text = `${field.name} (${(field.confidence * 100).toFixed(0)}%)`
        const metrics = ctx.measureText(text)
        ctx.fillStyle = isSelected ? 'rgba(52,211,153,0.9)' : isHovered ? 'rgba(129,140,248,0.9)' : 'rgba(248,113,113,0.9)'
        ctx.fillRect(labelX - 2, labelY - 11, metrics.width + 4, 14)
        ctx.fillStyle = '#09090b'
        ctx.fillText(text, labelX, labelY)
      }
    })
  }

  // Redraw whenever selection, hover, or image state changes
  useEffect(() => { drawPolygons() }, [imgLoaded, fields, selectedField, hovered])

  useEffect(() => {
    const handleResize = () => drawPolygons()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [imgLoaded, fields, selectedField, hovered])

  // Hit-test helpers — get canvas-relative coords from a mouse event
  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const hitField = (e) => {
    const { x, y } = getCanvasPos(e)
    // Search in reverse so topmost (last drawn) wins
    const polys = [...polygonRef.current].reverse()
    const hit = polys.find(p => pointInPolygon(x, y, p.points))
    return hit?.name ?? null
  }

  const handleCanvasClick = (e) => {
    if (!onFieldClick) return
    const name = hitField(e)
    if (name) onFieldClick(name)
  }

  const handleCanvasMouseMove = (e) => {
    const name = hitField(e)
    setHovered(name)
    canvasRef.current.style.cursor = name ? 'pointer' : 'default'
  }

  const handleCanvasMouseLeave = () => {
    setHovered(null)
    if (canvasRef.current) canvasRef.current.style.cursor = 'default'
  }

  if (imgError) return (
    <div className="border border-zinc-800 rounded-lg p-8 text-center bg-zinc-900">
      <p className="font-mono text-xs text-zinc-500">No se pudo cargar la imagen del acta</p>
    </div>
  )

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between" style={{ flexShrink: 0 }}>
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Imagen del acta · detección ICR
        </p>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-zinc-500">Seleccionado</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
            <span className="text-zinc-500">Hover</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            <span className="text-zinc-500">Confianza media</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            <span className="text-zinc-500">Confianza baja</span>
          </span>
        </div>
      </div>

      {/* Image + Canvas overlay */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div className="relative inline-block w-full">
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Acta de escrutinio"
            className="w-full block"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{ opacity: imgLoaded ? 1 : 0 }}
          />
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            style={{
              position: 'absolute', top: 0, left: 0,
              display: imgLoaded ? 'block' : 'none',
              width: '100%', height: '100%',
              // pointer-events ON so we receive clicks
            }}
          />
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <span className="font-mono text-xs text-zinc-500 animate-pulse">Cargando imagen...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50" style={{ flexShrink: 0, minHeight: 32 }}>
        {selectedField ? (
          <p className="text-xs font-mono text-emerald-400">
            Campo seleccionado: <span className="font-bold">{selectedField}</span>
            <span className="text-zinc-500 ml-2">— haz clic en otro campo del acta o la tabla para cambiar</span>
          </p>
        ) : (
          <p className="text-xs font-mono text-zinc-600">
            Haz clic en cualquier región del acta para seleccionar un campo
          </p>
        )}
      </div>
    </div>
  )
}