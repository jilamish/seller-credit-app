import { useState } from 'react'
import { api } from './api'

const PRESETS = [
  {
    label: 'Textile Seller',
    name: 'Aarav Textiles',
    gmv_monthly: 450000,
    order_count: 1200,
    return_rate: 4,
    account_age_months: 18,
    catalog_size: 320,
  },
  {
    label: 'New Home Decor Seller',
    name: 'Bloom Home Decor',
    gmv_monthly: 90000,
    order_count: 210,
    return_rate: 8,
    account_age_months: 5,
    catalog_size: 80,
  },
  {
    label: 'Established Electronics Seller',
    name: 'Chetak Electronics',
    gmv_monthly: 920000,
    order_count: 2100,
    return_rate: 2,
    account_age_months: 30,
    catalog_size: 500,
  },
]

const EMPTY_FORM = {
  name: '',
  gmv_monthly: '',
  order_count: '',
  return_rate: '',
  account_age_months: '',
  catalog_size: '',
}

export default function SellerForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const applyPreset = (preset) => {
    const { label, ...rest } = preset
    setForm(rest)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const seller = await api.createSeller({
        ...form,
        return_rate: Number(form.return_rate) / 100,
      })
      setForm(EMPTY_FORM)
      onCreated(seller.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h2>Get a Credit Score for Your Business</h2>
      <p className="muted">
        Enter your marketplace performance — we compute an alternative-data credit score and match you with lenders instantly.
      </p>

      <div className="presets">
        <span className="muted">Try an example:</span>
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="chip" onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Business name
          <input required value={form.name} onChange={update('name')} placeholder="e.g. Aarav Textiles" />
        </label>
        <label>
          Monthly GMV (₹)
          <input required type="number" min="0" value={form.gmv_monthly} onChange={update('gmv_monthly')} />
        </label>
        <label>
          Monthly order count
          <input required type="number" min="0" value={form.order_count} onChange={update('order_count')} />
        </label>
        <label>
          Return rate (%)
          <input required type="number" min="0" max="100" step="0.1" value={form.return_rate} onChange={update('return_rate')} />
        </label>
        <label>
          Account age (months)
          <input required type="number" min="0" value={form.account_age_months} onChange={update('account_age_months')} />
        </label>
        <label>
          Catalog size (SKUs)
          <input required type="number" min="0" value={form.catalog_size} onChange={update('catalog_size')} />
        </label>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Scoring...' : 'Get My Score & Loan Offers'}
        </button>
      </form>
    </div>
  )
}
