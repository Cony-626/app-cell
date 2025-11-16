import React, { useState, useEffect } from 'react'

interface Props {
  onLogin: (username: string) => void
}

const CREDENTIALS_KEY = 'app_credentials'
const SESSION_KEY = 'app_session'

const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const creds = localStorage.getItem(CREDENTIALS_KEY)
    setIsFirstTime(!creds)
  }, [])

  const handleRegister = () => {
    setError(null)
    if (!username.trim() || !password) {
      setError('Completa usuario y contraseña')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    const payload = { username: username.trim(), password }
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(payload))
      localStorage.setItem(SESSION_KEY, payload.username)
      onLogin(payload.username)
    } catch (e) {
      setError('No se pudo guardar credenciales')
      console.error(e)
    }
  }

  const handleLogin = () => {
    setError(null)
    const stored = localStorage.getItem(CREDENTIALS_KEY)
    if (!stored) {
      setError('No hay cuenta registrada. Regístrate primero.')
      setIsFirstTime(true)
      return
    }

    try {
      const creds = JSON.parse(stored)
      if (creds.username === username.trim() && creds.password === password) {
        localStorage.setItem(SESSION_KEY, creds.username)
        onLogin(creds.username)
      } else {
        setError('Usuario o contraseña inválidos')
      }
    } catch (e) {
      setError('Error leyendo credenciales')
      console.error(e)
    }
  }

  return (
    <div style={{maxWidth: 420, margin: '40px auto', padding: 20, border: '1px solid #ddd', borderRadius: 8}}>
      <h2 style={{marginTop: 0}}>{isFirstTime ? 'Regístrate' : 'Iniciar sesión'}</h2>

      <div style={{marginBottom: 10}}>
        <label>Usuario</label>
        <input
          style={{width: '100%', padding: 8, marginTop: 6}}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Ingresa tu nombre"
        />
      </div>

      <div style={{marginBottom: 10}}>
        <label>Contraseña</label>
        <input
          type="password"
          style={{width: '100%', padding: 8, marginTop: 6}}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
        />
      </div>

      {isFirstTime && (
        <div style={{marginBottom: 10}}>
          <label>Confirmar contraseña</label>
          <input
            type="password"
            style={{width: '100%', padding: 8, marginTop: 6}}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
          />
        </div>
      )}

      {error && <div style={{color: 'red', marginBottom: 10}}>{error}</div>}

      <div style={{display: 'flex', gap: 8}}>
        {isFirstTime ? (
          <button onClick={handleRegister} style={{flex: 1, padding: '8px 12px'}}>Registrarme</button>
        ) : (
          <button onClick={handleLogin} style={{flex: 1, padding: '8px 12px'}}>Ingresar</button>
        )}

        <button
          onClick={() => setIsFirstTime(!isFirstTime)}
          style={{flex: 1, padding: '8px 12px'}}
        >
          {isFirstTime ? 'Tengo cuenta' : 'Registrarme'}
        </button>
      </div>

      <p style={{marginTop: 12, fontSize: 12, color: '#555'}}>
        Nota: las credenciales se guardan en `localStorage` solo para este ejemplo.
      </p>
    </div>
  )
}

export default Auth
