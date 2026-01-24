import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, ArrowLeft } from "lucide-react";

const courseRequestSchema = z.object({
  courseCode: z
    .string()
    .trim()
    .min(1, "Course code is required")
    .max(20, "Course code must be less than 20 characters"),
  courseName: z
    .string()
    .trim()
    .min(1, "Course name is required")
    .max(100, "Course name must be less than 100 characters"),
  department: z
    .string()
    .trim()
    .min(1, "Department is required")
    .max(100, "Department must be less than 100 characters"),
  courseRepName: z
    .string()
    .trim()
    .min(1, "Course rep name is required")
    .max(100, "Name must be less than 100 characters"),
  courseRepPhone: z
    .string()
    .trim()
    .min(1, "Course rep phone is required")
    .max(20, "Phone number must be less than 20 characters")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
});

type CourseRequestForm = z.infer<typeof courseRequestSchema>;

export default function RequestCourse() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<CourseRequestForm>({
    resolver: zodResolver(courseRequestSchema),
    defaultValues: {
      courseCode: "",
      courseName: "",
      department: profile?.faculty || "",
      courseRepName: "",
      courseRepPhone: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (profile?.faculty) {
      form.setValue("department", profile.faculty);
    }
  }, [profile?.faculty, form]);

  const onSubmit = async (data: CourseRequestForm) => {
    setIsSubmitting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke(
        "notify-course-request",
        {
          body: data,
        }
      );

      if (error) {
        throw error;
      }

      if (!result?.success) {
        throw new Error(result?.error || "Failed to submit request");
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Error submitting course request:", error);
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header isLoggedIn userName="" />
        <main className="container py-8 max-w-lg px-4">
          <div className="h-4 w-32 bg-muted rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  if (!user) return null;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header isLoggedIn userName={profile?.full_name || ""} />
        <main className="container py-8 max-w-lg px-4">
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Course request received
            </h1>
            <p className="text-muted-foreground mb-8">
              Thanks! Once the course is uploaded, you'll be able to preview it
              on the app. We'll notify your course rep if we need any materials.
            </p>
            <Button onClick={() => navigate("/profile")}>
              Back to Profile
            </Button>
          </div>
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Header isLoggedIn userName={profile?.full_name || ""} />

      <main className="container py-6 max-w-lg px-4">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to profile
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground mb-1">
            Request a Course
          </h1>
          <p className="text-sm text-muted-foreground">
            Don't see your course yet? Request it and we'll add it as soon as
            possible.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="courseCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. GST 111" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Communication in English"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseRepName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Rep Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseRepPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Rep Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 08012345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        </Form>
      </main>

      <MobileBottomNav />
    </div>
  );
}
