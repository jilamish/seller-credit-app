import { useState } from 'react'
import { api } from './api'
import PersonPicker from './PersonPicker'
import LenderDashboard from './LenderDashboard'
import BorrowerDashboard from './BorrowerDashboard'
import HowItWorks from './HowItWorks'

function App() {
  const [tab, setTab] = useState('borrow')
  const [lenderId, setLenderId] = useState(null)
  const [borrowerId, setBorrowerId] = useState(null)

  const switchTab = (next) => {
    setTab(next)
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Community Credit</h1>
        <p className="tagline">A peer-to-peer marketplace for money — lend what you can spare, borrow what you need</p>
        <nav>
          <button className={tab === 'borrow' ? 'active' : ''} onClick={() => switchTab('borrow')}>Borrow</button>
          <button className={tab === 'lend' ? 'active' : ''} onClick={() => switchTab('lend')}>Lend</button>
          <button className={tab === 'how' ? 'active' : ''} onClick={() => switchTab('how')}>How it works</button>
        </nav>
      </header>

      <main>
        {tab === 'borrow' && !borrowerId && (
          <PersonPicker
            title="Get Instant Credit"
            subtitle="Enter your name to see your trust score and credit limit."
            ctaLabel="Continue"
            createFn={api.createBorrower}
            listFn={api.getBorrowers}
            onSelect={setBorrowerId}
          />
        )}
        {tab === 'borrow' && borrowerId && (
          <BorrowerDashboard borrowerId={borrowerId} onBack={() => setBorrowerId(null)} />
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
          <LenderDashboard lenderId={lenderId} onBack={() => setLenderId(null)} />
        )}

        {tab === 'how' && <HowItWorks />}
      </main>
    </div>
  )
}

export default App
