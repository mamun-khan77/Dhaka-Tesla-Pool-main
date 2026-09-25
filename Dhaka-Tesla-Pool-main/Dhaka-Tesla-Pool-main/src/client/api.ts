import { User, Ride, Pool, Vehicle, SystemStats, FareEstimate } from './types.ts';

const TOKEN_KEY = 'dhaka_tesla_jwt_token';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const rawText = await response.text();
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(
        response.ok
          ? `Server returned unexpected non-JSON response for ${endpoint}`
          : `Server error (${response.status}) on ${endpoint}`
      );
    }
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || 'An unexpected error occurred');
  }

  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    authStorage.setToken(res.token);
    return res;
  },

  async register(data: { name: string; email: string; phone: string; password: string; role?: string }): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    authStorage.setToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User; vehicle: Vehicle | null }> {
    return request<{ user: User; vehicle: Vehicle | null }>('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      authStorage.clearToken();
    }
  },

  // Rides & Passenger
  async estimateFare(pickupArea: string, destinationArea: string, seatsRequested: number = 1): Promise<FareEstimate> {
    return request<FareEstimate>('/rides/estimate', {
      method: 'POST',
      body: JSON.stringify({ pickupArea, destinationArea, seatsRequested }),
    });
  },

  async createRide(pickupArea: string, destinationArea: string, seatsRequested: number = 1, paymentMethod: 'CASH' | 'TESLAPAY' = 'CASH'): Promise<{ ride: Ride; message: string; matched: boolean; poolId?: string }> {
    return request('/rides', {
      method: 'POST',
      body: JSON.stringify({ pickupArea, destinationArea, seatsRequested, paymentMethod }),
    });
  },

  async getMyRides(): Promise<{ rides: Ride[] }> {
    return request<{ rides: Ride[] }>('/rides');
  },

  async getRideDetails(id: string): Promise<{ ride: Ride; pool: any; vehicle: any; driver: any; coPassengers: any[]; history: any[]; payments: any[] }> {
    return request(`/rides/${id}`);
  },

  async cancelRide(id: string): Promise<{ message: string; ride: Ride }> {
    return request(`/rides/${id}/cancel`, { method: 'PATCH' });
  },

  async payRide(id: string, method: 'CASH' | 'TESLAPAY'): Promise<{ message: string; payment: any }> {
    return request(`/rides/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
  },

  // Driver
  async getDriverDashboard(): Promise<any> {
    return request('/driver/dashboard');
  },

  async toggleVehicleStatus(): Promise<{ message: string; vehicle: Vehicle }> {
    return request('/driver/status', { method: 'PATCH' });
  },

  async acceptRide(rideId: string): Promise<any> {
    return request(`/driver/rides/${rideId}/accept`, { method: 'POST' });
  },

  async markDriverArrived(rideId: string): Promise<{ message: string; ride: Ride }> {
    return request(`/driver/rides/${rideId}/arrived`, { method: 'PATCH' });
  },

  async startRide(rideId: string): Promise<{ message: string; ride: Ride }> {
    return request(`/driver/rides/${rideId}/start`, { method: 'PATCH' });
  },

  async completeRide(rideId: string): Promise<{ message: string; ride: Ride }> {
    return request(`/driver/rides/${rideId}/complete`, { method: 'PATCH' });
  },

  // Pools
  async getPools(): Promise<{ pools: Pool[] }> {
    return request<{ pools: Pool[] }>('/pools');
  },

  async joinPool(poolId: string, rideId: string, seatsRequested: number): Promise<any> {
    return request(`/pools/${poolId}/join`, {
      method: 'POST',
      body: JSON.stringify({ rideId, seatsRequested }),
    });
  },

  // Admin
  async getAdminStats(): Promise<{ statistics: SystemStats }> {
    return request<{ statistics: SystemStats }>('/admin/statistics');
  },

  async getAdminUsers(): Promise<{ users: User[] }> {
    return request<{ users: User[] }>('/admin/users');
  },

  async getAdminRides(): Promise<{ rides: Ride[] }> {
    return request<{ rides: Ride[] }>('/admin/rides');
  },

  async getAdminVehicles(): Promise<{ vehicles: Vehicle[] }> {
    return request<{ vehicles: Vehicle[] }>('/admin/vehicles');
  },

  async resetSeedData(): Promise<{ message: string }> {
    return request<{ message: string }>('/admin/reset', { method: 'POST' });
  },

  // Firebase Google Auth Sync
  async firebaseSync(data: { email: string; name?: string; role?: string; phone?: string }): Promise<{ token: string; user: User; vehicle?: Vehicle }> {
    const res = await request<{ token: string; user: User; vehicle?: Vehicle }>('/auth/firebase-sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    authStorage.setToken(res.token);
    return res;
  },

  // Gemini AI Chatbot
  async sendGeminiChat(
    messages: Array<{ role: string; content: string }>,
    model: string = 'gemini-3.5-flash',
    systemInstruction?: string
  ): Promise<{ reply: string; model: string }> {
    return request<{ reply: string; model: string }>('/gemini/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, model, systemInstruction }),
    });
  },

  // Google Maps Grounding Search
  async searchGoogleMapsGrounding(
    query: string,
    latitude: number = 23.8103,
    longitude: number = 90.4125
  ): Promise<{
    query: string;
    answer: string;
    mapsLinks: Array<{ title: string; uri: string; address?: string; snippet?: string }>;
    groundingChunks: any[];
  }> {
    return request<{
      query: string;
      answer: string;
      mapsLinks: Array<{ title: string; uri: string; address?: string; snippet?: string }>;
      groundingChunks: any[];
    }>('/gemini/maps-grounding', {
      method: 'POST',
      body: JSON.stringify({ query, latitude, longitude }),
    });
  },
};
