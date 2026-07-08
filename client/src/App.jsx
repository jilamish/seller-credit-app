import { useEffect, useState } from 'react'
import { api } from './api'
import SellerForm from './SellerForm'
import SellerList from './SellerList'
import SellerDetail from './SellerDetail'
import LoansView from './LoansView'

function App() {
  const [tab, setTab] = useState('sellers')
  const [sellers, setSellers] = useState([])
  const [selectedSellerId, setSelectedSellerId] = useState(null)

  const loadSellers = () => api.getSellers().then(setSellers).catch(() => {})

  useEffect(loadSellers, [])

  const handleSellerCreated = (id) => {
    loadSellers()
    setSelectedSellerId(id)
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>SellerCredit</h1>
        <p className="tagline">Alternative-data credit scoring &amp; lending for small online sellers</p>
        <nav>
          <button className={tab === 'sellers' ? 'active' : ''} onClick={() => { setTab('sellers'); setSelectedSellerId(null) }}>
            Sellers
          </button>
          <button className={tab === 'loans' ? 'active' : ''} onClick={() => setTab('loans')}>
            Loans
          </button>
        </nav>
      </header>

      <main>
        {tab === 'sellers' && !selectedSellerId && (
          <>
            <SellerForm onCreated={handleSellerCreated} />
            <SellerList sellers={sellers} onSelect={setSelectedSellerId} />
          </>
        )}
        {tab === 'sellers' && selectedSellerId && (
          <SellerDetail sellerId={selectedSellerId} onBack={() => setSelectedSellerId(null)} />
        )}
        {tab === 'loans' && <LoansView />}
      </main>
    </div>
  )
}

export default App
