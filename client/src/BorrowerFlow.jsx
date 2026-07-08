import { useEffect, useState } from 'react'
import { api } from './api'
import { PhoneFrame, ScreenHeader } from './PhoneFrame'

function ProductPage({ product, onBuy }) {
  const discountPct = Math.round((1 - product.price / product.mrp) * 100)
  return (
    <PhoneFrame>
      <ScreenHeader title="Product details" right="♡" />
      <div className="phone-body" style={{ padding: 0 }}>
        <div style={{ height: 200, margin: '0 16px', borderRadius: 16, background: 'linear-gradient(135deg,#f3e2ec,#efd6e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <span className="muted small">Product photo</span>
          <span style={{ position: 'absolute', top: 12, left: 12, background: '#e0117e', color: '#fff', fontWeight: 800, fontSize: 10, padding: '4px 8px', borderRadius: 6 }}>{discountPct}% OFF</span>
        </div>
        <div style={{ padding: '14px 18px 0' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
            <span style={{ fontWeight: 800, fontSize: 22 }}>₹{product.price}</span>
            <span className="muted" style={{ textDecoration: 'line-through', fontSize: 14 }}>₹{product.mrp}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9 }}>
            <span style={{ background: '#0e9f6e', color: '#fff', fontWeight: 800, fontSize: 11, padding: '2px 7px', borderRadius: 5 }}>{product.rating} ★</span>
            <span className="muted small">{product.rating_count.toLocaleString('en-IN')} ratings · Free Delivery</span>
          </div>
          <div style={{ marginTop: 14, background: '#fce9f3', border: '1px solid #f6c9e0', borderRadius: 14, padding: '13px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: '#e0117e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>₹</span>
              <span style={{ fontWeight: 800, fontSize: 12.5, color: '#b00a63' }}>Community Pay Later</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Pay <b>₹{Math.round(product.price / 3)} × 3 months</b> · 0% interest</div>
            <div className="muted small" style={{ marginTop: 3 }}>Instant approval · No card needed</div>
          </div>
        </div>
      </div>
      <div className="phone-footer" style={{ display: 'flex', gap: 10 }}>
        <div className="phone-cta" style={{ background: '#fff', color: '#e0117e', border: '1.5px solid #e0117e', boxShadow: 'none', flex: 1 }}>Add to Cart</div>
        <button className="phone-cta" style={{ flex: 1 }} onClick={onBuy}>Buy Now</button>
      </div>
    </PhoneFrame>
  )
}

function CheckoutScreen({ product, onBack, onContinue }) {
  return (
    <PhoneFrame>
      <ScreenHeader title="Payment" onBack={onBack} />
      <div className="phone-body">
        <div className="muted small" style={{ textTransform: 'uppercase', fontWeight: 700, marginTop: 4 }}>Pay in full</div>
        <div className="option-row"><span className="radio" />UPI · GPay, PhonePe<span style={{ marginLeft: 'auto' }} className="muted small">₹{product.price}</span></div>
        <div className="option-row"><span className="radio" />Cash on Delivery<span style={{ marginLeft: 'auto' }} className="muted small">+₹15</span></div>
        <div className="muted small" style={{ textTransform: 'uppercase', fontWeight: 700, marginTop: 8 }}>Pay later</div>
        <div className="option-row selected">
          <span className="radio" />
          <span style={{ width: 20, height: 20, borderRadius: 6, background: '#e0117e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>₹</span>
          <span style={{ fontWeight: 800, fontSize: 13.5, color: '#b00a63' }}>Community Pay Later</span>
        </div>
        <div className="muted small" style={{ marginTop: -4, marginBottom: 12, paddingLeft: 2 }}>Pay ₹0 today. Split into easy instalments — 0% interest.</div>
        <div style={{ marginTop: 'auto', background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 13, padding: '13px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span className="muted">Item total</span><span>₹{product.price}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginTop: 5 }}><span className="muted">Delivery</span><span style={{ color: '#0e9f6e' }}>FREE</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, marginTop: 9, paddingTop: 9, borderTop: '1px dashed rgba(42,21,32,.12)' }}><span>To pay later</span><span>₹{product.price}</span></div>
        </div>
      </div>
      <div className="phone-footer"><button className="phone-cta" onClick={onContinue}>Continue</button></div>
    </PhoneFrame>
  )
}

const PLANS = [
  { key: '15day', label: 'Pay in 15 days', sub: 'One payment · No fee' },
  { key: '3emi', label: '3 monthly EMIs', sub: '0% interest', popular: true },
  { key: '6emi', label: '6 monthly EMIs', sub: '₹30 fee' },
]

function planAmount(plan, price) {
  if (plan === '15day') return price
  if (plan === '3emi') return Math.round(price / 3)
  return Math.round((price + 30) / 6)
}

function ChoosePlanScreen({ product, plan, setPlan, onBack, onConfirm }) {
  return (
    <PhoneFrame>
      <ScreenHeader title="Choose your plan" onBack={onBack} />
      <div className="phone-body">
        {PLANS.map((p) => (
          <div key={p.key} className={`option-row ${plan === p.key ? 'selected' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', position: 'relative' }} onClick={() => setPlan(p.key)}>
            {p.popular && <span style={{ position: 'absolute', top: -9, left: 14, background: '#e0117e', color: '#fff', fontWeight: 800, fontSize: 9.5, padding: '3px 8px', borderRadius: 5 }}>MOST POPULAR</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{p.label}</div>
                <div className="muted small" style={{ marginTop: 3 }}>{p.sub}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 18 }}>₹{planAmount(p.key, product.price)}</div>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#0e9f6e' }}>{p.key === '6emi' ? 'Low EMI' : '0% interest'}</div>
              </div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 9, background: '#f3eef6', borderRadius: 12, padding: '12px 13px' }}>
          <span style={{ width: 22, height: 22, borderRadius: 7, background: '#0e9f6e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flex: 'none' }}>✓</span>
          <div className="muted small">Your instalments are funded by verified community lenders — split across many, so no one carries all the risk.</div>
        </div>
      </div>
      <div className="phone-footer">
        <button className="phone-cta" onClick={onConfirm}>Confirm plan · ₹{planAmount(plan, product.price)}/mo</button>
      </div>
    </PhoneFrame>
  )
}

function KycScreen({ borrower, onBack, onVerified, submitting, error }) {
  const [pan, setPan] = useState('')
  const [panSaved, setPanSaved] = useState(!!borrower.pan_last4)
  const [aadhaar, setAadhaar] = useState(!!borrower.aadhaar_verified)
  const [busy, setBusy] = useState(false)

  const savePan = async () => {
    if (!pan.trim()) return
    setBusy(true)
    await api.savePan(borrower.id, pan)
    setPanSaved(true)
    setBusy(false)
  }

  const verifyAadhaar = async () => {
    setBusy(true)
    await api.verifyAadhaar(borrower.id)
    setAadhaar(true)
    setBusy(false)
  }

  return (
    <PhoneFrame>
      <ScreenHeader title="Verify to unlock credit" onBack={onBack} />
      <div className="phone-body">
        <p className="muted small">One-time check. Takes about 40 seconds.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 16px' }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: '#0e9f6e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>✓</span>
          <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Mobile number</div><div style={{ color: '#0e9f6e', fontSize: 12, fontWeight: 600 }}>Verified</div></div>
        </div>

        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 7 }}>PAN number</div>
        {panSaved ? (
          <div style={{ background: '#fff', border: '1.5px solid #0e9f6e', borderRadius: 12, padding: 14, fontWeight: 700, marginBottom: 16, color: '#0b7a54' }}>✓ PAN verified</div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCPK1234F" maxLength={10} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: '1.5px solid #e0117e', fontWeight: 700, letterSpacing: 1 }} />
            <button className="small primary" disabled={busy} onClick={savePan}>Save</button>
          </div>
        )}

        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 7 }}>Aadhaar eKYC</div>
        {aadhaar ? (
          <div style={{ background: '#fff', border: '1.5px solid #0e9f6e', borderRadius: 12, padding: 14, fontWeight: 700, color: '#0b7a54' }}>✓ Aadhaar verified</div>
        ) : (
          <div className="option-row" onClick={verifyAadhaar} style={{ cursor: busy ? 'default' : 'pointer' }}>
            <span>🆔</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>Verify with OTP</span>
            <span style={{ fontWeight: 700, fontSize: 12, color: '#e0117e' }}>{busy ? 'Sending...' : 'Send OTP →'}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 0', marginTop: 'auto' }}>
          <span>🔒</span>
          <div className="muted small">Bank-grade encryption. Data shared only with the regulated lending partner.</div>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
      <div className="phone-footer">
        <button className="phone-cta" disabled={!panSaved || !aadhaar || submitting} onClick={onVerified}>
          {submitting ? 'Verifying...' : 'Verify & continue'}
        </button>
      </div>
    </PhoneFrame>
  )
}

function PendingReviewScreen({ onRecheck, onHome, checking }) {
  return (
    <PhoneFrame>
      <ScreenHeader title="Application status" />
      <div className="phone-body" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🕐</div>
        <h3>Under review</h3>
        <p className="muted">Your application needs a quick manual check by our risk team. This usually takes a few minutes.</p>
      </div>
      <div className="phone-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="phone-cta green" onClick={onRecheck} disabled={checking}>{checking ? 'Checking...' : 'Check status'}</button>
        <button className="phone-cta" style={{ background: '#fff', color: '#6b5560', boxShadow: 'none', border: '1px solid rgba(42,21,32,.15)' }} onClick={onHome}>Back to shopping</button>
      </div>
    </PhoneFrame>
  )
}

function CreditUnlockedScreen({ borrower, order, onContinue }) {
  const used = borrower.usedCredit
  const limit = borrower.creditLimit
  const pct = Math.min((used / limit) * 100, 100)
  return (
    <PhoneFrame tint="tint-magenta">
      <ScreenHeader title="" />
      <div className="phone-body" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#fff' }}>
        <div style={{ width: 74, height: 74, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 38 }}>🎉</div>
        <div style={{ color: '#f8cfe4', fontWeight: 600 }}>Congrats, {borrower.name}! Your limit is</div>
        <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 48, margin: '6px 0 4px' }}>₹{limit.toLocaleString('en-IN')}</div>
        <div style={{ color: '#f8cfe4', fontSize: 13, marginBottom: 26 }}>Shop now, pay in easy instalments</div>
        <div style={{ width: '100%', background: 'rgba(255,255,255,.14)', borderRadius: 16, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 12, marginBottom: 8 }}><span>Using ₹{used.toLocaleString('en-IN')}</span><span>Available ₹{(limit - used).toLocaleString('en-IN')}</span></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
      <div className="phone-footer"><button className="phone-cta light" onClick={onContinue}>Complete purchase</button></div>
    </PhoneFrame>
  )
}

function OrderPlacedScreen({ order, onViewSchedule }) {
  return (
    <PhoneFrame>
      <ScreenHeader title="" />
      <div className="phone-body">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 18 }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#0e9f6e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, marginBottom: 10 }}>✓</span>
          <div style={{ fontWeight: 800, fontSize: 17 }}>Order placed!</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 16, padding: 15 }}>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 12 }}>How your purchase is funded</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: '#e0117e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>You</span>
            <span style={{ flex: 1, height: 2, background: 'repeating-linear-gradient(90deg,#d6c2cd 0 5px,transparent 5px 10px)', margin: '0 6px' }} />
            <span style={{ width: 36, height: 36, borderRadius: 10, background: '#2a1520', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 9, textAlign: 'center' }}>P2P<br />NBFC</span>
            <span style={{ flex: 1, height: 2, background: 'repeating-linear-gradient(90deg,#d6c2cd 0 5px,transparent 5px 10px)', margin: '0 6px' }} />
            <span style={{ width: 36, height: 36, borderRadius: 10, background: '#0e9f6e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{order.fundedBy}</span>
          </div>
          <div className="muted small" style={{ textAlign: 'center' }}>Your ₹{order.amount} was pooled from <b style={{ color: '#2a1520' }}>{order.fundedBy} community lender{order.fundedBy === 1 ? '' : 's'}</b> — no single person carries the risk.</div>
        </div>
        <div style={{ marginTop: 14, background: '#f3eef6', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}><div className="muted small">First instalment due</div><div style={{ fontWeight: 800, fontSize: 16 }}>₹{order.installmentAmount} · in 30 days</div></div>
          <span style={{ fontSize: 12, background: '#e0117e', color: '#fff', fontWeight: 800, padding: '5px 10px', borderRadius: 8 }}>Scheduled</span>
        </div>
      </div>
      <div className="phone-footer"><button className="phone-cta" onClick={onViewSchedule}>View repayment schedule</button></div>
    </PhoneFrame>
  )
}

function RepaymentDashboard({ borrower, onBack, onPay, onTrust }) {
  const activeLoan = borrower.loans.find((l) => l.status === 'active')
  const allInstallments = borrower.loans.filter((l) => l.status === 'active').flatMap((l) => l.installments.map((i) => ({ ...i, loan: l })))
  const paid = allInstallments.filter((i) => i.status === 'paid').length
  const total = allInstallments.length
  const outstanding = allInstallments.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)
  const nextDue = allInstallments.find((i) => i.status !== 'paid')

  return (
    <PhoneFrame>
      <ScreenHeader title="My Pay Later" onBack={onBack} right={<span onClick={onTrust} style={{ cursor: 'pointer' }}>ⓘ</span>} />
      <div className="phone-body">
        <div style={{ background: '#2a1520', borderRadius: 18, padding: '17px 18px', color: '#fff' }}>
          <div style={{ color: '#f6a8d4', fontSize: 12, fontWeight: 600 }}>Total outstanding</div>
          <div style={{ fontWeight: 800, fontSize: 30, margin: '3px 0 12px' }}>₹{outstanding.toLocaleString('en-IN')}</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
            {Array.from({ length: total || 1 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 7, borderRadius: 4, background: i < paid ? '#0e9f6e' : 'rgba(255,255,255,.22)' }} />
            ))}
          </div>
          <div className="muted small" style={{ color: '#e8d5df' }}>{paid} of {total || 0} instalments paid</div>
        </div>

        {allInstallments.length === 0 && <p className="muted" style={{ marginTop: 16 }}>No active Pay Later purchases. Go shopping to get started.</p>}

        {allInstallments.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 16, overflow: 'hidden', marginTop: 12 }}>
            {allInstallments.map((inst) => (
              <div key={inst.id} className="list-row">
                <span className="list-icon" style={{ background: inst.status === 'paid' ? '#e5f5ee' : '#fce9f3', color: inst.status === 'paid' ? '#0e9f6e' : '#e0117e' }}>
                  {inst.status === 'paid' ? '✓' : inst.seq_no}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Instalment {inst.seq_no}</div>
                  <div className="muted small">{inst.status === 'paid' ? 'Paid' : `Due in ${inst.due_offset_days} days`}</div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 13 }}>₹{inst.amount}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#e5f5ee', borderRadius: 12, padding: '11px 13px', marginTop: 12 }}>
          <span>⚡</span>
          <div className="muted small" style={{ color: '#0b7a54' }}>Pay on time to raise your trust score and credit limit.</div>
        </div>
      </div>
      {nextDue && (
        <div className="phone-footer"><button className="phone-cta" onClick={() => onPay(nextDue)}>Pay ₹{nextDue.amount} now</button></div>
      )}
    </PhoneFrame>
  )
}

function PayInstallmentScreen({ installment, onBack, onPaid, submitting }) {
  return (
    <PhoneFrame>
      <ScreenHeader title={`Pay instalment ${installment.seq_no}`} onBack={onBack} />
      <div className="phone-body">
        <div style={{ textAlign: 'center', padding: '14px 0 18px' }}>
          <div className="muted small">Amount due</div>
          <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 46 }}>₹{installment.amount}</div>
        </div>
        <div className="muted small" style={{ textTransform: 'uppercase', fontWeight: 700, marginBottom: 9 }}>Pay using</div>
        <div className="option-row selected"><span>🟣</span><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5 }}>UPI</div></div><span className="radio" /></div>
        <div className="option-row"><span>🏦</span><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5 }}>Net banking / card</div></div><span className="radio" /></div>
      </div>
      <div className="phone-footer"><button className="phone-cta" disabled={submitting} onClick={onPaid}>{submitting ? 'Paying...' : `Pay ₹${installment.amount}`}</button></div>
    </PhoneFrame>
  )
}

function TrustScoreScreen({ borrower, onBack }) {
  const score = Math.round(borrower.trust_score)
  const label = score >= 750 ? 'Excellent' : score >= 650 ? 'Good · Trusted borrower' : score >= 550 ? 'Building trust' : 'New borrower'
  const util = borrower.creditLimit > 0 ? Math.round((borrower.usedCredit / borrower.creditLimit) * 100) : 0
  const onTimePct = (() => {
    const all = borrower.loans.flatMap((l) => l.installments)
    const paid = all.filter((i) => i.status === 'paid').length
    return all.length ? Math.round((paid / all.length) * 100) : 100
  })()

  return (
    <PhoneFrame>
      <ScreenHeader title="Your Trust Score" onBack={onBack} />
      <div className="phone-body">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 16px' }}>
          <div className="gauge" />
          <div style={{ marginTop: -52, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 42 }}>{score}</div>
            <div className="muted small">out of 900</div>
          </div>
          <div style={{ marginTop: 10, background: '#e5f5ee', color: '#0b7a54', fontWeight: 800, fontSize: 12, padding: '5px 14px', borderRadius: 100 }}>{label}</div>
        </div>

        <div className="muted small" style={{ textTransform: 'uppercase', fontWeight: 700, marginBottom: 9 }}>What builds your score</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 12, padding: '11px 13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontWeight: 700, fontSize: 12.5 }}>On-time payments</span><span style={{ fontWeight: 800, fontSize: 11, color: '#0e9f6e' }}>High impact</span></div>
            <div className="progress-track" style={{ background: '#eee2ea' }}><div className="progress-fill" style={{ width: `${onTimePct}%` }} /></div>
          </div>
          <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 12, padding: '11px 13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontWeight: 700, fontSize: 12.5 }}>Credit utilisation</span><span style={{ fontWeight: 800, fontSize: 11, color: util > 70 ? '#e8850c' : '#0e9f6e' }}>{util > 70 ? 'Watch' : 'Healthy'}</span></div>
            <div className="progress-track" style={{ background: '#eee2ea' }}><div className="progress-fill" style={{ width: `${util}%`, background: util > 70 ? '#e8850c' : '#0e9f6e' }} /></div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', background: '#f3eef6', borderRadius: 12, padding: '12px 13px', display: 'flex', gap: 9 }}>
          <span>💡</span>
          <div className="muted small">Every on-time instalment adds points to your score and raises your limit.</div>
        </div>
      </div>
    </PhoneFrame>
  )
}

export default function BorrowerFlow({ borrowerId, onSwitchAccount }) {
  const [screen, setScreen] = useState('product')
  const [borrower, setBorrower] = useState(null)
  const [product, setProduct] = useState(null)
  const [plan, setPlan] = useState('3emi')
  const [order, setOrder] = useState(null)
  const [activeInstallment, setActiveInstallment] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const loadBorrower = () => api.getBorrower(borrowerId).then(setBorrower)

  useEffect(() => {
    loadBorrower()
    api.getProducts().then((p) => setProduct(p[0]))
  }, [borrowerId])

  const submitOrder = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const result = await api.createOrder({ borrower_id: borrowerId, product_id: product.id, plan })
      await loadBorrower()
      if (result.status === 'pending_review') {
        setScreen('pending')
      } else {
        setOrder(result)
        setScreen('unlocked')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleKycVerified = () => submitOrder()

  const recheckPending = async () => {
    setSubmitting(true)
    await loadBorrower()
    setSubmitting(false)
  }

  const handlePay = async () => {
    setSubmitting(true)
    try {
      await api.payInstallment(activeInstallment.id)
      await loadBorrower()
      setScreen('repayment')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!borrower || !product) return <p className="muted center">Loading...</p>

  return (
    <div>
      <button className="link" onClick={onSwitchAccount}>&larr; Switch account</button>

      {screen === 'product' && <ProductPage product={product} onBuy={() => setScreen('checkout')} />}
      {screen === 'checkout' && <CheckoutScreen product={product} onBack={() => setScreen('product')} onContinue={() => setScreen('plan')} />}
      {screen === 'plan' && (
        <ChoosePlanScreen
          product={product}
          plan={plan}
          setPlan={setPlan}
          onBack={() => setScreen('checkout')}
          onConfirm={() => (borrower.aadhaar_verified ? submitOrder() : setScreen('kyc'))}
        />
      )}
      {screen === 'kyc' && (
        <KycScreen borrower={borrower} onBack={() => setScreen('plan')} onVerified={handleKycVerified} submitting={submitting} error={error} />
      )}
      {screen === 'pending' && <PendingReviewScreen checking={submitting} onRecheck={recheckPending} onHome={() => setScreen('product')} />}
      {screen === 'unlocked' && order && <CreditUnlockedScreen borrower={borrower} order={order} onContinue={() => setScreen('orderplaced')} />}
      {screen === 'orderplaced' && order && <OrderPlacedScreen order={order} onViewSchedule={() => setScreen('repayment')} />}
      {screen === 'repayment' && (
        <RepaymentDashboard
          borrower={borrower}
          onBack={() => setScreen('product')}
          onTrust={() => setScreen('trust')}
          onPay={(inst) => { setActiveInstallment(inst); setScreen('pay') }}
        />
      )}
      {screen === 'pay' && activeInstallment && (
        <PayInstallmentScreen installment={activeInstallment} onBack={() => setScreen('repayment')} onPaid={handlePay} submitting={submitting} />
      )}
      {screen === 'trust' && <TrustScoreScreen borrower={borrower} onBack={() => setScreen('repayment')} />}

      {error && screen !== 'kyc' && <p className="error">{error}</p>}

      {borrower.loans.some((l) => l.status === 'active') && !['repayment', 'pay', 'trust'].includes(screen) && (
        <button className="link" style={{ display: 'block', margin: '0 auto' }} onClick={() => setScreen('repayment')}>View my Pay Later dashboard</button>
      )}
    </div>
  )
}
