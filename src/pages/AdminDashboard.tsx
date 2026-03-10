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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, BookOpen, ClipboardList, DollarSign, TrendingUp, Users, ShoppingCart, Crown, Upload, Calendar, Target, RefreshCw, Eye } from "lucide-react";
import { AmbassadorsTab } from "@/components/admin/AmbassadorsTab";
import { UploadsTab } from "@/components/admin/UploadsTab";
import { ContentReviewTab } from "@/components/admin/ContentReviewTab";
import { ContentQueueTab } from "@/components/admin/ContentQueueTab";
import { Badge } from "@/components/ui/badge";
import { facultyCategories, allDepartments } from "@/data/departments";

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

interface SurveyResponse {
  id: string;
  user_id: string;
  q1_buy_reason: string;
  q2_buy_timing: string;
  q3_question_overlap: string;
  q4_hesitation: string;
  q5_return_intent: string;
  created_at: string;
  full_name?: string | null;
}

const levels = ["100L", "200L", "300L", "400L", "500L"];

function SurveyResultsTab() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      const { data } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const userIds = data.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const nameMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

        setResponses(data.map(r => ({
          ...r,
          full_name: nameMap.get(r.user_id) || 'Unknown',
        })));
      }
      setLoading(false);
    };
    fetchResponses();
  }, []);

  const total = responses.length;
  const countAnswers = (key: keyof SurveyResponse) => {
    const counts: Record<string, number> = {};
    responses.forEach(r => {
      const val = r[key] as string;
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([answer, count]) => ({
        answer,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (total === 0) {
    return <p className="text-center text-muted-foreground py-8">No survey responses yet.</p>;
  }

  const surveyQuestions = [
    { key: 'q1_buy_reason' as const, title: 'What made them buy?' },
    { key: 'q2_buy_timing' as const, title: 'When did they buy?' },
    { key: 'q3_question_overlap' as const, title: 'Did questions overlap with exam?' },
    { key: 'q4_hesitation' as const, title: 'What caused hesitation?' },
    { key: 'q5_return_intent' as const, title: 'Would they return?' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{total} response{total !== 1 ? 's' : ''} collected</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {surveyQuestions.map(({ key, title }) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {countAnswers(key).map(({ answer, count, pct }) => (
                <div key={answer} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground">{answer}</span>
                    <span className="text-muted-foreground font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">All Responses</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Buy Reason</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Overlap</TableHead>
                <TableHead>Hesitation</TableHead>
                <TableHead>Return</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium whitespace-nowrap">{r.full_name}</TableCell>
                  <TableCell className="text-xs">{r.q1_buy_reason}</TableCell>
                  <TableCell className="text-xs">{r.q2_buy_timing}</TableCell>
                  <TableCell className="text-xs">{r.q3_question_overlap}</TableCell>
                  <TableCell className="text-xs">{r.q4_hesitation}</TableCell>
                  <TableCell className="text-xs">{r.q5_return_intent}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface PurchaseWithDetails {
  id: string;
  course_id: string;
  user_id: string;
  created_at: string;
  course_code?: string;
  course_title?: string;
  course_faculty?: string;
  course_price?: number;
  user_name?: string;
}

function SalesTab() {
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (!purchasesData) { setLoading(false); return; }

      const courseIds = [...new Set(purchasesData.map(p => p.course_id))];
      const userIds = [...new Set(purchasesData.map(p => p.user_id))];

      // Fetch all courses since purchases.course_id is text and may not match UUID filter
      const [{ data: coursesData }, { data: profilesData }] = await Promise.all([
        supabase.from('courses').select('id, code, title, faculty, price'),
        supabase.from('profiles').select('id, full_name').in('id', userIds),
      ]);

      // Build map keyed by course id (string) to handle text/uuid matching
      const courseMap = new Map(coursesData?.map(c => [String(c.id), c]) || []);
      const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);

      setPurchases(purchasesData.map(p => {
        const course = courseMap.get(p.course_id);
        return {
          ...p,
          course_code: course?.code || 'Unknown',
          course_title: course?.title || 'Unknown',
          course_faculty: course?.faculty || 'Unknown',
          course_price: course?.price || 1000,
          user_name: profileMap.get(p.user_id) || 'Unknown',
        };
      }));
      setLoading(false);
    };
    fetchSalesData();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const totalRevenue = purchases.reduce((sum, p) => sum + (p.course_price || 1000), 0);
  const uniqueBuyers = new Set(purchases.map(p => p.user_id)).size;

  // Department breakdown
  const deptStats = purchases.reduce<Record<string, { count: number; revenue: number }>>((acc, p) => {
    const dept = p.course_faculty || 'Unknown';
    if (!acc[dept]) acc[dept] = { count: 0, revenue: 0 };
    acc[dept].count++;
    acc[dept].revenue += p.course_price || 1000;
    return acc;
  }, {});

  const deptEntries = Object.entries(deptStats).sort((a, b) => b[1].revenue - a[1].revenue);

  // Course breakdown
  const courseStats = purchases.reduce<Record<string, { code: string; title: string; count: number; revenue: number }>>((acc, p) => {
    const key = p.course_id;
    if (!acc[key]) acc[key] = { code: p.course_code || '', title: p.course_title || '', count: 0, revenue: 0 };
    acc[key].count++;
    acc[key].revenue += p.course_price || 1000;
    return acc;
  }, {});

  const topCourses = Object.values(courseStats).sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{purchases.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />Unique Buyers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uniqueBuyers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />Avg per Buyer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₦{uniqueBuyers > 0 ? Math.round(totalRevenue / uniqueBuyers).toLocaleString() : 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Sales by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deptEntries.map(([dept, stats]) => (
                <TableRow key={dept}>
                  <TableCell className="font-medium">{dept}</TableCell>
                  <TableCell className="text-right">{stats.count}</TableCell>
                  <TableCell className="text-right">₦{stats.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Math.round((stats.revenue / totalRevenue) * 100)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Top Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCourses.map(c => (
                <TableRow key={c.code + c.title}>
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell className="text-right">{c.count}</TableCell>
                  <TableCell className="text-right">₦{c.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.slice(0, 25).map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium whitespace-nowrap">{p.user_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="mr-1">{p.course_code}</Badge>
                    <span className="text-xs text-muted-foreground">{p.course_title}</span>
                  </TableCell>
                  <TableCell className="text-xs">{p.course_faculty}</TableCell>
                  <TableCell className="text-right">₦{(p.course_price || 1000).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-xs whitespace-nowrap">{new Date(p.created_at!).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════ SEMESTER & DEPARTMENT PERFORMANCE TAB ═══════════════
function SemesterTab() {
  const { toast } = useToast();
  const [semesters, setSemesters] = useState<any[]>([]);
  const [deptStats, setDeptStats] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: sems }, { data: stats }, { data: ms }] = await Promise.all([
      supabase.from("semester_config").select("*").order("created_at", { ascending: false }),
      supabase.rpc("get_department_leaderboard"),
      supabase.from("department_milestones").select("*").order("achieved_at", { ascending: false }),
    ]);
    setSemesters(sems || []);
    setDeptStats(stats || []);
    setMilestones(ms || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateSemester = async () => {
    if (!newSemesterName.trim()) return;
    setCreating(true);
    // Deactivate all existing
    await supabase.from("semester_config").update({ is_active: false }).eq("is_active", true);
    // Create new active
    const { error } = await supabase.from("semester_config").insert({ name: newSemesterName.trim(), is_active: true });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "New semester created", description: "All milestone progress has been reset." });
      setNewSemesterName("");
    }
    setCreating(false);
    fetchData();
  };

  const activeSemester = semesters.find(s => s.is_active);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const TIERS: Record<number, string> = { 1: "Activation", 2: "Penetration", 3: "Domination" };

  return (
    <div className="space-y-6">
      {/* Active Semester */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Active Semester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSemester ? (
            <div className="flex items-center justify-between bg-accent/5 rounded-xl p-4">
              <div>
                <p className="font-bold">{activeSemester.name}</p>
                <p className="text-xs text-muted-foreground">Started {new Date(activeSemester.created_at).toLocaleDateString()}</p>
              </div>
              <Badge className="bg-accent text-accent-foreground">Active</Badge>
            </div>
          ) : (
            <p className="text-muted-foreground">No active semester</p>
          )}
          <div className="flex gap-2">
            <Input placeholder="e.g. 2025/2026 First Semester" value={newSemesterName} onChange={e => setNewSemesterName(e.target.value)} />
            <Button onClick={handleCreateSemester} disabled={creating || !newSemesterName.trim()}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-1" /> New Semester</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">⚠️ Creating a new semester resets all department milestones</p>
        </CardContent>
      </Card>

      {/* Department Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Unlocks</TableHead>
                <TableHead className="text-right">Avg/Buyer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deptStats.map((d: any) => (
                <TableRow key={d.department}>
                  <TableCell className="font-bold">{d.rank}</TableCell>
                  <TableCell className="font-medium">{d.department}</TableCell>
                  <TableCell className="text-right">{d.unique_buyers}</TableCell>
                  <TableCell className="text-right">{d.total_unlocks}</TableCell>
                  <TableCell className="text-right">{d.avg_per_buyer}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Achieved Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Crown className="w-4 h-4" /> Achieved Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No milestones achieved yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.department}</TableCell>
                    <TableCell><Badge variant="outline">{TIERS[m.tier] || `Tier ${m.tier}`}</Badge></TableCell>
                    <TableCell className="text-right">₦{m.bonus_amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-xs">{new Date(m.achieved_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast({ title: "Access denied", description: "You don't have admin privileges.", variant: "destructive" });
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
    setEditingCourse(course); setCode(course.code); setTitle(course.title);
    setFaculty(course.faculty); setLevel(course.level); setPrice(course.price.toString());
    const existingQuestions = await fetchCourseQuestions(course.id);
    setQuestions(existingQuestions.length > 0 ? existingQuestions : [{ q: "", a: "" }]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!code || !title || !faculty || !level) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const filteredQuestions = questions.filter(q => q.q.trim() && q.a.trim());
    const courseData = { code, title, faculty, level, price: parseInt(price) || 1000 };

    if (editingCourse) {
      const { error: updateError } = await supabase.from('courses').update(courseData).eq('id', editingCourse.id);
      if (updateError) { toast({ title: "Error", description: updateError.message, variant: "destructive" }); setIsSaving(false); return; }
      await supabase.from('course_questions').delete().eq('course_id', editingCourse.id);
      if (filteredQuestions.length > 0) {
        const questionsToInsert = filteredQuestions.map((q, index) => ({ course_id: editingCourse.id, question_index: index, question_text: q.q, answer_text: q.a }));
        const { error: questionsError } = await supabase.from('course_questions').insert(questionsToInsert);
        if (questionsError) toast({ title: "Warning", description: "Course updated but questions could not be saved: " + questionsError.message, variant: "destructive" });
      }
      toast({ title: "Course updated successfully" });
    } else {
      const { data: newCourse, error: insertError } = await supabase.from('courses').insert([courseData]).select().single();
      if (insertError || !newCourse) { toast({ title: "Error", description: insertError?.message || "Failed to create course", variant: "destructive" }); setIsSaving(false); return; }
      if (filteredQuestions.length > 0) {
        const questionsToInsert = filteredQuestions.map((q, index) => ({ course_id: newCourse.id, question_index: index, question_text: q.q, answer_text: q.a }));
        const { error: questionsError } = await supabase.from('course_questions').insert(questionsToInsert);
        if (questionsError) toast({ title: "Warning", description: "Course created but questions could not be saved: " + questionsError.message, variant: "destructive" });
      }
      toast({ title: "Course created successfully" });
    }
    setIsDialogOpen(false); resetForm(); fetchCourses(); setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Course deleted" }); fetchCourses(); }
  };

  const addQuestion = () => setQuestions([...questions, { q: "", a: "" }]);
  const updateQuestion = (index: number, field: 'q' | 'a', value: string) => {
    const updated = [...questions]; updated[index][field] = value; setQuestions(updated);
  };
  const removeQuestion = (index: number) => {
    if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== index));
  };

  if (authLoading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="w-5 h-5" /></Button>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Course</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Course Code *</Label>
                    <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. IRM 102" />
                  </div>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Library Routines" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Faculty *</Label>
                    <Select value={faculty} onValueChange={setFaculty}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {facultyCategories.map(category => (
                          <div key={category.name}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">{category.name}</div>
                            {category.departments.map(dept => (<SelectItem key={dept} value={dept}>{dept}</SelectItem>))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Level *</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>{levels.map(l => (<SelectItem key={l} value={l}>{l}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₦)</Label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Questions</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addQuestion}><Plus className="w-3 h-3 mr-1" />Add Question</Button>
                  </div>
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {questions.map((q, i) => (
                      <Card key={i} className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Question {i + 1}</Label>
                            {questions.length > 1 && (<Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(i)}><Trash2 className="w-3 h-3" /></Button>)}
                          </div>
                          <Input value={q.q} onChange={(e) => updateQuestion(i, 'q', e.target.value)} placeholder="Question text..." />
                          <Textarea value={q.a} onChange={(e) => updateQuestion(i, 'a', e.target.value)} placeholder="Answer (supports markdown)..." rows={3} />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={isSaving}>
                  {isSaving ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>) : (editingCourse ? "Update Course" : "Create Course")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="courses">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="courses" className="gap-2"><BookOpen className="w-4 h-4" />Courses</TabsTrigger>
            <TabsTrigger value="queue" className="gap-2"><ClipboardList className="w-4 h-4" />Content Queue</TabsTrigger>
            <TabsTrigger value="review" className="gap-2"><Eye className="w-4 h-4" />Review</TabsTrigger>
            <TabsTrigger value="sales" className="gap-2"><DollarSign className="w-4 h-4" />Sales</TabsTrigger>
            <TabsTrigger value="semester" className="gap-2"><Target className="w-4 h-4" />Departments</TabsTrigger>
            <TabsTrigger value="uploads" className="gap-2"><Upload className="w-4 h-4" />Uploads</TabsTrigger>
            <TabsTrigger value="ambassadors" className="gap-2"><Crown className="w-4 h-4" />Ambassadors</TabsTrigger>
            <TabsTrigger value="survey" className="gap-2"><ClipboardList className="w-4 h-4" />Survey</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" />Manage Courses ({courses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCourses ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : courses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No courses yet. Click "Add Course" to create one.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.code}</TableCell>
                          <TableCell>{course.title}</TableCell>
                          <TableCell>{course.faculty}</TableCell>
                          <TableCell>{course.level}</TableCell>
                          <TableCell>₦{course.price.toLocaleString()}</TableCell>
                          <TableCell>{course.questionCount}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(course)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queue">
            <ContentQueueTab />
          </TabsContent>

          <TabsContent value="review">
            <ContentReviewTab />
          </TabsContent>

          <TabsContent value="sales">
          </TabsContent>

          <TabsContent value="semester">
            <SemesterTab />
          </TabsContent>

          <TabsContent value="uploads">
            <UploadsTab />
          </TabsContent>

          <TabsContent value="ambassadors">
            <AmbassadorsTab />
          </TabsContent>

          <TabsContent value="survey">
            <SurveyResultsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
