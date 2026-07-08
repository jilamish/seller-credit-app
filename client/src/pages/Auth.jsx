import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export function Login() {
  const [email, setEmail] = useState('demo@fairygodrobe.app')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await login(email, password)
      navigate(user.onboarded ? '/closet' : `/onboarding/${user.onboardingStep}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fg-auth-page">
      <div className="fg-auth-card">
        <h2 className="fg-h3">Welcome back, darling</h2>
        <p className="fg-p-muted">Log in to see your closet.</p>
        <form onSubmit={handleSubmit} className="fg-form">
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <p className="fg-error">{error}</p>}
          <button className="fg-btn-solid" type="submit" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
        </form>
        <p className="fg-p-muted" style={{ marginTop: 18 }}>Try the demo account: <b>demo@fairygodrobe.app</b> / <b>demo1234</b></p>
        <p className="fg-p-muted">New here? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  )
}

export function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register(name, email, password)
      navigate('/onboarding/1')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fg-auth-page">
      <div className="fg-auth-card">
        <h2 className="fg-h3">Meet your fairy godmother</h2>
        <p className="fg-p-muted">Create an account to start cataloging your closet.</p>
        <form onSubmit={handleSubmit} className="fg-form">
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required /></label>
          {error && <p className="fg-error">{error}</p>}
          <button className="fg-btn-solid" type="submit" disabled={busy}>{busy ? 'Creating...' : 'Get early access →'}</button>
        </form>
        <p className="fg-p-muted">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  )
}
