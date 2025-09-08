import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';

interface DashboardStats {
  totalProperties: number;
  totalReservations: number;
  monthlyRevenue: number;
  occupancyRate: number;
  upcomingCheckIns: number;
}

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalReservations: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    upcomingCheckIns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch reservations count
      const { count: reservationsCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true });

      // Fetch this month's revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: reservations } = await supabase
        .from('reservations')
        .select('total_price')
        .gte('check_in', startOfMonth.toISOString())
        .eq('status', 'confirmed');

      const monthlyRevenue = reservations?.reduce((sum, r) => sum + Number(r.total_price), 0) || 0;

      // Fetch upcoming check-ins (next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const { count: upcomingCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .gte('check_in', today.toISOString().split('T')[0])
        .lte('check_in', nextWeek.toISOString().split('T')[0])
        .eq('status', 'confirmed');

      // Calculate occupancy rate (simplified - current month)
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const totalPossibleNights = (propertiesCount || 0) * daysInMonth;
      const occupiedNights = reservations?.length || 0;
      const occupancyRate = totalPossibleNights > 0 ? (occupiedNights / totalPossibleNights) * 100 : 0;

      setStats({
        totalProperties: propertiesCount || 0,
        totalReservations: reservationsCount || 0,
        monthlyRevenue,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        upcomingCheckIns: upcomingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Properties',
      value: stats.totalProperties.toString(),
      description: 'Active listings',
      icon: Building2,
      color: 'text-blue-600',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      description: 'This month',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Occupancy Rate',
      value: `${stats.occupancyRate}%`,
      description: 'This month',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      title: 'Upcoming Check-ins',
      value: stats.upcomingCheckIns.toString(),
      description: 'Next 7 days',
      icon: Calendar,
      color: 'text-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your hospitality business.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">• Add a new property</div>
            <div className="text-sm text-muted-foreground">• Create a manual reservation</div>
            <div className="text-sm text-muted-foreground">• Review AI pricing suggestions</div>
            <div className="text-sm text-muted-foreground">• Check upcoming bookings</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>Ready for external platform connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Airbnb Integration</span>
              <span className="text-muted-foreground">Ready</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Booking.com Integration</span>
              <span className="text-muted-foreground">Ready</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Google Calendar Sync</span>
              <span className="text-muted-foreground">Ready</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;