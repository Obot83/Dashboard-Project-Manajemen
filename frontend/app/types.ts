export interface KPIResponse {
  projects: number;
  work_packages: number;
  users: number;
  closed: number;
  overdue: number;
  in_progress: number;
  on_hold: number;
  rejected: number;
  close_rate: number;
}

export interface FilterOption {
  id: number;
  name: string;
  is_closed?: boolean;
}

export interface ProjectOption {
  id: number;
  name: string;
  identifier: string;
}

export interface FilterMetaResponse {
  statuses: FilterOption[];
  types: FilterOption[];
  priorities: FilterOption[];
  projects: ProjectOption[];
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  is_closed: boolean;
}

export interface TypeDistributionItem {
  type: string;
  count: number;
}

export interface PriorityDistributionItem {
  priority: string;
  count: number;
}

export interface MonthlyVolumeItem {
  month: string;
  count: number;
}

export interface ProjectItem {
  id: number;
  name: string;
  identifier: string;
  active: boolean;
  created_at: string;
  wp_count: number;
  closed_count: number;
  overdue_count: number;
  high_priority_open: number;
  avg_done: number;
  estimated_hours: number;
  spent_hours: number;
  close_rate: number;
  health: 'good' | 'warning' | 'critical';
  health_label: string;
}

export interface WorkPackageItem {
  id: number;
  subject: string;
  status: string;
  is_closed: boolean;
  type: string;
  priority: string;
  project_id: number;
  project: string;
  project_identifier: string;
  due_date: string | null;
  start_date: string | null;
  done_ratio: number | null;
  estimated_hours: number | null;
  created_at: string;
  updated_at: string;
  days_overdue: number;
  assignee: string | null;
}

export interface WorkPackagesResponse {
  total: number;
  page: number;
  pages: number;
  limit: number;
  offset: number;
  items: WorkPackageItem[];
}

export interface CustomFieldItem {
  name: string;
  value: string;
}

export interface JournalItem {
  id: number;
  version: number;
  notes: string;
  created_at: string;
  author: string | null;
}

export interface WorkPackageDetail {
  id: number;
  subject: string;
  description: string | null;
  status: string;
  is_closed: boolean;
  type: string;
  priority: string;
  project_id: number;
  project: string;
  project_identifier: string;
  due_date: string | null;
  start_date: string | null;
  done_ratio: number | null;
  estimated_hours: number | null;
  remaining_hours: number | null;
  spent_hours: number;
  created_at: string;
  updated_at: string;
  days_overdue: number;
  assignee: string | null;
  author: string | null;
  custom_fields: CustomFieldItem[];
  journals: JournalItem[];
}

export interface WorkloadItem {
  name: string;
  open_tasks: number;
  closed_tasks: number;
  total_tasks: number;
}

export interface ProjectHoursItem {
  id: number;
  name: string;
  estimated_hours: number;
  spent_hours: number;
}

export interface UserHoursItem {
  user_name: string;
  total_hours: number;
  log_count: number;
}

export interface TimeTrackingResponse {
  by_project: ProjectHoursItem[];
  by_user: UserHoursItem[];
}

export interface MilestoneItem {
  id: number;
  subject: string;
  due_date: string | null;
  start_date: string | null;
  done_ratio: number | null;
  project: string;
  status: string;
  is_closed: boolean;
}

export interface VersionItem {
  id: number;
  name: string;
  status: string;
  effective_date: string | null;
  project: string;
  wp_count: number;
  closed_count: number;
}

export interface CompletionItem {
  id: number;
  project: string;
  total: number;
  closed: number;
  avg_done: number;
}

export interface ReportStats {
  total_items: number;
  bug_count: number;
  story_count: number;
  task_count: number;
  feature_count: number;
  on_hold_count: number;
  rejected_count: number;
  overdue_count: number;
  closed_count: number;
  total_estimated_hours: number;
}

export interface TopProjectReport {
  id: number;
  name: string;
  total: number;
  closed: number;
  avg_done: number;
}

export interface ReportsSummaryResponse {
  stats: ReportStats;
  total_spent_hours: number;
  top_projects: TopProjectReport[];
}
