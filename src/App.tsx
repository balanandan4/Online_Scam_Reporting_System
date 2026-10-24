import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ReportModal } from './components/ReportModal';
import { ReportDetailModal } from './components/ReportDetailModal';
import { PublicTrackerModal } from './components/PublicTrackerModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ScamCategory } from './types';

function MainApp() {
  const { user, isAuthenticated, isAdmin } = useAuth();

  // Current view: 'home' | 'dashboard' | 'admin'
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'admin'>('home');

  // Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalCategory, setReportModalCategory] = useState<ScamCategory | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [trackerReference, setTrackerReference] = useState<string | undefined>(undefined);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  // Handlers
  const handleOpenReportModal = (category?: ScamCategory) => {
    if (!isAuthenticated) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setReportModalCategory(category);
    setIsReportModalOpen(true);
  };

  const handleOpenAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleOpenTrackerModal = (ref?: string) => {
    setTrackerReference(ref);
    setIsTrackerModalOpen(true);
  };

  const handleSelectReport = (id: number) => {
    setSelectedReportId(id);
  };

  const handleReportSubmitted = (newRef: string) => {
    // When a new report is submitted, stay on modal until citizen closes it
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Navbar with 3-Zone contract */}
      <Navbar
        onOpenReportModal={() => handleOpenReportModal()}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenTrackerModal={handleOpenTrackerModal}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'admin' && !isAdmin) {
            handleOpenAuthModal('login');
            return;
          }
          if (view === 'dashboard' && !isAuthenticated) {
            handleOpenAuthModal('login');
            return;
          }
          setCurrentView(view);
        }}
        onSelectReportId={handleSelectReport}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <LandingPage
            onOpenReportModal={handleOpenReportModal}
            onOpenTrackerModal={handleOpenTrackerModal}
            onOpenAuthModal={handleOpenAuthModal}
          />
        )}

        {currentView === 'dashboard' && isAuthenticated && (
          <UserDashboard
            onOpenReportModal={() => handleOpenReportModal()}
            onSelectReport={handleSelectReport}
          />
        )}

        {currentView === 'admin' && isAuthenticated && isAdmin && (
          <AdminDashboard />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        onSuccess={() => {
          if (user?.role === 'admin') {
            setCurrentView('admin');
          } else {
            setCurrentView('dashboard');
          }
        }}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={handleReportSubmitted}
        defaultCategory={reportModalCategory}
      />

      <ReportDetailModal
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
        onRefreshParent={() => {
          // Trigger refresh if needed
        }}
      />

      <PublicTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        initialReference={trackerReference}
        onOpenReportModal={() => {
          setIsTrackerModalOpen(false);
          handleOpenReportModal();
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
