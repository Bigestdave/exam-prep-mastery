import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CourseDetail from "./pages/CourseDetail";
import AnswerView from "./pages/AnswerView";
import Profile from "./pages/Profile";
import RequestCourse from "./pages/RequestCourse";
import Library from "./pages/Library";

import AmbassadorUpload from "./pages/AmbassadorUpload";
import AmbassadorDashboard from "./pages/AmbassadorDashboard";
import Quiz from "./pages/Quiz";
import QuizHub from "./pages/QuizHub";
import VipRedirect from "./pages/VipRedirect";
import Withdraw from "./pages/Withdraw";
import Onboarding from "./pages/Onboarding";
import ModifierDashboard from "./pages/ModifierDashboard";
import BecomeAmbassador from "./pages/BecomeAmbassador";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/index" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/course/:id/answer/:questionId" element={<AnswerView />} />
          <Route path="/course/:id/quiz" element={<Quiz />} />
          <Route path="/quiz-hub" element={<QuizHub />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/request-course" element={<RequestCourse />} />
          <Route path="/library" element={<Library />} />
          
          <Route path="/upload" element={<AmbassadorUpload />} />
          <Route path="/ambassador" element={<AmbassadorDashboard />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/modifier" element={<ModifierDashboard />} />
          <Route path="/become-ambassador" element={<BecomeAmbassador />} />
          <Route path="/vip/:code" element={<VipRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileBottomNav />
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
