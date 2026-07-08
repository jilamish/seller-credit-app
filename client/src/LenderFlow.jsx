import { useEffect, useState } from 'react'
import { api } from './api'
import { PhoneFrame, ScreenHeader } from './PhoneFrame'

function PortfolioHome({ lender, onAdd, onInvest, onReturns, onWithdraw }) {
  return (
    <PhoneFrame>
      <ScreenHeader title="My Portfolio" right={<span onClick={onReturns} style={{ cursor: 'pointer' }}>⚖️</span>} />
      <div className="phone-body">
        <div style={{ background: 'linear-gradient(140deg,#0e9f6e,#0b7a54)', borderRadius: 18, padding: '17px 18px', color: '#fff' }}>
          <div style={{ fontSize: 12, color: '#c8f0de', fontWeight: 600 }}>Current value</div>
          <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: -0.5, margin: '3px 0 8px' }}>₹{Math.round(lender.currentValue).toLocaleString('en-IN')}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div><div style={{ fontSize: 10.5, color: '#c8f0de' }}>Invested</div><div style={{ fontWeight: 700, fontSize: 13 }}>₹{Math.round(lender.invested).toLocaleString('en-IN')}</div></div>
            <div><div style={{ fontSize: 10.5, color: '#c8f0de' }}>Returns</div><div style={{ fontWeight: 700, fontSize: 13 }}>+₹{Math.round(lender.returns).toLocaleString('en-IN')}</div></div>
            <div><div style={{ fontSize: 10.5, color: '#c8f0de' }}>Return</div><div style={{ fontWeight: 700, fontSize: 13 }}>{lender.returnPct}%</div></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 11, margin: '12px 0' }}>
          <button className="phone-cta green" style={{ padding: '13px' }} onClick={onAdd}>+ Add money</button>
          <button className="phone-cta" style={{ background: '#fff', color: '#0b7a54', border: '1.5px solid #0e9f6e', boxShadow: 'none', padding: '13px' }} onClick={onInvest}>Invest</button>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div className="stat-mini"><div className="stat-mini-value">{lender.loansFunded}</div><div className="stat-mini-label">Loans funded</div></div>
          <div className="stat-mini"><div className="stat-mini-value" style={{ color: '#0e9f6e' }}>{lender.onTimeRepaidPct ?? '—'}{lender.onTimeRepaidPct !== null ? '%' : ''}</div><div className="stat-mini-label">On-time repaid</div></div>
        </div>
        <div className="muted small" style={{ textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Recent activity</div>
        <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 13, overflow: 'hidden' }}>
          {lender.activity.length === 0 && <div className="list-row muted small">No activity yet.</div>}
          {lender.activity.slice(0, 5).map((a) => (
            <div key={a.id} className="list-row">
              <span className="list-icon" style={{ background: a.type === 'emi_collected' ? '#e5f5ee' : '#f3eef6', color: a.type === 'emi_collected' ? '#0b7a54' : '#7b52d6' }}>
                {a.type === 'emi_collected' ? '↓' : a.type === 'withdrawn' ? '↑' : '↑'}
              </span>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 12 }}>{a.note}</div>
              <span style={{ fontWeight: 700, fontSize: 12, color: a.type === 'emi_collected' ? '#0e9f6e' : '#8a6b7c' }}>
                {a.type === 'emi_collected' ? '+' : ''}₹{Math.round(a.amount).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
        <button className="link" style={{ marginTop: 12 }} onClick={onWithdraw}>Withdraw money →</button>
      </div>
    </PhoneFrame>
  )
}

function AddMoneyScreen({ amount, setAmount, onBack, onContinue }) {
  return (
    <PhoneFrame>
      <ScreenHeader title="Add money" onBack={onBack} />
      <div className="phone-body">
        <div style={{ textAlign: 'center', padding: '18px 0 20px' }}>
          <div className="muted small">Enter amount</div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="big-amount-input"
            style={{ width: 200 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 9, marginBottom: 20 }}>
          {[1000, 10000, 25000].map((a) => (
            <button key={a} className={`chip ${Number(amount) === a ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setAmount(a)}>+₹{a.toLocaleString('en-IN')}</button>
          ))}
        </div>
        <div className="muted small" style={{ textTransform: 'uppercase', fontWeight: 700, marginBottom: 9 }}>From</div>
        <div className="option-row" style={{ marginBottom: 'auto' }}>
          <span>🏦</span>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>HDFC Bank ••4821</div><div className="muted small">UPI AutoPay linked</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#f3eef6', borderRadius: 12, padding: '11px 13px' }}>
          <span>🔒</span>
          <div className="muted small">Held safely until you allocate it to a pool.</div>
        </div>
      </div>
      <div className="phone-footer"><button className="phone-cta green" onClick={onContinue}>Add ₹{Number(amount).toLocaleString('en-IN')}</button></div>
    </PhoneFrame>
  )
}

function BrowsePoolsScreen({ pools, onBack, onSelect }) {
  const [filter, setFilter] = useState('All')
  const filtered = pools.filter((p) => filter === 'All' || (filter === 'Low risk' && p.grade === 'A') || (filter === 'High yield' && p.grade === 'C'))
  return (
    <PhoneFrame>
      <ScreenHeader title="Invest in pools" onBack={onBack} right="⚖️" />
      <div style={{ display: 'flex', gap: 7, padding: '4px 18px 10px' }}>
        {['All', 'Low risk', 'High yield'].map((f) => (
          <span key={f} className={`tag ${filter === f ? 'selected' : ''}`} onClick={() => setFilter(f)}>{f}</span>
        ))}
      </div>
      <div className="phone-body" style={{ paddingTop: 0 }}>
        {filtered.map((p) => (
          <div key={p.id} className="option-row" style={{ flexDirection: 'column', alignItems: 'stretch' }} onClick={() => onSelect(p)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div><div style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</div><div className="muted small">Grade {p.grade} · {p.grade === 'A' ? 'lowest risk' : p.grade === 'B' ? 'moderate risk' : 'higher risk'}</div></div>
              <span className="pill" style={{ background: p.grade === 'A' ? '#e5f5ee' : p.grade === 'B' ? '#fef2e2' : '#fdeaec', color: p.grade === 'A' ? '#0b7a54' : p.grade === 'B' ? '#b26a08' : '#c11d2b' }}>{p.grade}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 22, color: '#0e9f6e' }}>{p.target_rate_pct}%</span>
              <span className="muted small">p.a. target</span>
            </div>
            <div className="muted small" style={{ marginTop: 6 }}>{p.tenure_months}-month tenure · {p.stats.lenderCount} lenders · ₹{Math.round(p.stats.available).toLocaleString('en-IN')} available</div>
          </div>
        ))}
      </div>
    </PhoneFrame>
  )
}

function PoolDetailScreen({ pool, onBack, onInvest }) {
  const [detail, setDetail] = useState(null)
  useEffect(() => { api.getPool(pool.id).then(setDetail) }, [pool.id])
  const bars = [52, 64, 58, 76, 70, 88, 82, 94]

  return (
    <PhoneFrame>
      <ScreenHeader title={pool.name} onBack={onBack} right="ⓘ" />
      <div className="phone-body">
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="stat-mini"><div className="stat-mini-label">Target return</div><div className="stat-mini-value" style={{ color: '#0e9f6e' }}>{pool.target_rate_pct}%</div></div>
          <div className="stat-mini"><div className="stat-mini-label">Risk grade</div><div className="stat-mini-value">{pool.grade}</div></div>
          <div className="stat-mini"><div className="stat-mini-label">Tenure</div><div className="stat-mini-value">{pool.tenure_months}mo</div></div>
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 15, padding: 14, marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 11 }}>Illustrative performance trend</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 64 }}>
            {bars.map((h, i) => <div key={i} style={{ flex: 1, height: `${h}%`, background: i > 4 ? '#0e9f6e' : '#8fdcb9', borderRadius: '4px 4px 0 0' }} />)}
          </div>
          <div className="muted small" style={{ marginTop: 8 }}>Indicative only — actual returns depend on real repayments.</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 15, padding: 14, marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10 }}>Borrower mix</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#6b5560' }}>
            <span>{detail?.borrowerCount ?? '—'} loans funded</span>
            <span>avg loan ₹{detail ? Math.round(detail.avgLoan).toLocaleString('en-IN') : '—'}</span>
          </div>
          {detail?.onTimePct !== null && detail?.onTimePct !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#6b5560', marginTop: 4 }}>
              <span>On-time instalments</span><span style={{ color: '#2a1520', fontWeight: 700 }}>{detail.onTimePct}%</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fef2e2', borderRadius: 12, padding: '11px 13px', marginTop: 12 }}>
          <span>⚠️</span>
          <div className="muted small" style={{ color: '#8a5b09' }}>Returns are indicative, not guaranteed. Capital is at risk.</div>
        </div>
      </div>
      <div className="phone-footer"><button className="phone-cta green" onClick={onInvest}>Invest in this pool</button></div>
    </PhoneFrame>
  )
}

function FundAmountScreen({ pool, amount, setAmount, onBack, onInvest, submitting, error }) {
  const projected = Math.round(Number(amount) * (1 + (pool.target_rate_pct / 100) * (pool.tenure_months / 12)))
  const [autoInvest, setAutoInvest] = useState(true)
  return (
    <PhoneFrame>
      <ScreenHeader title={`Invest · ${pool.name}`} onBack={onBack} />
      <div className="phone-body">
        <div style={{ textAlign: 'center', padding: '10px 0 14px' }}>
          <div className="muted small">Investment amount</div>
          <input type="number" min="500" value={amount} onChange={(e) => setAmount(e.target.value)} className="big-amount-input" style={{ width: 180 }} />
        </div>
        <input type="range" min="500" max="50000" step="500" value={Math.min(amount, 50000)} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%', accentColor: '#0e9f6e', marginBottom: 16 }} />
        <div style={{ background: '#e5f5ee', borderRadius: 15, padding: 15, marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 12, color: '#0b7a54' }}>Projected value in {pool.tenure_months} months</span>
          <div style={{ fontWeight: 800, fontSize: 24, color: '#0b7a54', marginTop: 4 }}>≈ ₹{projected.toLocaleString('en-IN')}</div>
          <div className="muted small" style={{ color: '#0e9f6e', marginTop: 2 }}>+₹{(projected - Number(amount)).toLocaleString('en-IN')} at {pool.target_rate_pct}% p.a. target</div>
        </div>
        <div className="option-row" style={{ marginBottom: 'auto' }}>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>Auto-invest returns</div><div className="muted small">Re-lend EMIs as they come in</div></div>
          <button type="button" className={`toggle ${autoInvest ? 'on' : ''}`} onClick={() => setAutoInvest(!autoInvest)}><span /></button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
      <div className="phone-footer"><button className="phone-cta green" disabled={submitting} onClick={onInvest}>{submitting ? 'Investing...' : `Invest ₹${Number(amount).toLocaleString('en-IN')}`}</button></div>
    </PhoneFrame>
  )
}

function InvestedScreen({ pool, amount, onDone }) {
  return (
    <PhoneFrame tint="tint-green">
      <ScreenHeader title="" />
      <div className="phone-body" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#fff' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontSize: 34 }}>✅</div>
        <div style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 800, fontSize: 26 }}>₹{Number(amount).toLocaleString('en-IN')} invested</div>
        <div style={{ color: '#c8f0de', fontSize: 13, margin: '10px 0 24px', maxWidth: 250 }}>Added to <b style={{ color: '#fff' }}>{pool.name}</b>. Returns start accruing as borrowers repay.</div>
      </div>
      <div className="phone-footer"><button className="phone-cta light" onClick={onDone}>View portfolio</button></div>
    </PhoneFrame>
  )
}

function ReturnsRiskScreen({ lender, onBack }) {
  const gradeColor = { A: '#0e9f6e', B: '#e8850c', C: '#e02d3c' }
  return (
    <PhoneFrame>
      <ScreenHeader title="Returns & risk" onBack={onBack} />
      <div className="phone-body">
        <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 15, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="muted small" style={{ fontWeight: 600 }}>Net returns</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#0e9f6e' }}>{lender.returnPct}%</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, margin: '12px 0' }}>
          <div className="stat-mini"><div className="stat-mini-label">On-time repaid</div><div className="stat-mini-value" style={{ color: '#0e9f6e' }}>{lender.onTimeRepaidPct ?? '—'}{lender.onTimeRepaidPct !== null ? '%' : ''}</div></div>
          <div className="stat-mini"><div className="stat-mini-label">Loans funded</div><div className="stat-mini-value">{lender.loansFunded}</div></div>
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 15, padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 11 }}>Allocation by grade</div>
          {lender.allocation.length === 0 && <p className="muted small">No investments yet.</p>}
          {lender.allocation.length > 0 && (
            <>
              <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                {lender.allocation.map((a) => <div key={a.grade} style={{ width: `${a.pct}%`, background: gradeColor[a.grade] }} />)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {lender.allocation.map((a) => (
                  <div key={a.grade} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: gradeColor[a.grade] }} />
                    Grade {a.grade}
                    <span style={{ marginLeft: 'auto', color: '#8a6b7c' }}>{a.pct}% · ₹{Math.round(a.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </PhoneFrame>
  )
}

function WithdrawScreen({ lender, amount, setAmount, onBack, onWithdraw, submitting, error }) {
  return (
    <PhoneFrame>
      <ScreenHeader title="Withdraw" onBack={onBack} />
      <div className="phone-body">
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, background: '#e5f5ee', borderRadius: 13, padding: 13 }}><div className="muted small" style={{ color: '#0b7a54' }}>Available now</div><div style={{ fontWeight: 800, fontSize: 18, color: '#0b7a54' }}>₹{Math.round(lender.available).toLocaleString('en-IN')}</div></div>
          <div style={{ flex: 1, background: '#f3eef6', borderRadius: 13, padding: 13 }}><div className="muted small">Locked in loans</div><div style={{ fontWeight: 800, fontSize: 18 }}>₹{Math.round(lender.deployed).toLocaleString('en-IN')}</div></div>
        </div>
        <div style={{ textAlign: 'center', padding: '6px 0 16px' }}>
          <div className="muted small">Withdraw amount</div>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="big-amount-input" style={{ width: 180 }} />
        </div>
        <div className="muted small" style={{ textTransform: 'uppercase', fontWeight: 700, marginBottom: 9 }}>To bank</div>
        <div className="option-row" style={{ marginBottom: 'auto' }}>
          <span>🏦</span>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>HDFC Bank ••4821</div><div className="muted small">{lender.name}</div></div>
        </div>
        {error && <p className="error">{error}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#f3eef6', borderRadius: 12, padding: '11px 13px' }}>
          <span>⏱️</span>
          <div className="muted small">Only idle (undeployed) capital can be withdrawn instantly.</div>
        </div>
      </div>
      <div className="phone-footer"><button className="phone-cta green" disabled={submitting} onClick={onWithdraw}>{submitting ? 'Processing...' : `Withdraw ₹${Number(amount).toLocaleString('en-IN')}`}</button></div>
    </PhoneFrame>
  )
}

export default function LenderFlow({ lenderId, onSwitchAccount }) {
  const [screen, setScreen] = useState('home')
  const [lender, setLender] = useState(null)
  const [pools, setPools] = useState([])
  const [selectedPool, setSelectedPool] = useState(null)
  const [amount, setAmount] = useState(5000)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const load = () => {
    api.getLender(lenderId).then(setLender)
    api.getPools().then(setPools)
  }

  useEffect(load, [lenderId])

  const handleInvest = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await api.invest(lenderId, { pool_id: selectedPool.id, amount: Number(amount) })
      load()
      setScreen('invested')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleWithdraw = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await api.withdraw(lenderId, { amount: Number(amount) })
      load()
      setScreen('home')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!lender) return <p className="muted center">Loading...</p>

  return (
    <div>
      <button className="link" onClick={onSwitchAccount}>&larr; Switch account</button>

      {screen === 'home' && (
        <PortfolioHome lender={lender} onAdd={() => setScreen('add')} onInvest={() => setScreen('browse')} onReturns={() => setScreen('returns')} onWithdraw={() => { setAmount(Math.round(lender.available)); setScreen('withdraw') }} />
      )}
      {screen === 'add' && <AddMoneyScreen amount={amount} setAmount={setAmount} onBack={() => setScreen('home')} onContinue={() => setScreen('browse')} />}
      {screen === 'browse' && <BrowsePoolsScreen pools={pools} onBack={() => setScreen('home')} onSelect={(p) => { setSelectedPool(p); setScreen('pooldetail') }} />}
      {screen === 'pooldetail' && selectedPool && <PoolDetailScreen pool={selectedPool} onBack={() => setScreen('browse')} onInvest={() => setScreen('fund')} />}
      {screen === 'fund' && selectedPool && (
        <FundAmountScreen pool={selectedPool} amount={amount} setAmount={setAmount} onBack={() => setScreen('pooldetail')} onInvest={handleInvest} submitting={submitting} error={error} />
      )}
      {screen === 'invested' && selectedPool && <InvestedScreen pool={selectedPool} amount={amount} onDone={() => setScreen('home')} />}
      {screen === 'returns' && <ReturnsRiskScreen lender={lender} onBack={() => setScreen('home')} />}
      {screen === 'withdraw' && (
        <WithdrawScreen lender={lender} amount={amount} setAmount={setAmount} onBack={() => setScreen('home')} onWithdraw={handleWithdraw} submitting={submitting} error={error} />
      )}
    </div>
  )
}
