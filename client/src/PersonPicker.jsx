import { useEffect, useState } from 'react'

export default function PersonPicker({ title, subtitle, ctaLabel, createFn, listFn, onSelect }) {
  const [people, setPeople] = useState([])
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listFn().then(setPeople).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const person = await createFn({ name })
      onSelect(person.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h2>{title}</h2>
      <p className="muted">{subtitle}</p>
      <form onSubmit={handleSubmit} className="inline-form">
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Please wait...' : ctaLabel}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      {people.length > 0 && (
        <>
          <div className="divider-label">or continue as</div>
          <div className="person-chips">
            {people.map((p) => (
              <button key={p.id} className="chip" onClick={() => onSelect(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
