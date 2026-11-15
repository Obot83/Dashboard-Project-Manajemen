'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { downloadCSV } from '@/lib/utils';
import {
  KPIResponse,
  ProjectOption,
  ProjectItem,
  WorkPackageItem,
  WorkPackageDetail,
  StatusDistributionItem,
  TypeDistributionItem,
  PriorityDistributionItem,
  MonthlyVolumeItem,
  MilestoneItem,
  VersionItem,
  WorkloadItem,
  TimeTrackingResponse,
  ReportsSummaryResponse,
  ReleasePipelineResponse,
  UserItem,
  UserSummaryKPI,
  UserDetail,
  DashboardUser,
} from '@/lib/types';
import { Sidebar, TabType } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { OverviewView } from '@/components/views/overview-view';
import { ProjectsView } from '@/components/views/projects-view';
import { TasksView } from '@/components/views/tasks-view';
import { MilestonesView } from '@/components/views/milestones-view';
import { WorkloadView } from '@/components/views/workload-view';
import { ReportsView } from '@/components/views/reports-view';
import { UsersView } from '@/components/views/users-view';
import { TaskModal } from '@/components/tasks/task-modal';
import { UserDetailModal } from '@/components/users/user-detail-modal';
import { UserFormModal } from '@/components/users/user-form-modal';
import { DashboardUserModal } from '@/components/users/dashboard-user-modal';
import { LoginView } from '@/components/auth/login-view';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Overview data
  const [kpi, setKpi] = useState<KPIResponse | null>(null);
  const [statusDist, setStatusDist] = useState<StatusDistributionItem[]>([]);
  const [typeDist, setTypeDist] = useState<TypeDistributionItem[]>([]);
  const [monthlyVol, setMonthlyVol] = useState<MonthlyVolumeItem[]>([]);
  const [recentWp, setRecentWp] = useState<WorkPackageItem[]>([]);
  const [releasePipeline, setReleasePipeline] = useState<ReleasePipelineResponse | null>(null);

  // Projects data
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projSearch, setProjSearch] = useState('');

  // Tasks data
  const [tasks, setTasks] = useState<WorkPackageItem[]>([]);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [taskPage, setTaskPage] = useState(1);
  const [taskPages, setTaskPages] = useState(1);
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskOverdueFilter, setTaskOverdueFilter] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');

  // Modal data
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<WorkPackageDetail | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Milestones data
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [versions, setVersions] = useState<VersionItem[]>([]);

  // Workload data
  const [workload, setWorkload] = useState<WorkloadItem[]>([]);
  const [timeTracking, setTimeTracking] = useState<TimeTrackingResponse | null>(null);

  // Reports data
  const [reports, setReports] = useState<ReportsSummaryResponse | null>(null);

  // User Management data (OpenProject)
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersSummary, setUsersSummary] = useState<UserSummaryKPI | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetail | null>(null);
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userFormModalOpen, setUserFormModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);

  // Authentication & Dashboard Users data
  const [currentUser, setCurrentUser] = useState<DashboardUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [dashboardUsers, setDashboardUsers] = useState<DashboardUser[]>([]);
  const [dashboardUserModalOpen, setDashboardUserModalOpen] = useState(false);
  const [dashboardUserToEdit, setDashboardUserToEdit] = useState<DashboardUser | null>(null);

  // Enforce Clean Light Mode (Dark mode completely removed)
  useEffect(() => {
    localStorage.removeItem('theme');
    document.documentElement.removeAttribute('data-theme');
  }, []);

  // Check login authentication session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('dashboard_user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
          setCurrentUser(JSON.parse(storedUser));
          // Verify with server
          const me = await api.getMe();
          setCurrentUser(me.user);
          localStorage.setItem('dashboard_user', JSON.stringify(me.user));
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('dashboard_user');
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    };
    initAuth();
  }, []);

  // Handle Logout
  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari dashboard?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('dashboard_user');
      setCurrentUser(null);
    }
  };

  // Restrict tabs according to role
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role;
    if (role === 'viewer') {
      if (activeTab === 'projects' || activeTab === 'tasks' || activeTab === 'workload' || activeTab === 'users') {
        setActiveTab('overview');
      }
    } else if (role === 'member') {
      if (activeTab === 'milestones' || activeTab === 'reports' || activeTab === 'users') {
        setActiveTab('overview');
      }
    } else if (role === 'pm') {
      if (activeTab === 'users') {
        setActiveTab('overview');
      }
    }
  }, [currentUser, activeTab]);

  // Load project filters
  const loadFilterMeta = useCallback(async () => {
    try {
      const meta = await api.getFilterMeta();
      setProjectOptions(meta.projects);
    } catch (e) {
      console.error('Failed to load project filter meta', e);
    }
  }, []);

  // Load Active Tab Data
  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [k, s, t, m, w, rel] = await Promise.all([
          api.getKPI(selectedProjectId),
          api.getStatusDistribution(selectedProjectId),
          api.getTypeDistribution(selectedProjectId),
          api.getMonthlyVolume(selectedProjectId),
          api.getWorkPackages({ projectId: selectedProjectId, limit: 6 }),
          api.getReleasePipeline(selectedProjectId),
        ]);
        setKpi(k);
        setStatusDist(s);
        setTypeDist(t);
        setMonthlyVol(m);
        setRecentWp(w.items);
        setReleasePipeline(rel);
      } else if (activeTab === 'projects') {
        const pList = await api.getProjects(projSearch);
        setProjects(pList);
      } else if (activeTab === 'tasks') {
        const res = await api.getWorkPackages({
          projectId: selectedProjectId,
          status: taskOverdueFilter ? undefined : taskStatusFilter || undefined,
          isOverdue: taskOverdueFilter || undefined,
          search: taskSearch || undefined,
          limit: 30,
          offset: (taskPage - 1) * 30,
        });
        setTasks(res.items);
        setTasksTotal(res.total);
        setTaskPages(res.pages);
      } else if (activeTab === 'milestones') {
        const [mList, vList] = await Promise.all([
          api.getMilestones(selectedProjectId),
          api.getVersions(selectedProjectId),
        ]);
        setMilestones(mList);
        setVersions(vList);
      } else if (activeTab === 'workload') {
        const [wList, tTrack] = await Promise.all([
          api.getWorkload(selectedProjectId),
          api.getTimeTracking(selectedProjectId),
        ]);
        setWorkload(wList);
        setTimeTracking(tTrack);
      } else if (activeTab === 'reports') {
        const rSum = await api.getReportsSummary(selectedProjectId);
        setReports(rSum);
      } else if (activeTab === 'users') {
        const [res, dbUsers] = await Promise.all([
          api.getUsers({
            search: userSearch || undefined,
            status: userStatusFilter || undefined,
            role: userRoleFilter || undefined,
            projectId: selectedProjectId || undefined,
          }),
          api.getDashboardUsers(),
        ]);
        setUsers(res.users);
        setUsersSummary(res.summary);
        setDashboardUsers(dbUsers.users);
      }
      setLastUpdated(new Date().toLocaleTimeString('id-ID'));
    } catch (e) {
      console.error('Error loading tab data:', e);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    selectedProjectId,
    projSearch,
    taskPage,
    taskStatusFilter,
    taskOverdueFilter,
    taskSearch,
    userSearch,
    userStatusFilter,
    userRoleFilter,
  ]);

  useEffect(() => {
    loadFilterMeta();
  }, [loadFilterMeta]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Open Task Detail Modal
  const handleOpenTaskModal = async (id: number) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const detail = await api.getWorkPackageDetail(id);
      setSelectedTaskDetail(detail);
    } catch (e) {
      console.error('Failed to load task detail', e);
    } finally {
      setDetailLoading(false);
    }
  };

  // Export Tasks to CSV
  const handleExportTasksCSV = () => {
    if (!tasks.length) return alert('Tidak ada data task untuk di-export.');
    const headers = ['ID', 'Subject', 'Tipe', 'Prioritas', 'Status', 'Project', 'Assignee', 'Due Date', 'Progress %'];
    const rows = tasks.map((t) => [
      t.id,
      `"${t.subject.replace(/"/g, '""')}"`,
      t.type,
      t.priority,
      t.status,
      `"${t.project.replace(/"/g, '""')}"`,
      `"${t.assignee || 'Unassigned'}"`,
      t.due_date || '',
      t.done_ratio || 0,
    ]);
    downloadCSV(
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n'),
      `work_packages_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  // Export Projects to CSV
  const handleExportProjectsCSV = () => {
    if (!projects.length) return alert('Tidak ada data project untuk di-export.');
    const headers = ['Status', 'Nama Project', 'Identifier', 'Total Items', 'Closed', 'Close Rate %', 'Estimasi Jam', 'Jam Log'];
    const rows = projects.map((p) => [
      p.health_label,
      `"${p.name.replace(/"/g, '""')}"`,
      p.identifier,
      p.wp_count,
      p.closed_count,
      p.close_rate,
      p.estimated_hours,
      p.spent_hours,
    ]);
    downloadCSV(
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n'),
      `projects_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  // View User Detail Modal
  const handleViewUserDetail = async (id: number) => {
    setUserDetailLoading(true);
    setUserDetailModalOpen(true);
    try {
      const detail = await api.getUserDetail(id);
      setSelectedUserDetail(detail);
    } catch (e) {
      console.error('Failed to load user detail', e);
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Add User
  const handleAddUser = () => {
    setUserToEdit(null);
    setUserFormModalOpen(true);
  };

  // Edit User
  const handleEditUser = (user: UserItem) => {
    setUserToEdit(user);
    setUserFormModalOpen(true);
  };

  // Toggle User Status (Lock / Activate)
  const handleToggleUserStatus = async (user: UserItem) => {
    const isCurrentlyActive = user.status === 1;
    const actionLabel = isCurrentlyActive ? 'menonaktifkan (kunci)' : 'mengaktifkan kembali';
    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} akun pengguna "${user.name}"?`)) {
      return;
    }

    try {
      const newStatus = isCurrentlyActive ? 3 : 1;
      await api.updateUser(user.id, {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        admin: user.admin,
        status: newStatus,
      });
      loadTabData();
    } catch (err: any) {
      alert(`Gagal mengubah status: ${err.message || 'Terjadi kesalahan'}`);
    }
  };

  // Export Users to CSV
  const handleExportUsersCSV = () => {
    if (!users.length) return alert('Tidak ada data pengguna untuk di-export.');
    const headers = [
      'ID',
      'Username',
      'Nama Lengkap',
      'Email',
      'Peran',
      'Status',
      'Jumlah Project',
      'Daftar Project',
      'Open Tasks',
      'Closed Tasks',
      'Total Tasks',
      'Jam Log',
    ];
    const rows = users.map((u) => [
      u.id,
      `"${u.login.replace(/"/g, '""')}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email.replace(/"/g, '""')}"`,
      u.admin ? 'Administrator' : 'Anggota Tim',
      u.status_label,
      u.project_count,
      `"${(u.projects || []).join(', ').replace(/"/g, '""')}"`,
      u.open_tasks,
      u.closed_tasks,
      u.total_tasks,
      u.spent_hours,
    ]);
    downloadCSV(
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n'),
      `users_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  // Dashboard Users Management Handlers
  const handleAddDashboardUser = () => {
    setDashboardUserToEdit(null);
    setDashboardUserModalOpen(true);
  };

  const handleEditDashboardUser = (user: DashboardUser) => {
    setDashboardUserToEdit(user);
    setDashboardUserModalOpen(true);
  };

  const handleDeleteDashboardUser = async (user: DashboardUser) => {
    if (!confirm(`Hapus akun login dashboard "${user.username}"?`)) return;
    try {
      await api.deleteDashboardUser(user.id);
      loadTabData();
    } catch (e: any) {
      alert(`Gagal menghapus akun: ${e.message || 'Terjadi kesalahan'}`);
    }
  };

  // Auth checking loader
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--fg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm animate-pulse shadow-md">
            TOP
          </div>
          <div className="text-xs text-[var(--fg3)] font-medium">Memeriksa sesi login...</div>
        </div>
      </div>
    );
  }

  // If not logged in, render Login View
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--fg)]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setTaskPage(1);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => {
            setSelectedProjectId(id);
            setTaskPage(1);
          }}
          projectOptions={projectOptions}
          onRefresh={loadTabData}
          isLoading={loading}
          onOpenSidebar={() => setSidebarOpen(true)}
          lastUpdated={lastUpdated}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              kpi={kpi}
              statusDist={statusDist}
              typeDist={typeDist}
              monthlyVol={monthlyVol}
              recentWp={recentWp}
              releasePipeline={releasePipeline}
              onOpenTaskModal={handleOpenTaskModal}
              onSelectProject={(id) => {
                setSelectedProjectId(id.toString());
                setTaskPage(1);
              }}
              onNavigateToOverdue={() => {
                setActiveTab('tasks');
                setTaskOverdueFilter(true);
                setTaskStatusFilter('');
                setTaskPage(1);
              }}
              onNavigateToTasks={() => {
                setActiveTab('tasks');
                setTaskOverdueFilter(false);
                setTaskStatusFilter('');
                setTaskPage(1);
              }}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              searchTerm={projSearch}
              onSearchChange={setProjSearch}
              onExportCSV={handleExportProjectsCSV}
              onSelectProject={(id) => {
                setSelectedProjectId(id.toString());
                setActiveTab('overview');
              }}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              total={tasksTotal}
              page={taskPage}
              pages={taskPages}
              isOverdueFilter={taskOverdueFilter}
              statusFilter={taskStatusFilter}
              searchTerm={taskSearch}
              onPageChange={setTaskPage}
              onStatusFilterChange={setTaskStatusFilter}
              onOverdueFilterToggle={setTaskOverdueFilter}
              onSearchChange={(val) => {
                setTaskSearch(val);
                setTaskPage(1);
              }}
              onExportCSV={handleExportTasksCSV}
              onOpenTaskModal={handleOpenTaskModal}
            />
          )}

          {activeTab === 'milestones' && (
            <MilestonesView milestones={milestones} versions={versions} />
          )}

          {activeTab === 'workload' && (
            <WorkloadView workload={workload} timeTracking={timeTracking} />
          )}

          {activeTab === 'reports' && <ReportsView reports={reports} />}

          {activeTab === 'users' && (
            <UsersView
              users={users}
              summary={usersSummary}
              searchTerm={userSearch}
              onSearchChange={setUserSearch}
              statusFilter={userStatusFilter}
              onStatusFilterChange={setUserStatusFilter}
              roleFilter={userRoleFilter}
              onRoleFilterChange={setUserRoleFilter}
              onExportCSV={handleExportUsersCSV}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onViewDetail={handleViewUserDetail}
              onToggleStatus={handleToggleUserStatus}
              isLoading={loading}
              dashboardUsers={dashboardUsers}
              onAddDashboardUser={handleAddDashboardUser}
              onEditDashboardUser={handleEditDashboardUser}
              onDeleteDashboardUser={handleDeleteDashboardUser}
            />
          )}
        </main>
      </div>

      {/* Task Modal Popup */}
      <TaskModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        task={selectedTaskDetail}
        isLoading={detailLoading}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={userDetailModalOpen}
        onClose={() => setUserDetailModalOpen(false)}
        userDetail={selectedUserDetail}
        isLoading={userDetailLoading}
        onOpenTaskModal={(taskId) => {
          setUserDetailModalOpen(false);
          handleOpenTaskModal(taskId);
        }}
      />

      {/* User Add / Edit Modal (OpenProject) */}
      <UserFormModal
        isOpen={userFormModalOpen}
        onClose={() => setUserFormModalOpen(false)}
        userToEdit={userToEdit}
        onSaved={loadTabData}
      />

      {/* Dashboard User Modal (Akun Login Dashboard) */}
      <DashboardUserModal
        isOpen={dashboardUserModalOpen}
        onClose={() => setDashboardUserModalOpen(false)}
        userToEdit={dashboardUserToEdit}
        onSaved={loadTabData}
      />
    </div>
  );
}
