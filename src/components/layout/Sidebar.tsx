import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  ChevronDown,
  ChevronRight,
  MapPin
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  property_type: string;
}

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user, signOut } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesExpanded, setPropertiesExpanded] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, property_type')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Rooms', icon: Building2 },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'pricing', label: 'AI Pricing', icon: DollarSign },
    { id: 'market', label: 'Nearby Rates', icon: MapPin },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full glass-card border-r border-sidebar-border/50">
      <div className="p-6 border-b border-sidebar-border/30">
        <div className="flex items-center">
          <div className="relative">
            <Building2 className="h-8 w-8 text-sidebar-primary mr-3 float" />
            <div className="absolute inset-0 h-8 w-8 bg-gradient-primary rounded-lg opacity-20 blur-sm mr-3"></div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gradient">RoomBloom</h2>
            <p className="text-sm text-sidebar-foreground/70 font-medium">Revenue Management</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start gentle-hover relative overflow-hidden group ${
                  isActive 
                    ? "glass-sm bg-gradient-primary text-primary-foreground shadow-lg" 
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                onClick={() => onPageChange(item.id)}
              >
                <Icon className={`mr-3 h-4 w-4 transition-all duration-200 ${
                  isActive ? "text-primary-foreground" : "group-hover:scale-110"
                }`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-lg"></div>
                )}
              </Button>
            );
          })}
        </div>
      </nav>
      
      {/* Properties Section */}
      {properties.length > 0 && (
        <div className="px-4 pb-4">
          <div className="glass-sm rounded-xl p-3 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-between text-sm font-medium text-muted-foreground hover:text-foreground gentle-hover"
              onClick={() => setPropertiesExpanded(!propertiesExpanded)}
            >
              <span className="flex items-center">
                <Building2 className="h-4 w-4 mr-2 opacity-70" />
                Properties ({properties.length})
              </span>
              {propertiesExpanded ? (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              )}
            </Button>
            
            {propertiesExpanded && (
              <div className="mt-2">
                <ScrollArea className="h-32">
                  <div className="space-y-1 pl-2">
                    <Button
                      variant={selectedProperty === 'all' ? 'secondary' : 'ghost'}
                      className={`w-full justify-start text-sm gentle-hover ${
                        selectedProperty === 'all' ? 'glass-sm bg-primary/20 text-primary' : ''
                      }`}
                      onClick={() => setSelectedProperty('all')}
                    >
                      <Building2 className="mr-2 h-3 w-3" />
                      Všechny nemovitosti
                    </Button>
                    
                    {properties.map((property) => (
                      <Button
                        key={property.id}
                        variant={selectedProperty === property.id ? 'secondary' : 'ghost'}
                        className={`w-full justify-start text-sm gentle-hover ${
                          selectedProperty === property.id ? 'glass-sm bg-primary/20 text-primary' : ''
                        }`}
                        onClick={() => setSelectedProperty(property.id)}
                      >
                        <Building2 className="mr-2 h-3 w-3" />
                        <div className="flex-1 text-left">
                          <div className="truncate font-medium">{property.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {property.property_type.replace('_', ' ')}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="p-4 border-t border-sidebar-border/30">
        <div className="mb-3 glass-sm p-4 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="relative">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                  {(user?.user_metadata?.full_name || user?.email || 'U')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <Badge variant="outline" className="text-xs mt-1 bg-primary/10 text-primary border-primary/30">
                  Property Owner
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-red-500 hover:bg-red-50 gentle-hover group"
          onClick={signOut}
        >
          <LogOut className="mr-3 h-4 w-4 group-hover:animate-pulse" />
          <span className="font-medium">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;