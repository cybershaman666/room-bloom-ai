import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Building2, Plus, Edit, Trash2, MapPin, Users, Bed, Bath, Settings } from 'lucide-react';
import PropertyForm from './PropertyForm';
import PropertyDetails from './PropertyDetails';

interface Property {
  id: string;
  name: string;
  description: string;
  property_type: 'hotel' | 'bed_and_breakfast' | 'apartment' | 'villa' | 'chalet' | 'cabin' | 'glamping' | 'camping' | 'hostel' | 'guesthouse' | 'resort';
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
  is_active: boolean;
  airbnb_listing_id?: string;
  booking_com_id?: string;
  check_in_time: string;
  check_out_time: string;
}

const PropertyManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    property_type: 'apartment' as Property['property_type'],
    address: '',
    city: '',
    country: '',
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    base_price: 100,
    currency: 'USD',
    star_rating: 3,
    amenities: [] as string[],
    check_in_time: '15:00',
    check_out_time: '11:00',
    airbnb_listing_id: '',
    booking_com_id: ''
  });

  const propertyTypeOptions = [
    { value: 'hotel' as const, label: 'Hotel' },
    { value: 'bed_and_breakfast' as const, label: 'Bed & Breakfast' },
    { value: 'apartment' as const, label: 'Apartment' },
    { value: 'villa' as const, label: 'Villa' },
    { value: 'chalet' as const, label: 'Chalet' },
    { value: 'cabin' as const, label: 'Cabin' },
    { value: 'glamping' as const, label: 'Glamping' },
    { value: 'camping' as const, label: 'Camping' },
    { value: 'hostel' as const, label: 'Hostel' },
    { value: 'guesthouse' as const, label: 'Guesthouse' },
    { value: 'resort' as const, label: 'Resort' }
  ];

  const fetchProperties = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
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
    fetchProperties();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const propertyData = {
        ...formData,
        owner_id: user.id,
        amenities: formData.amenities,
      };

      if (selectedProperty) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', selectedProperty.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Property updated successfully!",
        });
      } else {
        const { error } = await supabase
          .from('properties')
          .insert([propertyData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Property created successfully!",
        });
      }

      setShowForm(false);
      setSelectedProperty(null);
      resetForm();
      fetchProperties();
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
      name: '',
      description: '',
      property_type: 'apartment',
      address: '',
      city: '',
      country: '',
      bedrooms: 1,
      bathrooms: 1,
      max_guests: 2,
      base_price: 100,
      currency: 'USD',
      star_rating: 3,
      amenities: [],
      check_in_time: '15:00',
      check_out_time: '11:00',
      airbnb_listing_id: '',
      booking_com_id: ''
    });
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      name: property.name,
      description: property.description || '',
      property_type: property.property_type,
      address: property.address || '',
      city: property.city || '',
      country: property.country || '',
      bedrooms: property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      max_guests: property.max_guests || 2,
      base_price: property.base_price || 100,
      currency: property.currency || 'USD',
      star_rating: property.star_rating || 3,
      amenities: property.amenities || [],
      check_in_time: property.check_in_time || '15:00',
      check_out_time: property.check_out_time || '11:00',
      airbnb_listing_id: property.airbnb_listing_id || '',
      booking_com_id: property.booking_com_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Property deleted successfully!",
      });
      
      fetchProperties();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    return propertyTypeOptions.find(option => option.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p>Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Property Management</h2>
          <p className="text-muted-foreground">Manage your properties, rooms, and settings</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setSelectedProperty(null);
              }}
              className="organic-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
            <DialogHeader>
              <DialogTitle>
                {selectedProperty ? 'Edit Property' : 'Add New Property'}
              </DialogTitle>
            </DialogHeader>
            <PropertyForm
              formData={formData}
              setFormData={setFormData}
              propertyTypeOptions={propertyTypeOptions}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isEditing={!!selectedProperty}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="glass-card organic-hover">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {getPropertyTypeLabel(property.property_type)}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
                      <PropertyDetails property={property} onUpdate={fetchProperties} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(property)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(property.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-1" />
                {property.city}, {property.country}
              </div>
              
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-1" />
                  {property.bedrooms} bed
                </div>
                <div className="flex items-center">
                  <Bath className="h-4 w-4 mr-1" />
                  {property.bathrooms} bath
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {property.max_guests} guests
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-primary">
                  {property.currency} {property.base_price}/night
                </span>
                <Badge variant={property.is_active ? "default" : "secondary"}>
                  {property.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              {property.amenities && property.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {property.amenities.slice(0, 3).map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {property.amenities.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{property.amenities.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {properties.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your first property to begin managing your hospitality business.
            </p>
            <Button onClick={() => setShowForm(true)} className="organic-hover">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyManagement;