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
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, BookOpen, FileText } from "lucide-react";

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

const faculties = ["IRM", "Engineering", "Sciences", "Arts", "Law", "Management", "Social Sciences"];
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
  const [faculty, setFaculty] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("1000");
  const [questions, setQuestions] = useState<Question[]>([{ q: "", a: "" }]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast({
        title: "Access denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, user, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchCourses();
    }
  }, [isAdmin]);

  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('id, code, title, faculty, level, price')
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
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const filteredQuestions = questions.filter(q => q.q.trim());
    
    const courseData = {
      code, title, faculty, level, price: parseInt(price) || 1000,
    };

    if (editingCourse) {
      const { error: updateError } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', editingCourse.id);

      if (updateError) {
        toast({ title: "Error", description: updateError.message, variant: "destructive" });
        setIsSaving(false);
        return;
      }

      // Delete old questions
      await supabase.from('course_questions').delete().eq('course_id', editingCourse.id);

      // Insert new questions
      if (filteredQuestions.length > 0) {
        const questionsToInsert = filteredQuestions.map((q, index) => ({
          course_id: editingCourse.id,
          question_index: index,
          question_text: q.q,
          answer_text: q.a,
        }));
        await supabase.from('course_questions').insert(questionsToInsert);
      }
      toast({ title: "Course updated successfully" });
    } else {
      const { data: newCourse, error: insertError } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (insertError || !newCourse) {
        toast({ title: "Error", description: insertError?.message, variant: "destructive" });
        setIsSaving(false);
        return;
      }

      if (filteredQuestions.length > 0) {
        const questionsToInsert = filteredQuestions.map((q, index) => ({
          course_id: newCourse.id,
          question_index: index,
          question_text: q.q,
          answer_text: q.a,
        }));
        await supabase.from('course_questions').insert(questionsToInsert);
      }
      toast({ title: "Course created successfully" });
    }

    setIsDialogOpen(false);
    resetForm();
    fetchCourses();
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Course deleted" });
      fetchCourses();
    }
  };

  const addQuestion = () => setQuestions([...questions, { q: "", a: "" }]);
  const updateQuestion = (index: number, field: 'q' | 'a', value: string) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };
  const removeQuestion = (index: number) => {
    if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== index));
  };

  if (authLoading || adminLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Course Details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-2">
                    <Label>Course Code</Label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. IRM 102" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Library Routines" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Faculty</Label>
                    <Select value={faculty} onValueChange={setFaculty}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {faculties.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₦)</Label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-white" />
                  </div>
                </div>

                {/* Questions Editor */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold">Questions & Answers</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                      <Plus className="w-3 h-3 mr-1" /> Add Question
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {questions.map((q, i) => (
                      <Card key={i} className="p-4 border-slate-200 shadow-sm">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <Label className="text-blue-600 font-bold">Question {i + 1}</Label>
                            {questions.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(i)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" /> Remove
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Input
                              value={q.q}
                              onChange={(e) => updateQuestion(i, 'q', e.target.value)}
                              placeholder="e.g. What is Information Architecture?"
                              className="font-medium"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>Answer (AI Output)</Label>
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                Tip: Use <b>### Step Name</b> for headers
                              </span>
                            </div>
                            <Textarea
                              value={q.a}
                              onChange={(e) => updateQuestion(i, 'a', e.target.value)}
                              placeholder="Paste the AI-generated answer here..."
                              className="font-mono text-sm min-h-[200px] bg-slate-50 leading-relaxed"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-4">
                   <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <><FileText className="w-5 h-5 mr-2"/> Save Course Content</>}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Manage Courses ({courses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCourses ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qs</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-bold text-slate-900">{course.code}</TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>{course.faculty}</TableCell>
                      <TableCell>₦{course.price.toLocaleString()}</TableCell>
                      <TableCell><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{course.questionCount}</span></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(course)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
