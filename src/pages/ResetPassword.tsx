import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidLink, setIsValidLink] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const getErrorMessage = (errorMessage: string): string => {
    const lowerMessage = errorMessage.toLowerCase();
    
    if (lowerMessage.includes('same password') || lowerMessage.includes('different password')) {
      return 'New password must be different from your current password.';
    }
    if (lowerMessage.includes('weak password') || lowerMessage.includes('password strength')) {
      return 'Please choose a stronger password with letters, numbers, and symbols.';
    }
    if (lowerMessage.includes('session') || lowerMessage.includes('expired') || lowerMessage.includes('invalid')) {
      return 'This reset link has expired. Please request a new one.';
    }
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Unable to connect. Please check your internet connection.';
    }
    
    return errorMessage || 'Something went wrong. Please try again.';
  };

  useEffect(() => {
    // Check if we have access token in URL (from email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    // Valid if we have access_token OR if type is recovery
    if (accessToken || type === 'recovery') {
      setIsValidLink(true);
    } else {
      // Also check if user already has a session from the recovery link
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsValidLink(true);
        } else {
          setIsValidLink(false);
          toast({
            title: "Invalid link",
            description: "Please request a new password reset link.",
            variant: "destructive",
          });
          navigate("/forgot-password");
        }
      });
    }
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      toast({
        title: "Unable to update password",
        description: getErrorMessage(error.message),
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    setIsSuccess(true);
    setIsLoading(false);
  };

  // Show loading while checking link validity
  if (isValidLink === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy p-12 flex-col justify-between">
        <Link to="/login" className="flex items-center gap-2 text-primary-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
        
        <div>
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-8">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            Create new password
          </h1>
          <p className="text-lg text-primary-foreground/70">
            Choose a strong password for your account.
          </p>
        </div>
        
        <p className="text-sm text-primary-foreground/50">
          © 2025 LCU Prep
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/login" className="lg:hidden flex items-center gap-2 text-muted-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
          
          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Password updated!</h2>
              <p className="text-muted-foreground mb-6">
                Your password has been successfully reset.
              </p>
              <Link to="/login">
                <Button className="w-full h-12">
                  Sign in with new password
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Reset password</h2>
                <p className="text-muted-foreground">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <Button type="submit" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
