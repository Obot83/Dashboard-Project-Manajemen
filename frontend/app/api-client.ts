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
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
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
};
