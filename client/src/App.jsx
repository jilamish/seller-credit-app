import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [seeding, setSeeding] = useState(false)

  const loadHealth = () => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadHealth()
  }, [])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await fetch('/api/seed', { method: 'POST' })
      loadHealth()
    } catch (err) {
      setError(err.message)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <section style={{ maxWidth: 640, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>Seller Credit App</h1>
      <h2>Backend Health Check</h2>
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {!health && !error && <p>Checking...</p>}
      {health && (
        <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: 8, overflowX: 'auto' }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      )}
      <button onClick={handleSeed} disabled={seeding}>
        {seeding ? 'Seeding...' : 'Seed Sample Data'}
      </button>
    </section>
  )
}

export default App
