import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { facultyCategories } from "@/data/departments";

const levels = ["100L", "200L", "300L", "400L", "500L"];

interface FrictionlessBuilderTabProps {
  onGenerated?: () => Promise<void> | void;
}

export function FrictionlessBuilderTab({ onGenerated }: FrictionlessBuilderTabProps) {
  const { toast } = useToast();
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [rawText, setRawText] = useState("");
  const [pdfUrlsText, setPdfUrlsText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const pdfUrls = useMemo(
    () =>
      pdfUrlsText
        .split(/\r?\n|,/)
        .map((url) => url.trim())
        .filter(Boolean),
    [pdfUrlsText],
  );

  const resetForm = () => {
    setCourseCode("");
    setCourseTitle("");
    setDepartment("");
    setLevel("");
    setRawText("");
    setPdfUrlsText("");
  };

  const canGenerate =
    Boolean(courseCode.trim()) &&
    Boolean(courseTitle.trim()) &&
    Boolean(department) &&
    Boolean(level) &&
    (Boolean(rawText.trim()) || pdfUrls.length > 0);

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast({
        title: "Missing course details",
        description: "Add course metadata and either raw text or PDF URLs before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-generate-course", {
        body: {
          course_code: courseCode.trim(),
          course_title: courseTitle.trim(),
          department,
          level,
          raw_text: rawText.trim() || undefined,
          pdf_urls: pdfUrls.length > 0 ? pdfUrls : undefined,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Course generation failed");

      toast({
        title: "Admin premium course generated",
        description: `${data.questions_count} tutorial questions were regenerated and published for ${courseCode.trim()}.`,
      });

      resetForm();
      await onGenerated?.();
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Unable to generate premium course content.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Admin premium course generator</CardTitle>
            <Badge variant="secondary">Admin only</Badge>
          </div>
          <CardDescription>
            Paste raw course materials or provide PDF URLs to generate published tutorial questions,
            premium answers, and relational quizzes in one run.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Course code</Label>
              <Input value={courseCode} onChange={(event) => setCourseCode(event.target.value)} placeholder="e.g. GST 101" />
            </div>
            <div className="space-y-2">
              <Label>Course title</Label>
              <Input value={courseTitle} onChange={(event) => setCourseTitle(event.target.value)} placeholder="e.g. Use of English" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  {facultyCategories.map((category) => (
                    <div key={category.name}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {category.name}
                      </div>
                      {category.departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Raw text</Label>
            <Textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Paste tutorial sheets, lecture notes, or exam prep material here..."
              rows={12}
            />
          </div>

          <div className="space-y-2">
            <Label>PDF URLs (optional)</Label>
            <Textarea
              value={pdfUrlsText}
              onChange={(event) => setPdfUrlsText(event.target.value)}
              placeholder={"One public PDF URL per line\nhttps://.../course-pack.pdf"}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Public URLs are fetched by the edge function and merged with the raw text before generation.
            </p>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating || !canGenerate} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating premium course...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate premium course
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What this generates</CardTitle>
          <CardDescription>The admin flow replaces prior autogenerated content for the matched course.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• Extracts tutorial questions with TokenRouter on GPT-4o-mini.</p>
          <p>• Generates premium answers with Claude Sonnet.</p>
          <p>• Publishes answers, explanations, key points, exam tips, and confidence scores.</p>
          <p>• Saves relational quiz rows for the quiz hub and quiz player.</p>
          <p>• Reuses an existing course by code + department, or creates it if it does not exist yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
