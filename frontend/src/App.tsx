import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./components/auth/AuthGuard";

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



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to explore */}
          <Route path="/" element={
            <AuthGuard>
              <Explore />
            </AuthGuard>
          } />
          <Route path="/auth" element={
            <AuthGuard requireAuth={false}>
              <Auth />
            </AuthGuard>
          } />
          
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
            <AuthGuard requireAuth={false}>
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
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
