import axios from 'axios';
import {
  User,
  Credential,
  Session,
  AuditLog,
  PasswordAnalysisResult,
  GeneratedPasswordResult,
  SecurityScoreReport,
  MfaSetupData,
  ShareCreatePayload,
  ShareCreateResponse,
  ShareMetadata,
  ShareRevealResponse,
} from '../types';


export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('securevault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute =
        window.location.pathname === '/login' ||
        window.location.pathname === '/register' ||
        window.location.pathname === '/forgot-password' ||
        window.location.pathname === '/reset-password' ||
        window.location.pathname === '/';

      if (!isAuthRoute) {
        localStorage.removeItem('securevault_token');
        localStorage.removeItem('securevault_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  async register(data: { name: string; email: string; password: string; confirmPassword: string }) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  async login(data: { email: string; password: string }) {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
  async mfaLogin(data: { mfaTempToken: string; code: string; isBackupCode?: boolean }) {
    const res = await api.post('/auth/mfa-login', data);
    return res.data;
  },
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('securevault_token');
      localStorage.removeItem('securevault_user');
    }
  },
  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data.user;
  },
  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  async verifyResetToken(token: string) {
    const res = await api.post('/auth/verify-reset', { token });
    return res.data;
  },
  async resetPassword(data: { token: string; password: string; confirmPassword: string }) {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
};

// Credentials Service
export const credentialsService = {
  async list(search?: string): Promise<Credential[]> {
    const params = search ? { search } : {};
    const res = await api.get('/credentials', { params });
    return res.data.data.credentials;
  },
  async create(data: { website: string; username: string; password: string }): Promise<Credential> {
    const res = await api.post('/credentials', data);
    return res.data.data.credential;
  },
  async reveal(id: string): Promise<Credential> {
    const res = await api.get(`/credentials/${id}`);
    return res.data.data.credential;
  },
  async update(id: string, data: { website?: string; username?: string; password?: string }): Promise<Credential> {
    const res = await api.put(`/credentials/${id}`, data);
    return res.data.data.credential;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/credentials/${id}`);
  },
};

// Password Tools Service
export const passwordToolsService = {
  async analyze(password: string): Promise<PasswordAnalysisResult> {
    const res = await api.post('/password/analyze', { password });
    return res.data.data;
  },
  async generate(options?: {
    length?: number;
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    special?: boolean;
  }): Promise<GeneratedPasswordResult> {
    const res = await api.post('/password/generate', options || {});
    return res.data.data;
  },
};

// MFA Service
export const mfaService = {
  async getStatus(): Promise<{ mfaEnabled: boolean; remainingBackupCodes: number }> {
    const res = await api.get('/mfa/status');
    return res.data.data;
  },
  async setup(): Promise<MfaSetupData> {
    const res = await api.post('/mfa/setup');
    return res.data.data;
  },
  async verifyAndEnable(data: { token: string; secret: string; backupCodes: string[] }) {
    const res = await api.post('/mfa/verify', data);
    return res.data;
  },
  async disable(password: string) {
    const res = await api.post('/mfa/disable', { password });
    return res.data;
  },
};

// Security Service
export const securityService = {
  async getScore(): Promise<SecurityScoreReport> {
    const res = await api.get('/security/score');
    return res.data.data;
  },
};

// Activity Service
export const activityService = {
  async list(limit = 30, offset = 0): Promise<{ logs: AuditLog[]; pagination: any }> {
    const res = await api.get('/activity', { params: { limit, offset } });
    return res.data.data;
  },
};

// Sessions Service
export const sessionsService = {
  async list(): Promise<Session[]> {
    const res = await api.get('/sessions');
    return res.data.data.sessions;
  },
  async revoke(sessionId: string): Promise<void> {
    await api.delete(`/sessions/${sessionId}`);
  },
  async revokeOthers(): Promise<number> {
    const res = await api.post('/sessions/revoke-others');
    return res.data.data.revokedCount;
  },
};

// Share Service (Ephemeral One-Time Secrets)
export const shareService = {
  async create(payload: ShareCreatePayload): Promise<ShareCreateResponse> {
    const res = await api.post('/share', payload);
    return res.data.data;
  },
  async getMeta(shareId: string): Promise<ShareMetadata> {
    const res = await api.get(`/share/${shareId}/meta`);
    return res.data.data;
  },
  async reveal(shareId: string, passphrase?: string): Promise<ShareRevealResponse> {
    const res = await api.post(`/share/${shareId}/reveal`, { passphrase });
    return res.data.data;
  },
};

