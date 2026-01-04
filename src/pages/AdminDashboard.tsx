import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, BookOpen, FileText, LayoutDashboard } from "lucide-react";

interface Question {
  q: string;
  a: string;
}

interface Course {
  id: string;
  code: string;
  title: string;
  faculty: string;
  level: string;
  price: number;
  questionCount: number;
}

// FIX: MATCHING SIGNUP PAGE EXACTLY
const departments = [
  "IRM",
  "LIS",
  "Mass Communication",
  "Computer Science",
  "Business Administration"
];

const levels = ["100L", "200L", "300L", "400L", "500L"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [faculty, setFaculty] = useState(""); // This will now store "Department"
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("1000");
  const [questions, setQuestions] = useState<Question[]>([{ q: "", a: "" }]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast({ title: "Access denied", variant: "destructive" });
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, user, navigate, toast]);

  useEffect(() => {
    if (isAdmin) fetchCourses();
  }, [isAdmin]);

  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true });

    if (!coursesError && coursesData) {
      const coursesWithCounts = await Promise.all(
        coursesData.map(async (course) => {
          const { count } = await supabase
            .from('course_questions')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);
          
          return { ...course, questionCount: count || 0 };
        })
      );
      setCourses(coursesWithCounts);
    }
    setIsLoadingCourses(false);
  };

  const fetchCourseQuestions = async (courseId: string): Promise<Question[]> => {
    const { data, error } = await supabase
      .from('course_questions')
      .select('question_text, answer_text')
      .eq('course_id', courseId)
      .order('question_index', { ascending: true });

    if (error || !data) return [];
    
    return data.map(q => ({ q: q.question_text, a: q.answer_text }));
  };

  const resetForm = () => {
    setCode("");
    setTitle("");
    setFaculty("");
    setLevel("");
    setPrice("1000");
    setQuestions([{ q: "", a: "" }]);
    setEditingCourse(null);
  };

  const openEditDialog = async (course: Course) => {
    setEditingCourse(course);
    setCode(course.code);
    setTitle(course.title);
    setFaculty(course.faculty);
    setLevel(course.level);
    setPrice(course.price.toString());
    
    const existingQuestions = await fetchCourseQuestions(course.id);
    setQuestions(existingQuestions.length > 0 ? existingQuestions : [{ q: "", a: "" }]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!code || !title || !faculty || !level) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const filteredQuestions = questions.filter(q => q.q.trim() && q.a.trim());
    const courseData = { 
      code, title, faculty, level, 
      price: parseInt(price) || 1000 
    };

    let courseId = editingCourse?.id;

    try {
      if (editingCourse) {
        // Update Course
        const { error: updateError } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id);
        if (updateError) throw updateError;
      } else {
        // Create Course
        const { data: newCourse, error: insertError } = await supabase
          .from('courses')
          .insert([courseData])
          .select()
          .single();
        if (insertError) throw insertError;
        courseId = newCourse.id;
      }

      // Handle Questions (Delete Old -> Insert New to ensure order)
      if (courseId) {
        await supabase
          .from('course_questions')
          .delete()
          .eq('course_id', courseId);

        if (filteredQuestions.length > 0) {
          const questionsToInsert = filteredQuestions.map((q, index) => ({
            course_id: courseId,
            question_index: index + 1, // Start at 1
            question_text: q.q,
            answer_text: q.a,
          }));

          const { error: qError } = await supabase
            .from('course_questions')
            .insert(questionsToInsert);
          
          if (qError) throw qError;
        }
      }

      toast({ title: editingCourse ? "Course Updated" : "Course Created", className: "bg-green-600 text-white" });
      setIsDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course? All data will be lost.")) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchCourses(); }
  };

  const addQuestion = () => setQuestions([...questions, { q: "", a: "" }]);
  
  const updateQuestion = (index: number, field: 'q' | 'a', value: string) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  if (authLoading || adminLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-[#0F172A]">Admin Dashboard</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#2563EB] hover:bg-blue-700 font-bold">
                <Plus className="w-4 h-4 mr-2" /> Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4 p-1">
                {/* Course Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-2"><Label>Code</Label><Input value={code} onChange={e => setCode(e.target.value)} className="bg-white" placeholder="IRM 101" /></div>
                  <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="bg-white" /></div>
                  <div className="space-y-2"><Label>Department</Label>
                    <Select value={faculty} onValueChange={setFaculty}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Price</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-white" /></div>
                </div>

                {/* Questions Editor */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-lg font-bold">Questions ({questions.length})</Label>
                    <Button variant="outline" size="sm" onClick={addQuestion}><Plus className="w-4 h-4 mr-1"/> Add</Button>
                  </div>
                  {questions.map((q, i) => (
                    <Card key={i} className="p-4 border-slate-200">
                      <div className="space-y-3">
                         <div className="flex justify-between"><Label className="text-blue-600 font-bold">Question {i+1}</Label><button onClick={() => removeQuestion(i)}><Trash2 className="w-4 h-4 text-red-400"/></button></div>
                         <Input value={q.q} onChange={e => updateQuestion(i, 'q', e.target.value)} placeholder="Question..." className="font-bold" />
                         <Textarea value={q.a} onChange={e => updateQuestion(i, 'a', e.target.value)} placeholder="Answer (Use ### for headers)..." className="font-serif bg-slate-50 min-h-[120px]" />
                      </div>
                    </Card>
                  ))}
                </div>

                <Button onClick={handleSubmit} className="w-full h-12 bg-[#2563EB] font-bold text-lg" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Course Content"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="bg-white shadow-premium border-slate-100 rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b"><CardTitle>Live Courses</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoadingCourses ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Dept</TableHead><TableHead>Qs</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {courses.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-bold text-[#0F172A]">{c.code}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{c.faculty}</span></TableCell>
                      <TableCell>{c.questionCount}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)}><Pencil className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
}
