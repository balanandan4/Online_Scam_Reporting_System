import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  Users,
  Search,
  Filter,
  Eye,
  FileText,
  BarChart3,
  ListFilter,
  History,
  Download,
  Send,
  X,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api';
import {
  ScamReport,
  Evidence,
  ReportUpdate,
  AuditLogItem,
  AdminDashboardStats,
  ReportStatus,
  ReportPriority,
  ScamCategory,
} from '../types';

const STATUS_LIST: ReportStatus[] = [
  'Submitted',
  'Under Review',
  'Additional Information Required',
  'Escalated',
  'Resolved',
  'Closed',
];

const PRIORITY_LIST: ReportPriority[] = ['Low', 'Medium', 'High', 'Critical'];

const PIE_COLORS = ['#3B82F6', '#6366F1', '#F59E0B', '#A855F7', '#10B981', '#64748B'];

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'analytics' | 'audit'>('queue');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Reports Queue State
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review Modal State
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<{
    report: ScamReport;
    evidence: Evidence[];
    updates: ReportUpdate[];
    auditLogs: AuditLogItem[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Update Status Form inside modal
  const [newStatus, setNewStatus] = useState<ReportStatus>('Under Review');
  const [newPriority, setNewPriority] = useState<ReportPriority>('Medium');
  const [userMessage, setUserMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  // 1. Fetch Stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // 2. Fetch Reports Queue
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await api.getAdminReports({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: search.trim() || undefined,
        page,
        limit: 10,
      });
      setReports(res.reports);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch reports queue:', err);
    } finally {
      setReportsLoading(false);
    }
  }, [statusFilter, priorityFilter, search, page]);

  // 3. Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await api.getAdminAuditLogs({
        search: auditSearch.trim() || undefined,
        limit: 25,
      });
      setAuditLogs(res.logs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  }, [auditSearch]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchReports();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchReports, fetchAuditLogs]);

  // Open Report Review Modal
  const handleOpenReview = async (id: number) => {
    setSelectedReportId(id);
    setDetailLoading(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.getAdminReportDetail(id);
      setDetailData(res);
      setNewStatus(res.report.status);
      setNewPriority(res.report.priority);
      setUserMessage('');
      setInternalNote('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to load case details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Submit Status Update
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId) return;

    setSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.updateReportStatus(selectedReportId, {
        status: newStatus,
        priority: newPriority,
        user_message: userMessage.trim() || undefined,
        internal_note: internalNote.trim() || undefined,
      });

      setActionSuccess(`Case successfully updated to "${newStatus}". Citizen has been notified.`);
      setUserMessage('');
      setInternalNote('');

      // Refresh detail and queue
      const updated = await api.getAdminReportDetail(selectedReportId);
      setDetailData(updated);
      fetchReports();
      fetchStats();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update case.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getPriorityBadgeClass = (priority: ReportPriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300 font-semibold';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status: ReportStatus) => {
    switch (status) {
      case 'Submitted':
        return 'text-slate-700 bg-slate-100 border-slate-300';
      case 'Under Review':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'Additional Information Required':
        return 'text-amber-800 bg-amber-50 border-amber-300';
      case 'Escalated':
        return 'text-purple-800 bg-purple-50 border-purple-200';
      case 'Resolved':
        return 'text-emerald-800 bg-emerald-50 border-emerald-300';
      case 'Closed':
        return 'text-slate-600 bg-slate-100 border-slate-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Administrator Oversight Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming scam complaints, assign priority levels, inspect evidence, issue victim updates, and record internal investigative notes.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'queue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Case Queue</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics & Trends</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Reports</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">{stats.summary.totalReports}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block">New Submissions</span>
            <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums mt-1">{stats.summary.newlySubmitted}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block">Under Review</span>
            <div className="text-2xl font-bold text-indigo-700 font-mono tabular-nums mt-1">{stats.summary.underReview}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider block">High / Critical</span>
            <div className="text-2xl font-bold text-red-600 font-mono tabular-nums mt-1">{stats.summary.highPriority}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">Resolved Cases</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">{stats.summary.resolved}</div>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Reported Loss</span>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1 truncate">
              ${stats.summary.totalLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: CASE QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-medium text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Priority filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-medium text-slate-500">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  {PRIORITY_LIST.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  fetchReports();
                  fetchStats();
                }}
                className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                title="Refresh queue"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search ref ID, reporter, scammer..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {reportsLoading ? (
              <div className="py-16 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                Loading case queue...
              </div>
            ) : reports.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                No reports matched the specified filters or search term.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Title & Platform</th>
                      <th className="py-3 px-4">Reporter</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Loss ($)</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {reports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleOpenReview(report.id)}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {report.report_reference}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-slate-900 truncate">{report.title}</div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {report.category} · {report.platform}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{report.reporter_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{report.reporter_email}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityBadgeClass(report.priority)}`}>
                            {report.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadgeClass(report.status)}`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                          {report.financial_loss > 0 ? (
                            <span className="text-red-600">
                              ${report.financial_loss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-400">$0.00</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(report.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReview(report.id);
                            }}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Reports by Scam Category */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Reports by Scam Category</span>
                <span className="text-[10px] text-slate-400 font-normal">Real SQLite Records</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryStats} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="category"
                      type="category"
                      tick={{ fontSize: 10 }}
                      width={140}
                      tickFormatter={(val) => (val.length > 20 ? `${val.substring(0, 18)}...` : val)}
                    />
                    <Tooltip
                      formatter={(value: any) => [`${value} complaints`, 'Total']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#CBD5E1' }}
                    />
                    <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Status Distribution */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Complaint Status Breakdown</span>
                <span className="text-[10px] text-slate-400 font-normal">Active Pipeline</span>
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusStats}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {stats.statusStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#CBD5E1' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2 text-[11px] text-slate-600">
                {stats.statusStats.map((s, idx) => (
                  <div key={s.status} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span>{s.status} ({s.count})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Submission Timeline */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Recent Ingestion & Incident Volume Over Time</span>
                <span className="text-[10px] text-slate-400 font-normal">Daily Count</span>
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.timelineStats} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="report_date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#CBD5E1' }} />
                    <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="text-xs text-slate-600 font-medium">
              Permanent chronological audit log of all case triage and status modifications.
            </div>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Filter by admin or action..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {auditLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading audit records...</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">No audit logs found.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Investigator / Admin</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Case Reference</th>
                    <th className="py-3 px-4">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {log.admin_name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                        {log.report_reference || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Case Review Drawer / Modal */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-blue-300">
                      {detailData?.report.report_reference || 'Loading...'}
                    </span>
                    {detailData && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadgeClass(detailData.report.status)}`}>
                        {detailData.report.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white truncate max-w-lg">
                    {detailData?.report.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedReportId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading case records and timeline...</div>
              ) : detailData ? (
                <>
                  {/* Reporter & Case Profile Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Reporting Citizen</span>
                      <span className="font-semibold text-slate-900 block">{detailData.report.reporter_name}</span>
                      <span className="text-[11px] text-slate-500 font-mono block">{detailData.report.reporter_email}</span>
                      {detailData.report.reporter_phone && (
                        <span className="text-[11px] text-slate-500 font-mono block">{detailData.report.reporter_phone}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Scam Classification</span>
                      <span className="font-semibold text-slate-900 block">{detailData.report.category}</span>
                      <span className="text-[11px] text-slate-500 block">Platform: {detailData.report.platform}</span>
                      <span className="text-[11px] text-slate-500 block">Incident: {detailData.report.incident_date}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Financial Disputed Loss</span>
                      <span className="font-mono text-base font-bold text-red-600 block tabular-nums">
                        ${detailData.report.financial_loss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-slate-500 block">Channel: {detailData.report.payment_method || 'None'}</span>
                    </div>
                  </div>

                  {/* Suspected Scammer Contact */}
                  {detailData.report.suspected_scammer && (
                    <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl text-xs">
                      <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block mb-1">
                        Suspected Perpetrator Coordinates / Lead
                      </span>
                      <span className="font-mono text-red-900 select-all font-semibold">
                        {detailData.report.suspected_scammer}
                      </span>
                    </div>
                  )}

                  {/* Narrative */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Full Incident Narrative
                    </h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {detailData.report.description}
                    </div>
                  </div>

                  {/* Attached Evidence */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Attached Digital Evidence ({detailData.evidence.length})
                    </h4>
                    {detailData.evidence.length === 0 ? (
                      <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                        No files uploaded.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {detailData.evidence.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <div className="truncate">
                                <span className="font-medium text-slate-900 truncate block">{f.original_filename}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {(f.file_size / 1024).toFixed(0)} KB · {f.file_type}
                                </span>
                              </div>
                            </div>
                            <a
                              href={`/api/evidence/${f.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-slate-700 text-[11px] font-semibold flex items-center gap-1 shrink-0"
                            >
                              <Download className="w-3 h-3" />
                              <span>Inspect</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Administrative Action Section (Status, Priority, User Message, Internal Notes) */}
                  <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-blue-700" />
                      <span>Administrative Case Decision & Action</span>
                    </h4>

                    {actionSuccess && (
                      <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium">
                        {actionSuccess}
                      </div>
                    )}

                    {actionError && (
                      <div className="p-3 bg-red-100 text-red-800 rounded-lg text-xs font-medium">
                        {actionError}
                      </div>
                    )}

                    <form onSubmit={handleStatusSubmit} className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            New Complaint Status *
                          </label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          >
                            {STATUS_LIST.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Investigation Priority *
                          </label>
                          <select
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value as ReportPriority)}
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          >
                            {PRIORITY_LIST.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          User-Visible Status Update Message (Citizen receives notification) *
                        </label>
                        <textarea
                          rows={2}
                          value={userMessage}
                          onChange={(e) => setUserMessage(e.target.value)}
                          placeholder="e.g. Case assigned to senior investigator. Subpoena sent to payment gateway provider..."
                          className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Internal Administrator Notes (CONFIDENTIAL - Visible only to admin team & audit log)
                        </label>
                        <textarea
                          rows={2}
                          value={internalNote}
                          onChange={(e) => setInternalNote(e.target.value)}
                          placeholder="e.g. Bank mule cluster #401; coordinated with CERT-In ticket #89912..."
                          className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={submittingAction}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{submittingAction ? 'Processing Action...' : 'Commit Status & Notify Citizen'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Previous Case Updates History */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Investigation History & Internal Audit Notes
                    </h4>
                    <div className="space-y-2.5">
                      {detailData.updates.map((u, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold px-2 py-0.5 rounded border ${getStatusBadgeClass(u.new_status)}`}>
                                {u.new_status}
                              </span>
                              <span className="text-slate-500">by {u.updated_by_name}</span>
                            </div>
                            <span className="font-mono text-slate-400">
                              {new Date(u.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-700 text-xs mt-1">
                            <span className="font-medium text-slate-500">Public: </span>
                            {u.user_message}
                          </p>
                          {u.internal_note && (
                            <p className="text-amber-800 text-[11px] font-mono bg-amber-50/70 p-1.5 rounded border border-amber-200/80">
                              <span className="font-bold">Confidential Note: </span>
                              {u.internal_note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedReportId(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Case Review
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
