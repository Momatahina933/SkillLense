import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api";
import { useAuth } from "./AuthContext";
import type { CVUpload as ApiCVUpload, JobDescription as ApiJobDescription, MatchResult as ApiMatchResult } from "../api";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ExtractedSkill { id: string; rawText: string; normalizedName: string; confidence: number; userVerified: boolean; }
export interface CVUpload { id: string; userId: string; fileName: string; uploadDate: string; parseStatus: "pending" | "completed" | "failed"; extractedSkills: ExtractedSkill[]; }
export interface JobRequiredSkill { skillName: string; importanceWeight: number; }
export interface JobDescription { id: string; userId: string; title: string; companyName: string; descriptionText: string; requiredSkills: JobRequiredSkill[]; createdAt: string; }
export interface SkillGap { skillName: string; gapType: "missing" | "partial" | "matched"; recommendation: string; }
export interface MatchResult { id: string; userId: string; cvId: string; jobId: string; matchScore: number; skillGaps: SkillGap[]; createdAt: string; }

interface DataContextType {
  cvUploads: CVUpload[];
  jobDescriptions: JobDescription[];
  matchResults: MatchResult[];
  isLoading: boolean;
  uploadCV: (file: File) => Promise<CVUpload>;
  updateSkillVerification: (cvId: string, skillId: string, verified: boolean) => void;
  createJobDescription: (job: Omit<JobDescription, "id" | "userId" | "createdAt">) => Promise<JobDescription>;
  runMatch: (cvId: string, jobId: string) => Promise<MatchResult>;
  deleteCV: (cvId: string) => void;
  deleteJob: (jobId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ─── API shape mappers ────────────────────────────────────────────────────────

function mapApiCV(c: ApiCVUpload): CVUpload {
  return { id: c.cvId, userId: c.userId, fileName: c.fileName, uploadDate: c.uploadDate, parseStatus: c.parseStatus === "processing" ? "pending" : c.parseStatus, extractedSkills: (c.extractedSkills ?? []).map(s => ({ id: s.skillId, rawText: s.rawSkillText, normalizedName: s.normalisedName, confidence: s.confidenceScore, userVerified: s.userVerified })) };
}
function mapApiJob(j: ApiJobDescription): JobDescription {
  return { id: j.jobId, userId: j.userId, title: j.title, companyName: j.companyName, descriptionText: j.descriptionText, requiredSkills: (j.requiredSkills ?? []).map(s => ({ skillName: s.skillName, importanceWeight: s.importanceWeight })), createdAt: j.createdAt };
}
function mapApiMatch(m: ApiMatchResult): MatchResult {
  return { id: m.matchId, userId: m.userId, cvId: m.cvId, jobId: m.jobId, matchScore: m.matchScore, skillGaps: (m.skillGaps ?? []).map(g => ({ skillName: g.skillName, gapType: g.gapType, recommendation: g.recommendationNote })), createdAt: m.createdAt };
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const SKILLS_POOL = ["JavaScript","Python","React","Node.js","SQL","TypeScript","HTML","CSS","Git","Docker","AWS","REST API","Agile","Machine Learning","PostgreSQL"];

function mockExtractSkills(): ExtractedSkill[] {
  const n = Math.floor(Math.random() * 7) + 5;
  return [...SKILLS_POOL].sort(() => Math.random() - 0.5).slice(0, n).map((s, i) => ({
    id: `skill_${Date.now()}_${i}`, rawText: s, normalizedName: s,
    confidence: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100, userVerified: true,
  }));
}

function mockCalculateMatch(cv: CVUpload, job: JobDescription): { matchScore: number; skillGaps: SkillGap[] } {
  const cvSkills = cv.extractedSkills.map(s => s.normalizedName.toLowerCase());
  let total = 0, earned = 0;
  const skillGaps: SkillGap[] = job.requiredSkills.map(req => {
    total += req.importanceWeight;
    const name = req.skillName.toLowerCase();
    if (cvSkills.includes(name)) {
      earned += req.importanceWeight;
      return { skillName: req.skillName, gapType: "matched" as const, recommendation: `You have ${req.skillName} in your CV.` };
    }
    const partial = cvSkills.some(s => s.includes(name.split(" ")[0]) || name.includes(s.split(" ")[0]));
    if (partial) {
      earned += req.importanceWeight * 0.5;
      return { skillName: req.skillName, gapType: "partial" as const, recommendation: `You have related experience. Highlight ${req.skillName} more explicitly.` };
    }
    return { skillName: req.skillName, gapType: "missing" as const, recommendation: `Consider developing ${req.skillName} skills.` };
  });
  return { matchScore: total > 0 ? Math.round((earned / total) * 100) : 0, skillGaps };
}

// ─── Mock Provider ────────────────────────────────────────────────────────────

function MockDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cvUploads, setCvUploads] = useState<CVUpload[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  useEffect(() => {
    if (!user) return;
    const cvs = localStorage.getItem(`sl_cvs_${user.id}`);
    const jobs = localStorage.getItem(`sl_jobs_${user.id}`);
    const matches = localStorage.getItem(`sl_matches_${user.id}`);
    if (cvs) setCvUploads(JSON.parse(cvs));
    if (jobs) setJobDescriptions(JSON.parse(jobs));
    if (matches) setMatchResults(JSON.parse(matches));
  }, [user]);

  useEffect(() => { if (user) localStorage.setItem(`sl_cvs_${user.id}`, JSON.stringify(cvUploads)); }, [cvUploads, user]);
  useEffect(() => { if (user) localStorage.setItem(`sl_jobs_${user.id}`, JSON.stringify(jobDescriptions)); }, [jobDescriptions, user]);
  useEffect(() => { if (user) localStorage.setItem(`sl_matches_${user.id}`, JSON.stringify(matchResults)); }, [matchResults, user]);

  const uploadCV = async (file: File): Promise<CVUpload> => {
    await new Promise(r => setTimeout(r, 400));
    const cv: CVUpload = { id: `cv_${Date.now()}`, userId: user!.id, fileName: file.name, uploadDate: new Date().toISOString(), parseStatus: "completed", extractedSkills: mockExtractSkills() };
    setCvUploads(prev => [...prev, cv]);
    return cv;
  };

  const updateSkillVerification = (cvId: string, skillId: string, verified: boolean) => {
    setCvUploads(prev => prev.map(cv => cv.id !== cvId ? cv : { ...cv, extractedSkills: cv.extractedSkills.map(s => s.id === skillId ? { ...s, userVerified: verified } : s) }));
  };

  const createJobDescription = async (job: Omit<JobDescription, "id" | "userId" | "createdAt">): Promise<JobDescription> => {
    const newJob: JobDescription = { ...job, id: `job_${Date.now()}`, userId: user!.id, createdAt: new Date().toISOString() };
    setJobDescriptions(prev => [...prev, newJob]);
    return newJob;
  };

  const runMatch = async (cvId: string, jobId: string): Promise<MatchResult> => {
    await new Promise(r => setTimeout(r, 300));
    // Read directly from localStorage in case state hasn't updated yet
    const storedCVs: CVUpload[] = JSON.parse(localStorage.getItem(`sl_cvs_${user?.id}`) || "[]");
    const storedJobs: JobDescription[] = JSON.parse(localStorage.getItem(`sl_jobs_${user?.id}`) || "[]");
    const cv = storedCVs.find(c => c.id === cvId) ?? cvUploads.find(c => c.id === cvId);
    const job = storedJobs.find(j => j.id === jobId) ?? jobDescriptions.find(j => j.id === jobId);
    if (!cv) throw new Error("CV not found");
    if (!job) throw new Error("Job not found");
    const { matchScore, skillGaps } = mockCalculateMatch(cv, job);
    const match: MatchResult = { id: `match_${Date.now()}`, userId: user!.id, cvId, jobId, matchScore, skillGaps, createdAt: new Date().toISOString() };
    setMatchResults(prev => [...prev, match]);
    return match;
  };

  const deleteCV = (cvId: string) => {
    setCvUploads(prev => prev.filter(c => c.id !== cvId));
    setMatchResults(prev => prev.filter(m => m.cvId !== cvId));
  };

  const deleteJob = (jobId: string) => {
    setJobDescriptions(prev => prev.filter(j => j.id !== jobId));
    setMatchResults(prev => prev.filter(m => m.jobId !== jobId));
  };

  return (
    <DataContext.Provider value={{ cvUploads, jobDescriptions, matchResults, isLoading: false, uploadCV, updateSkillVerification, createJobDescription, runMatch, deleteCV, deleteJob }}>
      {children}
    </DataContext.Provider>
  );
}

// ─── Real API Provider ────────────────────────────────────────────────────────

function RealDataProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: rawCVs = [], isLoading: cvsLoading } = useQuery({ queryKey: ["cvs"], queryFn: () => apiClient.cv.list() });
  const { data: rawJobs = [], isLoading: jobsLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => apiClient.jobs.list() });
  const { data: rawMatches = [], isLoading: matchesLoading } = useQuery({ queryKey: ["matches"], queryFn: () => apiClient.match.history() });

  const uploadCVMut = useMutation({ mutationFn: (f: File) => apiClient.cv.upload(f), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cvs"] }) });
  const createJobMut = useMutation({ mutationFn: (d: Parameters<typeof apiClient.jobs.create>[0]) => apiClient.jobs.create(d), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }) });
  const runMatchMut = useMutation({ mutationFn: ({ cvId, jobId }: { cvId: string; jobId: string }) => apiClient.match.run(cvId, jobId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }) });
  const deleteCVMut = useMutation({ mutationFn: (id: string) => apiClient.cv.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cvs"] }); queryClient.invalidateQueries({ queryKey: ["matches"] }); } });
  const deleteJobMut = useMutation({ mutationFn: (id: string) => apiClient.jobs.delete(id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["jobs"] }); queryClient.invalidateQueries({ queryKey: ["matches"] }); } });
  const updateSkillMut = useMutation({ mutationFn: ({ cvId, skillId, verified }: { cvId: string; skillId: string; verified: boolean }) => apiClient.cv.reviewSkills(cvId, [{ skillId, userVerified: verified }]), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cvs"] }) });

  return (
    <DataContext.Provider value={{
      cvUploads: rawCVs.map(mapApiCV),
      jobDescriptions: rawJobs.map(mapApiJob),
      matchResults: rawMatches.map(mapApiMatch),
      isLoading: cvsLoading || jobsLoading || matchesLoading,
      uploadCV: async (f) => mapApiCV(await uploadCVMut.mutateAsync(f)),
      updateSkillVerification: (cvId, skillId, verified) => updateSkillMut.mutate({ cvId, skillId, verified }),
      createJobDescription: async (job) => mapApiJob(await createJobMut.mutateAsync({ title: job.title, companyName: job.companyName, descriptionText: job.descriptionText })),
      runMatch: async (cvId, jobId) => mapApiMatch(await runMatchMut.mutateAsync({ cvId, jobId })),
      deleteCV: (id) => deleteCVMut.mutate(id),
      deleteJob: (id) => deleteJobMut.mutate(id),
    }}>
      {children}
    </DataContext.Provider>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  return USE_MOCK ? <MockDataProvider>{children}</MockDataProvider> : <RealDataProvider>{children}</RealDataProvider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
}
