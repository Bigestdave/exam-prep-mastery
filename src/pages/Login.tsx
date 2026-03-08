import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getErrorMessage = (errorMessage: string): string => {
    const lowerMessage = errorMessage.toLowerCase();
    
    if (lowerMessage.includes('invalid login credentials')) {
      return 'The email or password you entered is incorrect. Please try again.';
    }
    if (lowerMessage.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }
    if (lowerMessage.includes('user not found') || lowerMessage.includes('no user')) {
      return 'No account found with this email. Please sign up first.';
    }
    if (lowerMessage.includes('too many requests') || lowerMessage.includes('rate limit')) {
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Unable to connect. Please check your internet connection.';
    }
    
    return errorMessage || 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await login(email, password);
    
    if (error) {
      toast({
        title: "Login failed",
        description: getErrorMessage(error.message),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    navigate("/dashboard");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-card p-12 flex-col justify-between border-r border-border">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        
        <div>
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Welcome back to LCU Prep
          </h1>
          <p className="text-lg text-muted-foreground">
            Continue your journey to exam success.
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground">
          © 2025 LCU Prep
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 text-muted-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Sign in</h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <GoogleSignInButton label="Sign in with Google" />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground tracking-widest font-mono">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
