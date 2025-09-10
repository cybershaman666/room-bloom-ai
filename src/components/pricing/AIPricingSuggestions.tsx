import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Target,
  Lightbulb,
  Clock,
  Sparkles,
  Brain,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  base_price: number;
  currency: string;
  location?: string;
  type?: string;
  amenities?: string[];
}

interface AIPricingSuggestion {
  propertyId: string;
  propertyName: string;
  date: string;
  currentPrice: number;
  suggestedPrice: number;
  confidence: number;
  reasoning: string;
  factors: string[];
  impact: 'increase' | 'decrease' | 'maintain';
  ruleType: string;
}

// AI Service class
class AIPricingService {
  private generateSmartSuggestions(property: Property) {
    const suggestions = [];
    const dates = this.getNext14Days();
    const basePrice = property.base_price;
    
    dates.forEach((date, index) => {
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      const isHoliday = this.isHoliday(dateObj);
      const isLastMinute = index <= 2;
      
      let multiplier = 1.0;
      let reasoning = 'Standard pricing maintained';
      let factors = ['baseline'];
      let impact: 'increase' | 'decrease' | 'maintain' = 'maintain';
      
      // Weekend premium
      if (isWeekend) {
        multiplier *= 1.25;
        reasoning = 'Weekend premium - higher leisure demand';
        factors = ['weekend', 'demand'];
        impact = 'increase';
      }
      
      // Holiday premium
      if (isHoliday) {
        multiplier *= 1.15;
        reasoning += (reasoning.includes('Weekend') ? ' + holiday period' : 'Holiday period pricing');
        factors.push('holiday');
        impact = 'increase';
      }
      
      // Last-minute discount for non-peak days
      if (isLastMinute && !isWeekend && !isHoliday) {
        multiplier *= 0.9;
        reasoning = 'Last-minute discount to boost occupancy';
        factors = ['last_minute', 'occupancy'];
        impact = 'decrease';
      }
      
      // Seasonal adjustment
      const month = dateObj.getMonth();
      if (month >= 5 && month <= 8) { // Summer
        multiplier *= 1.1;
        if (!reasoning.includes('premium')) {
          reasoning += ' + summer season adjustment';
        }
        factors.push('seasonal');
      }
      
      // Winter discount (except holidays)
      if ((month >= 11 || month <= 2) && !isHoliday) {
        multiplier *= 0.95;
        if (!reasoning.includes('discount')) {
          reasoning += ' + winter season adjustment';
        }
        factors.push('seasonal');
        if (impact === 'maintain') impact = 'decrease';
      }
      
      const suggestedPrice = Math.round(basePrice * multiplier);
      
      if (suggestedPrice !== basePrice) {
        suggestions.push({
          date,
          suggestedPrice,
          confidence: this.calculateConfidence(factors, isWeekend, isHoliday),
          reasoning,
          factors,
          impact
        });
      }
    });
    
    return { suggestions };
  }
  
