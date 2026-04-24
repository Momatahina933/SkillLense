import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Upload, 
  Briefcase, 
  TrendingUp, 
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";

export function DashboardPage() {
  const { user } = useAuth();
  const { cvUploads, jobDescriptions, matchResults, isLoading } = useData();

  const latestCV = cvUploads[cvUploads.length - 1];
  const latestJob = jobDescriptions[jobDescriptions.length - 1];
  const latestMatch = matchResults[matchResults.length - 1];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your CV analysis journey
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              CVs Uploaded
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="animate-pulse bg-gray-200 rounded h-8 w-full" />
                <div className="animate-pulse bg-gray-200 rounded h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{cvUploads.length}</div>
                <p className="text-xs text-muted-foreground">
                  {latestCV
                    ? `Last uploaded ${format(new Date(latestCV.uploadDate), "MMM d, yyyy")}`
                    : "No CVs yet"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Job Applications
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="animate-pulse bg-gray-200 rounded h-8 w-full" />
                <div className="animate-pulse bg-gray-200 rounded h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{jobDescriptions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {latestJob
                    ? `Last added ${format(new Date(latestJob.createdAt), "MMM d, yyyy")}`
                    : "No jobs yet"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Match Analyses
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="animate-pulse bg-gray-200 rounded h-8 w-full" />
                <div className="animate-pulse bg-gray-200 rounded h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{matchResults.length}</div>
                <p className="text-xs text-muted-foreground">
                  {latestMatch
                    ? `Last run ${format(new Date(latestMatch.createdAt), "MMM d, yyyy")}`
                    : "No matches yet"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with your CV analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/app/upload">
            <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-indigo-600" />
              <div>
                <div className="font-semibold">Upload CV</div>
                <div className="text-xs text-gray-500">
                  Start by uploading your CV
                </div>
              </div>
            </Button>
          </Link>

          <Link to="/app/job">
            <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-2">
              <Briefcase className="w-8 h-8 text-indigo-600" />
              <div>
                <div className="font-semibold">Add Job Description</div>
                <div className="text-xs text-gray-500">
                  Compare your skills to a job
                </div>
              </div>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Latest Match Result */}
      {latestMatch && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Match Result</CardTitle>
            <CardDescription>
              Your most recent CV-to-job analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {format(new Date(latestMatch.createdAt), "PPP")}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {cvUploads.find(cv => cv.id === latestMatch.cvId)?.fileName} →{" "}
                  {jobDescriptions.find(job => job.id === latestMatch.jobId)?.title}
                </p>
              </div>
              <div className={`px-6 py-3 rounded-lg ${getScoreColor(latestMatch.matchScore)}`}>
                <div className="text-3xl font-bold">{latestMatch.matchScore}%</div>
                <div className="text-xs">Match Score</div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">
                  {latestMatch.skillGaps.filter(s => s.gapType === "matched").length} Matched
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">
                  {latestMatch.skillGaps.filter(s => s.gapType === "partial").length} Partial
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm">
                  {latestMatch.skillGaps.filter(s => s.gapType === "missing").length} Missing
                </span>
              </div>
            </div>

            <Link to={`/app/result/${latestMatch.id}`}>
              <Button className="w-full mt-2">
                View Detailed Analysis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {cvUploads.length === 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Get Started with SkillLens
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Upload your CV to begin analyzing your skills and matching them with job opportunities
            </p>
            <Link to="/app/upload">
              <Button>
                Upload Your First CV
                <Upload className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
