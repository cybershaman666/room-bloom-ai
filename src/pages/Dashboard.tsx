import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Sidebar from '@/components/layout/Sidebar';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import PropertyManagement from '@/components/properties/PropertyManagement';
import ReservationCalendar from '@/components/reservations/ReservationCalendar';
import ReservationManagement from '@/components/reservations/ReservationManagement';
import AIPricingSuggestions from '@/components/pricing/AIPricingSuggestions';
import AccommodationComparison from '@/components/market/AccommodationComparison';
import GanttChart from '@/components/reservations/GanttChart';

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { loading } = useAuth();

  // Memoize page change handler to prevent unnecessary re-renders
  const handlePageChange = useCallback((page: string) => {
    setCurrentPage(page);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="glass-card p-8 text-center">
          <div className="relative">
            <div className="h-12 w-12 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Loading Dashboard</h3>
          <p className="text-muted-foreground text-sm">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  const ComingSoonPanel = ({ title, description }: { title: string; description: string }) => (
    <div className="space-y-6">
      <div className="glass-card p-6 border-0">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">{title}</h2>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>
      <div className="glass-card p-16 text-center border-0">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent opacity-60"></div>
        </div>
        <p className="text-muted-foreground font-medium">{title} coming soon...</p>
      </div>
    </div>
  );

  const renderPage = () => {
    const renderWithErrorBoundary = (component: React.ReactNode, componentName: string) => (
      <ErrorBoundary key={componentName}>
        {component}
      </ErrorBoundary>
    );

    switch (currentPage) {
      case 'dashboard':
        return renderWithErrorBoundary(<DashboardOverview />, 'DashboardOverview');
      case 'rooms':
        return renderWithErrorBoundary(<RoomsGanttChart />, 'RoomsGanttChart');
      case 'properties':
        return renderWithErrorBoundary(<PropertyManagement />, 'PropertyManagement');
      case 'calendar':
        return renderWithErrorBoundary(<ReservationCalendar />, 'ReservationCalendar');
      case 'pricing':
        return renderWithErrorBoundary(<AIPricingSuggestions />, 'AIPricingSuggestions');
      case 'market':
        return renderWithErrorBoundary(<AccommodationComparison />, 'AccommodationComparison');
      case 'analytics':
        return <ComingSoonPanel title="Analytics" description="Detailed revenue and performance analytics" />;
      case 'users':
        return <ComingSoonPanel title="User Management" description="Manage staff access and permissions" />;
      case 'settings':
        return <ComingSoonPanel title="Settings" description="Configure your account and platform integrations" />;
      default:
        return renderWithErrorBoundary(<DashboardOverview />, 'DashboardOverview');
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="w-64 flex-shrink-0">
        <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      </div>
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;