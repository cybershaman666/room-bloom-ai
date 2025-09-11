import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertTriangle, 
  Wrench,
  TrendingUp,
  Lightbulb,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TodayActivity {
  arrivals: number;
  checkIns: number;
  stayovers: number;
  checkOuts: number;
  needsCleaning: number;
  maintenance: number;
}

interface AIRecommendation {
  type: 'pricing' | 'operations' | 'marketing' | 'maintenance';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

const TodayOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activity, setActivity] = useState<TodayActivity>({
    arrivals: 0,
    checkIns: 0,
    stayovers: 0,
    checkOuts: 0,
    needsCleaning: 0,
    maintenance: 0
  });
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchTodayData = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch properties first
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);
        
        if (!properties || properties.length === 0) {
          setLoading(false);
          return;
        }
        
        const propertyIds = properties.map(p => p.id);
        
        // Fetch today's reservations
        const { data: checkInsData } = await supabase
          .from('reservations')
          .select('*')
          .in('property_id', propertyIds)
          .eq('check_in', today);
        
        const { data: checkOutsData } = await supabase
          .from('reservations')
          .select('*')
          .in('property_id', propertyIds)
          .eq('check_out', today);
        
        const { data: stayoversData } = await supabase
          .from('reservations')
          .select('*')
          .in('property_id', propertyIds)
          .lte('check_in', today)
          .gt('check_out', today);
        
        // Fetch rooms for cleaning status
        const { data: roomsData } = await supabase
          .from('rooms')
          .select('*')
          .in('property_id', propertyIds);
        
        // Simulate room status (since we don't have status field yet)
        const needsCleaningCount = Math.floor((roomsData?.length || 0) * 0.3);
        const maintenanceCount = Math.floor((roomsData?.length || 0) * 0.1);
        
        setActivity({
          arrivals: checkInsData?.length || 0,
          checkIns: checkInsData?.length || 0,
          stayovers: stayoversData?.length || 0,
          checkOuts: checkOutsData?.length || 0,
          needsCleaning: needsCleaningCount,
          maintenance: maintenanceCount
        });
        
        // Generate AI recommendations
        generateAIRecommendations();
        
      } catch (error) {
        console.error('Error fetching today data:', error);
        toast({
          title: "Error",
          description: "Failed to load today's data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTodayData();
  }, [user, toast]);

  const generateAIRecommendations = () => {
    const recs: AIRecommendation[] = [
      {
        type: 'pricing',
        title: 'Weekend Rate Optimization',
        description: 'Consider increasing weekend rates by 15-20% based on local demand patterns',
        priority: 'medium'
      },
      {
        type: 'operations',
        title: 'Cleaning Schedule',
        description: 'Peak checkout time is 11 AM. Schedule additional cleaning staff between 11 AM - 2 PM',
        priority: 'high'
      },
      {
        type: 'marketing',
        title: 'Last-Minute Bookings',
        description: 'Enable instant booking for same-day reservations to capture spontaneous travelers',
        priority: 'low'
      },
      {
        type: 'maintenance',
        title: 'Preventive Maintenance',
        description: 'Schedule HVAC maintenance before peak season to avoid disruptions',
        priority: 'medium'
      }
    ];
    
    setRecommendations(recs);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing': return <TrendingUp className="w-4 h-4" />;
      case 'operations': return <Clock className="w-4 h-4" />;
      case 'marketing': return <Users className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="glass-card border-0">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Activities */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-emerald-500/20">
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{activity.arrivals}</div>
            <div className="text-xs text-muted-foreground">Arrivals</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-blue-500/20">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{activity.checkIns}</div>
            <div className="text-xs text-muted-foreground">Check-ins</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-purple-500/20">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{activity.stayovers}</div>
            <div className="text-xs text-muted-foreground">Stayovers</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-orange-500/20">
              <UserX className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{activity.checkOuts}</div>
            <div className="text-xs text-muted-foreground">Check-outs</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{activity.needsCleaning}</div>
            <div className="text-xs text-muted-foreground">Need Cleaning</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-red-500/20">
              <Wrench className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{activity.maintenance}</div>
            <div className="text-xs text-muted-foreground">Maintenance</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gradient">
            <Lightbulb className="w-5 h-5" />
            AI Recommendations & Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 rounded-lg bg-secondary/10 border border-border/20">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                    {getTypeIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TodayOverview;