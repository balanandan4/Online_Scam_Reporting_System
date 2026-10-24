import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  PlusCircle,
  Search,
  Filter,
  Eye,
  FileText,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { api } from '../services/api';
import { ScamReport, UserDashboardStats, ReportStatus, ScamCategory } from '../types';
import { useAuth } from '../context/AuthContext';

interface UserDashboardProps {
  onOpenReportModal: () => void;
  onSelectReport: (reportId: number) => void;
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Reports', value: 'all' },
  { label: 'Submitted', value: 'Submitted' },
  { label: 'Under Review', value: 'Under Review' },
  { label: 'Action Required', value: 'Additional Information Required' },
  { label: 'Escalated', value: 'Escalated' },
  { label: 'Resolved', value: 'Resolved' },
  { label: 'Closed', value: 'Closed' },
];

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onOpenReportModal,
  onSelectReport,
}) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [stats, setStats] = useState<UserDashboardStats>({
    total: 0,
    underReview: 0,
    requiresInfo: 0,
    resolvedOrClosed: 0,
    totalLoss: 0,
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMyReports({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined,
      });
      setReports(res.reports);
      setStats(res.stats);
    } catch (err) {
      console.error('Fetch my reports error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getStatusBadgeClass = (status: ReportStatus) => {
    switch (status) {
      case 'Submitted':
        return 'text-slate-700 bg-slate-100 border-slate-300';
      case 'Under Review':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'Additional Information Required':
        return 'text-amber-800 bg-amber-50 border-amber-300 animate-pulse';
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
      
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Citizen Case Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-800">{user?.full_name}</span>. Track investigation status, manage evidence, and reply to officer requests.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchReports()}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenReportModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Complaint</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Reports */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Reports</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.total}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Logged by your account</span>
        </div>

        {/* Card 2: Under Review */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Triage / Review</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.underReview}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Active investigations</span>
        </div>

        {/* Card 3: Action Required */}
        <div className={`p-4 rounded-xl border shadow-xs ${stats.requiresInfo > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${stats.requiresInfo > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
              Action Required
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stats.requiresInfo > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${stats.requiresInfo > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
            {stats.requiresInfo}
          </div>
          <span className={`text-[10px] mt-0.5 block ${stats.requiresInfo > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>
            {stats.requiresInfo > 0 ? 'Officer waiting for your reply' : 'No pending queries'}
          </span>
        </div>

        {/* Card 4: Resolved / Closed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Resolved / Closed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stats.resolvedOrClosed}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Dispute & takedown completed</span>
        </div>

        {/* Card 5: Financial Loss */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Loss Tracked</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono tabular-nums">
            ${stats.totalLoss.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Estimated total disputed</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Interactive filter segmented buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === f.value
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference, title..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Reports Data View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
            Loading your registered cases...
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Reports Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
              {statusFilter !== 'all' || searchTerm
                ? 'No reports match your current filter parameters. Try clearing the filters.'
                : 'You have not submitted any scam complaints yet. Report an incident to begin tracking.'}
            </p>
            {statusFilter === 'all' && !searchTerm && (
              <button
                onClick={onOpenReportModal}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                File Your First Report
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Scam Incident Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Loss ($)</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => onSelectReport(report.id)}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {report.report_reference}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{report.title}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        Platform: {report.platform}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {report.category}
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
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(report.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReport(report.id);
                        }}
                        className="px-3 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Track Case</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
