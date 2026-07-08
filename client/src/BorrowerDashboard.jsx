import { useEffect, useState } from 'react'
import { api } from './api'

const PURPOSES = ['Restock inventory', 'Emergency', 'Festival', 'General']

export default function BorrowerDashboard({ borrowerId, onBack }) {
  const [borrower, setBorrower] = useState(null)
  const [pools, setPools] = useState([])
  const [amount, setAmount] = useState(2000)
  const [purpose, setPurpose] = useState(PURPOSES[0])
  const [selectedPool, setSelectedPool] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [approval, setApproval] = useState(null)
  const [error, setError] = useState(null)
  const [payingId, setPayingId] = useState(null)

  const load = () => {
    api.getBorrower(borrowerId).then(setBorrower).catch((err) => setError(err.message))
    api.getPools().then((p) => {
      setPools(p)
      setSelectedPool((prev) => prev ?? p[1]?.id ?? p[0]?.id)
    })
  }

  useEffect(load, [borrowerId])

  const handleApply = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setApproval(null)
    try {
      const loan = await api.applyForLoan({
        borrower_id: borrowerId,
        pool_id: selectedPool,
        amount: Number(amount),
        purpose,
      })
      setApproval(loan)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePay = async (installmentId) => {
    setPayingId(installmentId)
    try {
      await api.payInstallment(installmentId)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setPayingId(null)
    }
  }

  if (!borrower) return <p className="muted">Loading...</p>

  const activeLoans = borrower.loans.filter((l) => l.status === 'active')

  return (
    <div>
      <button className="link" onClick={onBack}>&larr; Switch account</button>

      <div className="card hero-card borrower-hero">
        <div className="hero-label">Trust Score</div>
        <div className="hero-value">{Math.round(borrower.trust_score)}</div>
        <div className="muted" style={{ color: '#f8cfe4' }}>Credit limit: ₹{borrower.creditLimit.toLocaleString('en-IN')}</div>
      </div>

      {activeLoans.length === 0 && (
        <div className="card">
          <h3>Get Instant Credit</h3>
          <form onSubmit={handleApply}>
            <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem' }}>
              <div className="muted">How much do you need?</div>
              <input
                type="number"
                min="100"
                max={borrower.creditLimit}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="big-amount-input"
              />
            </div>

            <div className="muted small" style={{ marginBottom: 6 }}>What's it for?</div>
            <div className="presets" style={{ marginBottom: '1rem' }}>
              {PURPOSES.map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`chip ${purpose === p ? 'active' : ''}`}
                  onClick={() => setPurpose(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="muted small" style={{ marginBottom: 6 }}>Choose a repayment plan</div>
            <div className="pool-grid" style={{ marginBottom: '1rem' }}>
              {pools.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={`pool-card borrower ${selectedPool === p.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPool(p.id)}
                >
                  <div className="pool-name">{p.tenure_months} monthly EMIs</div>
                  <div className="muted small">≈ ₹{Math.round((amount * (1 + p.target_rate_pct / 100 * p.tenure_months / 12)) / p.tenure_months).toLocaleString('en-IN')}/mo · {p.target_rate_pct}% p.a.</div>
                </button>
              ))}
            </div>

            {error && <p className="error">{error}</p>}
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? 'Checking...' : `Get ₹${Number(amount).toLocaleString('en-IN')} now`}
            </button>
          </form>
        </div>
      )}

      {approval && (
        <div className="card approval-card">
          <div className="approval-check">✓</div>
          <h3>₹{approval.amount.toLocaleString('en-IN')} approved instantly</h3>
          <p className="muted">
            Repay ₹{approval.installmentAmount.toLocaleString('en-IN')} × {approval.tenureMonths} months · funded by {approval.fundedBy} community lenders
          </p>
        </div>
      )}

      {activeLoans.map((loan) => (
        <div className="card" key={loan.id}>
          <h3>Repayment Schedule</h3>
          <p className="muted">{loan.purpose} · ₹{loan.amount.toLocaleString('en-IN')} via {loan.pool_name}</p>
          <table className="table">
            <thead>
              <tr><th>#</th><th>Amount</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {loan.installments.map((inst) => (
                <tr key={inst.id}>
                  <td>{inst.seq_no}</td>
                  <td>₹{inst.amount.toLocaleString('en-IN')}</td>
                  <td><span className={`badge status-${inst.status === 'paid' ? 'approved' : 'pending'}`}>{inst.status === 'paid' ? 'Paid' : 'Due'}</span></td>
                  <td>
                    {inst.status !== 'paid' && (
                      <button className="small primary" disabled={payingId === inst.id} onClick={() => handlePay(inst.id)}>
                        {payingId === inst.id ? 'Paying...' : 'Pay now'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {borrower.loans.filter((l) => l.status === 'completed').length > 0 && (
        <div className="card">
          <h3>Completed Loans</h3>
          {borrower.loans.filter((l) => l.status === 'completed').map((l) => (
            <div key={l.id} className="activity-row">
              <span className="activity-note">{l.purpose} · ₹{l.amount.toLocaleString('en-IN')}</span>
              <span className="badge status-approved">Repaid</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
