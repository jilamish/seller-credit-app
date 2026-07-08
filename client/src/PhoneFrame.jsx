export function PhoneFrame({ children, tint }) {
  return (
    <div className="phone-shell">
      <div className={`phone-inner ${tint || ''}`}>
        <div className="phone-statusbar" style={tint ? { color: '#fff' } : undefined}>
          <span>9:41</span>
          <span className="phone-statusbar-icons">
            <span className="phone-5g">5G</span>
            <span className="phone-battery"><span /></span>
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ScreenHeader({ title, onBack, right }) {
  return (
    <div className="phone-header">
      {onBack ? <button className="phone-back" onClick={onBack}>&#8249;</button> : <span className="phone-back-spacer" />}
      <span className="phone-title">{title}</span>
      <span className="phone-header-right">{right || <span className="phone-back-spacer" />}</span>
    </div>
  )
}
