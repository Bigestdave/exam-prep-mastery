import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { OfflineFallback } from "@/components/OfflineFallback";
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
import Survey from "./pages/Survey";
import AmbassadorUpload from "./pages/AmbassadorUpload";
import AmbassadorDashboard from "./pages/AmbassadorDashboard";
import Quiz from "./pages/Quiz";
import VipRedirect from "./pages/VipRedirect";
import Withdraw from "./pages/Withdraw";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const isOnline = useOnlineStatus();

  if (!isOnline) return <OfflineFallback />;

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/course/:id/answer/:questionId" element={<AnswerView />} />
          <Route path="/course/:id/quiz" element={<Quiz />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/request-course" element={<RequestCourse />} />
          <Route path="/library" element={<Library />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/upload" element={<AmbassadorUpload />} />
          <Route path="/ambassador" element={<AmbassadorDashboard />} />
          <Route path="/withdraw" element={<Withdraw />} />
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
