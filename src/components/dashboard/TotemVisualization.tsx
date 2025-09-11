import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trees, 
  Calendar, 
  TrendingUp, 
  Star, 
  Users, 
  DollarSign,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface TotemMetrics {
  occupancyRate: number;
  guestSatisfaction: number;
  revenuePerRoom: number;
  overallScore: number;
  date: string;
}

interface TotemVisualizationProps {
  propertyId?: string;
  propertyName?: string;
}

const TotemVisualization: React.FC<TotemVisualizationProps> = ({ 
  propertyId = "all", 
  propertyName = "Všechny nemovitosti" 
}) => {
  const [viewMode, setViewMode] = useState<'now' | 'history'>('now');
  const [currentMetrics, setCurrentMetrics] = useState<TotemMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<TotemMetrics[]>([]);
  const [selectedDay, setSelectedDay] = useState<TotemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateMockData();
  }, [propertyId]);

  const generateMockData = () => {
    setLoading(true);
    
    // Současné metriky
    const today: TotemMetrics = {
      occupancyRate: Math.floor(Math.random() * 40 + 60), // 60-100%
      guestSatisfaction: Math.floor(Math.random() * 20 + 80), // 80-100%
      revenuePerRoom: Math.floor(Math.random() * 50 + 150), // 150-200€
      overallScore: 0,
      date: new Date().toISOString().split('T')[0]
    };
    
    today.overallScore = Math.round(
      (today.occupancyRate + today.guestSatisfaction + (today.revenuePerRoom / 2)) / 3
    );
    
    setCurrentMetrics(today);

    // Historická data za posledních 30 dní
    const historical: TotemMetrics[] = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayData: TotemMetrics = {
        occupancyRate: Math.floor(Math.random() * 40 + 50),
        guestSatisfaction: Math.floor(Math.random() * 25 + 75),
        revenuePerRoom: Math.floor(Math.random() * 80 + 120),
        overallScore: 0,
        date: date.toISOString().split('T')[0]
      };
      
      dayData.overallScore = Math.round(
        (dayData.occupancyRate + dayData.guestSatisfaction + (dayData.revenuePerRoom / 2)) / 3
      );
      
      historical.push(dayData);
    }
    
    setHistoricalData(historical);
    setLoading(false);
  };

  const getTotemHealth = (score: number): { color: string; intensity: string; status: string } => {
    if (score >= 85) return { color: 'text-primary', intensity: 'opacity-100', status: 'Vynikající' };
    if (score >= 70) return { color: 'text-accent', intensity: 'opacity-90', status: 'Dobrý' };
    if (score >= 55) return { color: 'text-secondary', intensity: 'opacity-75', status: 'Průměrný' };
    if (score >= 40) return { color: 'text-muted-foreground', intensity: 'opacity-60', status: 'Slabý' };
    return { color: 'text-destructive', intensity: 'opacity-40', status: 'Kritický' };
  };

  const renderTotem = (metrics: TotemMetrics, size: 'large' | 'mini' = 'large') => {
    const health = getTotemHealth(metrics.overallScore);
    const sizeClass = size === 'large' ? 'h-32 w-32' : 'h-8 w-8';
    
    return (
      <div className={`${sizeClass} flex items-center justify-center`}>
        <Trees 
          className={`${sizeClass} ${health.color} ${health.intensity} transition-all duration-500`}
          style={{
            filter: `drop-shadow(0 0 ${size === 'large' ? '20px' : '5px'} currentColor)`
          }}
        />
      </div>
    );
  };

  const exportData = (format: 'csv' | 'png') => {
    if (format === 'csv') {
      const csvContent = [
        ['Datum', 'Obsazenost (%)', 'Spokojenost (%)', 'Výnos (€)', 'Celkové skóre'],
        ...historicalData.map(day => [
          day.date,
          day.occupancyRate.toString(),
          day.guestSatisfaction.toString(),
          day.revenuePerRoom.toString(),
          day.overallScore.toString()
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `totem-data-${propertyName}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse">
          <Trees className="h-32 w-32 text-gray-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header s přepínačem */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Shaman Totem</h2>
          <Badge variant="outline">{propertyName}</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'now' ? 'default' : 'outline'}
            onClick={() => setViewMode('now')}
            size="sm"
          >
            Nyní
          </Button>
          <Button
            variant={viewMode === 'history' ? 'default' : 'outline'}
            onClick={() => setViewMode('history')}
            size="sm"
          >
            Historie
          </Button>
          
          {viewMode === 'history' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData('csv')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'now' ? (
        /* Současný stav */
        <div className="grid gap-6 md:grid-cols-2">
          {/* Hlavní totem */}
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center p-8">
              {currentMetrics && renderTotem(currentMetrics)}
              <div className="text-center mt-4">
                <h3 className="text-3xl font-bold mb-2">{currentMetrics?.overallScore}%</h3>
                <p className="text-lg text-muted-foreground">
                  {getTotemHealth(currentMetrics?.overallScore || 0).status}
                </p>
                <Badge className="mt-2" variant="outline">
                  Celkové skóre
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Detailní metriky */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-medium">Obsazenost</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{currentMetrics?.occupancyRate}%</div>
                    <div className="w-24 bg-muted rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentMetrics?.occupancyRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-accent" />
                    <span className="font-medium">Spokojenost hostů</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{currentMetrics?.guestSatisfaction}%</div>
                    <div className="w-24 bg-muted rounded-full h-2 mt-1">
                      <div 
                        className="bg-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentMetrics?.guestSatisfaction}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-secondary" />
                    <span className="font-medium">Výnos z pokojů</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{currentMetrics?.revenuePerRoom}€</div>
                    <div className="w-24 bg-muted rounded-full h-2 mt-1">
                      <div 
                        className="bg-secondary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (currentMetrics?.revenuePerRoom || 0) / 2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Historický pohled */
        <div className="space-y-6">
          {/* Timeline s mini-totemy */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Timeline posledních 30 dní</h3>
                <div className="flex items-center space-x-2">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    {new Date(historicalData[0]?.date || '').toLocaleDateString()} - 
                    {' ' + new Date(historicalData[historicalData.length - 1]?.date || '').toLocaleDateString()}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
              
              <div className="grid grid-cols-15 gap-2 mb-4 overflow-x-auto">
                {historicalData.slice(-15).map((day, index) => (
                  <div
                    key={day.date}
                    className="flex flex-col items-center cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setSelectedDay(day)}
                  >
                    {renderTotem(day, 'mini')}
                    <div className="text-xs mt-1 text-center">
                      {new Date(day.date).getDate()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.overallScore}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Graf celkového skóre */}
              <div className="mt-6 h-32 relative bg-muted/20 rounded-lg p-4">
                <svg viewBox="0 0 400 100" className="w-full h-full">
                  <polyline
                    points={historicalData.slice(-15).map((day, index) => 
                      `${(index / 14) * 380 + 10},${90 - (day.overallScore / 100) * 80}`
                    ).join(' ')}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary"
                  />
                  {historicalData.slice(-15).map((day, index) => (
                    <circle
                      key={day.date}
                      cx={(index / 14) * 380 + 10}
                      cy={90 - (day.overallScore / 100) * 80}
                      r="3"
                      className="fill-primary cursor-pointer"
                      onClick={() => setSelectedDay(day)}
                    />
                  ))}
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Detail vybraného dne */}
          {selectedDay && (
            <Card className="glass-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Detail pro {new Date(selectedDay.date).toLocaleDateString('cs-CZ')}
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{selectedDay.occupancyRate}%</div>
                    <div className="text-sm text-muted-foreground">Obsazenost</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <Star className="h-6 w-6 mx-auto mb-2 text-accent" />
                    <div className="text-2xl font-bold">{selectedDay.guestSatisfaction}%</div>
                    <div className="text-sm text-muted-foreground">Spokojenost</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <DollarSign className="h-6 w-6 mx-auto mb-2 text-secondary" />
                    <div className="text-2xl font-bold">{selectedDay.revenuePerRoom}€</div>
                    <div className="text-sm text-muted-foreground">Výnos/pokoj</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{selectedDay.overallScore}%</div>
                    <div className="text-sm text-muted-foreground">Celkové skóre</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TotemVisualization;