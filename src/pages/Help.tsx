import React from 'react';
import { 
  BookOpen, 
  Users, 
  Search, 
  MessageCircle, 
  Settings, 
  Lock, 
  MapPin, 
  Heart,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScrollRestoreLayout from '@/components/common/ScrollRestoreLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const Help = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: "Add Your Books",
      description: "Keep track of all the books you own. Add a title, author, and even a cover photo!",
      action: "Add a Book",
      path: "/register-book",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    },
    {
      icon: Search,
      title: "Explore Books",
      description: "Discover books from readers all around. Find new stories to read!",
      action: "Start Exploring",
      path: "/explore",
      color: "bg-green-500/10 text-green-600 dark:text-green-400"
    },
    {
      icon: Users,
      title: "Join Communities",
      description: "Meet other book lovers! Chat about your favorite stories together.",
      action: "Find Communities",
      path: "/communities",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
    },
    {
      icon: MessageCircle,
      title: "Book Classes",
      description: "Join live video chats to talk about books with other readers.",
      action: "Join a Class",
      path: "/book-classes",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400"
    }
  ];

  const faqs = [
    {
      question: "How do I add my first book?",
      answer: "Tap 'Add a Book' from the home screen or menu. Type in the book's title and author, then save it. That's it! Your book will show up on your profile."
    },
    {
      question: "How do I make my account private?",
      answer: "Go to Settings (the gear icon) → tap on 'Private Account' toggle. When private, only people you approve can see your books."
    },
    {
      question: "How do I show my location on my profile?",
      answer: "First, make sure you've added a location in Edit Profile. Then go to Settings → turn on 'Show Location'. If you haven't added a location yet, it won't show anything!"
    },
    {
      question: "How do I change how the app looks?",
      answer: "Go to Settings → Appearance → Theme. Pick Light (bright), Dark (easy on eyes at night), or System (matches your phone settings)."
    },
    {
      question: "How do I join a book class?",
      answer: "Tap 'Book Classes' in the menu. You'll see live and upcoming classes. Tap 'Join' on any class you like!"
    },
    {
      question: "How do I follow someone?",
      answer: "Visit their profile and tap the 'Follow' button. You'll see their new books and activities in your feed!"
    },
    {
      question: "How do I message someone?",
      answer: "Go to their profile and tap 'Message'. You can chat about books, recommend reads, or just say hi!"
    },
    {
      question: "How do I change my profile picture?",
      answer: "Go to Edit Profile → tap on your profile picture → choose 'Upload new photo' and pick an image from your device."
    }
  ];

  return (
    <ScrollRestoreLayout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">How Can We Help? 📚</h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about using the app
          </p>
        </div>

        {/* What You Can Do */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            What You Can Do
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <Card 
                key={feature.title} 
                className="group cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20"
                onClick={() => navigate(feature.path)}
              >
                <CardContent className="p-5">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${feature.color} mb-3`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                  <div className="flex items-center text-sm font-medium text-primary group-hover:underline">
                    {feature.action}
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Common Questions */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Common Questions
          </h2>
          <Card>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="border-b last:border-b-0"
                  >
                    <AccordionTrigger className="px-5 py-4 text-left hover:no-underline hover:bg-accent/50">
                      <span className="font-medium text-foreground">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4 text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Quick Settings Shortcuts */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Quick Shortcuts
          </h2>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              className="justify-between h-auto py-4 px-5"
              onClick={() => navigate('/settings')}
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Privacy Settings</p>
                  <p className="text-xs text-muted-foreground">Make your account private</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="justify-between h-auto py-4 px-5"
              onClick={() => navigate('/edit-profile')}
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Edit Profile</p>
                  <p className="text-xs text-muted-foreground">Update your info and location</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </section>

        {/* Still Need Help */}
        <section>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">🤔</div>
              <h3 className="font-semibold text-foreground mb-2">Still have questions?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Don't worry! Just explore the app and try things out. You can always come back here if you get stuck.
              </p>
              <Button onClick={() => navigate('/explore')}>
                Start Exploring
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </ScrollRestoreLayout>
  );
};

export default Help;
