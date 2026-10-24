export type UserRole = 'user' | 'admin';

export type ScamCategory =
  | 'Phishing and fake websites'
  | 'UPI and digital payment scams'
  | 'Online shopping fraud'
  | 'Job and employment scams'
  | 'Investment and cryptocurrency scams'
  | 'Social media impersonation'
  | 'OTP and account takeover scams'
  | 'Fake customer support scams'
  | 'Loan and financial scams'
  | 'Other online scams';

export type ReportStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Additional Information Required'
  | 'Escalated'
  | 'Resolved'
  | 'Closed';

export type ReportPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Evidence {
  id: number;
  report_id: number;
  stored_filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  upload_timestamp: string;
}

export interface ReportUpdate {
  id: number;
  report_id: number;
  previous_status: ReportStatus | null;
  new_status: ReportStatus;
  user_message: string;
  internal_note?: string | null;
  updated_by_user_id?: number;
  updated_by_name: string;
  timestamp: string;
}

export interface ScamReport {
  id: number;
  report_reference: string;
  user_id?: number;
  title: string;
  category: ScamCategory;
  description: string;
  incident_date: string;
  financial_loss: number;
  payment_method?: string | null;
  suspected_scammer?: string | null;
  platform: string;
  status: ReportStatus;
  priority: ReportPriority;
  accuracy_confirmed?: number;
  created_at: string;
  updated_at: string;
  evidence_count?: number;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
}

export interface NotificationItem {
  id: number;
  report_id: number;
  report_reference: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  details: string;
  report_id?: number | null;
  report_reference?: string;
  report_title?: string;
  timestamp: string;
}

export interface UserDashboardStats {
  total: number;
  underReview: number;
  requiresInfo: number;
  resolvedOrClosed: number;
  totalLoss: number;
}

export interface AdminDashboardStats {
  summary: {
    totalReports: number;
    newlySubmitted: number;
    underReview: number;
    highPriority: number;
    resolved: number;
    totalLoss: number;
    registeredUsers: number;
  };
  categoryStats: { category: string; count: number; total_loss: number }[];
  statusStats: { status: string; count: number }[];
  priorityStats: { priority: string; count: number }[];
  timelineStats: { report_date: string; count: number; total_loss: number }[];
}
