async function request(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  getPools: () => request('/api/pools'),
  getPool: (id) => request(`/api/pools/${id}`),

  createLender: (payload) => request('/api/lenders', { method: 'POST', body: JSON.stringify(payload) }),
  getLenders: () => request('/api/lenders'),
  getLender: (id) => request(`/api/lenders/${id}`),
  invest: (id, payload) => request(`/api/lenders/${id}/invest`, { method: 'POST', body: JSON.stringify(payload) }),
  withdraw: (id, payload) => request(`/api/lenders/${id}/withdraw`, { method: 'POST', body: JSON.stringify(payload) }),

  createBorrower: (payload) => request('/api/borrowers', { method: 'POST', body: JSON.stringify(payload) }),
  getBorrowers: () => request('/api/borrowers'),
  getBorrower: (id) => request(`/api/borrowers/${id}`),
  savePan: (id, pan) => request(`/api/borrowers/${id}/pan`, { method: 'POST', body: JSON.stringify({ pan }) }),
  verifyAadhaar: (id) => request(`/api/borrowers/${id}/aadhaar-otp`, { method: 'POST' }),

  getProducts: () => request('/api/products'),
  createOrder: (payload) => request('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),

  payInstallment: (id) => request(`/api/installments/${id}/pay`, { method: 'POST' }),

  getOpsQueue: () => request('/api/ops/queue'),
  opsDecision: (id, payload) => request(`/api/ops/loans/${id}/decision`, { method: 'POST', body: JSON.stringify(payload) }),
  getCollections: () => request('/api/ops/collections'),
};
