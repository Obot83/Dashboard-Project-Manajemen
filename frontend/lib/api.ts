import {
  KPIResponse,
  FilterMetaResponse,
  StatusDistributionItem,
  TypeDistributionItem,
  PriorityDistributionItem,
  MonthlyVolumeItem,
  ProjectItem,
  WorkPackagesResponse,
  WorkPackageDetail,
  WorkloadItem,
  TimeTrackingResponse,
  MilestoneItem,
  VersionItem,
  CompletionItem,
  ReportsSummaryResponse,
  ReleasePipelineResponse,
  UsersResponse,
  UserDetail,
  CreateUserRequest,
  UpdateUserRequest,
  DashboardUser,
  LoginRequest,
  LoginResponse,
  CreateDashboardUserRequest,
  UpdateDashboardUserRequest,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) errorDetail = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(`API Error [${res.status}]: ${errorDetail}`);
  }

  return res.json();
}

async function sendJSON<T>(path: string, method: string, data?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errJson = await res.json();
      if (errJson && errJson.error) errorDetail = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorDetail || `API Error [${res.status}]`);
  }

  return res.json();
}

export const api = {
  getFilterMeta: () => fetchJSON<FilterMetaResponse>('/api/meta/filters'),

  getKPI: (projectId?: string) =>
    fetchJSON<KPIResponse>(`/api/kpi${projectId ? `?project_id=${projectId}` : ''}`),

  getStatusDistribution: (projectId?: string) =>
    fetchJSON<StatusDistributionItem[]>(
      `/api/status-distribution${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getTypeDistribution: (projectId?: string) =>
    fetchJSON<TypeDistributionItem[]>(
      `/api/type-distribution${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getPriorityDistribution: (projectId?: string) =>
    fetchJSON<PriorityDistributionItem[]>(
      `/api/priority-distribution${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getMonthlyVolume: (projectId?: string) =>
    fetchJSON<MonthlyVolumeItem[]>(
      `/api/monthly-volume${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getProjects: (search?: string) =>
    fetchJSON<ProjectItem[]>(
      `/api/projects${search ? `?search=${encodeURIComponent(search)}` : ''}`
    ),

  getWorkPackages: (params: {
    projectId?: string;
    status?: string;
    priority?: string;
    type?: string;
    isOverdue?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortDir?: string;
  }) => {
    const q = new URLSearchParams();
    if (params.projectId) q.set('project_id', params.projectId);
    if (params.status) q.set('status', params.status);
    if (params.priority) q.set('priority', params.priority);
    if (params.type) q.set('type', params.type);
    if (params.isOverdue) q.set('is_overdue', 'true');
    if (params.search) q.set('search', params.search);
    if (params.limit) q.set('limit', params.limit.toString());
    if (params.offset !== undefined) q.set('offset', params.offset.toString());
    if (params.sortBy) q.set('sort_by', params.sortBy);
    if (params.sortDir) q.set('sort_dir', params.sortDir);

    return fetchJSON<WorkPackagesResponse>(`/api/work-packages?${q.toString()}`);
  },

  getWorkPackageDetail: (id: number) =>
    fetchJSON<WorkPackageDetail>(`/api/work-packages/${id}`),

  getWorkload: (projectId?: string) =>
    fetchJSON<WorkloadItem[]>(
      `/api/workload${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getTimeTracking: (projectId?: string) =>
    fetchJSON<TimeTrackingResponse>(
      `/api/time-tracking${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getMilestones: (projectId?: string) =>
    fetchJSON<MilestoneItem[]>(
      `/api/milestones${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getVersions: (projectId?: string) =>
    fetchJSON<VersionItem[]>(
      `/api/versions${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getCompletion: (projectId?: string) =>
    fetchJSON<CompletionItem[]>(
      `/api/completion${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getReportsSummary: (projectId?: string) =>
    fetchJSON<ReportsSummaryResponse>(
      `/api/reports-summary${projectId ? `?project_id=${projectId}` : ''}`
    ),

  getReleasePipeline: (projectId?: string) =>
    fetchJSON<ReleasePipelineResponse>(
      `/api/release-pipeline${projectId ? `?project_id=${projectId}` : ''}`
    ),

  // User Management
  getUsers: (params?: { search?: string; status?: string; role?: string; projectId?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.role) q.set('role', params.role);
    if (params?.projectId) q.set('project_id', params.projectId);
    const qs = q.toString();
    return fetchJSON<UsersResponse>(`/api/users${qs ? `?${qs}` : ''}`);
  },

  getUserDetail: (id: number) => fetchJSON<UserDetail>(`/api/users/${id}`),

  createUser: (payload: CreateUserRequest) =>
    sendJSON<{ message: string; id: number; login: string }>('/api/users', 'POST', payload),

  updateUser: (id: number, payload: UpdateUserRequest) =>
    sendJSON<{ message: string; id: number }>(`/api/users/${id}`, 'PUT', payload),

  deleteUser: (id: number) =>
    sendJSON<{ message: string; id: number }>(`/api/users/${id}`, 'DELETE'),

  // Authentication
  login: (payload: LoginRequest) =>
    sendJSON<LoginResponse>('/api/auth/login', 'POST', payload),

  getMe: () => fetchJSON<{ user: DashboardUser }>('/api/auth/me'),

  logout: () => sendJSON<{ message: string }>('/api/auth/logout', 'POST'),

  // Dashboard Users (Akses Dashboard)
  getDashboardUsers: (params?: { search?: string; role?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.role) q.set('role', params.role);
    const qs = q.toString();
    return fetchJSON<{ users: DashboardUser[]; total: number }>(
      `/api/dashboard-users${qs ? `?${qs}` : ''}`
    );
  },

  createDashboardUser: (payload: CreateDashboardUserRequest) =>
    sendJSON<{ message: string; id: number }>('/api/dashboard-users', 'POST', payload),

  updateDashboardUser: (id: number, payload: UpdateDashboardUserRequest) =>
    sendJSON<{ message: string }>(`/api/dashboard-users/${id}`, 'PUT', payload),

  deleteDashboardUser: (id: number) =>
    sendJSON<{ message: string }>(`/api/dashboard-users/${id}`, 'DELETE'),
};
