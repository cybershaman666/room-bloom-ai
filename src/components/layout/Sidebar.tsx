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
  ChevronRight
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
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'pricing', label: 'AI Pricing', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center">
          <Building2 className="h-8 w-8 text-sidebar-primary mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">RoomBloom</h2>
            <p className="text-sm text-sidebar-foreground/60">Revenue Management</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                className={`w-full justify-start ${
                  currentPage === item.id 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : ""
                }`}
                onClick={() => onPageChange(item.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>
      
      {/* Properties Section */}
      {properties.length > 0 && (
        <div className="px-4 pb-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-between text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setPropertiesExpanded(!propertiesExpanded)}
            >
              <span>Properties ({properties.length})</span>
              {propertiesExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            
            {propertiesExpanded && (
              <ScrollArea className="h-32">
                <div className="space-y-1 pl-4">
                  <Button
                    variant={selectedProperty === 'all' ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-sm"
                    onClick={() => setSelectedProperty('all')}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Všechny nemovitosti
                  </Button>
                  
                  {properties.map((property) => (
                    <Button
                      key={property.id}
                      variant={selectedProperty === property.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-sm"
                      onClick={() => setSelectedProperty(property.id)}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      <div className="flex-1 text-left">
                        <div className="truncate">{property.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {property.property_type.replace('_', ' ')}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      )}
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="mb-3 p-3 bg-sidebar-accent rounded-lg">
          <p className="text-sm font-medium text-sidebar-accent-foreground">
            {user?.user_metadata?.full_name || user?.email}
          </p>
          <p className="text-xs text-sidebar-accent-foreground/60">Property Owner</p>
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground"
          onClick={signOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;