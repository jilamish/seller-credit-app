import { useEffect, useState } from 'react'
import { api } from './api'

const QUICK_AMOUNTS = [1000, 5000, 10000]

export default function LenderDashboard({ lenderId, onBack }) {
  const [lender, setLender] = useState(null)
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [amount, setAmount] = useState(5000)
  const [investing, setInvesting] = useState(false)
  const [error, setError] = useState(null)

  const load = () => {
    api.getLender(lenderId).then(setLender).catch((err) => setError(err.message))
    api.getPools().then((p) => {
      setPools(p)
      setSelectedPool((prev) => prev ?? p[1]?.id ?? p[0]?.id)
    })
  }

  useEffect(load, [lenderId])

  const handleInvest = async () => {
    if (!selectedPool) return
    setInvesting(true)
    setError(null)
    try {
      await api.invest(lenderId, { pool_id: selectedPool, amount: Number(amount) })
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setInvesting(false)
    }
  }

  if (!lender) return <p className="muted">Loading...</p>

  return (
    <div>
      <button className="link" onClick={onBack}>&larr; Switch account</button>

      <div className="card hero-card lender-hero">
        <div className="hero-label">Portfolio value</div>
        <div className="hero-value">₹{Math.round(lender.currentValue).toLocaleString('en-IN')}</div>
        <div className="hero-stats">
          <div><span className="hero-stat-label">Invested</span><span className="hero-stat-value">₹{Math.round(lender.invested).toLocaleString('en-IN')}</span></div>
          <div><span className="hero-stat-label">Returns</span><span className="hero-stat-value">+₹{Math.round(lender.returns).toLocaleString('en-IN')}</span></div>
          <div><span className="hero-stat-label">Loans funded</span><span className="hero-stat-value">{lender.loansFunded}</span></div>
        </div>
      </div>

      <div className="card">
        <h3>Add Money to a Pool</h3>
        <p className="muted">Diversified automatically across every borrower funded from this pool.</p>

        <div className="pool-grid">
          {pools.map((p) => (
            <button
              key={p.id}
              className={`pool-card ${selectedPool === p.id ? 'selected' : ''}`}
              onClick={() => setSelectedPool(p.id)}
            >
              <div className="pool-rate">{p.target_rate_pct}%</div>
              <div className="pool-name">{p.name}</div>
              <div className="muted small">Grade {p.grade} · {p.tenure_months} mo · ₹{Math.round(p.stats.available).toLocaleString('en-IN')} available</div>
            </button>
          ))}
        </div>

        <div className="amount-row">
          {QUICK_AMOUNTS.map((a) => (
            <button key={a} className={`chip ${Number(amount) === a ? 'active' : ''}`} onClick={() => setAmount(a)}>
              +₹{a.toLocaleString('en-IN')}
            </button>
          ))}
          <input
            type="number"
            min="500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="amount-input"
          />
        </div>

        {error && <p className="error">{error}</p>}
        <button className="primary" onClick={handleInvest} disabled={investing}>
          {investing ? 'Adding...' : `Add ₹${Number(amount).toLocaleString('en-IN')}`}
        </button>
      </div>

      <div className="card">
        <h3>Recent Activity</h3>
        {lender.activity.length === 0 && <p className="muted">No activity yet.</p>}
        {lender.activity.map((a) => (
          <div key={a.id} className="activity-row">
            <span className={`activity-icon ${a.type}`}>{a.type === 'invested' ? '↑' : '↓'}</span>
            <span className="activity-note">{a.note}</span>
            <span className={`activity-amount ${a.type === 'emi_collected' ? 'positive' : ''}`}>
              {a.type === 'emi_collected' ? '+' : ''}₹{Math.round(a.amount).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
