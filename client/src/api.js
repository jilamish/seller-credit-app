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

  createLender: (payload) => request('/api/lenders', { method: 'POST', body: JSON.stringify(payload) }),
  getLenders: () => request('/api/lenders'),
  getLender: (id) => request(`/api/lenders/${id}`),
  invest: (id, payload) => request(`/api/lenders/${id}/invest`, { method: 'POST', body: JSON.stringify(payload) }),

  createBorrower: (payload) => request('/api/borrowers', { method: 'POST', body: JSON.stringify(payload) }),
  getBorrowers: () => request('/api/borrowers'),
  getBorrower: (id) => request(`/api/borrowers/${id}`),

  applyForLoan: (payload) => request('/api/loans', { method: 'POST', body: JSON.stringify(payload) }),
  payInstallment: (id) => request(`/api/installments/${id}/pay`, { method: 'POST' }),
};
