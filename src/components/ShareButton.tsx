import { useState } from 'react'
import '../styles/ShareButton.css'

interface ShareButtonProps {
  appTitle?: string
}

export function ShareButton({ appTitle = 'App-Cell' }: ShareButtonProps) {
  const [showInstructions, setShowInstructions] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    const text = `Mira esta aplicación: ${appTitle}`

    // Verificar si el navegador soporta Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: appTitle,
          text: text,
          url: url
        })
      } catch (err) {
        console.log('Error al compartir:', err)
      }
    } else {
      // Fallback: mostrar instrucciones de cómo agregar al inicio
      setShowInstructions(true)
    }
  }

  const closeInstructions = () => {
    setShowInstructions(false)
  }

  return (
    <>
      <button 
        onClick={handleShare}
        className="share-button"
        title="Compartir o agregar al inicio"
      >
        📤 Compartir
      </button>

      {showInstructions && (
        <div className="share-modal-overlay" onClick={closeInstructions}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeInstructions}>✕</button>
            
            <h2>📱 Agregar a tu Pantalla de Inicio</h2>
            
            <div className="instructions-container">
              <div className="instruction-section">
                <h3>🍎 Para iPhone (Safari):</h3>
                <ol>
                  <li>Abre la página en <strong>Safari</strong></li>
                  <li>Toca el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba)</li>
                  <li>Desplázate y selecciona <strong>"Agregar a Pantalla de Inicio"</strong></li>
                  <li>Escribe el nombre (puedes dejar el predeterminado)</li>
                  <li>Toca <strong>"Agregar"</strong> en la esquina superior derecha</li>
                </ol>
              </div>

              <div className="instruction-section">
                <h3>🤖 Para Android (Chrome):</h3>
                <ol>
                  <li>Abre la página en <strong>Chrome</strong></li>
                  <li>Toca el menú de tres puntos (⋮) en la esquina superior derecha</li>
                  <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a Pantalla de Inicio"</strong></li>
                  <li>Confirma el nombre de la aplicación</li>
                  <li>Toca <strong>"Instalar"</strong></li>
                </ol>
              </div>

              <div className="instruction-section chrome-share">
                <h3>💡 Alternativa: Compartir el enlace</h3>
                <p>Si tu navegador soporta compartir nativo:</p>
                <ol>
                  <li>Copia el enlace de esta página</li>
                  <li>Comparte por WhatsApp, Email, SMS, etc.</li>
                  <li>Tu amigo puede abrir el enlace y repetir los pasos anteriores</li>
                </ol>
              </div>

              <div className="benefits-section">
                <h3>✨ Ventajas de agregar al inicio:</h3>
                <ul>
                  <li>⚡ Acceso rápido desde tu pantalla de inicio</li>
                  <li>🚀 Se abre como una aplicación completa</li>
                  <li>💾 Funciona sin conexión (una vez cargado)</li>
                  <li>🔒 Acceso fácil a tus datos de ventas</li>
                </ul>
              </div>
            </div>

            <button className="close-button" onClick={closeInstructions}>
              Entendido ✓
            </button>
          </div>
        </div>
      )}
    </>
  )
}
