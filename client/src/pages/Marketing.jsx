import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="fg-page">
      <section className="fg-hero">
        <div className="fg-hero-glow" />
        <div className="fg-hero-inner">
          <span className="fg-eyebrow-pill">✨ Wardrobe OS</span>
          <h1 className="fg-hero-title">Fairy <span className="fg-italic-pink">Godrobe</span></h1>
          <p className="fg-hero-sub">
            Your closet, finally on speaking terms with your life. Fairy Godrobe catalogs everything you own, builds outfits from it,
            matches the makeup and nails, follows the influencers you love, and hunts down the cheapest place to buy whatever's missing.{' '}
            <b style={{ color: '#fff', fontWeight: 500 }}>Darling, the wardrobe crisis is over.</b>
          </p>
          <div className="fg-hero-tags">
            <span className="fg-tag-solid">📸 Snap &amp; auto-tag</span>
            <span className="fg-tag-outline">👠 Outfits by occasion</span>
            <span className="fg-tag-outline">💄 Beauty &amp; nails matched</span>
            <span className="fg-tag-gold">💅 Best price, found for you</span>
          </div>
          <div style={{ marginTop: 40, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/register" className="fg-btn-solid">Get early access →</Link>
            <Link to="/login" className="fg-btn-ghost">I already have an account</Link>
          </div>
        </div>
      </section>

      <section className="fg-callout-grid">
        <div className="fg-card-light">
          <span className="fg-eyebrow-pink">The glow-up</span>
          <h3 className="fg-h3">You decide</h3>
          <ul className="fg-bullet-list">
            <li><span className="fg-diamond">◆</span> Your style DNA — Minimalist, Y2K, Old Money, whatever you are.</li>
            <li><span className="fg-diamond">◆</span> Your monthly budget and which platforms you'll actually shop.</li>
            <li><span className="fg-diamond">◆</span> What stays, what goes, what's worth a re-wear.</li>
          </ul>
        </div>
        <div className="fg-card-dark">
          <span className="fg-eyebrow-gold">The magic</span>
          <h3 className="fg-h3" style={{ color: '#fff' }}>Handled quietly</h3>
          <ul className="fg-bullet-list fg-bullet-list-dark">
            <li><span className="fg-star">✦</span> Auto-tagging every piece by category, color, fabric &amp; vibe.</li>
            <li><span className="fg-star">✦</span> Building outfits &amp; matching beauty looks in the background.</li>
            <li><span className="fg-star">✦</span> Scouting influencers &amp; comparing prices so you don't have to.</li>
          </ul>
        </div>
      </section>

      <section className="fg-personas">
        <div className="fg-section-head">
          <span className="fg-eyebrow-pink">Who she's for</span>
          <h2 className="fg-h2">Three women, one fairy godmother</h2>
        </div>
        <div className="fg-persona-grid">
          <div className="fg-persona-card">
            <div className="fg-persona-icon">👗</div>
            <h4 className="fg-h4">The serial hoarder</h4>
            <p className="fg-p-muted">Owns <b style={{ color: '#1c1418' }}>200 pieces</b>, wears the same 15 — because she's forgotten what she even has.</p>
          </div>
          <div className="fg-persona-card">
            <div className="fg-persona-icon">📌</div>
            <h4 className="fg-h4">The saved-looks addict</h4>
            <p className="fg-p-muted">Dozens of Pinterest &amp; Insta looks she never recreates — no clue what's buyable, or from where.</p>
          </div>
          <div className="fg-persona-card">
            <div className="fg-persona-icon">💐</div>
            <h4 className="fg-h4">The last-minute dresser</h4>
            <p className="fg-p-muted"><b style={{ color: '#1c1418' }}>Three</b> weddings this season, zero clue. Needs a full look sorted — fast.</p>
          </div>
          <div className="fg-persona-card fg-persona-card-dark">
            <span className="fg-eyebrow-gold">Trusted pricing</span>
            <div style={{ marginTop: 16, fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#fff' }}>Real prices, real platforms</div>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(255,225,238,0.8)', marginTop: 16 }}>
              Prices sync from <b style={{ color: '#fff' }}>Myntra</b>, <b style={{ color: '#fff' }}>Meesho</b> &amp; <b style={{ color: '#fff' }}>Ajio</b>.
            </p>
          </div>
        </div>
      </section>

      <section className="fg-closing">
        <div className="fg-closing-card">
          <div className="fg-hero-glow" style={{ top: -80, right: -60, width: 300, height: 300 }} />
          <span className="fg-eyebrow-pill" style={{ position: 'relative' }}>✨ Bibbidi-bobbidi-boo</span>
          <h2 className="fg-closing-title">Your closet has a fairy godmother now</h2>
          <p className="fg-closing-sub">Catalog it, style it, glow it up, and buy the gap for less — all before you've finished your coffee.</p>
          <Link to="/register" className="fg-btn-solid-light">Get early access →</Link>
        </div>
      </section>
    </div>
  )
}
