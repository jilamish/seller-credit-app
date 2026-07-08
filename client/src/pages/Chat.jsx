import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

const STARTERS = [
  'What do I wear to a 7pm rooftop dinner?',
  "Can I re-wear Saturday's outfit without it being obvious?",
  'Style my new pieces three ways.',
]

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [closetCount, setClosetCount] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => {
    api.getChat().then(setMessages)
    api.getCloset().then((r) => setClosetCount(r.total))
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const msg = text || input
    if (!msg.trim()) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: msg, id: `tmp-${Date.now()}` }])
    setSending(true)
    try {
      const { reply } = await api.sendChat(msg)
      setMessages((m) => [...m, { role: 'assistant', content: reply, id: `tmp-r-${Date.now()}` }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fg-app-page fg-chat-page">
      <div className="fg-chat-header">
        <span className="fg-avatar" style={{ background: 'linear-gradient(150deg,#ff9ac2,#ff1f7a)' }} />
        <div><div style={{ fontWeight: 700, fontSize: 13.5 }}>Your Fairy Godmother</div><div className="fg-meta" style={{ color: '#2f7d4f' }}>● Knows all {closetCount} pieces</div></div>
      </div>

      <div className="fg-chat-messages">
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STARTERS.map((s) => (
              <div key={s} className="fg-starter-bubble" onClick={() => send(s)}>💬 <i>"{s}"</i></div>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'fg-bubble-user' : 'fg-bubble-assistant'}>{m.content}</div>
        ))}
        {sending && <div className="fg-bubble-assistant fg-bubble-typing">Thinking…</div>}
        <div ref={bottomRef} />
      </div>

      <div className="fg-chat-input-row">
        <input placeholder="Ask your stylist…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button className="fg-chat-send" onClick={() => send()} disabled={sending}>↑</button>
      </div>
    </div>
  )
}
