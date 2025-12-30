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
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, BookOpen } from "lucide-react";

interface Question { q: string; a: string; }
interface Course { id: string; code: string; title: string; faculty: string; level: string; price: number; questionCount: number; }

// UPDATED DEPARTMENTS
const departments = ["IRM", "LIS", "Mass Communication", "Computer Science", "Business Administration"];
const levels = ["100L", "200L", "300L", "400L"];

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
  useEffect(() => { if (!adminLoading && !isAdmin && user) navigate("/dashboard"); }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => { if (isAdmin) fetchCourses(); }, [isAdmin]);

  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    const { data: coursesData, error: coursesError } = await supabase.from('courses').select('*').order('created_at', { ascending: true });
    if (coursesData) {
      const coursesWithCounts = await Promise.all(coursesData.map(async (course) => {
        const { count } = await supabase.from('course_questions').select('*', { count: 'exact', head: true }).eq('course_id', course.id);
        return { ...course, questionCount: count || 0 };
      }));
      setCourses(coursesWithCounts);
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
    if (!code || !title || !faculty || !level) {
      toast({ title: "Missing fields", variant: "destructive" }); return;
    }
    setIsSaving(true);
    const filteredQuestions = questions.filter(q => q.q.trim() && q.a.trim());
    const courseData = { code, title, faculty, level, price: parseInt(price) || 1000 };

    if (editingCourse) {
      await supabase.from('courses').update(courseData).eq('id', editingCourse.id);
      await supabase.from('course_questions').delete().eq('course_id', editingCourse.id);
      const toInsert = filteredQuestions.map((q, index) => ({
        course_id: editingCourse.id, question_index: index + 1, question_text: q.q, answer_text: q.a,
      }));
      await supabase.from('course_questions').insert(toInsert);
    } else {
      const { data: newCourse } = await supabase.from('courses').insert([courseData]).select().single();
      if (newCourse) {
        const toInsert = filteredQuestions.map((q, index) => ({
          course_id: newCourse.id, question_index: index + 1, question_text: q.q, answer_text: q.a,
        }));
        await supabase.from('course_questions').insert(toInsert);
      }
    }
    setIsDialogOpen(false); resetForm(); fetchCourses(); setIsSaving(false);
    toast({ title: "Course saved successfully" });
  };

  const resetForm = () => { setCode(""); setTitle(""); setFaculty(""); setLevel(""); setPrice("1000"); setQuestions([{ q: "", a: "" }]); setEditingCourse(null); };

  if (authLoading || adminLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 font-bold"><Plus className="w-4 h-4 mr-2" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-8 rounded-3xl">
            <DialogHeader><DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle></DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Course Code</Label><Input value={code} onChange={e => setCode(e.target.value)} /></div>
                <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={faculty} onValueChange={setFaculty}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-white">
                      {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Price (₦)</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} /></div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center"><Label className="text-lg font-bold">Questions</Label><Button type="button" variant="outline" size="sm" onClick={() => setQuestions([...questions, { q: "", a: "" }])}>+ Add</Button></div>
                {questions.map((q, i) => (
                  <Card key={i} className="p-4 border-slate-100 shadow-sm">
                    <div className="space-y-3">
                       <Input value={q.q} onChange={e => { const u = [...questions]; u[i].q = e.target.value; setQuestions(u); }} placeholder="Question text..." className="font-bold h-12" />
                       <Textarea value={q.a} onChange={e => { const u = [...questions]; u[i].a = e.target.value; setQuestions(u); }} placeholder="Answer..." className="min-h-[150px] bg-slate-50 font-serif leading-relaxed" />
                    </div>
                  </Card>
                ))}
              </div>
              <Button onClick={handleSubmit} className="w-full h-14 bg-blue-600 text-lg font-bold" disabled={isSaving}>{isSaving ? "Saving..." : "Save Course Content"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="container py-8 px-6">
        <Card className="rounded-3xl border-slate-100 shadow-premium">
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /> Manage Catalog</CardTitle></CardHeader>
          <CardContent>
            {isLoadingCourses ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {courses.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-bold">{c.code}</TableCell>
                      <TableCell className="text-xs">{c.title}</TableCell>
                      <TableCell><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold">{c.faculty}</span></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)}><Pencil size={16}/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-red-500"><Trash2 size={16}/></Button>
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
