import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Building2, BarChart3, Calendar, DollarSign, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Building2 className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-primary">HostelPro</h1>
          </div>
          <h2 className="text-5xl font-bold mb-6">
            Smart Revenue Management for
            <span className="text-primary"> Hospitality</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Streamline your property management with AI-powered pricing, seamless reservations, 
            and multi-platform integration for small hotels, guesthouses, and Airbnb hosts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-3">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              View Demo
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg border border-border">
            <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Smart Reservations</h3>
            <p className="text-muted-foreground">
              Unified calendar with Airbnb, Booking.com, and Google Calendar sync. 
              Never double-book again.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border border-border">
            <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">AI Pricing Engine</h3>
            <p className="text-muted-foreground">
              Maximize revenue with automated pricing based on demand, seasonality, 
              and competitor data.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border border-border">
            <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Revenue Analytics</h3>
            <p className="text-muted-foreground">
              Track performance with detailed dashboards, occupancy metrics, 
              and revenue forecasting.
            </p>
          </div>
        </div>

        <div className="text-center bg-muted rounded-lg p-12">
          <h3 className="text-3xl font-bold mb-4">Ready to optimize your revenue?</h3>
          <p className="text-lg text-muted-foreground mb-6">
            Join hundreds of property owners who've increased their revenue by 25% on average
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-3">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
