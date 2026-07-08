import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

export function GapAnalysis() {
  const [gap, setGap] = useState(undefined)
  const navigate = useNavigate()

  useEffect(() => { api.getGap().then(setGap) }, [])

  if (gap === undefined) return <p className="fg-p-muted center">Loading...</p>
  if (gap === null) return <p className="fg-p-muted center">Your closet already covers every occasion beautifully. ✨</p>

  return (
    <div className="fg-app-page">
      <div className="fg-eyebrow-pink" style={{ fontSize: 12 }}>GAP ANALYSIS</div>
      <h3 className="fg-onboard-title" style={{ fontSize: 26, margin: '8px 0 16px' }}>You're one piece from a whole new closet</h3>
      <div className="fg-gap-hero">
        <div className="fg-gap-icon" style={{ background: `linear-gradient(150deg, ${gap.color_hex}, #1c1418)` }} />
        <div style={{ fontWeight: 700, fontSize: 15 }}>{gap.name}</div>
        <div className="fg-meta" style={{ color: '#b01560' }}>The one you keep almost-buying</div>
      </div>
      <div className="fg-gap-unlock-box">
        <div className="fg-gap-unlock-number">+{gap.unlocked}</div>
        <div className="fg-meta">new outfit pairings unlocked from pieces you <b style={{ color: '#1c1418' }}>already own</b></div>
      </div>
      <button className="fg-btn-solid fg-btn-block" style={{ marginTop: 20 }} onClick={() => navigate(`/gap/${gap.id}/price`)}>Find best price</button>
    </div>
  )
}

export function BestPrice() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [buying, setBuying] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { api.getGapPrice(id).then(setData) }, [id])

  if (!data) return <p className="fg-p-muted center">Loading...</p>

  const handleBuy = async () => {
    setBuying(true)
    try {
      const result = await api.purchaseGap(id)
      navigate('/gap/complete', { state: { item: data.item, best: data.best, unlockedOutfits: result.unlockedOutfits } })
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="fg-app-page">
      <div className="fg-row-header">
        <button className="fg-back-circle" onClick={() => navigate(-1)}>‹</button>
        <h3 className="fg-h3-tight">Best price</h3>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '16px 0' }}>
        <div style={{ width: 54, height: 66, borderRadius: 12, background: `linear-gradient(150deg, ${data.item.color_hex}, #1c1418)` }} />
        <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{data.item.name}</div><div className="fg-meta">{data.item.category}</div></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.options.map((o) => (
          <div key={o.platform} className={o.platform === data.best.platform ? 'fg-price-row fg-price-row-best' : 'fg-price-row'}>
            {o.platform === data.best.platform && <span className="fg-best-price-badge">✨ BEST PRICE</span>}
            <div><div style={{ fontWeight: 700, fontSize: 13 }}>{o.platform}</div><div className="fg-meta">Delivery in {o.delivery}</div></div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: o.platform === data.best.platform ? 22 : 20, color: o.platform === data.best.platform ? '#1c1418' : '#6b5b62' }}>₹{o.price}</div>
          </div>
        ))}
      </div>
      <p className="fg-savings-line">You save ₹{data.savings} vs. the priciest option 💅</p>
      <button className="fg-btn-gold fg-btn-block" style={{ marginTop: 12 }} disabled={buying} onClick={handleBuy}>
        {buying ? 'Placing order...' : `Buy on ${data.best.platform} · ₹${data.best.price}`}
      </button>
    </div>
  )
}

export function LookComplete() {
  const { state } = useLocation()
  const navigate = useNavigate()
  if (!state) return <p className="fg-p-muted center">Nothing to celebrate yet — go find your gap piece first.</p>

  return (
    <div className="fg-app-page fg-confetti-page">
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="fg-confetti-piece" style={{ left: `${10 + i * 10}%`, animationDelay: `${i * 0.25}s`, background: i % 2 ? '#cf9d4f' : '#ff1f7a' }} />
      ))}
      <div style={{ textAlign: 'center', color: '#fff', padding: '20px 0' }}>
        <div style={{ fontSize: 46 }}>🎉</div>
        <h3 className="fg-onboard-title" style={{ color: '#fff', fontSize: 28 }}>Yasss! Your look is complete</h3>
        <p style={{ color: 'rgba(255,225,238,0.85)', fontSize: 13 }}>{state.unlockedOutfits?.length || 0} outfits just unlocked. You did that, darling.</p>
        <div className="fg-order-summary">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 8 }}><span>{state.item.name}</span><b>₹{state.best.price}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,225,238,0.7)' }}><span>📦 {state.best.platform} · {state.best.delivery}</span><span>Free ship</span></div>
        </div>
      </div>
      <button className="fg-btn-solid-light fg-btn-block" onClick={() => navigate('/closet')}>Back to closet</button>
    </div>
  )
}
