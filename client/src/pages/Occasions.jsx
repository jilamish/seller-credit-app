import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const OCCASION_ICONS = {
  Office: '💼', 'Date Night': '🍷', 'Wedding Guest': '💍', Festive: '🪔',
  Travel: '✈️', Gym: '🏋️', WFH: '🏠', Party: '🎉',
}

export function OccasionPicker() {
  const [weather, setWeather] = useState(null)
  const [occasions, setOccasions] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.getWeather().then(setWeather)
    api.getOccasions().then(setOccasions)
  }, [])

  return (
    <div className="fg-app-page">
      {weather && (
        <div className="fg-weather-banner">
          <span>🌤️</span>
          <span>{weather.city} · <b>{weather.temp}°C</b>, {weather.tip}</span>
        </div>
      )}
      <h3 className="fg-h3-tight">What's the occasion?</h3>
      <div className="fg-occasion-grid">
        {occasions.map((o) => (
          <div key={o} className="fg-occasion-tile" onClick={() => navigate(`/occasions/${encodeURIComponent(o)}`)}>
            <div style={{ fontSize: 22 }}>{OCCASION_ICONS[o] || '✨'}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>{o}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function OccasionResults() {
  const { occasion } = useParams()
  const [combos, setCombos] = useState([])
  const navigate = useNavigate()

  useEffect(() => { api.getOutfitsForOccasion(occasion).then(setCombos) }, [occasion])

  return (
    <div className="fg-app-page">
      <div className="fg-row-header">
        <button className="fg-back-circle" onClick={() => navigate('/occasions')}>‹</button>
        <h3 className="fg-h3-tight">{occasion} looks</h3>
      </div>
      {combos.length === 0 && <p className="fg-p-muted">Add a few {occasion.toLowerCase()} pieces to your closet and I'll build looks instantly.</p>}
      <div className="fg-outfit-list">
        {combos.map((combo, idx) => (
          <div key={idx} className={`fg-outfit-row ${combo.missingItem ? 'fg-outfit-row-missing' : ''}`} onClick={() => navigate(`/occasions/${encodeURIComponent(occasion)}/outfit`, { state: { combo } })}>
            <div className="fg-outfit-thumbs">
              {combo.items.slice(0, 2).map((it, i) => (
                <span key={i} className="fg-outfit-thumb" style={{ background: it.image_path ? undefined : `linear-gradient(150deg, ${it.color_hex}, #1c1418)` }}>
                  {it.image_path && <img src={it.image_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />}
                </span>
              ))}
              {combo.missingItem && <span className="fg-outfit-thumb fg-outfit-thumb-missing">👞</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{combo.missingItem ? 'Almost there' : combo.name}</div>
              <div style={{ fontSize: 11, color: combo.missingItem ? '#a07725' : '#6b5b62' }}>
                {combo.missingItem ? `Missing: ${combo.missingItem}` : combo.items.map((i) => i.color_name).join(' · ')}
              </div>
            </div>
            <span className={combo.missingItem ? 'fg-badge-gold' : 'fg-badge-dark'}>{combo.missingItem ? 'Shop it' : `${combo.matchScore}%`}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const SLOT_ICONS = { Top: '👕', Bottom: '👖', Dress: '👗', Shoes: '👠', Bag: '👜', Outerwear: '🧥' }

export function OutfitDetail() {
  const { occasion } = useParams()
  const { state } = useLocation()
  const combo = state?.combo
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!combo) return <p className="fg-p-muted center">Open this outfit from the occasion results page.</p>

  const persist = async () => {
    const result = await api.saveOutfit({
      name: combo.name, occasion, itemIds: combo.items.map((i) => i.id), matchScore: combo.matchScore, missingItem: combo.missingItem,
    })
    return result.id
  }

  const handleWear = async () => {
    setBusy(true)
    try {
      const id = await persist()
      await api.wearOutfit(id)
      navigate(`/outfits/${id}/beauty`)
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async () => {
    setBusy(true)
    try {
      await persist()
      setSaved(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fg-app-page">
      <div className="fg-row-header">
        <button className="fg-back-circle" onClick={() => navigate(-1)}>‹</button>
        <span className="fg-badge-pink">{combo.matchScore}% match</span>
      </div>
      <h3 className="fg-h3-tight" style={{ margin: '14px 0' }}>{combo.name}</h3>
      <div className="fg-outfit-detail-grid">
        {combo.items.map((it) => (
          <div key={it.slot} className="fg-outfit-detail-tile" style={{ background: it.image_path ? undefined : `linear-gradient(150deg, ${it.color_hex}, #1c1418)` }}>
            {it.image_path && <img src={it.image_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />}
            <span className="fg-outfit-detail-label">{SLOT_ICONS[it.slot]} {it.slot}</span>
          </div>
        ))}
      </div>
      <p className="fg-p-muted center" style={{ marginTop: 14 }}>
        {combo.missingItem ? `Missing ${combo.missingItem} to complete this look.` : 'All pieces already in your closet, darling. ✨'}
      </p>
      {saved && <p className="fg-p-muted center" style={{ color: '#2f7d4f' }}>Saved to your outfits ✓</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button className="fg-btn-solid" style={{ flex: 1 }} disabled={busy} onClick={handleWear}>Wear today</button>
        <button className="fg-btn-light" style={{ flex: 1 }} disabled={busy} onClick={handleSave}>Save</button>
      </div>
    </div>
  )
}

export function Beauty() {
  const { id } = useParams()
  const [makeup, setMakeup] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { api.getMakeup(id).then(setMakeup) }, [id])

  if (!makeup) return <p className="fg-p-muted center">Loading...</p>

  return (
    <div className="fg-app-page">
      <button className="fg-back-circle" onClick={() => navigate('/closet')}>‹</button>
      <h3 className="fg-h3-tight" style={{ margin: '14px 0' }}>Makeup for this look</h3>
      <div className="fg-makeup-callout">
        <div style={{ fontWeight: 700, color: '#b01560' }}>💄 {makeup.style}</div>
        <p className="fg-p-muted" style={{ marginTop: 6 }}>{makeup.description}</p>
      </div>
      <div className="fg-product-list">
        {makeup.products.map((p) => (
          <div key={p.id} className="fg-product-row">
            <span className="fg-product-swatch" style={{ background: p.color_hex }} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.name} · {p.brand}</div><div className="fg-meta">₹{p.price}</div></div>
            <span className="fg-shop-btn">Shop</span>
          </div>
        ))}
      </div>
      <button className="fg-btn-solid fg-btn-block" style={{ marginTop: 16 }} onClick={() => navigate(`/outfits/${id}/nails`)}>Continue to nail match</button>
    </div>
  )
}

export function Nails() {
  const { id } = useParams()
  const [nails, setNails] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { api.getNails(id).then(setNails) }, [id])

  if (!nails) return <p className="fg-p-muted center">Loading...</p>

  return (
    <div className="fg-app-page">
      <div className="fg-row-header">
        <button className="fg-back-circle" onClick={() => navigate(-1)}>‹</button>
        <h3 className="fg-h3-tight">💅 Nail paint match</h3>
      </div>
      <p className="fg-p-muted">Three shades pulled straight from your outfit's palette.</p>
      <div className="fg-product-list">
        {nails.products.map((p) => (
          <div key={p.id} className={`fg-product-row ${p.premium ? 'fg-product-row-premium' : ''}`}>
            <span className="fg-product-dot" style={{ background: p.color_hex }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
              <div className="fg-meta">{p.brand} · ₹{p.price}{p.premium ? ' · ✨ Premium' : ''}</div>
            </div>
            <span className={p.premium ? 'fg-shop-btn-gold' : 'fg-shop-btn'}>Buy</span>
          </div>
        ))}
      </div>
      <button className="fg-btn-solid fg-btn-block" style={{ marginTop: 16 }} onClick={() => navigate('/closet')}>Add all 3 to cart</button>
    </div>
  )
}
