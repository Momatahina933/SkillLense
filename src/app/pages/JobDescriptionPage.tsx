import { useState } from "react";
import { useNavigate } from "react-router";
import { useData } from "../contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { 
  Briefcase, 
  Plus,
  X,
  Sparkles,
  Loader2,
  AlertCircle
} from "lucide-react";

export function JobDescriptionPage() {
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skillWeight, setSkillWeight] = useState("3");
  const [requiredSkills, setRequiredSkills] = useState<Array<{ skillName: string; importanceWeight: number }>>([]);
  const [extracting, setExtracting] = useState(false);
  const [cvId, setCvId] = useState("");
  const [matching, setMatching] = useState(false);
  
  const { createJobDescription, cvUploads, runMatch } = useData();
  const navigate = useNavigate();

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;

    setRequiredSkills([
      ...requiredSkills,
      { skillName: skillInput.trim(), importanceWeight: parseInt(skillWeight) },
    ]);
    setSkillInput("");
    setSkillWeight("3");
  };

  const handleRemoveSkill = (index: number) => {
    setRequiredSkills(requiredSkills.filter((_, i) => i !== index));
  };

  const handleExtractSkills = async () => {
    if (!description.trim()) {
      toast.error("Please enter a job description first");
      return;
    }

    setExtracting(true);
    // Simulate AI extraction
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock extraction from description
    const extractedSkills = extractSkillsFromDescription(description);
    setRequiredSkills(extractedSkills);
    setExtracting(false);
    toast.success(`Extracted ${extractedSkills.length} skills from the job description`);
  };

  const handleSaveAndMatch = async () => {
    if (!title || !companyName || requiredSkills.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!cvId) {
      toast.error("Please select a CV to match against");
      return;
    }

    setMatching(true);

    try {
      // Create job description
      const job = await createJobDescription({
        title,
        companyName,
        descriptionText: description,
        requiredSkills,
      });

      // Run match analysis
      const match = await runMatch(cvId, job.id);

      toast.success("Job saved and match analysis completed!");
      navigate(`/app/result/${match.id}`);
    } catch (error) {
      console.error("Save & match error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save job and run match");
    } finally {
      setMatching(false);
    }
  };

  const getWeightLabel = (weight: number) => {
    const labels: Record<number, string> = {
      1: "Nice to have",
      2: "Preferred",
      3: "Important",
      4: "Very important",
      5: "Essential",
    };
    return labels[weight] || "Unknown";
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 4) return "bg-red-100 text-red-800";
    if (weight >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Description</h1>
        <p className="text-gray-600 mt-1">
          Add a job description to match against your CV
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Enter the job information and required skills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Senior Frontend Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                placeholder="e.g., Tech Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Paste the full job description here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExtractSkills}
              disabled={extracting || !description.trim()}
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting Skills...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Auto-Extract Skills from Description
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required Skills</CardTitle>
          <CardDescription>
            Add skills required for this position and their importance level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g., React, Python, Project Management"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
              />
            </div>
            <Select value={skillWeight} onValueChange={setSkillWeight}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nice to have</SelectItem>
                <SelectItem value="2">Preferred</SelectItem>
                <SelectItem value="3">Important</SelectItem>
                <SelectItem value="4">Very important</SelectItem>
                <SelectItem value="5">Essential</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddSkill}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {requiredSkills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No skills added yet</p>
              <p className="text-sm">Add skills manually or extract from job description</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requiredSkills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">
                      {skill.skillName}
                    </span>
                    <Badge className={getWeightColor(skill.importanceWeight)}>
                      {getWeightLabel(skill.importanceWeight)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSkill(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select CV to Match</CardTitle>
          <CardDescription>
            Choose which CV you want to compare against this job
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cvUploads.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 mb-4">No CVs uploaded yet</p>
              <Button onClick={() => navigate("/app/upload")}>
                Upload a CV First
              </Button>
            </div>
          ) : (
            <Select value={cvId} onValueChange={setCvId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a CV" />
              </SelectTrigger>
              <SelectContent>
                {cvUploads.map((cv) => (
                  <SelectItem key={cv.id} value={cv.id}>
                    {cv.fileName} ({cv.extractedSkills.length} skills)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Ready to run analysis?
              </h3>
              <p className="text-sm text-gray-600">
                Save this job and match it against your selected CV
              </p>
            </div>
            <Button
              onClick={handleSaveAndMatch}
              size="lg"
              disabled={matching || !title || !companyName || requiredSkills.length === 0 || !cvId}
            >
              {matching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4 mr-2" />
                  Save & Run Match
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to extract skills from job description
function extractSkillsFromDescription(description: string): Array<{ skillName: string; importanceWeight: number }> {
  const commonSkills = [
    "JavaScript", "Python", "React", "Node.js", "SQL", "Git",
    "TypeScript", "HTML", "CSS", "REST API", "Docker", "AWS",
    "Agile", "Scrum", "Communication", "Leadership", "Problem Solving",
    "Java", "C++", "Ruby", "PHP", "MongoDB", "PostgreSQL"
  ];

  const text = description.toLowerCase();
  const found: Array<{ skillName: string; importanceWeight: number }> = [];

  commonSkills.forEach((skill) => {
    if (text.includes(skill.toLowerCase())) {
      // Determine importance based on context keywords
      let weight = 3;
      if (
        text.includes("required") ||
        text.includes("must have") ||
        text.includes("essential")
      ) {
        weight = 5;
      } else if (text.includes("preferred") || text.includes("nice to have")) {
        weight = 2;
      } else if (text.includes("strong") || text.includes("experience")) {
        weight = 4;
      }

      found.push({ skillName: skill, importanceWeight: weight });
    }
  });

  return found.length > 0 ? found : [];
}
