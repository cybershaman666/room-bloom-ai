import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';

const TestDashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { loading } = useAuth();

  const handlePageChange = useCallback((page: string) => {
    setCurrentPage(page);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="bg-card p-8 rounded-lg text-center">
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

  const renderSimplePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard Overview</h2>
              <p className="text-muted-foreground mt-2">Simple test dashboard content</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card p-4 rounded-lg border">
                  <h3 className="font-semibold">Test Card {i + 1}</h3>
                  <p className="text-2xl font-bold text-primary">123</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'properties':
        return (
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Properties</h2>
            <p className="text-muted-foreground mt-2">Simple test properties content</p>
          </div>
        );
      case 'pricing':
        return (
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-3xl font-bold tracking-tight text-primary">AI Pricing</h2>
            <p className="text-muted-foreground mt-2">Simple test pricing content</p>
          </div>
        );
      case 'market':
        try {
          // Import AccommodationComparison dynamically to see if it throws an error
          const AccommodationComparison = require('@/components/market/AccommodationComparison').default;
          return <AccommodationComparison />;
        } catch (error) {
          return (
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-bold text-destructive">Market Component Error</h2>
              <p className="text-muted-foreground mt-2">Error: {String(error)}</p>
            </div>
          );
        }
      default:
        return (
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-3xl font-bold tracking-tight text-primary">Coming Soon</h2>
            <p className="text-muted-foreground mt-2">This section is under development</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="w-64 flex-shrink-0">
        <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
      </div>
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {renderSimplePage()}
        </div>
      </main>
    </div>
  );
};

export default TestDashboard;
