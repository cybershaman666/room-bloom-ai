import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Bed, Users, Square, MapPin } from 'lucide-react';

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  size_sqm?: number;
  max_guests: number;
  base_price: number;
  amenities: string[];
  description?: string;
  floor_number?: number;
  position_description?: string;
  is_active: boolean;
}

interface RoomManagementProps {
  propertyId: string;
}

const RoomManagement: React.FC<RoomManagementProps> = ({ propertyId }) => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'standard',
    size_sqm: '',
    max_guests: 2,
    base_price: 0,
    amenities: [] as string[],
    description: '',
    floor_number: '',
    position_description: ''
  });

  const roomTypes = [
    { value: 'standard', label: 'Standard Room' },
    { value: 'deluxe', label: 'Deluxe Room' },
    { value: 'suite', label: 'Suite' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'studio', label: 'Studio' },
    { value: 'tent', label: 'Tent' },
    { value: 'cabin', label: 'Cabin' },
    { value: 'pod', label: 'Pod' },
    { value: 'villa', label: 'Villa' },
    { value: 'chalet', label: 'Chalet' }
  ];

  const commonAmenities = [
    'Private Bathroom', 'Air Conditioning', 'Heating', 'WiFi', 'TV', 
    'Mini Bar', 'Safe', 'Balcony', 'Sea View', 'Mountain View', 
    'Garden View', 'Kitchenette', 'Fireplace', 'Hot Tub'
  ];

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId)
        .order('room_number');

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const roomData = {
        ...formData,
        property_id: propertyId,
        size_sqm: formData.size_sqm ? parseFloat(formData.size_sqm) : null,
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
      };

      if (selectedRoom) {
        const { error } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', selectedRoom.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Room updated successfully!",
        });
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert([roomData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Room created successfully!",
        });
      }

      setShowForm(false);
      setSelectedRoom(null);
      resetForm();
      fetchRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      room_number: '',
      room_type: 'standard',
      size_sqm: '',
      max_guests: 2,
      base_price: 0,
      amenities: [],
      description: '',
      floor_number: '',
      position_description: ''
    });
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      size_sqm: room.size_sqm?.toString() || '',
      max_guests: room.max_guests,
      base_price: room.base_price,
      amenities: room.amenities || [],
      description: room.description || '',
      floor_number: room.floor_number?.toString() || '',
      position_description: room.position_description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Room deleted successfully!",
      });
      
      fetchRooms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: formData.amenities.filter(a => a !== amenity)
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity]
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Rooms & Units</h3>
          <p className="text-sm text-muted-foreground">Manage individual rooms, tents, or units within your property</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setSelectedRoom(null);
              }}
              className="organic-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
            <DialogHeader>
              <DialogTitle>
                {selectedRoom ? 'Edit Room' : 'Add New Room'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room_number">Room Number/Name *</Label>
                  <Input
                    id="room_number"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    required
                    placeholder="e.g. 101, Tent A, Lakeside Cabin"
                  />
                </div>
                <div>
                  <Label htmlFor="room_type">Room Type</Label>
                  <Select
                    value={formData.room_type}
                    onValueChange={(value) => setFormData({ ...formData, room_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="size_sqm">Size (m²)</Label>
                  <Input
                    id="size_sqm"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.size_sqm}
                    onChange={(e) => setFormData({ ...formData, size_sqm: e.target.value })}
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label htmlFor="max_guests">Max Guests</Label>
                  <Input
                    id="max_guests"
                    type="number"
                    min="1"
                    value={formData.max_guests}
                    onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="base_price">Base Price</Label>
                  <Input
                    id="base_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="floor_number">Floor</Label>
                  <Input
                    id="floor_number"
                    type="number"
                    value={formData.floor_number}
                    onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="position_description">Position/Location Description</Label>
                <Input
                  id="position_description"
                  value={formData.position_description}
                  onChange={(e) => setFormData({ ...formData, position_description: e.target.value })}
                  placeholder="e.g. Ocean view, Forest clearing, Near reception"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Special features, views, or unique characteristics..."
                />
              </div>

              <div>
                <Label>Room Amenities</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {commonAmenities.map((amenity) => (
                    <div
                      key={amenity}
                      onClick={() => handleAmenityToggle(amenity)}
                      className={`p-2 text-sm rounded-lg border cursor-pointer transition-colors ${
                        formData.amenities.includes(amenity)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                    >
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="organic-hover">
                  {selectedRoom ? 'Update' : 'Create'} Room
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Card key={room.id} className="glass-card organic-hover">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{room.room_number}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {roomTypes.find(t => t.value === room.room_type)?.label || room.room_type}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(room)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(room.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                {room.size_sqm && (
                  <div className="flex items-center">
                    <Square className="h-4 w-4 mr-1" />
                    {room.size_sqm}m²
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {room.max_guests} guests
                </div>
                {room.floor_number && (
                  <div className="text-muted-foreground">
                    Floor {room.floor_number}
                  </div>
                )}
              </div>
              
              {room.position_description && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {room.position_description}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-primary">
                  ${room.base_price}/night
                </span>
                <Badge variant={room.is_active ? "default" : "secondary"}>
                  {room.is_active ? "Available" : "Inactive"}
                </Badge>
              </div>
              
              {room.amenities && room.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {room.amenities.slice(0, 2).map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {room.amenities.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{room.amenities.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {rooms.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bed className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rooms added yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add individual rooms, tents, or units to better manage your property.
            </p>
            <Button onClick={() => setShowForm(true)} className="organic-hover">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Room
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoomManagement;