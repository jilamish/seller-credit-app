export default function SellerList({ sellers, onSelect }) {
  if (!sellers.length) {
    return <p className="muted">No sellers yet — add one above to see it here.</p>
  }

  return (
    <div className="card">
      <h2>Sellers</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Alt-Data Score</th>
            <th>Bureau Sim</th>
            <th>Monthly GMV</th>
          </tr>
        </thead>
        <tbody>
          {sellers.map((s) => (
            <tr key={s.id} className="clickable" onClick={() => onSelect(s.id)}>
              <td>{s.name}</td>
              <td>
                <span className="badge score">{s.alt_data_score ?? '—'}</span>
              </td>
              <td>{s.bureau_score_sim ?? '—'}</td>
              <td>₹{Number(s.gmv_monthly).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
