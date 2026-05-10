import { useEffect, useRef, useState } from 'react'

export default function ActaViewer({ imageUrl, fields, selectedField }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const drawPolygons = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imgLoaded) return

    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight

    const renderedW = img.clientWidth
    const renderedH = img.clientHeight

    const ratioX = renderedW / naturalW
    const ratioY = renderedH / naturalH

    canvas.width = renderedW
    canvas.height = renderedH

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    fields.forEach(field => {
      if (!field.boundingRegion) return

      let region
      try {
        region = JSON.parse(field.boundingRegion)
      } catch {
        return
      }

      const flat = region.polygon
      if (!flat || flat.length < 6) return

      const points = []
      for (let i = 0; i < flat.length; i += 2) {
        points.push([
          flat[i] * ratioX,
          flat[i + 1] * ratioY
        ])
      }

      const isSelected = selectedField === field.name
      const isLow = field.confidenceLevel === 'Low'
      const isMedium = field.confidenceLevel === 'Medium'

      let strokeColor, fillColor
      if (isSelected) {
        strokeColor = '#34d399'
        fillColor = 'rgba(52, 211, 153, 0.25)'
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
      ctx.lineWidth = isSelected ? 2.5 : 1.5
      ctx.stroke()

      if (isSelected || isLow) {
        const labelX = points[0][0]
        const labelY = points[0][1] - 5

        ctx.font = 'bold 10px monospace'
        const text = `${field.name} (${(field.confidence * 100).toFixed(0)}%)`
        const metrics = ctx.measureText(text)

        ctx.fillStyle = isSelected ? 'rgba(52,211,153,0.9)' : 'rgba(248,113,113,0.9)'
        ctx.fillRect(labelX - 2, labelY - 11, metrics.width + 4, 14)

        ctx.fillStyle = '#09090b'
        ctx.fillText(text, labelX, labelY)
      }
    })
  }

  useEffect(() => {
    drawPolygons()
  }, [imgLoaded, fields, selectedField])

  useEffect(() => {
    const handleResize = () => drawPolygons()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [imgLoaded, fields, selectedField])

  if (imgError) return (
    <div className="border border-zinc-800 rounded-lg p-8 text-center bg-zinc-900">
      <p className="font-mono text-xs text-zinc-500">No se pudo cargar la imagen del acta</p>
    </div>
  )

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Imagen del acta · detección ICR
        </p>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-zinc-500">Seleccionado</span>
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

      <div className="relative overflow-auto max-h-[600px]">
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
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              display: imgLoaded ? 'block' : 'none',
              width: '100%',
              height: '100%'
            }}
          />
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
              <span className="font-mono text-xs text-zinc-500 animate-pulse">
                Cargando imagen...
              </span>
            </div>
          )}
        </div>
      </div>

      {selectedField && (
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900/50">
          <p className="text-xs font-mono text-emerald-400">
            Campo seleccionado: <span className="font-bold">{selectedField}</span>
            <span className="text-zinc-500 ml-2">— haz click en otro campo de la tabla para comparar</span>
          </p>
        </div>
      )}
    </div>
  )
}