import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, ShieldAlert, DollarSign, Calendar, Globe, Trash2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { ScamCategory } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reportReference: string) => void;
  defaultCategory?: ScamCategory;
}

const CATEGORIES: ScamCategory[] = [
  'Phishing and fake websites',
  'UPI and digital payment scams',
  'Online shopping fraud',
  'Job and employment scams',
  'Investment and cryptocurrency scams',
  'Social media impersonation',
  'OTP and account takeover scams',
  'Fake customer support scams',
  'Loan and financial scams',
  'Other online scams',
];

const PLATFORMS = [
  'WhatsApp',
  'Telegram',
  'Instagram',
  'Facebook / Messenger',
  'Search Engine Ad (Google / Bing)',
  'SMS / Text Message',
  'Phone Call (Vishing)',
  'Email',
  'Online Marketplace (eBay, Craigslist, OLX)',
  'Dating App (Tinder, Bumble)',
  'Fake Web Portal',
  'Other Platform',
];

const PAYMENT_METHODS = [
  'UPI / Instant Wallet',
  'Cryptocurrency (Bitcoin, USDT, ETH)',
  'Credit / Debit Card',
  'Wire Transfer / NEFT / IMPS',
  'Gift Cards (Apple, Amazon, Google Play)',
  'Net Banking',
  'Cash on Delivery',
  'None / Attempted Fraud (No funds lost)',
  'Other Method',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ScamCategory>(defaultCategory || CATEGORIES[0]);
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [financialLoss, setFinancialLoss] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [suspectedScammer, setSuspectedScammer] = useState('');
  const [description, setDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      // Validate file size (5MB max) and total count (max 5)
      const validFiles: File[] = [];
      for (const file of selected) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`File "${file.name}" exceeds the 5MB limit.`);
          return;
        }
        validFiles.push(file);
      }
      setFiles((prev) => [...prev, ...validFiles].slice(0, 5));
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError('Please provide a descriptive title (at least 5 characters).');
      return;
    }

    if (description.trim().length < 20) {
      setError('Please provide a detailed description of what happened (at least 20 characters).');
      return;
    }

    if (!accuracyConfirmed) {
      setError('You must confirm that the provided information is accurate to the best of your knowledge.');
      return;
    }

    const lossVal = parseFloat(financialLoss);
    if (isNaN(lossVal) || lossVal < 0) {
      setError('Please enter a valid non-negative financial loss amount.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('incident_date', incidentDate);
      formData.append('platform', platform);
      formData.append('financial_loss', lossVal.toString());
      formData.append('payment_method', paymentMethod);
      if (suspectedScammer.trim()) {
        formData.append('suspected_scammer', suspectedScammer.trim());
      }
      formData.append('description', description.trim());
      if (additionalInfo.trim()) {
        formData.append('additional_info', additionalInfo.trim());
      }
      formData.append('accuracy_confirmed', 'true');

      // Append files
      files.forEach((file) => {
        formData.append('evidence', file);
      });

      const res = await api.submitReport(formData);
      setSubmittedRef(res.report.report_reference);
      onSuccess(res.report.report_reference);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please check required fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setTitle('');
    setDescription('');
    setFinancialLoss('0');
    setSuspectedScammer('');
    setAdditionalInfo('');
    setFiles([]);
    setAccuracyConfirmed(false);
    setSubmittedRef(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-base font-bold leading-tight">File Official Scam Incident Report</h3>
              <p className="text-[11px] text-slate-400">All submissions are assigned a non-sequential reference ID for tracking</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {submittedRef ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Scam Complaint Successfully Logged</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your report has been secured in the persistent registry and assigned to the investigation triage queue.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-w-sm mx-auto">
                <div className="text-[11px] text-slate-500 font-medium">Your Report Reference ID:</div>
                <div className="text-xl font-mono font-bold text-blue-600 mt-1 select-all">
                  {submittedRef}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Save this reference code to track progress publicly or from your dashboard.
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Classification */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>1. Incident Classification</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Scam Title / Brief Summary *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Fake Job Offer requesting upfront equipment deposit"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Scam Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ScamCategory)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Platform Where Scam Occurred *
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      {PLATFORMS.map((plat) => (
                        <option key={plat} value={plat}>
                          {plat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Date of Incident *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="date"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Financial Details & Scammer Details */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>2. Financial Loss & Scammer Profile</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Approximate Financial Loss ($ USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={financialLoss}
                        onChange={(e) => setFinancialLoss(e.target.value)}
                        placeholder="0.00"
                        className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Enter 0 if no funds were debited</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Payment Channel / Method Used
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Suspected Scammer Identifier
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={suspectedScammer}
                        onChange={(e) => setSuspectedScammer(e.target.value)}
                        placeholder="Phone number, email address, website URL, or social media @handle"
                        className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Do not enter sensitive data such as your own passwords, OTPs, or credit card CVV.
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Narrative */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>3. Detailed Description of Incident *</span>
                </h4>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain chronological sequence: how the scammer first contacted you, what claims or offers were made, what payment instructions were given, and when you discovered it was fraudulent..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed"
                />
                <span className="text-[10px] text-slate-400">Minimum 20 characters required.</span>
              </div>

              {/* Section 4: Evidence Upload */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>4. Digital Evidence & Documentation</span>
                  <span className="text-[10px] text-slate-500 normal-case font-normal">Max 5 files, 5MB each (JPEG, PNG, WEBP, PDF)</span>
                </h4>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-500">
                    <span>Click to browse files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Screenshots of chat logs, payment receipts, bogus emails, or SMS alerts.
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-700 font-medium">{file.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accuracy Confirmation Checkbox */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={accuracyConfirmed}
                    onChange={(e) => setAccuracyConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 leading-normal">
                    I confirm that the information and evidence provided in this report are accurate and truthful to the best of my knowledge, and understand this platform assists in cataloging and reviewing cyber fraud complaints.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {loading ? 'Submitting & Encrypting...' : 'Submit Scam Report'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
