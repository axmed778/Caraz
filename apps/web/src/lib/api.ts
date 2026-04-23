const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    token?: string,
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.data ?? json;
  }

  // ─── Reference ───────────────────────────────────────
  getReferenceData() {
    return this.request<any>('/reference', { next: { revalidate: 3600 } });
  }

  getBrands() {
    return this.request<any[]>('/reference/brands', { next: { revalidate: 3600 } });
  }

  getModels(brandId: number) {
    return this.request<any[]>(`/reference/models?brandId=${brandId}`, { next: { revalidate: 3600 } });
  }

  getCities() {
    return this.request<any[]>('/reference/cities', { next: { revalidate: 3600 } });
  }

  // ─── Listings ────────────────────────────────────────
  getListings(params: Record<string, any> = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])),
    ).toString();
    return this.request<any>(`/listings?${qs}`, { cache: 'no-store' });
  }

  getListing(id: string) {
    return this.request<any>(`/listings/${id}`, { next: { revalidate: 60 } });
  }

  createListing(data: any, token: string) {
    return this.request<any>('/listings', { method: 'POST', body: JSON.stringify(data) }, token);
  }

  updateListing(id: string, data: any, token: string) {
    return this.request<any>(`/listings/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
  }

  deleteListing(id: string, token: string) {
    return this.request<any>(`/listings/${id}`, { method: 'DELETE' }, token);
  }

  getMyListings(token: string, page = 1) {
    return this.request<any>(`/listings/user/me?page=${page}`, {}, token);
  }

  // ─── Auth ─────────────────────────────────────────────
  register(data: { email: string; password: string; phone?: string; firstName?: string; lastName?: string }) {
    return this.request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  login(data: { email: string; password: string }) {
    return this.request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  }

  refreshToken(refreshToken: string) {
    return this.request<any>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  }

  logout(refreshToken: string) {
    return this.request<any>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  }

  // ─── Users ─────────────────────────────────────────────
  getMe(token: string) {
    return this.request<any>('/users/me', {}, token);
  }

  updateProfile(data: any, token: string) {
    return this.request<any>('/users/me', { method: 'PUT', body: JSON.stringify(data) }, token);
  }

  // ─── Dealers ─────────────────────────────────────────
  getDealer(id: string) {
    return this.request<any>(`/dealers/${id}`, { next: { revalidate: 300 } });
  }

  getDealerListings(id: string, page = 1) {
    return this.request<any>(`/dealers/${id}/listings?page=${page}`, { cache: 'no-store' });
  }

  // ─── VIN ─────────────────────────────────────────────
  getVinHistory(vin: string) {
    return this.request<any>(`/vin/${vin}/history`, { next: { revalidate: 300 } });
  }

  // ─── Favorites ──────────────────────────────────────
  getFavorites(token: string, page = 1) {
    return this.request<any>(`/favorites?page=${page}`, {}, token);
  }

  saveListing(listingId: string, token: string) {
    return this.request<any>(`/favorites/${listingId}`, { method: 'POST' }, token);
  }

  unsaveListing(listingId: string, token: string) {
    return this.request<any>(`/favorites/${listingId}`, { method: 'DELETE' }, token);
  }

  checkSaved(listingId: string, token: string) {
    return this.request<any>(`/favorites/${listingId}/check`, {}, token);
  }

  // ─── Messaging ──────────────────────────────────────
  getConversations(token: string, page = 1) {
    return this.request<any>(`/messaging/conversations?page=${page}`, {}, token);
  }

  getMessages(conversationId: string, token: string, page = 1) {
    return this.request<any>(`/messaging/conversations/${conversationId}/messages?page=${page}`, {}, token);
  }

  startConversation(listingId: string, firstMessage: string, token: string) {
    return this.request<any>('/messaging/conversations', {
      method: 'POST', body: JSON.stringify({ listingId, firstMessage }),
    }, token);
  }

  sendMessage(conversationId: string, body: string, token: string) {
    return this.request<any>(`/messaging/conversations/${conversationId}/messages`, {
      method: 'POST', body: JSON.stringify({ body }),
    }, token);
  }

  getUnreadMessageCount(token: string) {
    return this.request<any>('/messaging/unread', {}, token);
  }

  // ─── Notifications ──────────────────────────────────
  getNotifications(token: string, page = 1) {
    return this.request<any>(`/notifications?page=${page}`, {}, token);
  }

  markNotificationRead(id: string, token: string) {
    return this.request<any>(`/notifications/${id}/read`, { method: 'PUT' }, token);
  }

  markAllNotificationsRead(token: string) {
    return this.request<any>('/notifications/read-all', { method: 'PUT' }, token);
  }

  // ─── Analytics ──────────────────────────────────────
  getListingStats(listingId: string, token: string) {
    return this.request<any>(`/analytics/listing/${listingId}`, {}, token);
  }

  getMarketOverview() {
    return this.request<any>('/analytics/overview', { next: { revalidate: 300 } });
  }
}

export const api = new ApiClient(API_URL);
