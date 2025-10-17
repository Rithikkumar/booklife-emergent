import React from 'react';
import { ArrowLeft, HelpCircle, MessageCircle, Book, Mail, Phone, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScrollRestoreLayout from '@/components/common/ScrollRestoreLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Help = () => {
  const navigate = useNavigate();

  const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
    <div className="py-4">
      <h3 className="text-sm font-medium text-foreground mb-2">{question}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
    </div>
  );

  const ContactOption = ({ 
    icon: Icon, 
    title, 
    description, 
    action,
    href
  }: {
    icon: any;
    title: string;
    description: string;
    action: string;
    href?: string;
  }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground mb-3">{description}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => href && window.open(href, '_blank')}
              className="h-8"
            >
              {action}
              {href && <ExternalLink className="h-3 w-3 ml-2" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ScrollRestoreLayout>
      <div className="max-w-4xl mx-auto py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
          <p className="text-sm text-muted-foreground">Find answers and get support</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Book className="h-5 w-5" />
                  <span>Getting Started</span>
                </CardTitle>
                <CardDescription>
                  Learn the basics of using our book sharing platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">Setting up your profile</p>
                      <p className="text-xs text-muted-foreground">Complete your profile to start connecting with other readers</p>
                    </div>
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">Registering your first book</p>
                      <p className="text-xs text-muted-foreground">Learn how to add books to your personal library</p>
                    </div>
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">Joining book classes</p>
                      <p className="text-xs text-muted-foreground">Discover how to participate in virtual book discussions</p>
                    </div>
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">Following other readers</p>
                      <p className="text-xs text-muted-foreground">Build your reading community by connecting with others</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5" />
                  <span>Frequently Asked Questions</span>
                </CardTitle>
                <CardDescription>
                  Quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <FAQItem
                    question="How do I make my profile private?"
                    answer="Go to Settings > Account and toggle the 'Private Account' option. When your account is private, only approved followers can see your book collection."
                  />
                  <Separator />
                  <FAQItem
                    question="Can I host my own book classes?"
                    answer="Yes! Navigate to Book Classes and click 'Host a Class'. You can schedule discussions for any book and invite other readers to join."
                  />
                  <Separator />
                  <FAQItem
                    question="How do I find books in my area?"
                    answer="Use the Explore page to search for books by location. You can filter results by city to find books available near you."
                  />
                  <Separator />
                  <Separator />
                  <FAQItem
                    question="How do I delete a book from my collection?"
                    answer="Go to your profile, select the Books tab, find the book you want to remove, and use the delete option. This action cannot be undone."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Features</CardTitle>
                <CardDescription>
                  Explore what you can do on our platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Book Registration</h3>
                    <p className="text-xs text-muted-foreground">Track your personal book collection with detailed information and sharing options.</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Book Communities</h3>
                    <p className="text-xs text-muted-foreground">Join communities, share book recommendations, and connect with other book enthusiasts.</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Virtual Classes</h3>
                    <p className="text-xs text-muted-foreground">Join or host live book discussions and reading sessions.</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Communities</h3>
                    <p className="text-xs text-muted-foreground">Discover and join communities based on your reading interests.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need More Help?</CardTitle>
                <CardDescription>
                  Get in touch with our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContactOption
                  icon={MessageCircle}
                  title="Live Chat"
                  description="Chat with our support team in real-time"
                  action="Start Chat"
                />
                <ContactOption
                  icon={Mail}
                  title="Email Support"
                  description="Send us a detailed message"
                  action="Send Email"
                  href="mailto:support@booksharing.com"
                />
                <ContactOption
                  icon={Phone}
                  title="Phone Support"
                  description="Call us during business hours"
                  action="Call Now"
                  href="tel:+1-555-0123"
                />
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate('/settings')}
                >
                  Account Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate('/communities')}
                >
                  Browse Communities
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate('/book-classes')}
                >
                  Join Book Classes
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate('/register-book')}
                >
                  Add a Book
                </Button>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">All systems operational</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: 2 minutes ago
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ScrollRestoreLayout>
  );
};

export default Help;