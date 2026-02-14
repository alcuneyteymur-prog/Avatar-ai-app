const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getToken = () => localStorage.getItem('token');

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Yetkisiz erisim');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Bir hata olustu' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response;
};

// Avatar API
export const avatarApi = {
  getAll: () => fetchWithAuth(`${API_URL}/avatars`).then(r => r.json()),
  getById: (id: string) => fetchWithAuth(`${API_URL}/avatars/${id}`).then(r => r.json()),
  create: (data: FormData) => fetchWithAuth(`${API_URL}/avatars/create`, {
    method: 'POST',
    body: data
  }).then(r => r.json()),
  delete: (id: string) => fetchWithAuth(`${API_URL}/avatars/${id}`, {
    method: 'DELETE'
  }).then(r => r.json())
};

// Chat API
export const chatApi = {
  sendText: (avatarId: string, message: string) => 
    fetchWithAuth(`${API_URL}/chat/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarId, message })
    }).then(r => r.json()),
  
  sendVoice: (avatarId: string, message: string) => 
    fetchWithAuth(`${API_URL}/chat/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarId, message })
    }),
  
  clearMemory: (avatarId: string) => 
    fetchWithAuth(`${API_URL}/chat/clear-memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarId })
    }).then(r => r.json())
};

// Room API
export const roomApi = {
  create: (avatarId: string, name: string, maxParticipants?: number) => 
    fetchWithAuth(`${API_URL}/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarId, name, maxParticipants })
    }).then(r => r.json()),
  
  join: (inviteCode: string) => 
    fetchWithAuth(`${API_URL}/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode })
    }).then(r => r.json()),
  
  getById: (roomId: string) => 
    fetchWithAuth(`${API_URL}/rooms/${roomId}`).then(r => r.json()),
  
  leave: (roomId: string) => 
    fetchWithAuth(`${API_URL}/rooms/${roomId}/leave`, {
      method: 'POST'
    }).then(r => r.json()),
  
  close: (roomId: string) => 
    fetchWithAuth(`${API_URL}/rooms/${roomId}/close`, {
      method: 'POST'
    }).then(r => r.json())
};

// Payment API
export const paymentApi = {
  getPrices: () => fetchWithAuth(`${API_URL}/payment/prices`).then(r => r.json()),
  
  createSubscription: (priceId: string) => 
    fetchWithAuth(`${API_URL}/payment/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId })
    }).then(r => r.json()),
  
  cancelSubscription: () => 
    fetchWithAuth(`${API_URL}/payment/cancel-subscription`, {
      method: 'POST'
    }).then(r => r.json())
};

export default { avatarApi, chatApi, roomApi, paymentApi };
