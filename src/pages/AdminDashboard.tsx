import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, BookOpen, FileText, LayoutDashboard, PlusCircle, AlertCircle } from "lucide-react";

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
  const [faculty, setFaculty] = useState("");
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
      toast({ title: "Missing fields", description: "Please fill code, title, dept, and level.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const filteredQuestions = questions.filter(q => q.q.trim() && q.a.trim());
    const courseData = { code, title, faculty, level, price: parseInt(price) || 1000 };

    try {
      let currentCId = editingCourse?.id;

      if (editingCourse) {
        await supabase.from('courses').update(courseData).eq('id', editingCourse.id);
        await supabase.from('course_questions').delete().eq('course_id', editingCourse.id);
      } else {
        const { data, error } = await supabase.from('courses').insert([courseData]).select().single();
        if (error) throw error;
        currentCId = data.id;
      }

      if (currentCId && filteredQuestions.length > 0) {
        const questionsToInsert = filteredQuestions.map((q, index) => ({
          course_id: currentCId,
          question_index: index + 1,
          question_text: q.q,
          answer_text: q.a,
        }));
        const { error: qError } = await supabase.from('course_questions').insert(questionsToInsert);
        if (qError) throw qError;
      }

      toast({ title: editingCourse ? "Course updated" : "Course created", className: "bg-green-600 text-white" });
      setIsDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (err: any) {
      toast({ title: "Database Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course? All purchased users will lose access.")) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { fetchCourses(); toast({ title: "Course deleted" }); }
  };

  if (authLoading || adminLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="rounded-full w-10 h-10 p-0" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Management Portal</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20">
                <Plus className="w-4 h-4 mr-2" /> Add New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl p-0 border-none shadow-2xl">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-bold text-[#0F172A]">{editingCourse ? "Edit Course Content" : "New Course Setup"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-8">
                  {/* Basic Info Group */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Course Code</Label>
                      <Input value={code} onChange={e => setCode(e.target.value)} className="bg-white h-12 rounded-xl border-slate-200" placeholder="e.g. IRM 102" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Title</Label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-white h-12 rounded-xl border-slate-200" placeholder="e.g. Library Routines" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Department</Label>
                      <Select value={faculty} onValueChange={setFaculty}>
                        <SelectTrigger className="bg-white h-12 rounded-xl border-slate-200"><SelectValue placeholder="Select Dept" /></SelectTrigger>
                        <SelectContent className="bg-white shadow-xl">{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Level</Label>
                        <Select value={level} onValueChange={setLevel}>
                          <SelectTrigger className="bg-white h-12 rounded-xl border-slate-200"><SelectValue placeholder="Level" /></SelectTrigger>
                          <SelectContent className="bg-white shadow-xl">{levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Price (₦)</Label>
                        <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-white h-12 rounded-xl border-slate-200" />
                      </div>
                    </div>
                  </div>

                  {/* Question Loop */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="text-lg font-bold text-[#0F172A]">Solved Tutorials</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => setQuestions([...questions, { q: "", a: "" }])} className="rounded-full border-blue-100 text-blue-600 bg-blue-50/50 hover:bg-blue-50 font-bold">
                        <PlusCircle className="w-4 h-4 mr-1" /> Add Slot
                      </Button>
                    </div>
                    
                    <div className="space-y-8">
                      {questions.map((q, i) => (
                        <div key={i} className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Question {i + 1}</span>
                            {questions.length > 1 && (
                              <button onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            )}
                          </div>
                          <div className="space-y-4">
                            <Input value={q.q} onChange={e => { const u = [...questions]; u[i].q = e.target.value; setQuestions(u); }} placeholder="Paste question here..." className="border-none bg-slate-50/50 h-12 font-bold text-slate-800 rounded-xl" />
                            <Textarea value={q.a} onChange={e => { const u = [...questions]; u[i].a = e.target.value; setQuestions(u); }} placeholder="Paste professor-level answer here (Use ### for headers)..." className="min-h-[200px] border-none bg-slate-50/50 font-serif leading-relaxed text-base rounded-xl p-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-10">
                   <Button onClick={handleSubmit} className="w-full bg-[#2563EB] hover:bg-blue-700 h-16 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/25" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><FileText className="w-5 h-5 mr-3"/> Save & Publish Course</>}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm transition-transform hover:rotate-12"><LayoutDashboard size={24}/></div>
           <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">Live Catalog</h2>
        </div>

        <div className="bg-white rounded-[2rem] shadow-premium border border-slate-100 overflow-hidden">
          {isLoadingCourses ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600/20" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="py-6 px-8 text-xs font-bold uppercase tracking-widest text-slate-400">Course</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400">Dept</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-[#0F172A] tracking-tight">{c.code}</span>
                        <span className="text-xs font-medium text-slate-400 truncate w-48">{c.title}</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">{c.faculty}</span></TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)} className="rounded-full hover:bg-blue-50 hover:text-blue-600"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="rounded-full hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {courses.length === 0 && !isLoadingCourses && (
             <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest">Database is empty</div>
          )}
        </div>
      </main>
    </div>
  );
}
