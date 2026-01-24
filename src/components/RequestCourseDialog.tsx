import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";

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
  extraNotes: z
    .string()
    .trim()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

type CourseRequestForm = z.infer<typeof courseRequestSchema>;

interface RequestCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userDepartment?: string | null;
}

export function RequestCourseDialog({
  open,
  onOpenChange,
  userDepartment,
}: RequestCourseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<CourseRequestForm>({
    resolver: zodResolver(courseRequestSchema),
    defaultValues: {
      courseCode: "",
      courseName: "",
      department: userDepartment || "",
      courseRepName: "",
      courseRepPhone: "",
      extraNotes: "",
    },
  });

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
      form.reset();
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

  const handleClose = () => {
    if (!isSubmitting) {
      setIsSuccess(false);
      form.reset({
        courseCode: "",
        courseName: "",
        department: userDepartment || "",
        courseRepName: "",
        courseRepPhone: "",
        extraNotes: "",
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">
              Course request received
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Thanks! Once the course is uploaded, you'll be able to preview it
              on the app. We'll notify your course rep if we need any materials.
            </DialogDescription>
            <Button onClick={handleClose} className="mt-6">
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request a Course</DialogTitle>
              <DialogDescription>
                Don't see your course yet? Request it and we'll add it as soon
                as possible.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 mt-4"
              >
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
                      <FormLabel>Course Rep Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 08012345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extraNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Extra Notes{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. tutorials were given last week"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
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
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
