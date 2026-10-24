import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, AlertTriangle, FileText, Send, Upload, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { ScamReport, Evidence, ReportUpdate, ReportStatus } from '../types';

interface ReportDetailModalProps {
  reportId: number | null;
  onClose: () => void;
  onRefreshParent?: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  reportId,
  onClose,
  onRefreshParent,
}) => {
  const [data, setData] = useState<{
    report: ScamReport;
    evidence: Evidence[];
    updates: ReportUpdate[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Response for Additional Info Required
  const [responseNotes, setResponseNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submittingInfo, setSubmittingInfo] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setData(null);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getMyReportDetail(reportId);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load report details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [reportId]);

  if (!reportId) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleProvideInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseNotes.trim()) return;

    setSubmittingInfo(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('response_notes', responseNotes.trim());
      files.forEach((f) => formData.append('evidence', f));

      await api.provideAdditionalInfo(reportId, formData);
      setResponseSuccess('Your information was submitted. Report moved to "Under Review".');
      setResponseNotes('');
      setFiles([]);

      // Refresh data
      const res = await api.getMyReportDetail(reportId);
      setData(res);
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setError(err.message || 'Failed to submit additional information.');
    } finally {
      setSubmittingInfo(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-blue-300">
                  {data?.report.report_reference || 'Loading...'}
                </span>
                {data && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadgeClass(data.report.status)}`}>
                    {data.report.status}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white truncate max-w-md">
                {data?.report.title || 'Report Details'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-12 text-center text-slate-500 text-xs">
              Loading report details and timeline history...
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {data && (
            <>
              {/* Report Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Category</span>
                  <span className="font-semibold text-slate-800 line-clamp-1">{data.report.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Incident Date</span>
                  <span className="font-semibold text-slate-800 font-mono">{data.report.incident_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Reported Loss</span>
                  <span className="font-semibold text-red-600 font-mono tabular-nums">
                    ${data.report.financial_loss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Platform</span>
                  <span className="font-semibold text-slate-800">{data.report.platform}</span>
                </div>
              </div>

              {/* Suspect Info & Payment Method */}
              {(data.report.suspected_scammer || data.report.payment_method) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
                  {data.report.suspected_scammer && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Suspected Scammer Identifier</span>
                      <span className="font-mono text-slate-800 break-all">{data.report.suspected_scammer}</span>
                    </div>
                  )}
                  {data.report.payment_method && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block">Payment Channel</span>
                      <span className="text-slate-800">{data.report.payment_method}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Incident Narrative */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Incident Narrative
                </h4>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {data.report.description}
                </div>
              </div>

              {/* Uploaded Evidence Section */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Attached Evidence ({data.evidence.length})</span>
                </h4>
                {data.evidence.length === 0 ? (
                  <div className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                    No files or attachments were provided during initial submission.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.evidence.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="truncate">
                            <span className="font-medium text-slate-800 block truncate">{file.original_filename}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {(file.file_size / 1024).toFixed(0)} KB · {file.file_type}
                            </span>
                          </div>
                        </div>
                        <a
                          href={`/api/evidence/${file.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium text-[11px] shrink-0"
                        >
                          <Download className="w-3 h-3" />
                          <span>View</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visual Status Progression Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Verification & Investigation Timeline
                </h4>
                
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {data.updates.map((update, idx) => (
                    <div key={update.id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadgeClass(update.new_status)}`}>
                              {update.new_status}
                            </span>
                            <span className="text-slate-400 text-[11px]">by {update.updated_by_name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(update.timestamp).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {update.user_message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Required: Provide Additional Information */}
              {data.report.status === 'Additional Information Required' && (
                <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Action Required: Provide Requested Details</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    The investigating officer has requested additional clarification or evidence before proceeding. Please reply below:
                  </p>

                  {responseSuccess && (
                    <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium">
                      {responseSuccess}
                    </div>
                  )}

                  <form onSubmit={handleProvideInfoSubmit} className="space-y-3">
                    <textarea
                      required
                      rows={3}
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      placeholder="Enter requested transaction ID, wallet address, email headers, or clarification..."
                      className="w-full text-xs p-3 bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />

                    <div>
                      <label className="block text-[11px] font-medium text-amber-900 mb-1">
                        Attach Additional Evidence Files (Optional)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        onChange={handleFileChange}
                        className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-200 file:text-amber-900 hover:file:bg-amber-300"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingInfo}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-60 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submittingInfo ? 'Sending Response...' : 'Submit Requested Details'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
