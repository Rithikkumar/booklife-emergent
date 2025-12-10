import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, BookPlus, Compass, Users, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LandingNavigation from '@/components/landing/LandingNavigation';
import FeatureCard from '@/components/landing/FeatureCard';
import StatsCard from '@/components/landing/StatsCard';
import TimelineStep from '@/components/landing/TimelineStep';
import { supabase } from '@/integrations/supabase/client';

const Landing = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ books: 0, communities: 0, classes: 0 });

  // Redirect authenticated users to explore
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/explore');
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    // Fetch real stats from the database
    const fetchStats = async () => {
      const [booksResult, communitiesResult, classesResult] = await Promise.all([
        supabase.from('user_books').select('id', { count: 'exact', head: true }),
        supabase.from('communities').select('id', { count: 'exact', head: true }),
        supabase.from('book_classes').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        books: booksResult.count || 0,
        communities: communitiesResult.count || 0,
        classes: classesResult.count || 0
      });
    };

    fetchStats();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingNavigation onNavigate={scrollToSection} />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16 pb-12">
        {/* Enhanced Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        
        {/* Enhanced Floating Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <BookOpen className="absolute top-24 left-[5%] w-20 h-20 text-primary/30 animate-[float_6s_ease-in-out_infinite] drop-shadow-lg" />
          <BookOpen className="absolute top-32 right-[8%] w-16 h-16 text-primary/20 animate-[float_8s_ease-in-out_infinite_0.5s] drop-shadow-lg" />
          <Sparkles className="absolute top-[45%] left-[10%] w-12 h-12 text-secondary/25 animate-[float_7s_ease-in-out_infinite_1s] drop-shadow-lg" />
          <BookOpen className="absolute bottom-32 right-[12%] w-18 h-18 text-primary/25 animate-[float_9s_ease-in-out_infinite_1.5s] drop-shadow-lg" />
          <Sparkles className="absolute top-[20%] right-[15%] w-8 h-8 text-primary/20 animate-[float_5s_ease-in-out_infinite_2s]" />
          <BookOpen className="absolute bottom-[20%] left-[15%] w-14 h-14 text-secondary/20 animate-[float_10s_ease-in-out_infinite_0.8s]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-6xl">
          <div className="animate-fade-in space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-primary/15 to-secondary/15 border-2 border-primary/30 shadow-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary">Track Your Books' Incredible Journey</span>
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            
            {/* Main Headline */}
            <h1 className="text-6xl md:text-8xl font-extrabold mb-6 leading-[1.1]">
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent drop-shadow-sm">
                Your Books'
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent drop-shadow-sm">
                Journey Starts Here
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed font-medium">
              Connect with passionate readers, share incredible stories, and discover the magic that happens when books travel from hand to hand
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="text-lg px-10 py-7 shadow-2xl hover:shadow-primary/50 transition-all hover:scale-105 bg-gradient-to-r from-primary to-primary/90 border-2 border-primary/20"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-7 border-2 hover:bg-primary/5 hover:border-primary/40 transition-all"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">Growing Community</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-medium">Thousands of Books</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-medium">Free to Join</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="text-sm font-semibold text-primary">POWERFUL FEATURES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Give your books a life story and connect with fellow readers around the world
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <FeatureCard
              icon={BookPlus}
              title="Register Books"
              description="Give your books a unique identity with custom codes and stickers. Track ownership and create lasting memories."
            />
            <FeatureCard
              icon={Compass}
              title="Track Journeys"
              description="Follow your books as they travel from reader to reader. See where they've been and the stories they've collected."
            />
            <FeatureCard
              icon={Users}
              title="Join Communities"
              description="Connect with book lovers who share your interests. Discuss, share recommendations, and build friendships."
            />
            <FeatureCard
              icon={GraduationCap}
              title="Book Classes"
              description="Attend live discussions and literary events. Learn from authors, critics, and passionate readers."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
              <span className="text-sm font-semibold text-secondary">SIMPLE PROCESS</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-foreground to-secondary bg-clip-text text-transparent">
              Get Started in Minutes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Join thousands of readers sharing their incredible book journeys
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <TimelineStep
                stepNumber={1}
                title="Create Account"
                description="Sign up in seconds with your email. No complex forms, just your passion for books."
                icon={Users}
              />
              <TimelineStep
                stepNumber={2}
                title="Register Your Books"
                description="Add your books to your collection. Get unique codes and optional stickers to track them."
                icon={BookPlus}
              />
              <TimelineStep
                stepNumber={3}
                title="Share & Connect"
                description="Release books into the world, join communities, and watch the magic happen."
                icon={Compass}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats Section */}
      <section id="community" className="py-16 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="text-sm font-semibold text-primary">JOIN THE MOVEMENT</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Our Thriving Community
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Be part of a vibrant community of readers sharing their love for books
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <StatsCard
              number={stats.books}
              label="Books Registered"
              icon={BookOpen}
            />
            <StatsCard
              number={stats.communities}
              label="Active Communities"
              icon={Users}
            />
            <StatsCard
              number={stats.classes}
              label="Classes Held"
              icon={GraduationCap}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary/15 to-primary/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-background/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in bg-background/40 backdrop-blur-sm rounded-3xl p-12 border-2 border-primary/20 shadow-2xl">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-6 animate-pulse" />
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Ready to Begin Your Book's Adventure?
            </h2>
            <p className="text-xl text-muted-foreground/90 mb-10 font-medium leading-relaxed">
              Join our community today and start tracking your books' incredible journeys around the world
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-12 py-7 shadow-2xl hover:shadow-primary/50 transition-all hover:scale-105 bg-gradient-to-r from-primary to-primary/90 border-2 border-primary/20"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Join Now - It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-12 py-7 border-2 hover:bg-primary/5 hover:border-primary/40 transition-all"
                onClick={() => scrollToSection('features')}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">BookPassing</span>
            </div>
            
            <div className="flex gap-8 text-sm text-muted-foreground">
              <button onClick={() => navigate('/help')} className="hover:text-foreground transition-colors">
                Help
              </button>
              <button onClick={() => scrollToSection('features')} className="hover:text-foreground transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('community')} className="hover:text-foreground transition-colors">
                Community
              </button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2025 BookPassing. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
