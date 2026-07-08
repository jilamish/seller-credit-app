function getToken() {
  return localStorage.getItem('fg_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('fg_token', token);
  else localStorage.removeItem('fg_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const isForm = options.body instanceof FormData;
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/api/auth/me'),

  onboardingStep: (step, data) => request('/api/onboarding/step', { method: 'POST', body: JSON.stringify({ step, data }) }),

  getCloset: (params = {}) => request(`/api/closet?${new URLSearchParams(params)}`),
  getClosetItem: (id) => request(`/api/closet/${id}`),
  wearItem: (id) => request(`/api/closet/${id}/wear`, { method: 'PATCH' }),
  analyzePhoto: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return request('/api/closet/analyze', { method: 'POST', body: form });
  },
  addClosetItem: (payload) => request('/api/closet', { method: 'POST', body: JSON.stringify(payload) }),

  getWeather: () => request('/api/weather'),
  getOccasions: () => request('/api/occasions'),
  getOutfitsForOccasion: (occasion) => request(`/api/occasions/${encodeURIComponent(occasion)}/outfits`),
  saveOutfit: (payload) => request('/api/outfits', { method: 'POST', body: JSON.stringify(payload) }),
  getOutfit: (id) => request(`/api/outfits/${id}`),
  wearOutfit: (id) => request(`/api/outfits/${id}/wear`, { method: 'POST' }),
  getMakeup: (outfitId) => request(`/api/outfits/${outfitId}/makeup`),
  getNails: (outfitId) => request(`/api/outfits/${outfitId}/nails`),

  getInfluencers: (q) => request(`/api/influencers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  toggleFollow: (id) => request(`/api/influencers/${id}/follow`, { method: 'POST' }),
  getFeed: () => request('/api/feed'),
  getRecreate: (lookId) => request(`/api/looks/${lookId}/recreate`),
  getTrending: () => request('/api/trending'),
  getNotifications: () => request('/api/notifications'),

  getGap: () => request('/api/gap'),
  getGapPrice: (id) => request(`/api/gap/${id}/price`),
  purchaseGap: (id) => request(`/api/gap/${id}/purchase`, { method: 'POST' }),

  getChat: () => request('/api/chat'),
  sendChat: (message) => request('/api/chat', { method: 'POST', body: JSON.stringify({ message }) }),
};
