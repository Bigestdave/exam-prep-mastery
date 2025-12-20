import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { levels } from "@/data/courses";

// THE UPDATED DEPARTMENT LIST
const departments = [
  "Information Resource Management (IRM)",
  "Library & Information Science (LIS)",
  "Mass Communication",
  "Computer Science",
  "Business Administration"
];

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    faculty: "", // Keeps 'faculty' key for database consistency
    level: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.faculty || !formData.level) {
      toast({
        title: "Missing information",
        description: "Please select your department and level.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await signup(formData);
    
    if (error) {
      toast({
        title: "Signup failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    toast({
      title: "Account created!",
      description: "Welcome to LCU Prep!",
    });
    navigate("/dashboard");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Left Panel - Professional Navy */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        
        <div>
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Start your exam prep journey
          </h1>
          <p className="text-lg text-slate-400">
            Join thousands of students achieving first-class results.
          </p>
        </div>
        
        <p className="text-sm text-slate-500">
          © 2025 LCU Prep
        </p>
      </div>

      {/* Right Panel - Clean Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-premium border border-slate-100">
          <Link to="/" className="lg:hidden flex items-center gap-2 text-muted-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2 tracking-tight">Create account</h2>
            <p className="text-muted-foreground font-medium">
              Enter your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-bold text-[#0F172A] ml-1">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Okonkwo David"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-[#0F172A] ml-1">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="david@student.lcu.edu.ng"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" id="password" className="font-bold text-[#0F172A] ml-1">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-[#0F172A] ml-1">Department</Label>
                <Select
                  value={formData.faculty}
                  onValueChange={(value) => setFormData({ ...formData, faculty: value })}
                >
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-xs overflow-hidden">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl shadow-xl border-slate-100">
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept} className="text-xs">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-[#0F172A] ml-1">Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl shadow-xl border-slate-100">
                    {levels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
                type="submit" 
                className="w-full h-12 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] mt-2" 
                disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2563EB] font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
