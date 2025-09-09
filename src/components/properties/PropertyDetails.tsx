import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Upload, Camera, Bed, MapPin, Clock } from 'lucide-react';
import RoomManagement from './RoomManagement';
import PhotoGallery from './PhotoGallery';

interface Property {
  id: string;
  name: string;
  description: string;
  property_type: string;
  address: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price: number;
  currency: string;
  star_rating?: number;
  amenities: string[];
  check_in_time: string;
  check_out_time: string;
  is_active: boolean;
}

interface PropertyDetailsProps {
  property: Property;
  onUpdate: () => void;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onUpdate }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{property.name}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {property.city}, {property.country}
            </div>
            <Badge variant="secondary">{property.property_type}</Badge>
            {property.star_rating && (
              <div className="flex">
                {Array.from({ length: property.star_rating }).map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <Badge variant={property.is_active ? "default" : "secondary"}>
          {property.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rooms">Rooms & Units</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
                  <p className="text-sm">{property.description || 'No description provided'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Bedrooms</h4>
                    <p className="flex items-center text-sm">
                      <Bed className="h-4 w-4 mr-1" />
                      {property.bedrooms}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Max Guests</h4>
                    <p className="text-sm">{property.max_guests}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Check-in / Check-out</h4>
                  <p className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {property.check_in_time} / {property.check_out_time}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Pricing & Amenities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Base Price</h4>
                  <p className="text-lg font-semibold text-primary">
                    {property.currency} {property.base_price}/night
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-1">
                    {property.amenities && property.amenities.length > 0 ? (
                      property.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No amenities listed</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rooms">
          <RoomManagement propertyId={property.id} />
        </TabsContent>

        <TabsContent value="photos">
          <PhotoGallery propertyId={property.id} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Platform Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Airbnb Listing ID</Label>
                  <Input placeholder="Not connected" disabled />
                </div>
                <div>
                  <Label>Booking.com ID</Label>
                  <Input placeholder="Not connected" disabled />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Platform integrations will sync reservations and pricing automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Property Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Active Status</h4>
                  <p className="text-sm text-muted-foreground">
                    Control whether this property accepts new bookings
                  </p>
                </div>
                <Badge variant={property.is_active ? "default" : "secondary"}>
                  {property.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyDetails;