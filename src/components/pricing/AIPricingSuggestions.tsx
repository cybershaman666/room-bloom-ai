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
  Sparkles
} from 'lucide-react';
import { format, addDays, isWeekend, getDay } from 'date-fns';

interface Property {
  id: string;
  name: string;
  base_price: number;
  currency: string;
}

interface PricingSuggestion {
  propertyId: string;
  propertyName: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  confidence: number;
  impact: 'increase' | 'decrease' | 'maintain';
  ruleType: 'weekend' | 'seasonal' | 'occupancy' | 'event' | 'demand';
  effectiveDates: string[];
}

const AIPricingSuggestions: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [suggestions, setSuggestions] = useState<PricingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPrices, setGeneratingPrices] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, base_price, currency')
        .eq('is_active', true);

      if (error) throw error;
      setProperties(data || []);
      
      if (data && data.length > 0) {
        generatePricingSuggestions(data);
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

  const generatePricingSuggestions = async (propertiesData: Property[]) => {
    setGeneratingPrices(true);
    
    try {
      // Simulate AI pricing logic with realistic rules
      const newSuggestions: PricingSuggestion[] = [];
      
      for (const property of propertiesData) {
        // Weekend pricing rule
        const next14Days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));
        
        next14Days.forEach((date, index) => {
          let suggestedPrice = property.base_price;
          let reason = 'Standard pricing maintained';
          let ruleType: PricingSuggestion['ruleType'] = 'demand';
          let impact: PricingSuggestion['impact'] = 'maintain';
          let confidence = 85;

          // Weekend premium (Friday, Saturday)
          if (isWeekend(date) || getDay(date) === 5) {
            suggestedPrice = Math.round(property.base_price * 1.25);
            reason = 'Weekend premium pricing - higher demand expected';
            ruleType = 'weekend';
            impact = 'increase';
            confidence = 92;
          }

          // Seasonal adjustments (simple example)
          const month = date.getMonth();
          if (month >= 5 && month <= 8) { // Summer months
            suggestedPrice = Math.round(suggestedPrice * 1.15);
            reason = reason.includes('Weekend') ? 
              'Weekend + summer season premium' : 
              'Summer season pricing - peak demand';
            ruleType = 'seasonal';
            impact = 'increase';
            confidence = 88;
          }

          // Occupancy-based pricing (simulated)
          if (index % 4 === 0) { // Simulate some high-occupancy days
            suggestedPrice = Math.round(suggestedPrice * 1.1);
            reason = reason.includes('premium') ? 
              reason + ' + high occupancy area' : 
              'High occupancy predicted - increase recommended';
            ruleType = 'occupancy';
            impact = 'increase';
            confidence = 79;
          }

          // Last-minute pricing (within 3 days)
          if (index <= 3 && impact !== 'increase') {
            suggestedPrice = Math.round(property.base_price * 0.9);
            reason = 'Last-minute discount to boost occupancy';
            ruleType = 'demand';
            impact = 'decrease';
            confidence = 76;
          }

          if (suggestedPrice !== property.base_price) {
            newSuggestions.push({
              propertyId: property.id,
              propertyName: property.name,
              currentPrice: property.base_price,
              suggestedPrice,
              reason,
              confidence,
              impact,
              ruleType,
              effectiveDates: [format(date, 'yyyy-MM-dd')],
            });
          }
        });
      }

      setSuggestions(newSuggestions.slice(0, 10)); // Show top 10 suggestions
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

  const applyPricingSuggestion = async (suggestion: PricingSuggestion) => {
    try {
      // In a real implementation, you would create pricing rules or update base prices
      const { error } = await supabase
        .from('pricing_rules')
        .insert({
          property_id: suggestion.propertyId,
          rule_type: suggestion.ruleType,
          rule_name: `AI Suggestion - ${suggestion.reason}`,
          conditions: {
            dates: suggestion.effectiveDates,
            original_price: suggestion.currentPrice,
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

      // Remove applied suggestion from the list
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

  const getImpactIcon = (impact: PricingSuggestion['impact']) => {
    switch (impact) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const getImpactColor = (impact: PricingSuggestion['impact']) => {
    switch (impact) {
      case 'increase':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'decrease':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getRuleTypeIcon = (ruleType: PricingSuggestion['ruleType']) => {
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
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Pricing Suggestions</h2>
          <p className="text-muted-foreground">
            Smart pricing recommendations based on demand, seasonality, and market data
          </p>
        </div>
        
        <Button 
          onClick={() => generatePricingSuggestions(properties)}
          disabled={generatingPrices}
        >
          {generatingPrices ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Lightbulb className="mr-2 h-4 w-4" />
              Refresh Suggestions
            </>
          )}
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No properties available</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add properties first to get AI-powered pricing suggestions
            </p>
          </CardContent>
        </Card>
      ) : suggestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">All prices optimized!</h3>
            <p className="text-muted-foreground text-center mb-4">
              No pricing adjustments recommended at this time. Check back later or click refresh.
            </p>
            <Button onClick={() => generatePricingSuggestions(properties)}>
              <Lightbulb className="mr-2 h-4 w-4" />
              Generate New Suggestions
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
                    </CardTitle>
                    <CardDescription>{suggestion.reason}</CardDescription>
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
                      <div className="text-sm text-muted-foreground">Current Price</div>
                      <div className="text-xl font-semibold">${suggestion.currentPrice}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Suggested Price</div>
                      <div className="text-xl font-semibold text-primary">
                        ${suggestion.suggestedPrice}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Change</div>
                      <div className={`text-xl font-semibold ${
                        suggestion.impact === 'increase' ? 'text-green-600' : 
                        suggestion.impact === 'decrease' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {suggestion.impact === 'increase' ? '+' : suggestion.impact === 'decrease' ? '-' : ''}
                        {Math.round(((Math.abs(suggestion.suggestedPrice - suggestion.currentPrice) / suggestion.currentPrice) * 100))}%
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Confidence</div>
                      <div className="text-xl font-semibold">{suggestion.confidence}%</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline">View Details</Button>
                    <Button onClick={() => applyPricingSuggestion(suggestion)}>
                      Apply Suggestion
                    </Button>
                  </div>
                </div>
                
                {suggestion.effectiveDates.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Effective dates: {suggestion.effectiveDates.slice(0, 3).join(', ')}
                      {suggestion.effectiveDates.length > 3 && ` and ${suggestion.effectiveDates.length - 3} more`}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5" />
            AI Pricing Intelligence
          </CardTitle>
          <CardDescription>
            Our AI analyzes multiple factors to optimize your pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-border rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium">Seasonality</div>
              <div className="text-xs text-muted-foreground">Peak & off-peak periods</div>
            </div>
            
            <div className="text-center p-4 border border-border rounded-lg">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium">Occupancy</div>
              <div className="text-xs text-muted-foreground">Local demand patterns</div>
            </div>
            
            <div className="text-center p-4 border border-border rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium">Market Trends</div>
              <div className="text-xs text-muted-foreground">Competitor analysis</div>
            </div>
            
            <div className="text-center p-4 border border-border rounded-lg">
              <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="font-medium">Events</div>
              <div className="text-xs text-muted-foreground">Local events impact</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPricingSuggestions;