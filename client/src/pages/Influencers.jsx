import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

export function InfluencerList() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')

  const load = () => api.getInfluencers(q).then(setList)
  useEffect(load, [q])

  const handleFollow = async (id) => {
    await api.toggleFollow(id)
    load()
  }

  return (
    <div className="fg-app-page fg-dark-page">
      <h3 className="fg-h3-tight" style={{ color: '#fff' }}>Follow your people</h3>
      <input className="fg-search" placeholder="🔍 Search creators & handles" value={q} onChange={(e) => setQ(e.target.value)} style={{ margin: '12px 0 16px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((inf) => (
          <div key={inf.id} className="fg-influencer-row">
            <span className="fg-avatar" style={{ background: inf.gradient }} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{inf.name}</div><div className="fg-meta" style={{ color: 'rgba(255,255,255,0.6)' }}>{inf.handle}</div></div>
            <span className={inf.following ? 'fg-following-btn' : 'fg-follow-btn'} onClick={() => handleFollow(inf.id)}>{inf.following ? 'Following' : 'Follow'}</span>
          </div>
        ))}
      </div>
      <div className="fg-connect-ig">📸 Or <b>connect Instagram</b> to import everyone you follow.</div>
    </div>
  )
}

export function Feed() {
  const [looks, setLooks] = useState([])
  const navigate = useNavigate()

  useEffect(() => { api.getFeed().then(setLooks) }, [])

  return (
    <div className="fg-app-page fg-dark-page">
      <h3 className="fg-h3-tight" style={{ color: '#fff' }}>Your feed</h3>
      <p className="fg-meta" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>Scored against your closet</p>
      {looks.length === 0 && <p className="fg-p-muted" style={{ color: 'rgba(255,255,255,0.6)' }}>Follow a few creators to see your feed light up.</p>}
      <div className="fg-feed-grid">
        {looks.map((look) => (
          <div key={look.id} className="fg-feed-tile" style={{ background: look.gradient }} onClick={() => navigate(`/looks/${look.id}/recreate`)}>
            <span className="fg-badge-dark" style={{ position: 'absolute', top: 8, left: 8 }}>{look.matchScore}% match</span>
            <span className="fg-feed-handle">{look.handle}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RecreateLook() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { api.getRecreate(id).then(setData) }, [id])

  if (!data) return <p className="fg-p-muted center">Loading...</p>

  return (
    <div className="fg-app-page fg-dark-page">
      <div className="fg-row-header">
        <button className="fg-back-circle" onClick={() => navigate(-1)}>‹</button>
        <h3 className="fg-h3-tight" style={{ color: '#fff' }}>Recreate this look</h3>
      </div>
      <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
        <div style={{ flex: 1 }}>
          <div style={{ borderRadius: 14, height: 118, background: data.gradient }} />
          <div className="fg-meta" style={{ textAlign: 'center', marginTop: 5, color: 'rgba(255,255,255,0.6)' }}>{data.handle}</div>
        </div>
        <div style={{ flex: 1, borderRadius: 14, background: '#2a1c22', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 5, height: 118 }}>
          {data.pieces.map((p, i) => (
            <span key={i} style={{ borderRadius: 7, background: p.owned ? `linear-gradient(150deg, ${p.ownedItem?.color_hex || '#cf9d4f'}, #1c1418)` : 'transparent', border: p.owned ? 'none' : '1.5px dashed #ff1f7a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {!p.owned && '👠'}
            </span>
          ))}
        </div>
      </div>
      <div className="fg-owned-banner">
        <b>{data.ownedCount} of {data.totalCount} pieces</b> already yours ✨
      </div>
      {data.ownedCount < data.totalCount && (
        <div className="fg-missing-banner">
          <div><div style={{ fontWeight: 600, fontSize: 11.5 }}>Missing: {data.pieces.find((p) => !p.owned)?.description}</div><div className="fg-meta">Closest match found</div></div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 16 }}>₹{data.price}</span>
        </div>
      )}
      <button className="fg-btn-solid fg-btn-block" style={{ marginTop: 16 }} onClick={() => navigate('/gap')}>Complete the look · ₹{data.price}</button>
    </div>
  )
}

export function Trending() {
  const [looks, setLooks] = useState([])
  useEffect(() => { api.getTrending().then(setLooks) }, [])

  return (
    <div className="fg-app-page fg-dark-page">
      <h3 className="fg-h3-tight" style={{ color: '#fff' }}>🔥 Trending right now</h3>
      <p className="fg-meta" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>Sourced from Instagram · shop instantly</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {looks.map((look) => (
          <div key={look.id} className="fg-trend-card">
            <div className="fg-trend-image" style={{ background: look.gradient }}><span className="fg-badge-dark">{look.handle}</span></div>
            <div className="fg-trend-info">
              <div><div style={{ fontWeight: 600, fontSize: 12.5 }}>{look.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 15 }}>₹{look.price}</span>
                  <span className="fg-platform-badge">{look.platform}</span>
                </div>
              </div>
              <span className="fg-shop-now-btn">Shop now</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Notifications() {
  const [list, setList] = useState([])
  useEffect(() => { api.getNotifications().then(setList) }, [])

  return (
    <div className="fg-app-page fg-notif-page">
      <div className="fg-notif-time">✨ FAIRY GODROBE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        {list.map((n) => (
          <div key={n.id} className="fg-notif-card">
            <span className="fg-notif-icon">{n.icon}</span>
            <div>
              <div className="fg-notif-title">{n.title}</div>
              <div className="fg-notif-body">{n.body}</div>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="fg-p-muted" style={{ color: 'rgba(255,255,255,0.7)' }}>No nudges yet — check back soon.</p>}
      </div>
    </div>
  )
}
