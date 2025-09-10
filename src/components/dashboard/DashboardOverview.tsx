import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TotemVisualization from './TotemVisualization';
import { 
  Building2, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  CheckCircle,
  Clock,
  Star,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  Zap,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalProperties: number;
  totalReservations: number;
  monthlyRevenue: number;
  occupancyRate: number;
  upcomingCheckIns: number;
}

const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalReservations: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    upcomingCheckIns: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      if (!user) return;
      
      setRefreshing(true);
      
      // Fetch properties count
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('owner_id', user.id);

      // Fetch reservations count - get through properties to ensure user owns them
      const { count: reservationsCount } = await supabase
        .from('reservations')
        .select('*, properties!inner(*)', { count: 'exact', head: true })
        .eq('properties.owner_id', user.id);

      // Fetch this month's revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: reservations } = await supabase
        .from('reservations')
        .select('total_price, properties!inner(*)')
        .eq('properties.owner_id', user.id)
        .gte('check_in', startOfMonth.toISOString())
        .eq('status', 'confirmed');

      const monthlyRevenue = reservations?.reduce((sum, r) => sum + Number(r.total_price), 0) || 0;

      // Fetch upcoming check-ins (next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const { count: upcomingCount } = await supabase
        .from('reservations')
        .select('*, properties!inner(*)', { count: 'exact', head: true })
        .eq('properties.owner_id', user.id)
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
      setRefreshing(false);
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
      {/* Totem Visualization */}
      <TotemVisualization />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Přehled výkonu</h1>
          <p className="text-muted-foreground">
            Detailní metriky vašeho podnikání v pohostinství
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchDashboardStats}
          disabled={refreshing}
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
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