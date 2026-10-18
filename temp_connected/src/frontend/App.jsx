import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AINetworkingAssistant from './components/AINetworkingAssistant';
import AuthModal from './components/AuthModal';
import ProfileEditModal from './components/ProfileEditModal';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AlumniDiscoveryPage from './pages/AlumniDiscoveryPage';
import CareerGoalPage from './pages/CareerGoalPage';
import CareerRoadmapPage from './pages/CareerRoadmapPage';
import MentorMatchingPage from './pages/MentorMatchingPage';
import ProfileEditPage from './pages/ProfileEditPage';
import AlumniPortalDashboard from './pages/AlumniPortalDashboard';
import AdminControlCenter from './pages/AdminControlCenter';
import AlumniMessagingCenter from './pages/AlumniMessagingCenter';
import InstitutePortalPage from './pages/InstitutePortalPage';
import EnterprisePitchSlide from './components/EnterprisePitchSlide';
import LiveJobsRadarPage from './pages/LiveJobsRadarPage';
import ConnectEdProModal from './components/ConnectEdProModal';
import ResumeRAGModal from './components/ResumeRAGModal';
import ResumeUploadModal from './components/ResumeUploadModal';
import { userApi, authApi } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Theme state ('dark' or 'light')
  const [theme, setTheme] = useState(() => localStorage.getItem('connected_theme') || 'dark');

  // Auth Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  // Profile Edit Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // ConnectEd Pro Modal state
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Resume RAG Chatbot Modal state
  const [isRAGModalOpen, setIsRAGModalOpen] = useState(false);

  // Resume Upload Modal state
  const [isResumeUploadModalOpen, setIsResumeUploadModalOpen] = useState(false);

  // Full-page Alumni Messaging state
  const [activeMessagingAlumni, setActiveMessagingAlumni] = useState(null);
  const [activeMessagingNote, setActiveMessagingNote] = useState('');

  // Live Notifications state
  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'Welcome to ConnectEd', message: 'Explore verified alumni mentors and launch your 100-day placement roadmap.', time: 'Just now', read: false },
    { id: 'n2', title: 'Mentorship Network Active', message: '12 alumni mentors are currently available for 1-on-1 technical guidance.', time: '15m ago', read: false }
  ]);

  const handleAddNotification = (notif) => {
    const newNotif = {
      id: 'notif_' + Date.now(),
      title: notif.title || 'Notification',
      message: notif.message,
      time: 'Just now',
      read: false,
      alumni: notif.alumni
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleStartChatWithAlumni = (alumni, initialMsg = '') => {
    setActiveMessagingAlumni(alumni);
    setActiveMessagingNote(initialMsg);
    setActiveTab('messages');
  };

  const handleSelectNotification = (notif) => {
    if (notif.alumni) {
      handleStartChatWithAlumni(notif.alumni, '');
    } else {
      setActiveTab('messages');
    }
  };

  useEffect(() => {
    async function initSession() {
      const session = await authApi.getSession();
      setIsAuthenticated(session.isAuthenticated);
      if (session.user) {
        setActiveUser(session.user);
      }
    }
    initSession();

    // Global tactile keyboard shortcuts (Orbit & Apple style)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsAIAssistantOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('connected_theme', nextTheme);
  };

  const handleToggleAIAssistant = () => {
    setIsAIAssistantOpen(prev => !prev);
  };

  const handleOpenAuth = (tabName = 'login') => {
    setAuthModalTab(tabName);
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await authApi.logout();
    setIsAuthenticated(false);
    setActiveUser(null);
  };

  const handleAuthSuccess = async (user) => {
    setIsAuthenticated(true);
    setActiveUser(user);
    setIsAuthModalOpen(false);
  };

  const handleQuickDemo = async () => {
    const res = await authApi.login({ demoKey: 'alex' });
    if (res.success) {
      setIsAuthenticated(true);
      setActiveUser(res.user);
    }
  };

  const handleProfileUpdated = (updatedUser) => {
    setActiveUser(updatedUser);
  };

  // Mobile Menu Drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={`${theme} h-screen w-screen overflow-hidden bg-[#FBF9F5] dark:bg-[#111215] text-[#111111] dark:text-[#F7F7F9] flex flex-col selection:bg-[#E2F952] selection:text-black transition-colors duration-200`}>
      {/* Top Header */}
      <Navbar 
        onToggleAIAssistant={handleToggleAIAssistant}
        activeUser={activeUser}
        isAuthenticated={isAuthenticated}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenEditProfile={() => setActiveTab('profile')}
        onOpenProModal={() => setIsProModalOpen(true)}
        onOpenRAGModal={() => setIsRAGModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        notifications={notifications}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onSelectNotification={handleSelectNotification}
      />

      {/* Main Content Area */}
      {!isAuthenticated ? (
        <main className="flex-1 overflow-y-auto bg-[#FBF9F5] dark:bg-[#111215]">
          <LandingPage 
            onOpenAuth={handleOpenAuth}
            onQuickDemo={handleQuickDemo}
          />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden relative bg-[#FBF9F5] dark:bg-[#111215]">
          {/* Left Sidebar */}
          <Sidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenAI={() => setIsAIAssistantOpen(true)}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            activeUser={activeUser}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-8 bg-slate-100 dark:bg-[#0d131f]">
            {activeTab === 'dashboard' && (
              activeUser?.role === 'alumni' ? (
                <AlumniPortalDashboard 
                  user={activeUser}
                  onOpenAI={() => setIsAIAssistantOpen(true)}
                />
              ) : activeUser?.role === 'admin' ? (
                <AdminControlCenter 
                  user={activeUser}
                  onOpenAI={() => setIsAIAssistantOpen(true)}
                />
              ) : (
                <DashboardPage 
                  user={activeUser}
                  setActiveTab={setActiveTab} 
                  onOpenAI={() => setIsAIAssistantOpen(true)}
                  onOpenEditProfile={() => setActiveTab('profile')}
                  onOpenResumeUpload={() => setIsResumeUploadModalOpen(true)}
                  onOpenRAG={() => setIsRAGModalOpen(true)}
                  onOpenPro={() => setIsProModalOpen(true)}
                />
              )
            )}

            {activeTab === 'jobs' && (
              <LiveJobsRadarPage 
                user={activeUser}
                onOpenAI={() => setIsAIAssistantOpen(true)}
              />
            )}

            {activeTab === 'institute' && (
              <InstitutePortalPage 
                user={activeUser}
                onOpenAI={() => setIsAIAssistantOpen(true)}
              />
            )}

            {activeTab === 'alumni' && (
              <AlumniDiscoveryPage 
                user={activeUser}
                onOpenAI={() => setIsAIAssistantOpen(true)}
                setActiveTab={setActiveTab}
                onStartChatWithAlumni={handleStartChatWithAlumni}
                onAddNotification={handleAddNotification}
              />
            )}

            {activeTab === 'goal' && (
              <CareerGoalPage 
                user={activeUser}
                setActiveTab={setActiveTab}
                onOpenAI={() => setIsAIAssistantOpen(true)}
              />
            )}

            {activeTab === 'roadmap' && (
              <CareerRoadmapPage 
                user={activeUser}
                setActiveTab={setActiveTab}
                onOpenAI={() => setIsAIAssistantOpen(true)}
              />
            )}

            {activeTab === 'mentors' && (
              <MentorMatchingPage 
                user={activeUser}
                onOpenAI={() => setIsAIAssistantOpen(true)}
                onStartChatWithAlumni={handleStartChatWithAlumni}
                onAddNotification={handleAddNotification}
              />
            )}

            {activeTab === 'messages' && (
              <AlumniMessagingCenter 
                user={activeUser}
                onOpenAI={() => setIsAIAssistantOpen(true)}
                initialAlumni={activeMessagingAlumni}
                initialNote={activeMessagingNote}
                onAddNotification={handleAddNotification}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileEditPage 
                user={activeUser}
                onProfileUpdated={handleProfileUpdated}
                onOpenAI={() => setIsAIAssistantOpen(true)}
              />
            )}

            {activeTab === 'enterprise' && (
              <div className="p-4 sm:p-8 max-w-7xl mx-auto">
                <EnterprisePitchSlide 
                  onExploreSolution={() => setActiveTab('mentors')}
                />
              </div>
            )}
          </main>

          {/* Mobile Bottom Quick Navigation Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#131c2e]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#233147] px-3 py-2 flex items-center justify-around">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
              { id: 'jobs', label: 'Jobs', icon: 'Briefcase' },
              { id: 'goal', label: 'Goals', icon: 'Target' },
              { id: 'roadmap', label: 'Roadmap', icon: 'Compass' },
              { id: 'alumni', label: 'Alumni', icon: 'Users' },
              { id: 'messages', label: 'Messages', icon: 'MessageSquare' },
              { id: 'profile', label: 'Profile', icon: 'User' }
            ].map(nav => {
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveTab(nav.id)}
                  className={`flex flex-col items-center space-y-0.5 px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="capitalize">{nav.label}</span>
                </button>
              );
            })}
          </div>

          {/* Slide-over AI Assistant Copilot */}
          <AINetworkingAssistant 
            isOpen={isAIAssistantOpen}
            onClose={() => setIsAIAssistantOpen(false)}
          />
        </div>
      )}

      {/* Login / Register Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* View & Edit Profile Modal */}
      <ProfileEditModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={activeUser}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* ConnectEd Pro Plan Modal */}
      <ConnectEdProModal 
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        user={activeUser}
        onProfileUpdated={handleProfileUpdated}
        onOpenRAG={() => setIsRAGModalOpen(true)}
      />

      {/* Resume RAG AI Co-pilot Modal */}
      <ResumeRAGModal 
        isOpen={isRAGModalOpen}
        onClose={() => setIsRAGModalOpen(false)}
        user={activeUser}
        onOpenResumeUpload={() => setIsResumeUploadModalOpen(true)}
      />

      {/* AI Resume Upload & Profile Synchronizer Modal */}
      <ResumeUploadModal 
        isOpen={isResumeUploadModalOpen}
        onClose={() => setIsResumeUploadModalOpen(false)}
        onApplyExtractedSkills={(skills, res) => {
          handleProfileUpdated({
            ...activeUser,
            name: res?.name?.trim() ? res.name.trim() : activeUser?.name,
            skills: skills,
            skillsList: skills,
            targetRole: res?.targetRole || activeUser?.targetRole,
            degree: res?.degree || activeUser?.degree,
            major: res?.major || activeUser?.major,
            graduationYear: res?.graduationYear ? Number(res.graduationYear) : activeUser?.graduationYear,
            bio: res?.summary || activeUser?.bio
          });
        }}
      />
    </div>
  );
}
