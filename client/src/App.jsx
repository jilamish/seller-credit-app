import { useState } from 'react'
import { api } from './api'
import PersonPicker from './PersonPicker'
import BorrowerFlow from './BorrowerFlow'
import LenderFlow from './LenderFlow'
import OpsFlow from './OpsFlow'
import HowItWorks from './HowItWorks'

function App() {
  const [tab, setTab] = useState('borrow')
  const [lenderId, setLenderId] = useState(null)
  const [borrowerId, setBorrowerId] = useState(null)

  return (
    <div className="app">
      <header className="topbar">
        <h1>Community Credit</h1>
        <p className="tagline">A peer-to-peer marketplace for money — lend what you can spare, borrow what you need</p>
        <nav>
          <button className={tab === 'borrow' ? 'active' : ''} onClick={() => setTab('borrow')}>Borrow</button>
          <button className={tab === 'lend' ? 'active' : ''} onClick={() => setTab('lend')}>Lend</button>
          <button className={tab === 'ops' ? 'active' : ''} onClick={() => setTab('ops')}>Ops &amp; Risk</button>
          <button className={tab === 'how' ? 'active' : ''} onClick={() => setTab('how')}>How it works</button>
        </nav>
      </header>

      <main>
        {tab === 'borrow' && !borrowerId && (
          <PersonPicker
            title="Get Instant Credit"
            subtitle="Enter your name to shop and see your trust score."
            ctaLabel="Continue"
            createFn={api.createBorrower}
            listFn={api.getBorrowers}
            onSelect={setBorrowerId}
          />
        )}
        {tab === 'borrow' && borrowerId && (
          <BorrowerFlow borrowerId={borrowerId} onSwitchAccount={() => setBorrowerId(null)} />
        )}

        {tab === 'lend' && !lenderId && (
          <PersonPicker
            title="Start Lending"
            subtitle="Enter your name to set up your lending portfolio."
            ctaLabel="Continue"
            createFn={api.createLender}
            listFn={api.getLenders}
            onSelect={setLenderId}
          />
        )}
        {tab === 'lend' && lenderId && (
          <LenderFlow lenderId={lenderId} onSwitchAccount={() => setLenderId(null)} />
        )}

        {tab === 'ops' && <OpsFlow />}

        {tab === 'how' && <HowItWorks />}
      </main>
    </div>
  )
}

export default App
