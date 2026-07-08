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
  getSellers: () => request('/api/sellers'),
  getSeller: (id) => request(`/api/sellers/${id}`),
  createSeller: (payload) => request('/api/sellers', { method: 'POST', body: JSON.stringify(payload) }),
  getLenders: () => request('/api/lenders'),
  getLoans: () => request('/api/loans'),
  applyForLoan: (payload) => request('/api/loans', { method: 'POST', body: JSON.stringify(payload) }),
  updateLoanStatus: (id, status) =>
    request(`/api/loans/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
