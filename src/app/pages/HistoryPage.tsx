import { Link } from "react-router";
import { useData } from "../contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  History as HistoryIcon,
  FileText,
  Briefcase,
  TrendingUp,
  Calendar,
  Trash2,
  Eye,
  AlertCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export function HistoryPage() {
  const { cvUploads, jobDescriptions, matchResults, deleteCV, deleteJob, isLoading } = useData();

  const handleDeleteCV = (cvId: string) => {
    if (confirm("Are you sure you want to delete this CV? This will also delete all related match results.")) {
      deleteCV(cvId);
      toast.success("CV deleted successfully");
    }
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm("Are you sure you want to delete this job? This will also delete all related match results.")) {
      deleteJob(jobId);
      toast.success("Job deleted successfully");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">History</h1>
        <p className="text-gray-600 mt-1">
          View your uploaded CVs, saved jobs, and match analyses
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading your history...</p>
        </div>
      ) : (
        <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matches">
            <TrendingUp className="w-4 h-4 mr-2" />
            Match Results
          </TabsTrigger>
          <TabsTrigger value="cvs">
            <FileText className="w-4 h-4 mr-2" />
            CVs
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Briefcase className="w-4 h-4 mr-2" />
            Jobs
          </TabsTrigger>
        </TabsList>

        {/* Match Results Tab */}
        <TabsContent value="matches" className="space-y-4 mt-6">
          {matchResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No match results yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload a CV and add a job description to start analyzing
                </p>
                <Link to="/app/upload">
                  <Button>Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {[...matchResults].reverse().map((match) => {
                const cv = cvUploads.find((c) => c.id === match.cvId);
                const job = jobDescriptions.find((j) => j.id === match.jobId);

                return (
                  <Card key={match.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge className={getScoreColor(match.matchScore)}>
                              {match.matchScore}% Match
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(match.createdAt), "MMM d, yyyy")}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {cv?.fileName || "CV not found"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {job?.title || "Job not found"} at {job?.companyName || "Unknown"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600">
                              {match.skillGaps.filter((s) => s.gapType === "matched").length} Matched
                            </span>
                            <span className="text-yellow-600">
                              {match.skillGaps.filter((s) => s.gapType === "partial").length} Partial
                            </span>
                            <span className="text-red-600">
                              {match.skillGaps.filter((s) => s.gapType === "missing").length} Missing
                            </span>
                          </div>
                        </div>

                        <Link to={`/app/result/${match.id}`}>
                          <Button>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* CVs Tab */}
        <TabsContent value="cvs" className="space-y-4 mt-6">
          {cvUploads.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No CVs uploaded yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload your first CV to get started
                </p>
                <Link to="/app/upload">
                  <Button>Upload CV</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...cvUploads].reverse().map((cv) => (
                <Card key={cv.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{cv.fileName}</CardTitle>
                        <CardDescription>
                          Uploaded {format(new Date(cv.uploadDate), "MMM d, yyyy")}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={cv.parseStatus === "completed" ? "default" : "secondary"}
                      >
                        {cv.parseStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <strong>{cv.extractedSkills.length}</strong> skills extracted
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cv.extractedSkills.slice(0, 5).map((skill) => (
                        <Badge key={skill.id} variant="outline">
                          {skill.normalizedName}
                        </Badge>
                      ))}
                      {cv.extractedSkills.length > 5 && (
                        <Badge variant="outline">
                          +{cv.extractedSkills.length - 5} more
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteCV(cv.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete CV
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4 mt-6">
          {jobDescriptions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No jobs saved yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Add a job description to start matching
                </p>
                <Link to="/app/job">
                  <Button>Add Job</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...jobDescriptions].reverse().map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{job.title}</CardTitle>
                        <CardDescription>{job.companyName}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4" />
                        Added {format(new Date(job.createdAt), "MMM d, yyyy")}
                      </div>
                      <strong>{job.requiredSkills.length}</strong> required skills
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="outline">
                          {skill.skillName}
                        </Badge>
                      ))}
                      {job.requiredSkills.length > 5 && (
                        <Badge variant="outline">
                          +{job.requiredSkills.length - 5} more
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Job
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
