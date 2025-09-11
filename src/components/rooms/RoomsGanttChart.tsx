import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Wrench,
  Plus,
  Edit,
  Trash2,
  Users,
  Building2
} from 'lucide-react';
import { format, addDays, startOfDay, isWithinInterval, parseISO } from 'date-fns';

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  property_id: string;
  max_guests: number;
  base_price: number;
  is_active: boolean;
  properties?: {
    name: string;
  };
}

interface Reservation {
  id: string;
  property_id: string;
  room_id?: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  source: string;
  notes?: string;
}

interface Property {
  id: string;
  name: string;
}

const RoomsGanttChart: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ roomId: string; date: string } | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [formData, setFormData] = useState({
    property_id: '',
    room_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    guests_count: 1,
    total_price: 0,
    status: 'confirmed',
    source: 'manual',
    notes: '',
  });

  // Generate date range for next 14 days
  const dateRange = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(currentDate, i);
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayNumber: format(date, 'd'),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch properties first
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('id, name')
        .eq('owner_id', user!.id)
        .eq('is_active', true);
      
      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);
      
      if (!propertiesData || propertiesData.length === 0) {
        setLoading(false);
        return;
      }
      
      const propertyIds = propertiesData.map(p => p.id);
      
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          properties (
            name
          )
        `)
        .in('property_id', propertyIds)
        .eq('is_active', true)
        .order('room_number');
      
      if (roomsError) throw roomsError;
      setRooms(roomsData || []);
      
      // Fetch reservations for the date range
      const startDate = format(currentDate, 'yyyy-MM-dd');
      const endDate = format(addDays(currentDate, 14), 'yyyy-MM-dd');
      
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
        .in('property_id', propertyIds)
        .gte('check_out', startDate)
        .lte('check_in', endDate);
      
      if (reservationsError) throw reservationsError;
      setReservations(reservationsData || []);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (roomId: string, dateStr: string) => {
    const existingReservation = getReservationForCell(roomId, dateStr);
    
    if (existingReservation) {
      // Edit existing reservation
      setSelectedReservation(existingReservation);
      setFormData({
        property_id: existingReservation.property_id,
        room_id: existingReservation.room_id || '',
        guest_name: existingReservation.guest_name,
        guest_email: existingReservation.guest_email || '',
        guest_phone: existingReservation.guest_phone || '',
        check_in: existingReservation.check_in,
        check_out: existingReservation.check_out,
        guests_count: existingReservation.guests_count,
        total_price: existingReservation.total_price,
        status: existingReservation.status,
        source: existingReservation.source,
        notes: existingReservation.notes || '',
      });
    } else {
      // Create new reservation
      const room = rooms.find(r => r.id === roomId);
      const nextDay = format(addDays(new Date(dateStr), 1), 'yyyy-MM-dd');
      
      setSelectedReservation(null);
      setFormData({
        property_id: room?.property_id || '',
        room_id: roomId,
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        check_in: dateStr,
        check_out: nextDay,
        guests_count: 1,
        total_price: room?.base_price || 0,
        status: 'confirmed',
        source: 'manual',
        notes: '',
      });
    }
    
    setIsDialogOpen(true);
  };

  const getReservationForCell = (roomId: string, dateStr: string): Reservation | null => {
    const date = new Date(dateStr);
    return reservations.find(reservation => {
      if (reservation.room_id !== roomId) return false;
      const checkIn = parseISO(reservation.check_in);
      const checkOut = parseISO(reservation.check_out);
      return isWithinInterval(date, { start: checkIn, end: checkOut });
    }) || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedReservation) {
        // Update existing reservation
        const { error } = await supabase
          .from('reservations')
          .update(formData)
          .eq('id', selectedReservation.id);

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Reservation updated successfully',
        });
      } else {
        // Create new reservation
        const { error } = await supabase
          .from('reservations')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Reservation created successfully',
        });
      }
      
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedReservation || !confirm('Are you sure you want to delete this reservation?')) return;

    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', selectedReservation.id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Reservation deleted successfully',
      });
      
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/80 border-green-600 text-white';
      case 'pending':
        return 'bg-yellow-500/80 border-yellow-600 text-white';
      case 'cancelled':
        return 'bg-red-500/80 border-red-600 text-white';
      case 'checked_in':
        return 'bg-blue-500/80 border-blue-600 text-white';
      case 'checked_out':
        return 'bg-gray-500/80 border-gray-600 text-white';
      default:
        return 'bg-gray-400/80 border-gray-500 text-white';
    }
  };

  const getRoomStatusColor = (roomId: string, dateStr: string) => {
    const reservation = getReservationForCell(roomId, dateStr);
    if (reservation) {
      return getStatusColor(reservation.status);
    }
    return 'bg-gray-100 border-gray-200 hover:bg-gray-200';
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = addDays(currentDate, direction === 'next' ? 7 : -7);
    setCurrentDate(newDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading rooms and reservations...</p>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No rooms available</h3>
          <p className="text-muted-foreground text-center mb-4">
            Add rooms to your properties first to manage reservations.
          </p>
          <Button onClick={() => window.location.href = '#properties'}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rooms to Properties
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">Rooms & Reservations</h2>
          <p className="text-muted-foreground">
            Interactive Gantt chart for room availability and reservation management
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigateWeek('prev')}>
            ← Previous Week
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" onClick={() => navigateWeek('next')}>
            Next Week →
          </Button>
        </div>
      </div>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Room Availability Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header with dates */}
              <div className="flex border-b border-border/20">
                <div className="w-48 flex-shrink-0 p-3 border-r border-border/20 bg-muted/30">
                  <div className="font-semibold text-sm">Room</div>
                </div>
                {dateRange.map(({ date, dayName, dayNumber, isWeekend }) => (
                  <div 
                    key={date.toISOString()} 
                    className={`w-32 flex-shrink-0 p-3 text-center border-r border-border/20 ${
                      isWeekend ? 'bg-accent/10' : 'bg-muted/10'
                    }`}
                  >
                    <div className="text-xs font-medium text-muted-foreground">{dayName}</div>
                    <div className="text-sm font-semibold">{dayNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(date, 'MMM')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Room rows */}
              {rooms.map(room => (
                <div key={room.id} className="flex border-b border-border/10 hover:bg-muted/20 transition-colors">
                  {/* Room info */}
                  <div className="w-48 flex-shrink-0 p-3 border-r border-border/20">
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">{room.room_number}</div>
                      <div className="text-xs text-muted-foreground capitalize">{room.room_type}</div>
                      <div className="text-xs text-muted-foreground">{room.properties?.name}</div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Users className="w-3 h-3 mr-1" />
                        {room.max_guests} guests
                      </div>
                    </div>
                  </div>

                  {/* Date cells */}
                  {dateRange.map(({ date, dateStr }) => {
                    const reservation = getReservationForCell(room.id, dateStr);
                    const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

                    return (
                      <div 
                        key={`${room.id}-${dateStr}`}
                        className={`w-32 flex-shrink-0 p-2 border-r border-border/20 cursor-pointer transition-all hover:bg-muted/40 ${
                          isToday ? 'bg-primary/5 border-primary/20' : ''
                        }`}
                        onClick={() => handleCellClick(room.id, dateStr)}
                      >
                        {reservation ? (
                          <div className={`h-16 rounded-lg p-2 border-2 ${getRoomStatusColor(room.id, dateStr)} transition-all hover:scale-105`}>
                            <div className="text-xs font-medium truncate text-white">
                              {reservation.guest_name}
                            </div>
                            <div className="text-xs opacity-90 truncate text-white">
                              {reservation.guests_count} guests
                            </div>
                            <div className="text-xs opacity-90 text-white">
                              ${reservation.total_price}
                            </div>
                          </div>
                        ) : (
                          <div className="h-16 rounded-lg border-2 border-dashed border-border/40 bg-background/50 hover:bg-primary/10 hover:border-primary/40 transition-all flex items-center justify-center">
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span>Checked In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-dashed border-gray-400"></div>
              <span>Available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reservation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl glass-card">
          <DialogHeader>
            <DialogTitle>
              {selectedReservation ? 'Edit Reservation' : 'New Reservation'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property_id">Property *</Label>
                <Select
                  value={formData.property_id}
                  onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="room_id">Room *</Label>
                <Select
                  value={formData.room_id}
                  onValueChange={(value) => setFormData({ ...formData, room_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms
                      .filter(room => !formData.property_id || room.property_id === formData.property_id)
                      .map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.room_number} ({room.room_type})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest_name">Guest Name *</Label>
                <Input
                  id="guest_name"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guests_count">Number of Guests</Label>
                <Input
                  id="guests_count"
                  type="number"
                  min="1"
                  value={formData.guests_count}
                  onChange={(e) => setFormData({ ...formData, guests_count: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest_email">Email</Label>
                <Input
                  id="guest_email"
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guest_phone">Phone</Label>
                <Input
                  id="guest_phone"
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check_in">Check-in Date *</Label>
                <Input
                  id="check_in"
                  type="date"
                  value={formData.check_in}
                  onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="check_out">Check-out Date *</Label>
                <Input
                  id="check_out"
                  type="date"
                  value={formData.check_out}
                  onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_price">Total Price *</Label>
                <Input
                  id="total_price"
                  type="number"
                  step="0.01"
                  value={formData.total_price}
                  onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source">Booking Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="booking.com">Booking.com</SelectItem>
                  <SelectItem value="direct">Direct Booking</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the reservation"
                rows={3}
              />
            </div>
            
            <div className="flex justify-between pt-4">
              {selectedReservation && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex space-x-2 ml-auto">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="organic-hover">
                  {selectedReservation ? 'Update' : 'Create'} Reservation
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomsGanttChart;