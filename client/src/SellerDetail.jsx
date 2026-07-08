import { useEffect, useState } from 'react'
import { api } from './api'

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
}

export default function SellerDetail({ sellerId, onBack }) {
  const [seller, setSeller] = useState(null)
  const [error, setError] = useState(null)
  const [applying, setApplying] = useState(null)

  const load = () => {
    api.getSeller(sellerId).then(setSeller).catch((err) => setError(err.message))
  }

  useEffect(load, [sellerId])

  const handleApply = async (lender) => {
    setApplying(lender.id)
    try {
      await api.applyForLoan({ seller_id: sellerId, lender_id: lender.id, amount: lender.max_amount })
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setApplying(null)
    }
  }

  if (error) return <p className="error">{error}</p>
  if (!seller) return <p className="muted">Loading...</p>

  return (
    <div>
      <button className="link" onClick={onBack}>&larr; Back to sellers</button>

      <div className="card">
        <h2>{seller.name}</h2>
        <div className="score-row">
          <div className="score-box">
            <span className="score-label">Alt-Data Score</span>
            <span className="score-value">{seller.alt_data_score}</span>
            <span className="muted small">Based on GMV, orders, returns, tenure, catalog</span>
          </div>
          <div className="score-box">
            <span className="score-label">Bureau Score (simulated)</span>
            <span className="score-value">{seller.bureau_score_sim}</span>
            <span className="muted small">Traditional-style estimate for comparison</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Eligible Lenders</h3>
        {seller.eligibleLenders.length === 0 && (
          <p className="muted">No lenders match this score yet. Try improving GMV, orders, or account age.</p>
        )}
        <table className="table">
          <thead>
            <tr>
              <th>Lender</th>
              <th>Max Amount</th>
              <th>Rate</th>
              <th>Tenure</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {seller.eligibleLenders.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>₹{Number(l.max_amount).toLocaleString('en-IN')}</td>
                <td>{l.rate_pct}%</td>
                <td>{l.tenure_months} mo</td>
                <td>
                  <button className="primary small" disabled={applying === l.id} onClick={() => handleApply(l)}>
                    {applying === l.id ? 'Applying...' : 'Apply'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Loan Applications</h3>
        {seller.loans.length === 0 && <p className="muted">No applications yet.</p>}
        {seller.loans.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Lender</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {seller.loans.map((l) => (
                <tr key={l.id}>
                  <td>{l.lender_name}</td>
                  <td>₹{Number(l.amount).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge status-${l.status}`}>{STATUS_LABEL[l.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
