import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./components/auth/AuthGuard";
import { useNativeFeatures } from "./hooks/useNativeFeatures";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useEffect } from "react";
import { cleanupExpiredCaches } from "./utils/securityCache";

import Landing from "./pages/Landing";
import RegisterBook from "./pages/RegisterBook";
import Explore from "./pages/Explore";
import BookDetails from "./pages/BookDetails";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import BookClasses from "./pages/BookClasses";
import LiveClass from "./pages/LiveClass";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import FollowingJourneys from "@/pages/FollowingJourneys";
import Settings from "./pages/Settings";
import Security from "./pages/Security";
import AdminSecurity from "./pages/AdminSecurity";
import Help from "./pages/Help";
import Auth from "./pages/Auth";
import Messages from "./pages/Messages";
import MessageThread from "./pages/MessageThread";
import ScanBook from "./pages/ScanBook";



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const App = () => {
  const { isNative } = useNativeFeatures();
  const { isSupported } = usePushNotifications();

  useEffect(() => {
    // Clean up expired caches on app startup
    cleanupExpiredCaches();
    
    if (isNative) {
      console.log('Running as native app with push notifications:', isSupported);
    }
  }, [isNative, isSupported]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          {/* Landing page - no auth required */}
          <Route path="/" element={<Landing />} />
          
          <Route path="/auth" element={
            <AuthGuard requireAuth={false}>
              <Auth />
            </AuthGuard>
          } />
          
          {/* Scan route - handles QR code scans, manages its own auth redirect */}
          <Route path="/scan/:code" element={<ScanBook />} />
          
          {/* Protected routes */}
          <Route path="/register-book" element={
            <AuthGuard>
              <RegisterBook />
            </AuthGuard>
          } />
          <Route path="/explore" element={
            <AuthGuard>
              <Explore />
            </AuthGuard>
          } />
          <Route path="/book/:id" element={
            <AuthGuard>
              <BookDetails />
            </AuthGuard>
          } />
          <Route path="/communities" element={
            <AuthGuard>
              <Communities />
            </AuthGuard>
          } />
          <Route path="/communities/:communityId" element={
            <AuthGuard>
              <CommunityDetail />
            </AuthGuard>
          } />
          <Route path="/book-classes" element={
            <AuthGuard>
              <BookClasses />
            </AuthGuard>
          } />
          <Route path="/class/:id" element={
            <AuthGuard>
              <LiveClass />
            </AuthGuard>
          } />
          <Route path="/profile" element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          } />
          <Route path="/profile/:username" element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          } />
          <Route path="/edit-profile" element={
            <AuthGuard>
              <EditProfile />
            </AuthGuard>
          } />
          <Route path="/following-journeys" element={
            <AuthGuard>
              <FollowingJourneys />
            </AuthGuard>
          } />
          <Route path="/settings" element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          } />
          <Route path="/security" element={
            <AuthGuard>
              <Security />
            </AuthGuard>
          } />
          <Route path="/admin/security" element={
            <AuthGuard>
              <AdminSecurity />
            </AuthGuard>
          } />
          <Route path="/help" element={
            <AuthGuard>
              <Help />
            </AuthGuard>
          } />
          <Route path="/messages" element={
            <AuthGuard>
              <Messages />
            </AuthGuard>
          } />
          <Route path="/messages/:conversationId" element={
            <AuthGuard>
              <MessageThread />
            </AuthGuard>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
