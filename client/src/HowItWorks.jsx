export default function HowItWorks() {
  return (
    <div className="card">
      <h2>How Community Credit Works</h2>
      <div className="flow-diagram">
        <div className="flow-node lender-color">💰<br />Lenders</div>
        <span className="flow-arrow">→</span>
        <div className="flow-node dark">₹<br />Pooled Escrow</div>
        <span className="flow-arrow">→</span>
        <div className="flow-node borrower-color">🛍️<br />Borrowers</div>
      </div>
      <p className="muted center">Money moves only through a pooled account. No single lender ever carries one borrower's full risk.</p>

      <div className="checklist">
        <div><span className="check">✓</span> <b>Diversified.</b> Every loan is split across every lender currently in that pool.</div>
        <div><span className="check">✓</span> <b>Instant.</b> Borrowers get a credit decision in seconds based on a transparent trust score.</div>
        <div><span className="check">✓</span> <b>Aligned.</b> Lenders earn real returns only as borrowers repay — visible in real time.</div>
        <div><span className="check">✓</span> <b>Building credit.</b> Every on-time repayment raises a borrower's trust score and future limit.</div>
      </div>

      <div className="divider-label">Common questions</div>
      <div className="presets" style={{ marginBottom: '1.25rem' }}>
        <span className="tag">Is my capital guaranteed?</span>
        <span className="tag">What if a borrower defaults?</span>
        <span className="tag">Lending limits?</span>
      </div>

      <div className="disclaimer">
        This is a hackathon prototype demonstrating the lending mechanics — not a regulated financial product. A real version would require RBI NBFC-P2P registration, KYC/AML checks, and escrow banking infrastructure.
      </div>
    </div>
  )
}
