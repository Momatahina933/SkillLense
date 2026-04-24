import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import { User, Save, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

export function ProfilePage() {
  const { user, profile, updateProfile } = useAuth();
  const [educationSummary, setEducationSummary] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEducationSummary(profile.educationSummary);
      setExperienceSummary(profile.experienceSummary);
      setTargetRole(profile.targetRole);
      setCareerGoal(profile.careerGoal);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);

    try {
      await updateProfile({
        educationSummary,
        experienceSummary,
        targetRole,
        careerGoal,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your account information and career details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your basic account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {user?.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                Member since {user?.createdAt ? format(new Date(user.createdAt), "MMM yyyy") : ""}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Career Profile</CardTitle>
          <CardDescription>
            Help us understand your background and goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetRole">Target Role</Label>
            <Input
              id="targetRole"
              placeholder="e.g., Senior Software Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="educationSummary">Education Summary</Label>
            <Textarea
              id="educationSummary"
              placeholder="e.g., Bachelor's in Computer Science from Stanford University"
              value={educationSummary}
              onChange={(e) => setEducationSummary(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experienceSummary">Experience Summary</Label>
            <Textarea
              id="experienceSummary"
              placeholder="e.g., 5 years of experience in full-stack development with focus on React and Node.js"
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="careerGoal">Career Goal</Label>
            <Textarea
              id="careerGoal"
              placeholder="e.g., Transition into a technical leadership role at a growing startup"
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                💡 Pro Tip
              </h3>
              <p className="text-sm text-gray-700">
                Keep your profile updated to get more accurate job matching results. 
                The more details you provide, the better SkillLens can understand your career trajectory.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
