import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const CATEGORIES = ['All', 'Top', 'Bottom', 'Dress', 'Shoes', 'Bag', 'Outerwear']

function Swatch({ item, size = '100%' }) {
  if (item.image_path) return <img src={item.image_path} alt="" style={{ width: size, height: size, objectFit: 'cover', borderRadius: 14 }} />
  return <div style={{ width: size, height: size, borderRadius: 14, background: `linear-gradient(150deg, ${item.color_hex}, #1c1418)` }} />
}

export function ClosetGrid() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState('All')
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.getCloset({ category, q }).then((r) => { setItems(r.items); setTotal(r.total) })
  }, [category, q])

  return (
    <div className="fg-app-page">
      <div className="fg-closet-header">
        <h3 className="fg-h3-tight">My closet</h3>
        <input className="fg-search" placeholder="🔍 Search your closet" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="fg-chip-wrap" style={{ marginBottom: 16 }}>
        {CATEGORIES.map((c) => (
          <span key={c} className={`fg-filter-chip ${category === c ? 'fg-filter-chip-active' : ''}`} onClick={() => setCategory(c)}>
            {c === 'All' ? `All ${total}` : c}
          </span>
        ))}
      </div>
      <div className="fg-closet-grid">
        {items.map((item) => (
          <div key={item.id} className="fg-closet-tile" onClick={() => navigate(`/closet/${item.id}`)}>
            <Swatch item={item} />
          </div>
        ))}
        {items.length === 0 && <p className="fg-p-muted">No pieces match yet — try another filter.</p>}
      </div>
      <Link to="/closet/new" className="fg-fab">+</Link>
    </div>
  )
}

export function ClosetItemDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { api.getClosetItem(id).then(setItem) }, [id])

  if (!item) return <p className="fg-p-muted center">Loading...</p>

  return (
    <div className="fg-app-page">
      <button className="fg-back-circle" onClick={() => navigate('/closet')}>‹</button>
      <div style={{ margin: '14px 0 18px' }}><Swatch item={item} size="100%" /></div>
      <h3 className="fg-h3-tight" style={{ marginBottom: 3 }}>{item.color_name} {item.category}</h3>
      <p className="fg-meta">{item.brand || 'Unbranded'} · added {new Date(item.date_added).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
      <div className="fg-chip-wrap" style={{ margin: '14px 0' }}>
        {item.fabric && <span className="fg-tag-pink">{item.fabric}</span>}
        {item.occasion_tags.map((t) => <span key={t} className="fg-tag-pink">{t}</span>)}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div className="fg-stat-box"><div className="fg-stat-value">{item.times_worn}×</div><div className="fg-stat-label">Worn</div></div>
        <div className="fg-stat-box"><div className="fg-stat-value">₹{item.costPerWear}</div><div className="fg-stat-label">Cost / wear</div></div>
      </div>
      {item.care_instructions && (
        <>
          <div className="fg-label">Care</div>
          <p className="fg-p-muted">{item.care_instructions}</p>
        </>
      )}
      <button className="fg-btn-solid fg-btn-block" style={{ marginTop: 20 }} onClick={() => navigate('/occasions')}>Build an outfit</button>
    </div>
  )
}

export function SnapTag() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [tags, setTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setAnalyzing(true)
    setError(null)
    try {
      const r = await api.analyzePhoto(f)
      setResult(r)
      setTags([r.suggested.category, r.suggested.color_name, r.suggested.fabric, r.suggested.vibe])
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.addClosetItem({
        imagePath: result.imagePath,
        category: result.suggested.category,
        color_name: tags[1] || result.suggested.color_name,
        color_hex: result.suggested.color_hex,
        fabric: tags[2] || result.suggested.fabric,
        vibe: tags[3] || result.suggested.vibe,
        occasion_tags: [tags[3] || result.suggested.vibe],
        brand: '',
        price: 0,
      })
      navigate('/closet')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fg-app-page">
      <button className="fg-back-circle" onClick={() => navigate('/closet')}>‹</button>
      <h3 className="fg-h3-tight" style={{ margin: '14px 0' }}>Snap &amp; auto-tag</h3>

      {!preview && (
        <div className="fg-upload-drop" onClick={() => inputRef.current.click()}>
          <div style={{ fontSize: 32 }}>📸</div>
          <p className="fg-p-muted">Tap to take or upload a photo</p>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
        </div>
      )}

      {preview && (
        <div className="fg-snap-preview">
          <img src={preview} alt="" style={{ width: '100%', borderRadius: 18, maxHeight: 260, objectFit: 'cover' }} />
          {analyzing && <span className="fg-analyzing-badge">📸 Analysing…</span>}
        </div>
      )}

      {result && (
        <>
          <div className="fg-label" style={{ marginTop: 18 }}>✨ AI detected</div>
          <div className="fg-chip-wrap" style={{ marginBottom: 16 }}>
            {tags.map((t, i) => <span key={i} className="fg-tag-pink">{t}</span>)}
          </div>
          <div className="fg-goeswith-box">
            <span>👠</span>
            <span>Already goes with <b>{result.goesWith} piece{result.goesWith === 1 ? '' : 's'}</b> you own.</span>
          </div>
        </>
      )}

      {error && <p className="fg-error">{error}</p>}

      <button className="fg-btn-solid fg-btn-block" style={{ marginTop: 20 }} disabled={!result || saving} onClick={handleSave}>
        {saving ? 'Adding...' : 'Add to closet'}
      </button>
    </div>
  )
}
