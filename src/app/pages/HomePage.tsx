import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { 
  FileText, 
  Briefcase, 
  TrendingUp, 
  Sparkles, 
  CheckCircle, 
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export function HomePage() {
  const [showSteps, setShowSteps] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SkillLens</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered CV Analysis &<br />
            <span className="text-blue-600">Job Matching</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload your CV, add job descriptions, and get intelligent match scores with 
            detailed skill analysis and personalized recommendations.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth/register">
              <Button size="lg" className="text-lg px-8">
                Start Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need for Job Matching
          </h2>
          <p className="text-lg text-gray-600">
            Powered by advanced AI and NLP technology
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <FeaturePoint
            icon={<FileText className="h-6 w-6 text-blue-600" />}
            title="Smart CV Analysis"
          />
          <FeaturePoint
            icon={<Briefcase className="h-6 w-6 text-blue-600" />}
            title="Job Parsing"
          />
          <FeaturePoint
            icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
            title="Intelligent Matching"
          />
          <FeaturePoint
            icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
            title="Visual Analytics"
          />
          <FeaturePoint
            icon={<Sparkles className="h-6 w-6 text-blue-600" />}
            title="AI Recommendations"
          />
          <FeaturePoint
            icon={<Shield className="h-6 w-6 text-blue-600" />}
            title="Secure & Private"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowSteps(!showSteps)}
            className="text-xl font-semibold px-10 py-6 bg-blue-600 text-white border-0 shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-300 rounded-xl"
          >
            How SkillLens Works
            {showSteps ? (
              <ChevronUp className="ml-3 h-5 w-5" />
            ) : (
              <ChevronDown className="ml-3 h-5 w-5" />
            )}
          </Button>
        </div>

        {showSteps && (
          <div className="animate-in fade-in duration-300">
            <div className="grid md:grid-cols-3 gap-6">
              <StepCard
                number="1"
                title="Upload Your CV"
                description="Simply upload your CV in PDF or Word format. Our AI will extract your skills, experience, and qualifications."
                icon={<FileText className="h-10 w-10 text-blue-600" />}
              />
              <StepCard
                number="2"
                title="Add Job Descriptions"
                description="Paste job descriptions you're interested in. We'll analyze the requirements and extract key skills needed."
                icon={<Briefcase className="h-10 w-10 text-blue-600" />}
              />
              <StepCard
                number="3"
                title="Get Match Results"
                description="View detailed match scores, skill gaps, and personalized recommendations for improving your candidacy."
                icon={<CheckCircle className="h-10 w-10 text-blue-600" />}
              />
            </div>
          </div>
        )}
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowBenefits(!showBenefits)}
            className="text-xl font-semibold px-10 py-6 bg-blue-600 text-white border-0 shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-300 rounded-xl"
          >
            Why Choose SkillLens?
            {showBenefits ? (
              <ChevronUp className="ml-3 h-5 w-5" />
            ) : (
              <ChevronDown className="ml-3 h-5 w-5" />
            )}
          </Button>
        </div>

        {showBenefits && (
          <div className="animate-in fade-in duration-300">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <BenefitCard
                  icon={<Zap className="h-6 w-6" />}
                  title="Lightning Fast"
                  text="Save hours of manual CV tailoring and job research"
                  color="blue"
                />
                <BenefitCard
                  icon={<CheckCircle className="h-6 w-6" />}
                  title="Skill Gap Analysis"
                  text="Know exactly which skills you need to develop"
                  color="green"
                />
                <BenefitCard
                  icon={<BarChart3 className="h-6 w-6" />}
                  title="Progress Tracking"
                  text="Track your match history and see progress over time"
                  color="indigo"
                />
                <BenefitCard
                  icon={<Sparkles className="h-6 w-6" />}
                  title="Smart Insights"
                  text="AI-powered insights to improve your job applications"
                  color="purple"
                />
                <BenefitCard
                  icon={<TrendingUp className="h-6 w-6" />}
                  title="Strategic Focus"
                  text="Focus on jobs where you have the highest match scores"
                  color="cyan"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  number="94%"
                  label="Match Accuracy"
                  color="blue"
                />
                <StatCard
                  number="2.5x"
                  label="Faster Process"
                  color="indigo"
                />
                <StatCard
                  number="1000+"
                  label="CVs Analyzed"
                  color="green"
                />
                <StatCard
                  number="15min"
                  label="Average Time"
                  color="gray"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join SkillLens today and take the guesswork out of job searching.
          </p>
          <Link to="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-white">SkillLens</span>
              </div>
              <p className="text-sm">
                AI-powered CV analysis and job matching for modern job seekers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            © 2024 SkillLens. A dissertation project demonstrating AI-powered job matching.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeaturePoint({ 
  icon, 
  title
}: { 
  icon: React.ReactNode; 
  title: string; 
}) {
  return (
    <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="mb-3 p-3 bg-blue-50 rounded-full">{icon}</div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
  );
}

function StepCard({ 
  number, 
  icon, 
  title, 
  description 
}: { 
  number: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="relative">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-blue-600">{number}</span>
          </div>
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function BenefitCard({ 
  icon, 
  title, 
  text, 
  color
}: { 
  icon: React.ReactNode; 
  title: string; 
  text: string; 
  color: string; 
}) {
  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    indigo: 'bg-indigo-600',
    purple: 'bg-purple-600',
    cyan: 'bg-cyan-600'
  };

  return (
    <div className={`${colorClasses[color]} p-4 rounded-lg shadow-md hover:shadow-lg transition-all`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <div className="text-blue-600">{icon}</div>
        </div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
      </div>
      <p className="text-sm text-white/90 ml-13">{text}</p>
    </div>
  );
}

function StatCard({ 
  number, 
  label, 
  color
}: { 
  number: string; 
  label: string; 
  color: string; 
}) {
  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    green: 'bg-green-600',
    gray: 'bg-gray-700'
  };

  return (
    <div className={`${colorClasses[color]} p-6 rounded-lg shadow-md hover:shadow-lg transition-all`}>
      <div className="text-3xl font-bold text-white mb-1">{number}</div>
      <div className="text-sm font-medium text-white/80">{label}</div>
    </div>
  );
}