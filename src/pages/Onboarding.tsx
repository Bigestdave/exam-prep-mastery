import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { levels } from "@/data/courses";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { facultyCategories } from "@/data/departments";
import { supabase } from "@/integrations/supabase/client";

export default function Onboarding() {
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if profile already complete (use useEffect, not during render)
  useEffect(() => {
    if (!authLoading && profile?.faculty && profile?.level) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, profile, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!department || !level) {
      toast({
        title: "Missing information",
        description: "Please select your department and level to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setIsLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ faculty: department, level })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Force full page reload to ensure AuthContext re-fetches the updated profile
    window.location.replace("/dashboard");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            Almost there!
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us about yourself so we can personalize your experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Department</Label>
            <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={departmentOpen}
                  className="h-12 w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {department || "Select your department..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search department..." />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>No department found.</CommandEmpty>
                    {facultyCategories.map((category) => (
                      <CommandGroup key={category.name} heading={category.name}>
                        {category.departments.map((dept) => (
                          <CommandItem
                            key={dept}
                            value={dept}
                            onSelect={() => {
                              setDepartment(dept);
                              setDepartmentOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                department === dept ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {dept}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Continue to Dashboard"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          This helps us show you the right courses for your program.
        </p>
      </div>
    </div>
  );
}
