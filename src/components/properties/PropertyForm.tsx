import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface PropertyFormProps {
  formData: any;
  setFormData: (data: any) => void;
  propertyTypeOptions: { value: string; label: string }[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const PropertyForm: React.FC<PropertyFormProps> = ({
  formData,
  setFormData,
  propertyTypeOptions,
  onSubmit,
  onCancel,
  isEditing
}) => {
  const commonAmenities = [
    'WiFi', 'Kitchen', 'Parking', 'Pool', 'Gym', 'Spa', 'Restaurant', 
    'Bar', 'Laundry', 'Pet Friendly', 'Air Conditioning', 'Heating',
    'TV', 'Balcony', 'Garden', 'BBQ', 'Hot Tub', 'Fireplace'
  ];

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = formData.amenities || [];
    if (currentAmenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: currentAmenities.filter((a: string) => a !== amenity)
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...currentAmenities, amenity]
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Property Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g. Sunset Villa"
          />
        </div>
        <div>
          <Label htmlFor="property_type">Property Type *</Label>
          <Select
            value={formData.property_type}
            onValueChange={(value) => setFormData({ ...formData, property_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {propertyTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Describe your property, its unique features and location..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Street address"
          />
        </div>
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
            placeholder="City"
          />
        </div>
        <div>
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            required
            placeholder="Country"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div>
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            min="0"
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            min="0"
            value={formData.bathrooms}
            onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
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
          <Label htmlFor="star_rating">Star Rating</Label>
          <Select
            value={formData.star_rating?.toString()}
            onValueChange={(value) => setFormData({ ...formData, star_rating: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Star</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="check_in_time">Check-in Time</Label>
          <Input
            id="check_in_time"
            type="time"
            value={formData.check_in_time}
            onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="check_out_time">Check-out Time</Label>
          <Input
            id="check_out_time"
            type="time"
            value={formData.check_out_time}
            onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Amenities</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {commonAmenities.map((amenity) => (
            <div
              key={amenity}
              onClick={() => handleAmenityToggle(amenity)}
              className={`p-2 text-sm rounded-lg border cursor-pointer transition-colors ${
                (formData.amenities || []).includes(amenity)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              {amenity}
            </div>
          ))}
        </div>
        {formData.amenities && formData.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.amenities.map((amenity: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {amenity}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleAmenityToggle(amenity)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="airbnb_listing_id">Airbnb Listing ID</Label>
          <Input
            id="airbnb_listing_id"
            value={formData.airbnb_listing_id}
            onChange={(e) => setFormData({ ...formData, airbnb_listing_id: e.target.value })}
            placeholder="For platform integration"
          />
        </div>
        <div>
          <Label htmlFor="booking_com_id">Booking.com ID</Label>
          <Input
            id="booking_com_id"
            value={formData.booking_com_id}
            onChange={(e) => setFormData({ ...formData, booking_com_id: e.target.value })}
            placeholder="For platform integration"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="organic-hover">
          {isEditing ? 'Update' : 'Create'} Property
        </Button>
      </div>
    </form>
  );
};

export default PropertyForm;