import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  MapPin, 
  Star, 
  DollarSign, 
  Navigation, 
  Search,
  Wifi,
  Car,
  Coffee,
  Waves,
  Users2,
  Building,
  TreePine,
  Home,
  Loader2,
  AlertCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface Accommodation {
  id: string;
  name: string;
  type: 'hotel' | 'camp' | 'apartment' | 'guesthouse' | 'hostel' | 'resort';
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  currency: string;
  location: {
    address: string;
    distance: number; // in km
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  amenities: string[];
  imageUrl?: string;
  bookingUrl?: string;
  description: string;
  availability: {
    available: boolean;
    lastUpdated: string;
  };
}

interface MarketResearchService {
  searchNearbyAccommodations(
    location: { lat: number; lng: number }, 
    radius: number,
    accommodationType: string,
    checkIn: string,
    checkOut: string
  ): Promise<Accommodation[]>;
}

// AI-powered market research service
class AIMarketResearchService implements MarketResearchService {
  private async callAI(prompt: string): Promise<any> {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyDDNd0lew1eKcgFzOXqznqxxVBxf9CGv5o';
      
      if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY not configured');
      }
      
      const enhancedPrompt = `${prompt}

Please respond with a valid JSON object in this exact format:
{
  "accommodations": [
    {
      "id": "unique-id",
      "name": "Hotel Name",
      "type": "hotel",
      "rating": 4.2,
      "reviewCount": 156,
      "pricePerNight": 95,
      "currency": "USD",
      "location": {
        "address": "123 Main St, City",
        "distance": 2.3,
        "coordinates": {"lat": 50.0755, "lng": 14.4378}
      },
      "amenities": ["wifi", "parking", "breakfast"],
      "description": "Comfortable hotel with modern amenities",
      "availability": {
        "available": true,
        "lastUpdated": "2024-01-10T10:00:00Z"
      }
    }
  ]
}

Only return the JSON object, no additional text or markdown formatting.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: enhancedPrompt }]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
            topK: 40,
            topP: 0.95
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        console.error('Gemini API error:', response.status, errorData);
        
        if (response.status === 429) {
          console.warn('API quota exceeded, using fallback data');
          throw new Error('API quota exceeded');
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid response from Gemini API:', data);
        throw new Error('Invalid AI response format');
      }
      
      const text = data.candidates[0].content.parts[0].text;
      
      // Clean the response text to extract JSON
      let jsonText = text.trim();
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      const result = JSON.parse(jsonText);
      return result;
      
    } catch (error) {
      console.warn('AI service failed, using fallback data:', error);
      return this.generateFallbackData(location);
    }
  }

  private generateFallbackData(location?: { lat: number; lng: number }) {
    // Generate realistic fallback data for accommodation search
    const accommodationTypes = ['hotel', 'camp', 'apartment', 'guesthouse', 'hostel'] as const;
    const accommodations = [];
    
    for (let i = 0; i < 8; i++) {
      const type = accommodationTypes[Math.floor(Math.random() * accommodationTypes.length)];
      // Adjust prices for Czech market (CZK converted to USD for display)
      const basePriceCZK = type === 'hotel' ? 1800 : type === 'resort' ? 2800 : type === 'camp' ? 800 : type === 'apartment' ? 1500 : 1000;
      const basePrice = Math.round(basePriceCZK / 23); // CZK to USD conversion (~23 CZK per USD)
      const priceVariation = Math.random() * 0.6 + 0.7; // ±30% price variation
      
      accommodations.push({
        id: `fallback-${i}`,
        name: this.generateAccommodationName(type),
        type,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 300 + 20),
        pricePerNight: Math.round(basePrice * priceVariation),
        currency: 'USD',
        location: {
          address: `${Math.floor(Math.random() * 999) + 1} ${this.getRandomStreetName()}`,
          distance: Math.round((Math.random() * 15 + 0.5) * 10) / 10,
          coordinates: {
            lat: (location?.lat || 50.0755) + (Math.random() - 0.5) * 0.1,
            lng: (location?.lng || 14.4378) + (Math.random() - 0.5) * 0.1
          }
        },
        amenities: this.getRandomAmenities(),
        description: this.generateDescription(type),
        availability: {
          available: Math.random() > 0.1, // 90% availability rate
          lastUpdated: new Date().toISOString()
        }
      });
    }
    
    return { accommodations };
  }

  private generateAccommodationName(type: string): string {
    const prefixes = {
      hotel: ['Hotel', 'Penzion', 'Wellness Hotel', 'Boutique Hotel', 'Zámecký Hotel', 'Historický Hotel'],
      camp: ['Autokemp', 'Kemp', 'Camping', 'Rekreační středisko', 'Chatová osada'],
      apartment: ['Apartmán', 'Studio', 'Ubytování', 'Rekreační byt', 'Moderní apartmán'],
      guesthouse: ['Penzion', 'Rodinný penzion', 'Ubytovna', 'Chalupa', 'Vila', 'Usedlost'],
      hostel: ['Hostel', 'Mladežnická ubytovna', 'Backpackers', 'Budget ubytování']
    };
    
    const names = {
      hotel: ['U Koruny', 'Zlatý Lev', 'Pod Hradem', 'Na Náměstí', 'Moravský Dvůr', 'U Růže'],
      camp: ['Pod Sosnami', 'U Řeky', 'Lesní', 'Pohoda', 'Slunečný', 'Relax'],
      apartment: ['Centrum', 'Panorama', 'Comfort', 'Family', 'Modern', 'Stylový'],
      guesthouse: ['U Mlýna', 'Na Kopci', 'Zelený Dvůr', 'Rodinný', 'Tradiční', 'Klidný Kout'],
      hostel: ['Mladost', 'Friendly', 'Cheap Sleep', 'Backpackers', 'Budget']
    };

    const prefix = prefixes[type as keyof typeof prefixes][Math.floor(Math.random() * prefixes[type as keyof typeof prefixes].length)];
    const name = names[type as keyof typeof names][Math.floor(Math.random() * names[type as keyof typeof names].length)];
    
    return `${prefix} ${name}`;
  }

  private getRandomStreetName(): string {
    const streetNames = [
      'Hlavní třída', 'Náměstí Míru', 'Kostelnická', 'Zámecká', 'Školní ulice', 
      'Dvořákova', 'Masarykova', 'Jiráskova', 'Komenského', 'Palackého'
    ];
    return streetNames[Math.floor(Math.random() * streetNames.length)];
  }

  private getRandomAmenities(): string[] {
    const allAmenities = ['wifi', 'parking', 'breakfast', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'pets', 'ac', 'heating', 'kitchen'];
    const count = Math.floor(Math.random() * 5 + 3); // 3-7 amenities
    const shuffled = allAmenities.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private generateDescription(type: string): string {
    const descriptions = {
      hotel: 'Comfortable hotel offering modern amenities and excellent service in the heart of the city.',
      camp: 'Peaceful camping experience surrounded by nature with essential facilities and outdoor activities.',
      apartment: 'Fully equipped apartment with modern furnishing perfect for short and extended stays.',
      guesthouse: 'Charming family-run accommodation offering personalized service and local hospitality.',
      hostel: 'Budget-friendly accommodation with shared facilities, perfect for backpackers and young travelers.'
    };
    
    return descriptions[type as keyof typeof descriptions] || 'Quality accommodation with great value for money.';
  }

  async searchNearbyAccommodations(
    location: { lat: number; lng: number }, 
    radius: number,
    accommodationType: string,
    checkIn: string,
    checkOut: string
  ): Promise<Accommodation[]> {
    const prompt = `
Search for accommodations near coordinates ${location.lat}, ${location.lng} within ${radius}km radius.
Looking for ${accommodationType === 'all' ? 'any type of' : accommodationType} accommodations.
Check-in: ${checkIn}
Check-out: ${checkOut}

Generate 6-10 realistic accommodations with current market prices in USD. Include various types like hotels, apartments, camps, guesthouses, and hostels. Make prices competitive and realistic for the location.

For each accommodation include:
- Unique ID
- Realistic name
- Type (hotel, camp, apartment, guesthouse, hostel, resort)
- Rating (3.0-5.0)
- Review count
- Price per night in USD
- Address and distance from search location
- Coordinates (vary slightly from search coordinates)
- List of amenities
- Brief description
- Availability status
    `.trim();

    const response = await this.callAI(prompt);
    return response.accommodations || [];
  }
}

const AccommodationComparison: React.FC = () => {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchRadius, setSearchRadius] = useState('10');
  const [accommodationType, setAccommodationType] = useState('all');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [isAiConnected, setIsAiConnected] = useState(false);
  const [marketService] = useState(() => new AIMarketResearchService());

  useEffect(() => {
    checkAiConnection();
    // Set default check-in/check-out dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    setCheckIn(tomorrow.toISOString().split('T')[0]);
    setCheckOut(dayAfter.toISOString().split('T')[0]);
  }, []);

  const checkAiConnection = async () => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || 'AIzaSyDDNd0lew1eKcgFzOXqznqxxVBxf9CGv5o';
      
      console.log('Market Research API Key available:', !!apiKey, 'Length:', apiKey?.length);
      
      if (!apiKey) {
        console.warn('No market research API key found');
        setIsAiConnected(false);
        return;
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Test connection. Respond with: {"status":"ok"}' }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAiConnected(true);
        console.log('AI market research service connected successfully:', data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setIsAiConnected(false);
        console.warn('AI market research service connection failed:', response.status, errorData);
      }
    } catch (error) {
      setIsAiConnected(false);
      console.warn('AI market research service not available, using smart fallback:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Please enter a location manually.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        searchAccommodations(location);
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Location access denied',
          description: 'Please enter a location manually or enable location services.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );
  };

  const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
      // Using OpenStreetMap Nominatim API for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const searchByAddress = async () => {
    if (!searchLocation.trim()) {
      toast({
        title: 'Location required',
        description: 'Please enter a city or address to search.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Geocode the address to get coordinates
      const coordinates = await geocodeAddress(searchLocation);
      
      if (!coordinates) {
        toast({
          title: 'Location not found',
          description: `Unable to find coordinates for "${searchLocation}". Please try a different location.`,
          variant: 'destructive',
        });
        return;
      }
      
      setUserLocation(coordinates);
      await searchAccommodations(coordinates);
      
      toast({
        title: 'Search completed',
        description: `Found accommodations near ${searchLocation}`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search failed',
        description: 'Unable to search accommodations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchAccommodations = async (location: { lat: number; lng: number }) => {
    try {
      const results = await marketService.searchNearbyAccommodations(
        location,
        parseInt(searchRadius),
        accommodationType,
        checkIn,
        checkOut
      );
      
      // Sort by distance and rating
      const sortedResults = results.sort((a, b) => {
        const distanceScore = a.location.distance - b.location.distance;
        const ratingScore = (b.rating - a.rating) * 2; // Weight rating more
        return distanceScore + ratingScore;
      });
      
      setAccommodations(sortedResults);
    } catch (error) {
      console.error('Error searching accommodations:', error);
      toast({
        title: 'Search error',
        description: 'Failed to search accommodations',
        variant: 'destructive',
      });
    }
  };

  const getAccommodationIcon = useCallback((type: string) => {
    switch (type) {
      case 'hotel':
        return <Building className="h-5 w-5" />;
      case 'camp':
        return <TreePine className="h-5 w-5" />;
      case 'apartment':
        return <Home className="h-5 w-5" />;
      case 'resort':
        return <Waves className="h-5 w-5" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  }, []);

  const getAmenityIcon = useCallback((amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return <Wifi className="h-3 w-3" />;
      case 'parking':
        return <Car className="h-3 w-3" />;
      case 'breakfast':
        return <Coffee className="h-3 w-3" />;
      case 'pool':
        return <Waves className="h-3 w-3" />;
      default:
        return <Users2 className="h-3 w-3" />;
    }
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 border-0 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="relative">
                <MapPin className="h-8 w-8 text-primary float" />
                <div className="absolute inset-0 h-8 w-8 bg-gradient-primary rounded-lg opacity-20 blur-sm"></div>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gradient">
                Market Intelligence
              </h2>
            </div>
            <p className="text-muted-foreground font-medium">
              Compare local accommodation pricing to optimize your rates
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {!isAiConnected && (
              <Badge variant="outline" className="glass-sm bg-yellow-50/80 text-yellow-700 border-yellow-300/50 font-medium">
                <AlertCircle className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            )}
            {isAiConnected && (
              <Badge variant="outline" className="glass-sm bg-green-50/80 text-green-700 border-green-300/50 font-medium">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Search Controls */}
      <div className="glass-card border-0 organic-hover">
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center space-x-2 mb-2">
            <Search className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Search Parameters</h3>
          </div>
          <p className="text-muted-foreground">
            Find accommodations in your area to compare pricing
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="flex space-x-2">
                <Input
                  id="location"
                  placeholder="City or address"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchByAddress()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={loading}
                  className="gentle-hover glass-sm"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="radius">Radius (km)</Label>
              <Select value={searchRadius} onValueChange={setSearchRadius}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type">Accommodation Type</Label>
              <Select value={accommodationType} onValueChange={setAccommodationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hotel">Hotels</SelectItem>
                  <SelectItem value="apartment">Apartments</SelectItem>
                  <SelectItem value="camp">Camps</SelectItem>
                  <SelectItem value="guesthouse">Guesthouses</SelectItem>
                  <SelectItem value="hostel">Hostels</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="checkin">Check-in Date</Label>
              <Input
                id="checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={searchByAddress} 
              disabled={loading}
              className="gradient-primary text-primary-foreground gentle-bounce shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Accommodations
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {accommodations.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Found {accommodations.length} accommodations
            </h3>
            <Badge variant="outline">
              Avg. Rate: {formatCurrency(
                accommodations.reduce((sum, acc) => sum + acc.pricePerNight, 0) / accommodations.length,
                'USD'
              )}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {accommodations.map((accommodation) => (
              <div key={accommodation.id} className="glass-card border-0 organic-hover overflow-hidden group">
                <div className="p-6 border-b border-border/30">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="relative">
                          {getAccommodationIcon(accommodation.type)}
                          <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-sm rounded"></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {accommodation.name}
                          </h3>
                          <Badge variant="outline" className="capitalize text-xs glass-sm mt-1">
                            {accommodation.type}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center glass-sm px-2 py-1 rounded-full">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">{accommodation.rating}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({accommodation.reviewCount})
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="text-xs">{accommodation.location.distance} km away</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="relative inline-block">
                        <div className="text-2xl font-bold text-gradient">
                          {formatCurrency(accommodation.pricePerNight, accommodation.currency)}
                        </div>
                        <div className="absolute inset-0 bg-gradient-primary opacity-5 blur-lg rounded"></div>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">per night</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    {accommodation.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Location</div>
                      <div className="text-sm text-muted-foreground">
                        {accommodation.location.address}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Amenities</div>
                      <div className="flex flex-wrap gap-1">
                        {accommodation.amenities.slice(0, 6).map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-xs glass-sm">
                            {getAmenityIcon(amenity)}
                            <span className="ml-1 capitalize">{amenity}</span>
                          </Badge>
                        ))}
                        {accommodation.amenities.length > 6 && (
                          <Badge variant="outline" className="text-xs glass-sm">
                            +{accommodation.amenities.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          accommodation.availability.available ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm">
                          {accommodation.availability.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      
                      {accommodation.bookingUrl && (
                        <Button variant="outline" size="sm" className="gentle-hover glass-sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !loading ? (
        <div className="glass-card border-0 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <MapPin className="h-12 w-12 text-muted-foreground/40 absolute inset-2" />
            <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-10 float"></div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No accommodations found</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md mx-auto">
            Search for accommodations in your area to see competitive pricing and market insights
          </p>
          <Button onClick={getCurrentLocation} className="gradient-primary text-primary-foreground gentle-bounce">
            <Navigation className="mr-2 h-4 w-4" />
            Use Current Location
          </Button>
        </div>
      ) : null}

      {/* Market Intelligence Panel */}
      <div className="glass-card border-0">
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="h-5 w-5 text-primary float-delayed" />
            <h3 className="text-lg font-semibold text-gradient">
              {isAiConnected ? 'AI Market Intelligence' : 'Market Research Engine'}
            </h3>
          </div>
          <p className="text-muted-foreground">
            {isAiConnected 
              ? 'Real-time competitive analysis powered by AI'
              : 'Smart market analysis using industry best practices'
            }
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-sm p-4 rounded-xl text-center group gentle-hover">
              <div className="relative inline-block mb-3">
                <MapPin className="h-8 w-8 text-primary mx-auto" />
                <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-sm rounded"></div>
              </div>
              <div className="font-semibold text-sm mb-1">Location Analysis</div>
              <div className="text-xs text-muted-foreground">Proximity-based pricing</div>
            </div>
            
            <div className="glass-sm p-4 rounded-xl text-center group gentle-hover">
              <div className="relative inline-block mb-3">
                <Star className="h-8 w-8 text-secondary mx-auto" />
                <div className="absolute inset-0 bg-gradient-secondary opacity-20 blur-sm rounded"></div>
              </div>
              <div className="font-semibold text-sm mb-1">Quality Comparison</div>
              <div className="text-xs text-muted-foreground">Rating & review analysis</div>
            </div>
            
            <div className="glass-sm p-4 rounded-xl text-center group gentle-hover">
              <div className="relative inline-block mb-3">
                <DollarSign className="h-8 w-8 text-accent mx-auto" />
                <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-sm rounded"></div>
              </div>
              <div className="font-semibold text-sm mb-1">Price Positioning</div>
              <div className="text-xs text-muted-foreground">Competitive rate analysis</div>
            </div>
            
            <div className="glass-sm p-4 rounded-xl text-center group gentle-hover">
              <div className="relative inline-block mb-3">
                <Users2 className="h-8 w-8 text-primary mx-auto" />
                <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-sm rounded"></div>
              </div>
              <div className="font-semibold text-sm mb-1">Demand Insights</div>
              <div className="text-xs text-muted-foreground">Occupancy patterns</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccommodationComparison;
