import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 min-h-[80vh] flex items-center">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        <div className="space-y-8">
          
          <div>
            <p
              className="uppercase tracking-[0.3em] text-xs font-bold mb-4"
              style={{ color: 'var(--accent)' }}
            >
              Error 404
            </p>

            <h1
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '4rem',
                lineHeight: 1,
                fontWeight: 300,
                color: 'var(--text)'
              }}
            >
              Página no encontrada
            </h1>
          </div>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '1rem',
              lineHeight: 1.8,
              maxWidth: '540px'
            }}
          >
            La ruta que intentas visitar no existe o fue movida.
            Verifica la dirección o vuelve al panel principal
            para continuar consultando los resultados electorales.
          </p>

          <div className="flex flex-wrap gap-4">

            <Link
              to="/"
              style={{
                background: 'var(--accent)',
                color: 'white',
                padding: '0.85rem 1.25rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
              }}
            >
              ← Volver al inicio
            </Link>

            <Link
              to="/resultados"
              style={{
                background: 'var(--surface)',
                color: 'var(--text)',
                padding: '0.85rem 1.25rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                border: '1px solid var(--border)'
              }}
            >
              Ver resultados
            </Link>

          </div>
        </div>

        <div className="relative flex justify-center">
          
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              aspectRatio: 1,
              borderRadius: '2rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)'
            }}
          >

            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at top, var(--accent-light), transparent 70%)'
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              
              <div className="text-center">
                
                <div
                  style={{
                    fontSize: '7rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: 'var(--accent)',
                    fontFamily: 'DM Mono, monospace'
                  }}
                >
                  404
                </div>

                <div
                  style={{
                    marginTop: '1rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700
                  }}
                >
                  Ruta inexistente
                </div>

              </div>

            </div>

            <div
              style={{
                position: 'absolute',
                top: '-60px',
                right: '-60px',
                width: '180px',
                height: '180px',
                borderRadius: '9999px',
                background: 'var(--accent)',
                opacity: 0.08
              }}
            />

            <div
              style={{
                position: 'absolute',
                bottom: '-40px',
                left: '-40px',
                width: '140px',
                height: '140px',
                borderRadius: '9999px',
                background: 'var(--text)',
                opacity: 0.04
              }}
            />

          </div>

        </div>

      </div>
    </div>
  )
}