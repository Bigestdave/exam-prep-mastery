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

interface Question { q: string; a: string; }
interface Course { id: string; code: string; title: string; faculty: string; level: string; price: number; questionCount: number; }

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

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [faculty, setFaculty] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("1000");
  const [questions, setQuestions] = useState<Question[]>([{ q: "", a: "" }]);

  useEffect(() => { if (!authLoading && !user) navigate("/login"); }, [user, authLoading, navigate]);
  useEffect(() => { if (isAdmin) fetchCourses(); }, [isAdmin]);

  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: true });
    if (coursesData) {
      const withCounts = await Promise.all(coursesData.map(async (c) => {
        const { count } = await supabase.from('course_questions').select('*', { count: 'exact', head: true }).eq('course_id', c.id);
        return { ...c, questionCount: count || 0 };
      }));
      setCourses(withCounts);
    }
    setIsLoadingCourses(false);
  };

  const openEditDialog = async (course: Course) => {
    setEditingCourse(course); setCode(course.code); setTitle(course.title);
    setFaculty(course.faculty); setLevel(course.level); setPrice(course.price.toString());
    const { data } = await supabase.from('course_questions').select('question_text, answer_text').eq('course_id', course.id).order('question_index', { ascending: true });
    setQuestions(data && data.length > 0 ? data.map(q => ({ q: q.question_text, a: q.answer_text })) : [{ q: "", a: "" }]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    const courseData = { code, title, faculty, level, price: parseInt(price) || 1000 };
    let cId = editingCourse?.id;

    if (editingCourse) {
      await supabase.from('courses').update(courseData).eq('id', cId);
      await supabase.from('course_questions').delete().eq('course_id', cId);
    } else {
      const { data } = await supabase.from('courses').insert([courseData]).select().single();
      cId = data?.id;
    }

    if (cId) {
      const toInsert = questions.filter(q => q.q.trim()).map((q, i) => ({
        course_id: cId, question_index: i + 1, question_text: q.q, answer_text: q.a
      }));
      await supabase.from('course_questions').insert(toInsert);
    }

    setIsDialogOpen(false); fetchCourses(); setIsSaving(false);
    toast({ title: "Changes saved successfully" });
  };

  if (authLoading || adminLoading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100">
        <div className="container max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="rounded-full w-10 h-10 p-0" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">Admin Dashboard</h1>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20">
                <Plus className="w-4 h-4 mr-2" /> Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] border-none shadow-2xl p-0">
              <div className="p-8">
                <DialogHeader className="mb-8">
                  <DialogTitle className="text-2xl font-bold text-[#0F172A]">
                    {editingCourse ? "Edit Course Content" : "Create New Course"}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Course Code</Label>
                      <Input value={code} onChange={e => setCode(e.target.value)} className="bg-white h-12 rounded-xl border-slate-200" placeholder="e.g. IRM 102" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Title</Label>
                      <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-white h-12 rounded-xl border-slate-200" placeholder="e.g. Library Routines" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Department</Label>
                      <Select value={faculty} onValueChange={setFaculty}>
                        <SelectTrigger className="bg-white h-12 rounded-xl border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-white rounded-xl shadow-xl border-slate-100">
                          {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Level</Label>
                          <Select value={level} onValueChange={setLevel}>
                            <SelectTrigger className="bg-white h-12 rounded-xl border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent className="bg-white rounded-xl shadow-xl border-slate-100">
                              {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Price (₦)</Label>
                          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="bg-white h-12 rounded-xl border-slate-200" />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#0F172A]">Step-by-Step Questions</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => setQuestions([...questions, { q: "", a: "" }])} className="rounded-full border-blue-100 text-blue-600 font-bold bg-blue-50/50">
                        <Plus className="w-4 h-4 mr-1" /> Add Question
                      </Button>
                    </div>
                    
                    <div className="space-y-6">
                      {questions.map((q, i) => (
                        <div key={i} className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all">
                          <div className="flex items-center justify-between mb-6">
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Question {i + 1}</span>
                            {questions.length > 1 && (
                              <button onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                            )}
                          </div>
                          <div className="space-y-4">
                            <Input value={q.q} onChange={e => { const u = [...questions]; u[i].q = e.target.value; setQuestions(u); }} placeholder="Enter the tutorial question..." className="border-none bg-slate-50/50 h-12 text-lg font-serif font-bold text-slate-800 focus:bg-white transition-all rounded-xl" />
                            <Textarea value={q.a} onChange={e => { const u = [...questions]; u[i].a = e.target.value; setQuestions(u); }} placeholder="Paste AI formatted answer here (Use ### for headers)..." className="min-h-[250px] border-none bg-slate-50/50 font-serif leading-relaxed text-base focus:bg-white transition-all rounded-xl p-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSubmit} className="w-full bg-[#2563EB] hover:bg-blue-700 h-16 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/25 transition-all active:scale-[0.99]" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><FileText className="w-5 h-5 mr-3"/> Publish Course Updates</>}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><LayoutDashboard size={24}/></div>
           <h2 className="text-3xl font-bold tracking-tight">Active Catalog</h2>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          {isLoadingCourses ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600/20" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="py-6 px-8 text-xs font-bold uppercase tracking-widest text-slate-400">Course</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400">Department</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400">Price</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-slate-400 text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                    <TableCell className="py-6 px-8">
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-[#0F172A] tracking-tight">{c.code}</span>
                        <span className="text-xs font-medium text-slate-400">{c.title}</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">{c.faculty}</span></TableCell>
                    <TableCell className="font-bold text-[#0F172A]">₦{c.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)} className="rounded-full hover:bg-blue-50 hover:text-blue-600"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if(confirm("Delete this course?")) supabase.from('courses').delete().eq('id', c.id).then(() => fetchCourses()); }} className="rounded-full hover:bg-red-50 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
