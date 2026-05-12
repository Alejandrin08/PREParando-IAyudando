import { useState, useRef, useCallback } from 'react'
import { actasApi } from '../services/api'

const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadModal({ onClose }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const validateFile = (file) => {
    if (!VALID_TYPES.includes(file.type))
      return 'Formato no válido. Solo JPG o PNG.'
    if (file.size > MAX_SIZE_BYTES)
      return `El archivo excede ${MAX_SIZE_MB} MB.`
    return null
  }

  const addFiles = useCallback((incoming) => {
    const newFiles = Array.from(incoming).map(file => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      error: validateFile(file),
    }))
    setFiles(prev => {
      const existing = new Set(prev.map(f => `${f.file.name}-${f.file.size}`))
      return [...prev, ...newFiles.filter(f => !existing.has(`${f.file.name}-${f.file.size}`))]
    })
  }, [])

  const removeFile = (id) => {
    setFiles(prev => {
      const f = prev.find(f => f.id === id)
      if (f) URL.revokeObjectURL(f.preview)
      return prev.filter(f => f.id !== id)
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const allValid = files.length > 0 && files.every(f => !f.error)

  const handleUpload = async () => {
    if (!allValid) return
    setUploading(true)
    setResult(null)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('images', f.file))
      const res = await actasApi.uploadBatch(formData)
      setResult(res.data)
      setFiles([])
    } catch (e) {
      setResult({ error: 'Error al subir las actas. Intenta de nuevo.' })
    } finally {
      setUploading(false)
    }
  }

  const validCount = files.filter(f => !f.error).length
  const invalidCount = files.filter(f => f.error).length

  const hasAnyResult = result && !result.error && (
    result.succeededDocuments > 0 ||
    result.failedDocuments > 0 ||
    result.skippedDocuments > 0
  )

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 100
        }}
      />

      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: '600px',
        maxHeight: '90vh',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 101
      }}>

        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ fontFamily: 'Fraunces, serif', color: 'var(--text)', fontSize: '1.1rem', fontWeight: 400 }}>
              Subir actas
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.125rem' }}>
              JPG o PNG · máximo {MAX_SIZE_MB} MB por archivo
            </p>
          </div>
          <button onClick={onClose}
            style={{
              color: 'var(--text-muted)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              width: '32px', height: '32px',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {uploading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'var(--accent-light)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid var(--border)',
                  borderTop: '2px solid var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  flexShrink: 0
                }} />
                <div>
                  <p style={{
                    color: 'var(--text)',
                    fontSize: '0.825rem',
                    fontWeight: 500
                  }}>
                    Procesando actas...
                  </p>

                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem'
                  }}>
                    Esto puede tomar unos minutos dependiendo del número de actas
                  </p>
                </div>
              </div>
            )}

          {result && (
            <div style={{
              background: result.error ? '#fee2e2' : 'var(--surface-2)',
              border: `1px solid ${result.error ? '#fca5a5' : 'var(--border)'}`,
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem',
              marginBottom: '1rem'
            }}>
              {result.error ? (
                <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{result.error}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <p style={{ color: 'var(--text)', fontSize: '0.875rem', fontWeight: 600 }}>
                    Procesamiento completado
                  </p>

                  {result.succeededDocuments > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.625rem',
                      background: '#dcfce7', border: '1px solid #86efac',
                      borderRadius: '0.5rem', padding: '0.5rem 0.75rem'
                    }}>
                      <span style={{ fontSize: '0.875rem' }}>✓</span>
                      <p style={{ color: '#15803d', fontSize: '0.8rem' }}>
                        <strong>{result.succeededDocuments}</strong> acta{result.succeededDocuments !== 1 ? 's' : ''} procesada{result.succeededDocuments !== 1 ? 's' : ''} y guardada{result.succeededDocuments !== 1 ? 's' : ''} correctamente
                      </p>
                    </div>
                  )}

                  {result.skippedDocuments > 0 && (
                    <div style={{
                      background: '#fef9c3', border: '1px solid #fde047',
                      borderRadius: '0.5rem', padding: '0.5rem 0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: result.skippedNames?.length > 0 ? '0.375rem' : '0' }}>
                        <span style={{ fontSize: '0.875rem' }}>↷</span>
                        <p style={{ color: '#854d0e', fontSize: '0.8rem' }}>
                          <strong>{result.skippedDocuments}</strong> acta{result.skippedDocuments !== 1 ? 's' : ''} omitida{result.skippedDocuments !== 1 ? 's' : ''} porque ya existen en el sistema
                        </p>
                      </div>
                      {result.skippedNames?.length > 0 && (
                        <div style={{
                          paddingLeft: '1.5rem',
                          display: 'flex', flexDirection: 'column', gap: '0.125rem'
                        }}>
                          {result.skippedNames.map(name => (
                            <p key={name} style={{
                              color: '#92400e',
                              fontSize: '0.7rem',
                              fontFamily: 'DM Mono, monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              · {name}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {result.failedDocuments > 0 && (
                    <div style={{
                      background: '#fee2e2', border: '1px solid #fca5a5',
                      borderRadius: '0.5rem', padding: '0.5rem 0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{ fontSize: '0.875rem' }}>✗</span>
                        <p style={{ color: '#b91c1c', fontSize: '0.8rem' }}>
                          <strong>{result.failedDocuments}</strong> acta{result.failedDocuments !== 1 ? 's' : ''} no pud{result.failedDocuments !== 1 ? 'ieron' : 'o'} procesarse por un error del sistema
                        </p>
                      </div>
                    </div>
                  )}

                  {result.succeededDocuments === 0 && result.failedDocuments === 0 && result.skippedDocuments > 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.775rem', marginTop: '0.25rem' }}>
                      Todas las actas seleccionadas ya estaban registradas. No se realizaron cambios.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '0.75rem',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'var(--accent-light)' : 'var(--surface-2)',
              transition: 'all 0.2s',
              marginBottom: files.length > 0 ? '1rem' : '0'
            }}>
            <div style={{
              width: '40px', height: '40px',
              background: 'var(--border)',
              borderRadius: '0.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.75rem',
              fontSize: '1.25rem'
            }}>
              📎
            </div>
            <p style={{ color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500 }}>
              Arrastra las actas aquí
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.775rem', marginTop: '0.25rem' }}>
              o haz clic para seleccionar archivos
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png"
              onChange={e => addFiles(e.target.files)}
              style={{ display: 'none' }}
            />
          </div>

          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                  {files.length} archivo{files.length !== 1 ? 's' : ''}
                  {validCount > 0 && (
                    <span style={{ color: '#15803d' }}>
                      {' '}· {validCount} válido{validCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {invalidCount > 0 && (
                    <span style={{ color: '#b91c1c' }}>
                      {' '}· {invalidCount} con error
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setFiles([])}
                  style={{ color: 'var(--text-muted)', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Limpiar todo
                </button>
              </div>

              {files.map(f => (
                <div key={f.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  background: f.error ? '#fff1f2' : 'var(--surface-2)',
                  border: `1px solid ${f.error ? '#fca5a5' : 'var(--border)'}`,
                  borderRadius: '0.625rem'
                }}>
                  <img
                    src={f.preview}
                    alt={f.file.name}
                    style={{
                      width: '36px', height: '36px',
                      objectFit: 'cover',
                      borderRadius: '0.375rem',
                      border: '1px solid var(--border)',
                      flexShrink: 0
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      color: 'var(--text)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {f.file.name}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.1rem' }}>
                      {formatBytes(f.file.size)}
                      {f.error && (
                        <span style={{ color: '#b91c1c', marginLeft: '0.5rem' }}>
                          · {f.error}
                        </span>
                      )}
                    </p>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {f.error ? (
                      <button
                        onClick={() => removeFile(f.id)}
                        style={{
                          width: '28px', height: '28px',
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.875rem'
                        }}
                        title="Eliminar archivo">
                        🗑
                      </button>
                    ) : (
                      <div style={{
                        width: '28px', height: '28px',
                        background: '#dcfce7',
                        border: '1px solid #86efac',
                        borderRadius: '0.375rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.875rem'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'var(--surface)'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
            {uploading
              ? 'Procesando actas, por favor espera...'
              : allValid && files.length > 0
              ? `${validCount} acta${validCount !== 1 ? 's' : ''} lista${validCount !== 1 ? 's' : ''} para subir`
              : invalidCount > 0
              ? 'Elimina los archivos con error para continuar'
              : hasAnyResult
              ? 'Puedes cerrar esta ventana o subir más actas'
              : 'Selecciona las actas para comenzar'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-muted)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}>
              {hasAnyResult ? 'Cerrar' : 'Cancelar'}
            </button>
            <button
              onClick={handleUpload}
              disabled={!allValid || uploading}
              style={{
                padding: '0.5rem 1.25rem',
                background: allValid && !uploading ? 'var(--accent)' : 'var(--border)',
                color: allValid && !uploading ? 'white' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: allValid && !uploading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                minWidth: '100px'
              }}>
              {uploading
                ? 'Procesando...'
                : files.length > 0
                ? `Subir (${validCount})`
                : 'Subir'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}