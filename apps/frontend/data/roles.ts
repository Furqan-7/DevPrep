/**
 * Interview roles offered in DevPrep. Shared by the AI-interview dashboard and the
 * landing page, so the landing page's counts always match what the product offers.
 */
export const ROLES = [
  { title: "Frontend Engineer",          duration: 20, category: "Engineering", skills: ["React", "TypeScript", "CSS Architecture", "Web Performance"] },
  { title: "Backend Engineer",           duration: 20, category: "Engineering", skills: ["System Design", "REST APIs", "Databases", "Caching"] },
  { title: "Full Stack Developer",       duration: 25, category: "Engineering", skills: ["Node.js", "React", "PostgreSQL", "Docker"] },
  { title: "Data Structures & Algorithms", duration: 18, category: "Data",     skills: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming"] },
  { title: "System Design",             duration: 30, category: "Engineering", skills: ["Scalability", "Load Balancing", "Microservices", "CAP Theorem"] },
  { title: "Machine Learning Engineer", duration: 20, category: "Data",        skills: ["Machine Learning", "Deep Learning", "Data Analysis", "Python"] },
  { title: "DevOps Engineer",           duration: 18, category: "Engineering", skills: ["CI/CD", "Kubernetes", "AWS", "Infrastructure as Code"] },
  { title: "Android Developer",         duration: 18, category: "Engineering", skills: ["Kotlin", "Jetpack Compose", "Android SDK", "MVVM"] },
  { title: "iOS Developer",             duration: 18, category: "Engineering", skills: ["Swift", "SwiftUI", "UIKit", "Core Data"] },
  { title: "Data Engineer",             duration: 20, category: "Data",        skills: ["Spark", "Kafka", "ETL Pipelines", "Data Warehousing"] },
  { title: "Product Manager",           duration: 20, category: "Product",     skills: ["Product Strategy", "Roadmapping", "Stakeholder Management", "Metrics"] },
  { title: "Behavioral Round",          duration: 15, category: "Behavioral",  skills: ["Leadership", "Conflict Resolution", "Communication", "Teamwork"] },
  { title: "Cloud Engineer",            duration: 20, category: "Engineering", skills: ["AWS", "GCP", "Azure", "Serverless", "Terraform"] },
  { title: "Site Reliability Engineer", duration: 22, category: "Engineering", skills: ["Observability", "On-Call", "SLOs & SLAs", "Incident Response"] },
  { title: "Cybersecurity Engineer",    duration: 20, category: "Engineering", skills: ["Threat Modeling", "Penetration Testing", "OWASP", "Cryptography"] },
  { title: "QA / Test Engineer",        duration: 18, category: "Engineering", skills: ["Test Automation", "Selenium", "API Testing", "Bug Lifecycle"] },
  { title: "Data Scientist",            duration: 22, category: "Data",        skills: ["Statistics", "Feature Engineering", "Model Evaluation", "SQL"] },
  { title: "Generative AI Engineer",    duration: 20, category: "Data",        skills: ["LLMs", "Prompt Engineering", "RAG", "LangChain", "Fine-tuning"] },
  { title: "Embedded Systems Engineer", duration: 20, category: "Engineering", skills: ["C/C++", "RTOS", "Microcontrollers", "Hardware Interfaces"] },
  { title: "Blockchain Developer",      duration: 20, category: "Engineering", skills: ["Solidity", "Smart Contracts", "Web3.js", "DeFi Protocols"] },
  { title: "UI/UX Designer",           duration: 18, category: "Design",      skills: ["Figma", "User Research", "Design Systems", "Prototyping"] },
  { title: "Game Developer",            duration: 20, category: "Engineering", skills: ["Unity", "C#", "Game Physics", "Shader Programming"] },
  { title: "Database Administrator",    duration: 20, category: "Engineering", skills: ["Query Optimization", "Indexing", "Replication", "Backup & Recovery"] },
  { title: "Technical Program Manager", duration: 20, category: "Product",     skills: ["Execution Planning", "Cross-team Alignment", "Risk Management", "OKRs"] },
] as const;

export type Role = (typeof ROLES)[number];

// same order as the dashboard's filter tags; any new category is appended at the end
const CATEGORY_ORDER = ["Engineering", "Data", "Design", "Product", "Behavioral"];
export const ROLE_CATEGORIES = Array.from(new Set(ROLES.map((r) => r.category as string))).sort(
  (a, b) => (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99),
);
export const ROLE_DURATION_RANGE = {
  min: Math.min(...ROLES.map((r) => r.duration)),
  max: Math.max(...ROLES.map((r) => r.duration)),
};
