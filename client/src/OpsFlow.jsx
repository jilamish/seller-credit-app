import { useEffect, useState } from 'react'
import { api } from './api'
import { PhoneFrame, ScreenHeader } from './PhoneFrame'

function scoreColor(score) {
  if (score >= 700) return { bg: '#e5f5ee', fg: '#0b7a54' }
  if (score >= 600) return { bg: '#fef2e2', fg: '#b26a08' }
  return { bg: '#fdeaec', fg: '#c11d2b' }
}

function UnderwritingQueue({ data, onDecide, busyId }) {
  return (
    <PhoneFrame>
      <ScreenHeader title="Underwriting" right={<span className="pill" style={{ background: '#7b52d6', color: '#fff' }}>{data.pending.length} pending</span>} />
      <div style={{ display: 'flex', gap: 9, padding: '4px 16px 10px' }}>
        <div style={{ flex: 1, background: '#f3eef6', borderRadius: 11, padding: '9px 11px' }}><div style={{ fontWeight: 800, fontSize: 15, color: '#7b52d6' }}>{data.autoApprovedToday}</div><div className="muted small">Auto-approved</div></div>
        <div style={{ flex: 1, background: '#fef2e2', borderRadius: 11, padding: '9px 11px' }}><div style={{ fontWeight: 800, fontSize: 15, color: '#b26a08' }}>{data.pending.length}</div><div className="muted small">Need review</div></div>
      </div>
      <div className="phone-body" style={{ paddingTop: 0 }}>
        {data.pending.length === 0 && <p className="muted center" style={{ marginTop: 20 }}>Queue is clear — nothing needs review.</p>}
        {data.pending.map((app) => {
          const sc = scoreColor(app.trust_score)
          return (
            <div key={app.id} style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 14, padding: 13, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><div style={{ fontWeight: 700, fontSize: 13 }}>{app.borrower_name}</div><div className="muted small">Requests ₹{Math.round(app.amount).toLocaleString('en-IN')} · {app.purpose}</div></div>
                <span className="pill" style={{ background: sc.bg, color: sc.fg }}>Score {Math.round(app.trust_score)}</span>
              </div>
              {app.flags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {app.flags.map((f) => <span key={f} className="pill" style={{ background: '#fef2e2', color: '#8a5b09' }}>{f}</span>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  style={{ flex: 1, textAlign: 'center', background: '#0e9f6e', color: '#fff', fontWeight: 700, fontSize: 12, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer' }}
                  disabled={busyId === app.id}
                  onClick={() => onDecide(app.id, 'approve', Math.round(app.limit * 0.4))}
                >
                  Approve ₹{Math.round(app.limit * 0.4).toLocaleString('en-IN')}
                </button>
                <button
                  style={{ flex: 1, textAlign: 'center', border: '1.5px solid #e02d3c', color: '#c11d2b', fontWeight: 700, fontSize: 12, padding: '9px 0', borderRadius: 9, background: '#fff', cursor: 'pointer' }}
                  disabled={busyId === app.id}
                  onClick={() => onDecide(app.id, 'decline')}
                >
                  Decline
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </PhoneFrame>
  )
}

function CollectionsDashboard({ data }) {
  const bucketColor = { '1-30': '#e8850c', '31-60': '#e0117e', '60+': '#e02d3c' }
  const maxAmount = Math.max(...Object.values(data.buckets).map((b) => b.amount), 1)
  return (
    <PhoneFrame>
      <ScreenHeader title="Collections" right="🔔" />
      <div className="phone-body">
        <div style={{ background: '#2a1520', borderRadius: 16, padding: '15px 17px' }}>
          <div style={{ color: '#f6a8d4', fontSize: 12, fontWeight: 600 }}>Total overdue</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 26, margin: '2px 0 4px' }}>₹{Math.round(data.totalOverdue).toLocaleString('en-IN')}</div>
          <div className="muted small" style={{ color: '#c8f0de' }}>Recovery rate · <b style={{ color: '#8fdcb9' }}>{data.recoveryRate}%</b></div>
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 15, padding: 14, marginTop: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 11 }}>Days past due</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {Object.entries(data.buckets).map(([key, b]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#6b5560', marginBottom: 4 }}>
                  <span>{key} days</span><span style={{ color: '#2a1520' }}>₹{Math.round(b.amount).toLocaleString('en-IN')} · {b.count} accounts</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${(b.amount / maxAmount) * 100}%`, background: bucketColor[key] }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(42,21,32,.08)', borderRadius: 14, overflow: 'hidden', marginTop: 12 }}>
          {data.overdue.length === 0 && <div className="list-row muted small">No overdue accounts — recovery healthy.</div>}
          {data.overdue.map((o) => (
            <div key={o.id} className="list-row">
              <span className="list-icon" style={{ background: o.daysPastDue > 60 ? '#fdeaec' : '#fef2e2', color: o.daysPastDue > 60 ? '#c11d2b' : '#b26a08' }}>{o.daysPastDue}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 12.5 }}>Loan #{o.loan_id} · ₹{Math.round(o.amount)}</div><div className="muted small">{o.daysPastDue} days past due</div></div>
              <span style={{ fontWeight: 700, fontSize: 11, color: '#7b52d6' }}>Nudge</span>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  )
}

export default function OpsFlow() {
  const [tab, setTab] = useState('queue')
  const [queue, setQueue] = useState(null)
  const [collections, setCollections] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    api.getOpsQueue().then(setQueue)
    api.getCollections().then(setCollections)
  }

  useEffect(load, [])

  const handleDecide = async (id, action, amount) => {
    setBusyId(id)
    try {
      await api.opsDecision(id, { action, amount })
      load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="presets" style={{ justifyContent: 'center' }}>
        <button className={`chip ${tab === 'queue' ? 'active' : ''}`} onClick={() => setTab('queue')}>Underwriting</button>
        <button className={`chip ${tab === 'collections' ? 'active' : ''}`} onClick={() => setTab('collections')}>Collections</button>
      </div>
      {tab === 'queue' && queue && <UnderwritingQueue data={queue} onDecide={handleDecide} busyId={busyId} />}
      {tab === 'collections' && collections && <CollectionsDashboard data={collections} />}
      {(!queue || !collections) && <p className="muted center">Loading...</p>}
    </div>
  )
}
