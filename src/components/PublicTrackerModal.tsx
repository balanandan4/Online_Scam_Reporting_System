import React, { useState, useEffect } from 'react';
import { X, Search, ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { ScamReport, ReportStatus } from '../types';

interface PublicTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReference?: string;
  onOpenReportModal?: () => void;
}

export const PublicTrackerModal: React.FC<PublicTrackerModalProps> = ({
  isOpen,
  onClose,
  initialReference = '',
  onOpenReportModal,
}) => {
  const [referenceInput, setReferenceInput] = useState(initialReference);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    report: ScamReport;
    updates: { previous_status: ReportStatus; new_status: ReportStatus; user_message: string; timestamp: string }[];
  } | null>(null);

  useEffect(() => {
    if (initialReference) {
      setReferenceInput(initialReference);
      doSearch(initialReference);
    }
  }, [initialReference]);

  if (!isOpen) return null;

  async function doSearch(refCode: string) {
    if (!refCode.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.trackReportByReference(refCode.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Report reference not found in the public database.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(referenceInput);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Search className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">Track Official Scam Complaint</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                placeholder="Enter Reference ID (e.g. SCAM-2026-8K401)"
                className="w-full text-xs font-mono pl-3 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Searching...' : 'Track'}</span>
            </button>
          </form>
          <div className="text-[11px] text-slate-500 mt-2">
            Try demo codes: <button type="button" onClick={() => { setReferenceInput('SCAM-2026-8K401'); doSearch('SCAM-2026-8K401'); }} className="text-blue-600 hover:underline font-mono">SCAM-2026-8K401</button>, <button type="button" onClick={() => { setReferenceInput('SCAM-2026-9M102'); doSearch('SCAM-2026-9M102'); }} className="text-blue-600 hover:underline font-mono">SCAM-2026-9M102</button>, <button type="button" onClick={() => { setReferenceInput('SCAM-2026-1V550'); doSearch('SCAM-2026-1V550'); }} className="text-blue-600 hover:underline font-mono">SCAM-2026-1V550</button>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700">
                    {result.report.report_reference}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadgeClass(result.report.status)}`}>
                    {result.report.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{result.report.title}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Category</span>
                    <span className="font-medium">{result.report.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Incident Date</span>
                    <span className="font-mono">{result.report.incident_date}</span>
                  </div>
                </div>
              </div>

              {/* Progress Timeline */}
              <div>
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Verification History
                </h5>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {result.updates.map((upd, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadgeClass(upd.new_status)}`}>
                            {upd.new_status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(upd.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-[11px] mt-1">
                          {upd.user_message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!result && !error && !loading && (
            <div className="py-8 text-center text-xs text-slate-400">
              Enter your reference ID above to query real-time case status and investigation updates.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
