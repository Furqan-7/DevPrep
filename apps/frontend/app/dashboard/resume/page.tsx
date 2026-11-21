import type { Metadata } from "next";
import { ResumeView } from "@/components/resume/ResumeView";

export const metadata: Metadata = { title: "Resume · DevPrep" };

export default function ResumePage() {
  return <ResumeView />;
}
