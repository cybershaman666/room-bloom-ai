import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, DollarSign, CheckCircle, AlertCircle, XCircle, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  property_id: string;
  max_guests: number;
  status: 'clean' | 'stayover' | 'needs_cleaning' | 'dirty' | 'maintenance';
}

interface Reservation {
  id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  room_id?: string;
  total_price: number;
  status: string;
}

interface DateRange {
  date: Date;
  day: string;
  isWeekend: boolean;
}

interface PriceRecommendation {
  date: string;
  recommendedPrice: number;
  demand: 'low' | 'medium' | 'high';
}

const GanttChart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [dateRange, setDateRange] = useState<DateRange[]>([]);
  const [priceRecommendations, setPriceRecommendations] = useState<PriceRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate date range for next 30 days
  useEffect(() => {
    const dates: DateRange[] = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      dates.push({ date, day, isWeekend });
    }
    
    setDateRange(dates);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch properties first to get owner filter
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', user.id);
        
        if (!properties || properties.length === 0) {
          setLoading(false);
          return;
        }
        
        const propertyIds = properties.map(p => p.id);
        
        // Fetch rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*')
          .in('property_id', propertyIds);
        
        if (roomsError) throw roomsError;
        
        // Add status to rooms (simulated for now)
        const roomsWithStatus = (roomsData || []).map(room => ({
          ...room,
          status: ['clean', 'stayover', 'needs_cleaning', 'dirty'][Math.floor(Math.random() * 4)] as Room['status']
        }));
        
        setRooms(roomsWithStatus);
        
        // Fetch reservations
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .in('property_id', propertyIds)
          .gte('check_out', new Date().toISOString().split('T')[0]);
        
        if (reservationsError) throw reservationsError;
        setReservations(reservationsData || []);
        
        // Generate AI price recommendations (simulated)
        generatePriceRecommendations();
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, toast]);

  const generatePriceRecommendations = () => {
    const recommendations: PriceRecommendation[] = [];
    
    dateRange.forEach(({ date, isWeekend }) => {
      const basePrice = 100;
      const weekendMultiplier = isWeekend ? 1.3 : 1;
      const seasonalMultiplier = Math.random() * 0.4 + 0.8; // 0.8 - 1.2
      const demandMultiplier = Math.random() * 0.6 + 0.7; // 0.7 - 1.3
      
      const recommendedPrice = Math.round(basePrice * weekendMultiplier * seasonalMultiplier * demandMultiplier);
      const demand = demandMultiplier > 1.1 ? 'high' : demandMultiplier > 0.9 ? 'medium' : 'low';
      
      recommendations.push({
        date: date.toISOString().split('T')[0],
        recommendedPrice,
        demand: demand as 'low' | 'medium' | 'high'
      });
    });
    
    setPriceRecommendations(recommendations);
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'clean': return 'bg-emerald-500';
      case 'stayover': return 'bg-blue-500';
      case 'needs_cleaning': return 'bg-amber-500';
      case 'dirty': return 'bg-red-500';
      case 'maintenance': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: Room['status']) => {
    switch (status) {
      case 'clean': return <CheckCircle className="w-3 h-3" />;
      case 'stayover': return <User className="w-3 h-3" />;
      case 'needs_cleaning': return <AlertCircle className="w-3 h-3" />;
      case 'dirty': return <XCircle className="w-3 h-3" />;
      case 'maintenance': return <Wrench className="w-3 h-3" />;
      default: return null;
    }
  };

  const isDateInReservation = (roomId: string, date: Date) => {
    return reservations.find(res => {
      if (!res.room_id || res.room_id !== roomId) return false;
      const checkIn = new Date(res.check_in);
      const checkOut = new Date(res.check_out);
      return date >= checkIn && date < checkOut;
    });
  };

  const getPriceRecommendation = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return priceRecommendations.find(pr => pr.date === dateStr);
  };

  const getDemandColor = (demand: 'low' | 'medium' | 'high') => {
    switch (demand) {
      case 'high': return 'text-emerald-600';
      case 'medium': return 'text-amber-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <Calendar className="w-5 h-5" />
          Room Availability & Pricing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Header with dates */}
          <div className="flex min-w-max">
            <div className="w-48 flex-shrink-0 p-2 border-r border-border/20">
              <div className="font-medium text-sm">Room</div>
            </div>
            {dateRange.map(({ date, day, isWeekend }) => (
              <div 
                key={date.toISOString()} 
                className={`w-24 flex-shrink-0 p-2 text-center border-r border-border/20 ${isWeekend ? 'bg-accent/10' : ''}`}
              >
                <div className="text-xs font-medium">{day}</div>
                <div className="text-xs text-muted-foreground">
                  {date.getDate()}/{date.getMonth() + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Room rows */}
          {rooms.map(room => (
            <div key={room.id} className="flex min-w-max border-t border-border/20">
              {/* Room info */}
              <div className="w-48 flex-shrink-0 p-3 border-r border-border/20">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(room.status)}`}>
                    {getStatusIcon(room.status)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{room.room_number}</div>
                    <div className="text-xs text-muted-foreground">{room.room_type}</div>
                    <div className="text-xs capitalize text-muted-foreground">{room.status.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>

              {/* Date cells */}
              {dateRange.map(({ date }) => {
                const reservation = isDateInReservation(room.id, date);
                const priceRec = getPriceRecommendation(date);

                return (
                  <div 
                    key={`${room.id}-${date.toISOString()}`}
                    className="w-24 flex-shrink-0 p-1 border-r border-border/20 h-20"
                  >
                    {reservation ? (
                      <div className="h-full bg-primary/20 border border-primary/40 rounded p-1 flex flex-col justify-between">
                        <div className="text-xs font-medium truncate">{reservation.guest_name}</div>
                        <div className="text-xs text-muted-foreground">${reservation.total_price}</div>
                      </div>
                    ) : (
                      <div className="h-full bg-secondary/10 border border-dashed border-border/40 rounded p-1 flex flex-col justify-center items-center">
                        {priceRec && (
                          <>
                            <div className={`text-xs font-medium ${getDemandColor(priceRec.demand)}`}>
                              ${priceRec.recommendedPrice}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {priceRec.demand}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Clean</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Stayover</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Needs Cleaning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Dirty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>Maintenance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;