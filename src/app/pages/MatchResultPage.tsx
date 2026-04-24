import { useParams, useNavigate, Link } from "react-router";
import { useData } from "../contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  TrendingUp,
  FileText,
  Briefcase,
  Calendar,
  ArrowLeft,
  Lightbulb,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

export function MatchResultPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { matchResults, cvUploads, jobDescriptions, isLoading } = useData();
  const navigate = useNavigate();

  const match = matchResults.find((m) => m.id === matchId);
  const cv = match ? cvUploads.find((c) => c.id === match.cvId) : null;
  const job = match ? jobDescriptions.find((j) => j.id === match.jobId) : null;

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600" />
            <p className="text-gray-500 text-sm">Loading match result...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!match || !cv || !job) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Match Result Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The match result you're looking for doesn't exist
            </p>
            <Button onClick={() => navigate("/app/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const matchedSkills = match.skillGaps.filter((s) => s.gapType === "matched");
  const partialSkills = match.skillGaps.filter((s) => s.gapType === "partial");
  const missingSkills = match.skillGaps.filter((s) => s.gapType === "missing");

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return "Excellent match! You're well-qualified for this role.";
    if (score >= 60) return "Good match! Consider highlighting relevant experience.";
    return "Moderate match. Focus on developing key missing skills.";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Match Analysis</h1>
          <p className="text-gray-600 mt-1">
            Detailed skill comparison and recommendations
          </p>
        </div>
      </div>

      {/* Match Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`lg:col-span-1 ${getScoreBgColor(match.matchScore)}`}>
          <CardContent className="pt-6 text-center">
            <TrendingUp className={`w-12 h-12 mx-auto mb-4 ${getScoreColor(match.matchScore)}`} />
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(match.matchScore)}`}>
              {match.matchScore}%
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Match Score
            </p>
            <p className="text-sm text-gray-600">
              {getScoreMessage(match.matchScore)}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Analysis Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">CV</p>
                <p className="text-base text-gray-900">{cv.fileName}</p>
                <p className="text-xs text-gray-500">
                  {cv.extractedSkills.length} skills extracted
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Job</p>
                <p className="text-base text-gray-900">{job.title}</p>
                <p className="text-xs text-gray-500">
                  {job.companyName} • {job.requiredSkills.length} required skills
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Analyzed</p>
                <p className="text-base text-gray-900">
                  {format(new Date(match.createdAt), "PPP 'at' p")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Match Breakdown</CardTitle>
          <CardDescription>
            How your skills compare to job requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {matchedSkills.length}
              </div>
              <p className="text-sm text-gray-600">Matched</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">
                {partialSkills.length}
              </div>
              <p className="text-sm text-gray-600">Partial</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {missingSkills.length}
              </div>
              <p className="text-sm text-gray-600">Missing</p>
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Coverage
              </span>
              <span className="text-sm font-medium text-gray-900">
                {match.matchScore}%
              </span>
            </div>
            <Progress value={match.matchScore} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Matched Skills */}
      {matchedSkills.length > 0 && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <CardTitle>Matched Skills</CardTitle>
            </div>
            <CardDescription>
              Skills you have that match the job requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {matchedSkills.map((skill, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      {skill.skillName}
                    </Badge>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-700">{skill.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Partial Skills */}
      {partialSkills.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <CardTitle>Partially Matched Skills</CardTitle>
            </div>
            <CardDescription>
              Skills where you have related experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {partialSkills.map((skill, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-yellow-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {skill.skillName}
                    </Badge>
                  </div>
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-sm text-gray-700">{skill.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <CardTitle>Missing Skills</CardTitle>
            </div>
            <CardDescription>
              Skills required for the job that weren't found in your CV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {missingSkills.map((skill, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-red-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">
                      {skill.skillName}
                    </Badge>
                  </div>
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm text-gray-700">{skill.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                What's next?
              </h3>
              <p className="text-sm text-gray-600">
                Continue improving your profile or try matching with another job
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/app/upload">
                <Button variant="outline">
                  Update CV
                </Button>
              </Link>
              <Link to="/app/job">
                <Button>
                  Try Another Job
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
