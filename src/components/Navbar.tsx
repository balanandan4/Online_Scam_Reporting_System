import React, { useState, useEffect, useRef } from 'react';
import { Shield, ShieldAlert, Bell, User as UserIcon, LogOut, CheckCircle2, Search, PlusCircle, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';

interface NavbarProps {
  onOpenReportModal: () => void;
  onOpenAuthModal: (initialTab?: 'login' | 'register') => void;
  onOpenTrackerModal: (ref?: string) => void;
  onOpenProfileModal: () => void;
  currentView: 'home' | 'dashboard' | 'admin';
  setCurrentView: (view: 'home' | 'dashboard' | 'admin') => void;
  onSelectReportId?: (id: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenReportModal,
  onOpenAuthModal,
  onOpenTrackerModal,
  onOpenProfileModal,
  currentView,
  setCurrentView,
  onSelectReportId,
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [quickTrackId, setQuickTrackId] = useState<string>('');
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Poll notifications when user is logged in
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifs = async () => {
      try {
        const res = await api.getNotifications();
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      } catch {
        // ignore
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!notif.is_read) {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setIsNotifOpen(false);
      if (onSelectReportId) {
        onSelectReportId(notif.report_id);
      }
    } catch {
      // ignore
    }
  };

  const handleQuickTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackId.trim()) {
      onOpenTrackerModal(quickTrackId.trim());
      setQuickTrackId('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          
          {/* Zone 1: Wordmark Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg p-1"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-white block leading-tight">
                  CyberShield
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide block uppercase">
                  Online Scam Reporting System
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Single-line, unboxed, whitespace-nowrap) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => setCurrentView('home')}
              className={`hover:text-white transition-colors whitespace-nowrap ${currentView === 'home' ? 'text-blue-400 font-semibold' : ''}`}
            >
              Public Portal
            </button>
            <a
              href="#categories"
              onClick={(e) => {
                if (currentView !== 'home') {
                  setCurrentView('home');
                }
              }}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              Scam Categories
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                if (currentView !== 'home') {
                  setCurrentView('home');
                }
              }}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              How It Works
            </a>
            <a
              href="#cyber-tips"
              onClick={(e) => {
                if (currentView !== 'home') {
                  setCurrentView('home');
                }
              }}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              Security Tips
            </a>
            <button
              onClick={() => onOpenTrackerModal()}
              className="hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 text-slate-300"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Complaint</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Session Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Track Input on desktop if on home */}
            <form onSubmit={handleQuickTrackSubmit} className="hidden lg:flex items-center relative">
              <input
                type="text"
                placeholder="SCAM-2026-..."
                value={quickTrackId}
                onChange={(e) => setQuickTrackId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 font-mono placeholder:text-slate-500"
              />
              <button
                type="submit"
                title="Search reference code"
                className="absolute right-1 text-slate-400 hover:text-white p-1 rounded"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Notification Bell (Authenticated Users) */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  aria-label="Notifications"
                  className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">Case Updates</span>
                        {unreadCount > 0 && (
                          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs text-slate-400">
                          No notifications yet. You will receive real-time updates when an officer reviews your report.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                              notif.is_read ? 'opacity-70' : 'bg-blue-50/40'
                            }`}
                          >
                            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-600" style={{ opacity: notif.is_read ? 0 : 1 }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-semibold text-slate-900 truncate">
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                                  {notif.report_reference}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                {new Date(notif.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If Not Authenticated: Sign In & Primary Report CTA */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenReportModal}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Report a Scam</span>
                </button>
              </div>
            ) : (
              /* Authenticated User Menu */
              <div className="flex items-center gap-2.5" ref={userMenuRef}>
                {/* Primary CTA */}
                {!isAdmin ? (
                  <button
                    onClick={onOpenReportModal}
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-sm whitespace-nowrap"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>File Report</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/80 rounded-lg hover:bg-amber-900/60 transition-colors whitespace-nowrap"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </button>
                )}

                {/* Account Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-blue-300 border border-slate-600">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden sm:inline text-xs font-medium text-slate-200 max-w-[120px] truncate">
                      {user?.full_name}
                    </span>
                  </button>

                  {/* Account Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <div className="text-xs font-semibold text-slate-900 truncate">{user?.full_name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase">
                          Role: <span className="font-semibold text-slate-700">{user?.role}</span>
                        </div>
                      </div>

                      <div className="py-1">
                        {isAdmin ? (
                          <button
                            onClick={() => {
                              setCurrentView('admin');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            <span>Administrator Console</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setCurrentView('dashboard');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                            <span>My Reports Dashboard</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onOpenProfileModal();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Profile & Password</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setCurrentView('home');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
