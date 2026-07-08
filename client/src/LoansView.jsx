import { useEffect, useState } from 'react'
import { api } from './api'

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
}

export default function LoansView() {
  const [loans, setLoans] = useState([])
  const [error, setError] = useState(null)

  const load = () => api.getLoans().then(setLoans).catch((err) => setError(err.message))

  useEffect(load, [])

  const setStatus = async (id, status) => {
    try {
      await api.updateLoanStatus(id, status)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="card">
      <h2>All Loan Applications</h2>
      <p className="muted">Simulated lender view — approve, reject, or mark loans as disbursed.</p>
      {error && <p className="error">{error}</p>}
      {loans.length === 0 && <p className="muted">No loan applications yet.</p>}
      {loans.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Seller</th>
              <th>Lender</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr key={l.id}>
                <td>{l.seller_name}</td>
                <td>{l.lender_name}</td>
                <td>₹{Number(l.amount).toLocaleString('en-IN')}</td>
                <td>
                  <span className={`badge status-${l.status}`}>{STATUS_LABEL[l.status]}</span>
                </td>
                <td className="actions">
                  {l.status === 'pending' && (
                    <>
                      <button className="small" onClick={() => setStatus(l.id, 'approved')}>Approve</button>
                      <button className="small danger" onClick={() => setStatus(l.id, 'rejected')}>Reject</button>
                    </>
                  )}
                  {l.status === 'approved' && (
                    <button className="small" onClick={() => setStatus(l.id, 'disbursed')}>Mark Disbursed</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
