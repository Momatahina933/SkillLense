import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useData } from "../contexts/DataContext";
import { apiClient } from "../api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw
} from "lucide-react";

type UploadPhase = "idle" | "uploading" | "processing" | "completed" | "failed";

export function UploadCVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [extractedCV, setExtractedCV] = useState<any>(null);
  const { uploadCV, updateSkillVerification } = useData();
  const navigate = useNavigate();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const startPolling = (cvId: string) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const cv = await apiClient.cv.get(cvId);
        if (cv.parseStatus === "completed") {
          stopPolling();
          // Map API CV to local shape
          const mapped = {
            id: cv.cvId,
            fileName: cv.fileName,
            parseStatus: cv.parseStatus,
            extractedSkills: (cv.extractedSkills ?? []).map((s) => ({
              id: s.skillId,
              rawText: s.rawSkillText,
              normalizedName: s.normalisedName,
              confidence: s.confidenceScore,
              userVerified: s.userVerified,
            })),
          };
          setExtractedCV(mapped);
          setPhase("completed");
          toast.success("CV analyzed successfully!");
        } else if (cv.parseStatus === "failed") {
          stopPolling();
          setPhase("failed");
          toast.error("CV processing failed");
        }
      } catch {
        // silently retry on transient errors
      }
    }, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Please upload a PDF or DOCX file");
        return;
      }
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setPhase("uploading");
    try {
      const cv = await uploadCV(file);

      // In mock mode the CV is already fully processed — skip polling
      if (cv.parseStatus === "completed") {
        setExtractedCV(cv);
        setPhase("completed");
        toast.success("CV analyzed successfully!");
        return;
      }

      // Real backend: poll until parseStatus changes
      setPhase("processing");
      startPolling(cv.id);
    } catch {
      setPhase("failed");
      toast.error("Failed to upload CV");
    }
  };

  const handleRetry = () => {
    stopPolling();
    setPhase("idle");
    setFile(null);
    setExtractedCV(null);
  };

  const handleSkillToggle = (skillId: string, verified: boolean) => {
    if (extractedCV) {
      updateSkillVerification(extractedCV.id, skillId, verified);
      setExtractedCV({
        ...extractedCV,
        extractedSkills: extractedCV.extractedSkills.map((skill: any) =>
          skill.id === skillId ? { ...skill, userVerified: verified } : skill
        ),
      });
    }
  };

  const handleFinish = () => {
    toast.success("CV saved! Ready to match with jobs.");
    navigate("/app/dashboard");
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-green-100 text-green-800";
    if (confidence >= 0.7) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const uploading = phase === "uploading";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload CV</h1>
        <p className="text-gray-600 mt-1">
          Upload your CV to extract and analyze your skills
        </p>
      </div>

      {/* Processing state */}
      {phase === "processing" && (
        <Card>
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Processing your CV...</h2>
            <p className="text-sm text-gray-500">
              We're extracting your skills. This usually takes a few seconds.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Failed state */}
      {phase === "failed" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Processing Failed</h2>
            <p className="text-sm text-gray-600">
              We couldn't process your CV. Please try again with a different file.
            </p>
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload form */}
      {(phase === "idle" || phase === "uploading") && (
        <Card>
          <CardHeader>
            <CardTitle>Select Your CV</CardTitle>
            <CardDescription>
              Upload your CV in PDF or DOCX format (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                id="cv-upload"
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <label
                htmlFor="cv-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-indigo-600" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF or DOCX up to 10MB
                  </p>
                </div>
              </label>
            </div>

            {file && !uploading && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FileText className="w-8 h-8 text-indigo-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button onClick={handleUpload}>
                  Analyze CV
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {uploading && (
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                <p className="text-sm text-gray-600">
                  Uploading your CV...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completed — show extracted skills */}
      {phase === "completed" && extractedCV && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <CardTitle>Skills Extracted Successfully</CardTitle>
                  <CardDescription>
                    Review and verify the skills we found in your CV
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-900">
                  We found <strong>{extractedCV.extractedSkills.length} skills</strong> in your CV. 
                  Check or uncheck skills to confirm accuracy.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {extractedCV.extractedSkills.map((skill: any) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      checked={skill.userVerified}
                      onCheckedChange={(checked) =>
                        handleSkillToggle(skill.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {skill.normalizedName}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getConfidenceColor(skill.confidence)}`}
                      >
                        {(skill.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Ready to match with jobs?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your CV has been analyzed. You can now compare it with job descriptions.
                  </p>
                </div>
                <Button onClick={handleFinish} size="lg">
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
