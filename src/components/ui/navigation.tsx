import { Button } from "@/components/ui/button";
import { BookOpen, Compass, Users, GraduationCap, BookPlus, Menu, Sparkles } from "lucide-react";
import ProfileDropdown from '@/components/profile/ProfileDropdown';
import MessagesDropdown from '@/components/profile/MessagesDropdown';
import UserSearchInput from '@/components/common/UserSearchInput';
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const Navigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navigationItems = [
    { path: "/register-book", label: "Register Book", icon: BookPlus, isHighlighted: true },
    { path: "/explore", label: "Explore", icon: Compass },
    { path: "/communities", label: "Communities", icon: Users },
    { path: "/book-classes", label: "Book Classes", icon: GraduationCap },
  ];
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card backdrop-blur-md border-b border-border transform-gpu will-change-transform">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo - fixed width to prevent reflow */}
          <Link to="/explore" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="p-1.5 sm:p-2 bg-gradient-primary rounded-lg shadow-glow">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              BookPassing
            </h1>
          </Link>

          {/* Search Bar - flex-1 with fixed margins */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <UserSearchInput className="w-full" />
          </div>

          {/* Desktop Navigation Items - flex-shrink-0 to prevent compression */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
            {navigationItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`flex items-center space-x-2 font-bold relative overflow-visible
                    after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 
                    after:bg-primary after:transition-transform after:duration-200 after:origin-center
                    after:will-change-transform
                    ${isActive(item.path) ? 'after:scale-x-100' : 'after:scale-x-0'}
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.isHighlighted && (
                    <Sparkles className="h-3 w-3 text-accent absolute -top-2 -right-2 z-20 pointer-events-none animate-pulse" />
                  )}
                </Button>
              </Link>
            ))}
          </div>

          {/* Mobile/Tablet Navigation - fixed width container */}
          <div className="lg:hidden flex items-center gap-2 mr-2 flex-shrink-0" style={{ minWidth: '140px', justifyContent: 'flex-end' }}>
            <MessagesDropdown />
            <ProfileDropdown />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 h-9 w-9 flex-shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">Navigation</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {navigationItems.map((item) => (
                    <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className={`w-full justify-start h-12 px-4 relative ${isActive(item.path) ? 'bg-primary/10 text-primary' : ''}`}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="text-left">{item.label}</span>
                        </div>
                        {item.isHighlighted && (
                          <Sparkles className="h-3 w-3 text-accent absolute top-2 right-2 pointer-events-none" />
                        )}
                      </Button>
                    </Link>
                  ))}
                  {!isAuthenticated && (
                    <div className="pt-4 border-t space-y-2">
                      <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                        Sign In
                      </Button>
                      <Button className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300" onClick={() => setIsOpen(false)}>
                        Join BookPassing
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop User Actions - fixed width container to prevent reflow */}
          <div 
            className="hidden lg:flex items-center gap-3 ml-8 mr-2 flex-shrink-0" 
            style={{ minWidth: '100px', justifyContent: 'flex-end' }}
          >
            <MessagesDropdown />
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
