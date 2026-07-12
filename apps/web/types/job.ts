export type Job = {
  id: string;
  title: string;
  company: string;
  companyLetter: string;
  companyDomain?: string;        // used to load a real logo via Clearbit
  location: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  type: "full-time" | "remote" | "contract" | "internship";
  category: "startup" | "faang" | "company" | "hft";
  description: string;
  skills: string[];
  applyUrl: string;
  postedAt: string;
  source: "adzuna" | "remotive" | "jsearch";
  isVerified: boolean;
  isSaved: boolean;
};
