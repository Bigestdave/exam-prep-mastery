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

// UPDATED: Standardized Department List
const departments = [
  "Information Resource Management (IRM)",
  "Library & Information Science (LIS)",
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
  const [faculty, setFaculty] = useState(""); // Mapping to 'Department' in UI
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
    setCode(""); setTitle(""); setFaculty(""); setLevel(""); setPrice("1000");
    setQuestions([{ q: "", a: "" }]); setEditingCourse(null);
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
    const courseData = { code, title, faculty, level, price: parseInt(price) || 1000 };

    if (editingCourse) {
      const { error: updateError } = await supabase.from('courses').update(courseData).eq('id', editingCourse.id);
      if (updateError) {
        toast({ title: "Error", description: updateError.message, variant: "destructive" });
        setIsSaving(false);
        return;
      }
      await supabase.from('course_questions').delete().eq('course_id', editingCourse.id);
      if (filteredQuestions.length > 0) {
        const questionsToInsert = filteredQuestions.map((q, index) => ({
          course_id: editingCourse.id, question_index: index + 1, question_text: q.q, answer_text: q.a,
        }));
        await supabase.from('course_questions').insert(questionsToInsert);
      }
      toast({ title: "Course updated" });
    } else {
      const { data: newCourse, error: insertError } = await supabase.from('courses').insert([courseData]).select().single();
      if (insertError || !newCourse) {
        toast({ title: "Error", variant: "destructive" });
        setIsSaving(false); return;
      }
      if (filteredQuestions.length > 0) {
        const questionsToInsert = filteredQuestions.map((q, index) => ({
          course_id: newCourse.id, question_index: index + 1, question_text: q.q, answer_text: q.a,
        }));
        await supabase.from('course_questions').insert(questionsToInsert);
      }
      toast({ title: "Course created" });
    }
    setIsDialogOpen(false); resetForm(); fetchCourses(); setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast({ title: "Error", variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchCourses(); }
  };

  if (authLoading || adminLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#2563EB] hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-2">
                    <Label className="font-bold">Course Code</Label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="IRM 102" className="bg-white rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Library Routines" className="bg-white rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Department</Label>
                    <Select value={faculty} onValueChange={setFaculty}>
                      <SelectTrigger className="bg-white rounded-xl h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Level</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger className="bg-white rounded-xl h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-white">
                        {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Price (₦)</Label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-white rounded-xl h-12" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-bold">Questions & Answers</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setQuestions([...questions, { q: "", a: "" }])}>
                      <Plus className="w-3 h-3 mr-1" /> Add Question
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {questions.map((q, i) => (
                      <Card key={i} className="p-5 border-slate-200 shadow-sm rounded-2xl">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-[#2563EB] font-bold">Question {i + 1}</Label>
                            {questions.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <Input value={q.q} onChange={(e) => {
                            const updated = [...questions]; updated[i].q = e.target.value; setQuestions(updated);
                          }} placeholder="Question text..." className="rounded-xl h-12" />
                          <Textarea value={q.a} onChange={(e) => {
                            const updated = [...questions]; updated[i].a = e.target.value; setQuestions(updated);
                          }} placeholder="Paste AI formatted answer here..." className="font-serif min-h-[150px] bg-slate-50 rounded-xl p-4" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSubmit} className="w-full bg-[#2563EB] hover:bg-blue-700 h-14 rounded-xl text-lg font-bold shadow-lg" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save All Course Content"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="bg-white shadow-premium rounded-3xl border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#2563EB]" />
              Course Catalog ({courses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCourses ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Price</TableHead><TableHead>Qs</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {courses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-bold">{c.code}</TableCell>
                      <TableCell className="text-xs">{c.title}</TableCell>
                      <TableCell className="font-bold">₦{c.price}</TableCell>
                      <TableCell><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold text-[10px]">{c.questionCount}</span></TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
