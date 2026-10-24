import {
  User,
  ScamReport,
  Evidence,
  ReportUpdate,
  NotificationItem,
  AuditLogItem,
  UserDashboardStats,
  AdminDashboardStats,
  ReportStatus,
  ReportPriority,
} from '../types';

const TOKEN_KEY = 'scam_report_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type if body is FormData (browser will set boundary automatically)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(data: { full_name: string; email: string; password: string; phone?: string }) {
    const res = await request<{ user: User; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(data: { email: string; password: string }) {
    const res = await request<{ user: User; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearStoredToken();
    }
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  async updateProfile(data: { full_name: string; phone?: string }) {
    return request<{ user: User; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: { current_password: string; new_password: string }) {
    return request<{ message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Reports (User)
  async submitReport(formData: FormData) {
    return request<{
      message: string;
      report: { id: number; report_reference: string; title: string; category: string; status: ReportStatus };
    }>('/api/reports', {
      method: 'POST',
      body: formData,
    });
  },

  async getMyReports(filters?: { status?: string; category?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{ reports: ScamReport[]; stats: UserDashboardStats }>(`/api/reports/my${qs}`);
  },

  async getMyReportDetail(id: number) {
    return request<{
      report: ScamReport;
      evidence: Evidence[];
      updates: ReportUpdate[];
    }>(`/api/reports/my/${id}`);
  },

  async trackReportByReference(reference: string) {
    return request<{
      report: ScamReport;
      updates: { previous_status: ReportStatus; new_status: ReportStatus; user_message: string; timestamp: string }[];
    }>(`/api/reports/track/${encodeURIComponent(reference)}`);
  },

  async provideAdditionalInfo(reportId: number, formData: FormData) {
    return request<{ message: string; status: ReportStatus }>(`/api/reports/${reportId}/provide-info`, {
      method: 'POST',
      body: formData,
    });
  },

  // Notifications
  async getNotifications() {
    return request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications');
  },

  async markNotificationRead(id: number) {
    return request<{ message: string }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead() {
    return request<{ message: string }>('/api/notifications/read-all', {
      method: 'POST',
    });
  },

  // Admin Endpoints
  async getAdminReports(paramsObj?: {
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  }) {
    const params = new URLSearchParams();
    if (paramsObj) {
      Object.entries(paramsObj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
      });
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{
      reports: ScamReport[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/api/admin/reports${qs}`);
  },

  async getAdminReportDetail(id: number) {
    return request<{
      report: ScamReport;
      evidence: Evidence[];
      updates: ReportUpdate[];
      auditLogs: AuditLogItem[];
    }>(`/api/admin/reports/${id}`);
  },

  async updateReportStatus(
    id: number,
    data: {
      status: ReportStatus;
      priority?: ReportPriority;
      user_message?: string;
      internal_note?: string;
    }
  ) {
    return request<{ message: string; status: ReportStatus; priority: ReportPriority }>(
      `/api/admin/reports/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  },

  async updateReportPriority(id: number, priority: ReportPriority) {
    return request<{ message: string; priority: ReportPriority }>(`/api/admin/reports/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    });
  },

  async getAdminStats() {
    return request<AdminDashboardStats>('/api/admin/stats');
  },

  async getAdminAuditLogs(paramsObj?: { action?: string; search?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (paramsObj) {
      Object.entries(paramsObj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
      });
    }
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{
      logs: AuditLogItem[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/api/admin/audit-logs${qs}`);
  },
};
