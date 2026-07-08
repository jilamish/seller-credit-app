import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../AuthContext'

const VIBES = ['Minimalist', 'Streetwear', 'Old Money', 'Boho', 'Y2K', 'Glam']
const PLATFORMS = ['Myntra', 'Meesho', 'Ajio', 'Amazon', 'Nykaa']
const SKIN_TONES = ['#f4d9be', '#e6b98f', '#c88f5f', '#9c6640', '#6e4327']
const UNDERTONES = ['Warm', 'Cool', 'Neutral']
const MAKEUP_VIBES = ['Natural', 'Glam', 'Bold', 'No-makeup-makeup']
const BUDGETS = [5000, 10000, 15000, 25000, 40000]

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

function Chip({ active, children, onClick }) {
  return (
    <span className={`fg-chip ${active ? 'fg-chip-active' : ''}`} onClick={onClick}>
      {children}{active ? ' ✓' : ''}
    </span>
  )
}

export default function Onboarding() {
  const { step: stepParam } = useParams()
  const step = Number(stepParam) || 1
  const navigate = useNavigate()
  const { refresh } = useAuth()

  const [styleTags, setStyleTags] = useState([])
  const [budget, setBudget] = useState(15000)
  const [platforms, setPlatforms] = useState([])
  const [skinTone, setSkinTone] = useState(SKIN_TONES[1])
  const [undertone, setUndertone] = useState('Warm')
  const [makeupVibe, setMakeupVibe] = useState([])
  const [declutterNotes, setDeclutterNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const advance = async (data) => {
    setBusy(true)
    try {
      await api.onboardingStep(step, data)
      await refresh()
      if (step === 6) navigate('/closet')
      else navigate(`/onboarding/${step + 1}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fg-onboard-page">
      <div className="fg-onboard-card">
        <div className="fg-onboard-topbar">
          <button className="fg-onboard-back" onClick={() => step > 1 && navigate(`/onboarding/${step - 1}`)}>‹</button>
          <span className="fg-onboard-step">Step {step} of 6</span>
        </div>

        {step === 1 && (
          <>
            <div className="fg-onboard-emoji">✨</div>
            <h3 className="fg-onboard-title">Find your vibe</h3>
            <p className="fg-p-muted">Pick everything that feels like you. No wrong answers, only main-character energy.</p>
            <div className="fg-chip-wrap">{VIBES.map((v) => <Chip key={v} active={styleTags.includes(v)} onClick={() => setStyleTags((prev) => toggle(prev, v))}>{v}</Chip>)}</div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="fg-onboard-emoji">💸</div>
            <h3 className="fg-onboard-title">Your monthly budget</h3>
            <p className="fg-p-muted">So gap-shopping suggestions actually fit your life.</p>
            <div className="fg-chip-wrap">{BUDGETS.map((b) => <Chip key={b} active={budget === b} onClick={() => setBudget(b)}>₹{b.toLocaleString('en-IN')}</Chip>)}</div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="fg-onboard-emoji">🛍️</div>
            <h3 className="fg-onboard-title">Where do you shop?</h3>
            <p className="fg-p-muted">We'll compare prices across whichever platforms you'll actually use.</p>
            <div className="fg-chip-wrap">{PLATFORMS.map((p) => <Chip key={p} active={platforms.includes(p)} onClick={() => setPlatforms((prev) => toggle(prev, p))}>{p}</Chip>)}</div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="fg-onboard-emoji">💄</div>
            <h3 className="fg-onboard-title">Your beauty profile</h3>
            <p className="fg-p-muted">So every makeup &amp; nail match actually suits you.</p>
            <div className="fg-label">Skin tone</div>
            <div className="fg-swatch-row">
              {SKIN_TONES.map((c) => (
                <span key={c} className="fg-swatch" style={{ background: c, outline: skinTone === c ? '3px solid #ff1f7a' : 'none', outlineOffset: 2 }} onClick={() => setSkinTone(c)} />
              ))}
            </div>
            <div className="fg-label">Undertone</div>
            <div className="fg-segment-row">
              {UNDERTONES.map((u) => <div key={u} className={`fg-segment ${undertone === u ? 'fg-segment-active' : ''}`} onClick={() => setUndertone(u)}>{u}</div>)}
            </div>
            <div className="fg-label">Makeup vibe</div>
            <div className="fg-chip-wrap">{MAKEUP_VIBES.map((v) => <Chip key={v} active={makeupVibe.includes(v)} onClick={() => setMakeupVibe((prev) => toggle(prev, v))}>{v}</Chip>)}</div>
          </>
        )}

        {step === 5 && (
          <>
            <div className="fg-onboard-emoji">🧹</div>
            <h3 className="fg-onboard-title">Quick declutter pass</h3>
            <p className="fg-p-muted">What stays, what goes, what's worth a re-wear? Jot anything on your mind — we'll remind you later.</p>
            <textarea className="fg-textarea" rows={5} placeholder="e.g. Donate anything unworn for 12+ months, re-wear the black blazer more..." value={declutterNotes} onChange={(e) => setDeclutterNotes(e.target.value)} />
          </>
        )}

        {step === 6 && (
          <>
            <div className="fg-onboard-emoji">🎉</div>
            <h3 className="fg-onboard-title">Bibbidi-bobbidi-boo!</h3>
            <p className="fg-p-muted">Your style DNA and beauty profile are set. Let's build your closet, darling.</p>
          </>
        )}

        <div className="fg-onboard-footer">
          <div className="fg-progress-track"><div className="fg-progress-fill" style={{ width: `${(step / 6) * 100}%` }} /></div>
          <button
            className="fg-btn-solid fg-btn-block"
            disabled={busy}
            onClick={() => {
              if (step === 1) advance({ styleTags })
              else if (step === 2) advance({ budget })
              else if (step === 3) advance({ platforms })
              else if (step === 4) advance({ skinTone, undertone, makeupVibe })
              else if (step === 5) advance({ declutterNotes })
              else advance({})
            }}
          >
            {busy ? 'Please wait...' : step === 6 ? 'Enter my closet →' : step === 4 ? 'Continue' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