  private getNext14Days(): string[] {
    const dates = [];
    for (let i = 1; i <= 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }
  
  private isHoliday(date: Date): boolean {
    const holidays = [
      { month: 11, day: 25 }, // Christmas
      { month: 0, day: 1 },   // New Year
      { month: 6, day: 4 },   // July 4th
      { month: 11, day: 24 }, // Christmas Eve
      { month: 11, day: 31 }, // New Year's Eve
      { month: 9, day: 31 },  // Halloween
    ];
    
    return holidays.some(h => 
      date.getMonth() === h.month && date.getDate() === h.day
    );
  }
  
  private calculateConfidence(factors: string[], isWeekend: boolean, isHoliday: boolean): number {
    let confidence = 75;
    
    if (isWeekend) confidence += 15;
    if (isHoliday) confidence += 10;
    if (factors.includes('seasonal')) confidence += 5;
    if (factors.includes('last_minute')) confidence -= 10;
    if (factors.length > 2) confidence += 5; // Multiple factors increase confidence
    
    return Math.min(95, Math.max(60, confidence));
  }

  async generatePricingSuggestions(properties: Property[]): Promise<AIPricingSuggestion[]> {
    const allSuggestions: AIPricingSuggestion[] = [];
    
    for (const property of properties) {
      const response = this.generateSmartSuggestions(property);
      
      const suggestions = response.suggestions?.map((s: any) => ({
        propertyId: property.id,
        propertyName: property.name,
        date: s.date,
        currentPrice: property.base_price,
        suggestedPrice: s.suggestedPrice,
        confidence: s.confidence,
        reasoning: s.reasoning,
        factors: s.factors,
        impact: s.impact,
        ruleType: this.determineRuleType(s.factors)
      })) || [];
      
      allSuggestions.push(...suggestions);
    }
    
    // Sort by confidence and potential revenue impact
    return allSuggestions
      .sort((a, b) => {
        const aImpact = Math.abs(a.suggestedPrice - a.currentPrice) * (a.confidence / 100);
        const bImpact = Math.abs(b.suggestedPrice - b.currentPrice) * (b.confidence / 100);
        return bImpact - aImpact;
      })
      .slice(0, 12);
  }
  
  private determineRuleType(factors: string[]): string {
    if (factors.includes('weekend')) return 'weekend';
    if (factors.includes('seasonal')) return 'seasonal';
    if (factors.includes('holiday')) return 'event';
    if (factors.includes('last_minute')) return 'demand';
    return 'occupancy';
  }
}

const AIPricingSuggestions: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [suggestions, setSuggestions] = useState<AIPricingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPrices, setGeneratingPrices] = useState(false);
  const [aiService] = useState(() => new AIPricingService());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);


  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, base_price, currency, city, country, property_type, amenities')
        .eq('is_active', true);

      if (error) throw error;
      
      // Transform data to match expected interface
      const transformedData = data?.map(property => ({
        ...property,
        location: `${property.city}, ${property.country}`,
        type: property.property_type
      })) || [];
      
      setProperties(transformedData);
      
      if (transformedData.length > 0) {
        await generatePricingSuggestions(transformedData);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch properties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePricingSuggestions = async (propertiesData?: Property[]) => {
    setGeneratingPrices(true);
    
    try {
      const targetProperties = propertiesData || properties;
      if (targetProperties.length === 0) {
        setSuggestions([]);
        setLastUpdated(new Date());
        return;
      }
      
      const newSuggestions = await aiService.generatePricingSuggestions(targetProperties);
      setSuggestions(newSuggestions);
      setLastUpdated(new Date());
      
      toast({
        title: 'Success',
        description: `Generated ${newSuggestions.length} pricing suggestions`,
      });
    } catch (error) {
      console.error('Error generating pricing suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate pricing suggestions',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPrices(false);
    }
  };

  const applyPricingSuggestion = async (suggestion: AIPricingSuggestion) => {
    try {
      const { error } = await supabase
        .from('pricing_rules')
        .insert({
          property_id: suggestion.propertyId,
          rule_type: suggestion.ruleType,
          rule_name: `AI Suggestion - ${suggestion.reasoning}`,
          conditions: {
            dates: [suggestion.date],
            original_price: suggestion.currentPrice,
            ai_confidence: suggestion.confidence,
            factors: suggestion.factors
          },
          price_adjustment: suggestion.suggestedPrice - suggestion.currentPrice,
          is_percentage: false,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Pricing suggestion applied successfully',
      });

      setSuggestions(suggestions.filter(s => s !== suggestion));
    } catch (error) {
      console.error('Error applying pricing suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply pricing suggestion',
        variant: 'destructive',
      });
    }
  };

  const getImpactIcon = (impact: AIPricingSuggestion['impact']) => {
    switch (impact) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const getImpactColor = (impact: AIPricingSuggestion['impact']) => {
    switch (impact) {
      case 'increase':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'decrease':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'weekend':
        return <Calendar className="h-4 w-4" />;
      case 'seasonal':
        return <Sparkles className="h-4 w-4" />;
      case 'occupancy':
        return <Users className="h-4 w-4" />;
      case 'event':
        return <Target className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mb-4" />
              <div className="h-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <Brain className="mr-3 h-8 w-8 text-purple-600" />
            AI Pricing Suggestions
          </h2>
          <p className="text-gray-600">
            Smart pricing recommendations powered by advanced algorithms
            {lastUpdated && (
              <span className="text-sm text-muted-foreground ml-2">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => generatePricingSuggestions()}
            disabled={generatingPrices}
          >
            {generatingPrices ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No properties available</h3>
            <p className="text-gray-600 text-center mb-4">
              Add properties first to get AI-powered pricing suggestions
            </p>
          </CardContent>
        </Card>
      ) : suggestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">All prices optimized!</h3>
            <p className="text-gray-600 text-center mb-4">
              No pricing adjustments recommended at this time. Check back later or refresh analysis.
            </p>
            <Button onClick={() => generatePricingSuggestions()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      {getRuleTypeIcon(suggestion.ruleType)}
                      <span className="ml-2">{suggestion.propertyName}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {new Date(suggestion.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{suggestion.reasoning}</CardDescription>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {suggestion.factors.map(factor => (
                        <Badge key={factor} variant="secondary" className="text-xs">
                          {factor.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge className={getImpactColor(suggestion.impact)}>
                    {getImpactIcon(suggestion.impact)}
                    <span className="ml-1">
                      {suggestion.impact === 'increase' ? '+' : suggestion.impact === 'decrease' ? '-' : ''}
                      ${Math.abs(suggestion.suggestedPrice - suggestion.currentPrice)}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Current</div>
                      <div className="text-xl font-semibold">${suggestion.currentPrice}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600">AI Suggested</div>
                      <div className="text-xl font-semibold text-blue-600">
                        ${suggestion.suggestedPrice}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Change</div>
                      <div className={`text-xl font-semibold ${
                        suggestion.impact === 'increase' ? 'text-green-600' : 
                        suggestion.impact === 'decrease' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {suggestion.impact === 'increase' ? '+' : suggestion.impact === 'decrease' ? '-' : ''}
                        {Math.round(((Math.abs(suggestion.suggestedPrice - suggestion.currentPrice) / suggestion.currentPrice) * 100))}%
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Confidence</div>
                      <div className="text-xl font-semibold">{suggestion.confidence}%</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button size="sm" onClick={() => applyPricingSuggestion(suggestion)}>
                      Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5" />
            Smart Pricing Engine
          </CardTitle>
          <CardDescription>
            Advanced algorithms optimize pricing using proven hospitality rules and market patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium">Seasonality</div>
              <div className="text-xs text-gray-600">Peak & off-peak periods</div>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">Demand Patterns</div>
              <div className="text-xs text-gray-600">Weekend & event premiums</div>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium">Market Analysis</div>
              <div className="text-xs text-gray-600">Competitive positioning</div>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="font-medium">Revenue Focus</div>
              <div className="text-xs text-gray-600">Maximize total revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPricingSuggestions;
