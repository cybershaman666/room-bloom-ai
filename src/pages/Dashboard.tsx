import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import PropertyManagement from '@/components/properties/PropertyManagement';
import ReservationCalendar from '@/components/reservations/ReservationCalendar';
import ReservationManagement from '@/components/reservations/ReservationManagement';
import AIPricingSuggestions from '@/components/pricing/AIPricingSuggestions';

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'properties':
        return <PropertyManagement />;
      case 'reservations':
        return <ReservationManagement />;
      case 'calendar':
        return <ReservationCalendar />;
      case 'pricing':
        return <AIPricingSuggestions />;
      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
              <p className="text-muted-foreground">
                Detailed revenue and performance analytics
              </p>
            </div>
            <div className="text-center py-16 text-muted-foreground">
              Analytics dashboard coming soon...
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
              <p className="text-muted-foreground">
                Manage staff access and permissions
              </p>
            </div>
            <div className="text-center py-16 text-muted-foreground">
              User management coming soon...
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
              <p className="text-muted-foreground">
                Configure your account and platform integrations
              </p>
            </div>
            <div className="text-center py-16 text-muted-foreground">
              Settings panel coming soon...
            </div>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 flex-shrink-0">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {renderCurrentPage()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;