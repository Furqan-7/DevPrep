"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";

import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Star,
  ChevronDown,
  Filter,
  ArrowRight,
  Database,
  Code2,
  Trash2,
  X
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

// --- Types ---
interface Problem {
  id: number;
  name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  frequency: number;
  companies: string[];
  leetcode: string;
  gfg: string;
}

// --- Hardcoded Data ---
const problems: Problem[] = [
  { id: 1, name: "Two Sum", difficulty: "Easy", topic: "Arrays", frequency: 3, companies: ["Google", "Amazon", "Meta"], leetcode: "https://leetcode.com/problems/two-sum", gfg: "https://www.geeksforgeeks.org/two-sum/" },
  { id: 2, name: "Best Time to Buy and Sell Stock", difficulty: "Easy", topic: "Arrays", frequency: 3, companies: ["Google", "Amazon", "Flipkart"], leetcode: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock", gfg: "https://www.geeksforgeeks.org/best-time-to-buy-and-sell-stock/" },
  { id: 3, name: "Maximum Subarray", difficulty: "Medium", topic: "Arrays", frequency: 3, companies: ["Google", "Microsoft", "Amazon"], leetcode: "https://leetcode.com/problems/maximum-subarray", gfg: "https://www.geeksforgeeks.org/maximum-subarray-problem-kadanes-algorithm/" },
  { id: 4, name: "Merge Intervals", difficulty: "Medium", topic: "Arrays", frequency: 2, companies: ["Google", "Meta", "Razorpay"], leetcode: "https://leetcode.com/problems/merge-intervals", gfg: "https://www.geeksforgeeks.org/merging-intervals/" },
  { id: 5, name: "Product of Array Except Self", difficulty: "Medium", topic: "Arrays", frequency: 2, companies: ["Amazon", "Microsoft"], leetcode: "https://leetcode.com/problems/product-of-array-except-self", gfg: "https://www.geeksforgeeks.org/a-product-array-puzzle/" },
  { id: 6, name: "Longest Substring Without Repeating Characters", difficulty: "Medium", topic: "Sliding Window", frequency: 3, companies: ["Google", "Amazon", "Zepto"], leetcode: "https://leetcode.com/problems/longest-substring-without-repeating-characters", gfg: "https://www.geeksforgeeks.org/length-of-the-longest-substring-without-repeating-characters/" },
  { id: 7, name: "Valid Parentheses", difficulty: "Easy", topic: "Stacks & Queues", frequency: 3, companies: ["Google", "Meta", "Adobe"], leetcode: "https://leetcode.com/problems/valid-parentheses", gfg: "https://www.geeksforgeeks.org/check-for-balanced-parentheses-in-an-expression/" },
  { id: 8, name: "Climbing Stairs", difficulty: "Easy", topic: "DP", frequency: 2, companies: ["Amazon", "Flipkart"], leetcode: "https://leetcode.com/problems/climbing-stairs", gfg: "https://www.geeksforgeeks.org/count-ways-reach-nth-stair/" },
  { id: 9, name: "Binary Tree Level Order Traversal", difficulty: "Medium", topic: "Trees", frequency: 3, companies: ["Google", "Amazon", "Microsoft"], leetcode: "https://leetcode.com/problems/binary-tree-level-order-traversal", gfg: "https://www.geeksforgeeks.org/level-order-tree-traversal/" },
  { id: 10, name: "Number of Islands", difficulty: "Medium", topic: "Graphs", frequency: 3, companies: ["Google", "Amazon", "Flipkart", "Zepto"], leetcode: "https://leetcode.com/problems/number-of-islands", gfg: "https://www.geeksforgeeks.org/find-number-of-islands/" },
  { id: 11, name: "Coin Change", difficulty: "Medium", topic: "DP", frequency: 2, companies: ["Amazon", "Microsoft", "Razorpay"], leetcode: "https://leetcode.com/problems/coin-change", gfg: "https://www.geeksforgeeks.org/coin-change-dp-7/" },
  { id: 12, name: "Word Break", difficulty: "Medium", topic: "DP", frequency: 2, companies: ["Google", "Meta"], leetcode: "https://leetcode.com/problems/word-break", gfg: "https://www.geeksforgeeks.org/word-break-problem-dp-32/" },
  { id: 13, name: "LRU Cache", difficulty: "Hard", topic: "Linked Lists", frequency: 3, companies: ["Google", "Amazon", "Flipkart", "Razorpay"], leetcode: "https://leetcode.com/problems/lru-cache", gfg: "https://www.geeksforgeeks.org/lru-cache-implementation/" },
  { id: 14, name: "Median of Sorted Arrays", difficulty: "Hard", topic: "Binary Search", frequency: 2, companies: ["Google", "Meta", "Amazon"], leetcode: "https://leetcode.com/problems/median-of-two-sorted-arrays", gfg: "https://www.geeksforgeeks.org/median-of-two-sorted-arrays/" },
  { id: 15, name: "Trapping Rain Water", difficulty: "Hard", topic: "Arrays", frequency: 3, companies: ["Google", "Amazon", "Microsoft", "Adobe"], leetcode: "https://leetcode.com/problems/trapping-rain-water", gfg: "https://www.geeksforgeeks.org/trapping-rain-water/" },
];

const companies = ["All", "Google", "Meta", "Amazon", "Microsoft", "Flipkart", "Razorpay", "Zepto", "Adobe", "AMD", "Others"];
const topics = ["All", "Arrays", "Strings", "Trees", "Graphs", "DP", "Linked Lists", "Stacks & Queues", "Greedy", "Backtracking", "Binary Search", "Sliding Window"];
const difficulties = ["All", "Easy", "Medium", "Hard"];
const statuses = ["All", "Solved", "Unsolved"];

// --- Components ---

const SelectField = ({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (val: string) => void }) => (
  <div className="relative group">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 pr-10 text-xs font-medium text-brand-muted hover:border-white/20 transition-colors focus:outline-none focus:border-white/40 cursor-pointer w-full md:w-auto min-w-[140px]"
    >
      {options.map(opt => <option key={opt} value={opt} className="bg-[#0a0a0b] text-white">{opt === "All" ? `${label}: All` : opt}</option>)}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-hover:text-white/40 transition-colors" />
  </div>
);

export default function DSAPage() {
  const [solvedProblems, setSolvedProblems] = useState<Set<number>>(new Set());
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [filters, setFilters] = useState({
    difficulty: "All",
    topic: "All",
    status: "All",
    searchQuery: ""
  });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [editingNote, setEditingNote] = useState<number | null>(null);

  // --- Persistence ---
  useEffect(() => {
    const savedSolved = localStorage.getItem("tp_solved");
    const savedNotes = localStorage.getItem("tp_notes");
    if (savedSolved) setSolvedProblems(new Set(JSON.parse(savedSolved)));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, []);

  const toggleSolved = (id: number) => {
    const newSolved = new Set(solvedProblems);
    if (newSolved.has(id)) newSolved.delete(id);
    else newSolved.add(id);
    setSolvedProblems(newSolved);
    localStorage.setItem("tp_solved", JSON.stringify(Array.from(newSolved)));
  };

  const saveNote = (id: number, text: string) => {
    const newNotes = { ...notes, [id]: text };
    setNotes(newNotes);
    localStorage.setItem("tp_notes", JSON.stringify(newNotes));
    setEditingNote(null);
  };

  // --- Filter Logic ---
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      const companyMatch = selectedCompany === "All" || p.companies.includes(selectedCompany) || (selectedCompany === "Others" && !["Google", "Meta", "Amazon", "Microsoft", "Flipkart", "Razorpay", "Zepto", "Adobe", "AMD"].some(c => p.companies.includes(c)));
      const difficultyMatch = filters.difficulty === "All" || p.difficulty === filters.difficulty;
      const topicMatch = filters.topic === "All" || p.topic === filters.topic;
      const statusMatch = filters.status === "All" || (filters.status === "Solved" ? solvedProblems.has(p.id) : !solvedProblems.has(p.id));
      const searchMatch = p.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
      return companyMatch && difficultyMatch && topicMatch && statusMatch && searchMatch;
    });
  }, [selectedCompany, filters, solvedProblems]);

  const stats = useMemo(() => {
    const totalSolved = solvedProblems.size;
    const easySolved = problems.filter(p => p.difficulty === "Easy" && solvedProblems.has(p.id)).length;
    const mediumSolved = problems.filter(p => p.difficulty === "Medium" && solvedProblems.has(p.id)).length;
    const hardSolved = problems.filter(p => p.difficulty === "Hard" && solvedProblems.has(p.id)).length;
    return { total: totalSolved, easy: easySolved, medium: mediumSolved, hard: hardSolved };
  }, [solvedProblems]);

  return (
    <DashboardShell>
    <div className="min-h-screen bg-brand-bg text-white dot-background selection:bg-white selection:text-black pb-20">
      {/* Page Header */}
      <header className="pt-10 pb-8 border-b border-white/5 bg-brand-bg/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-muted font-bold">
                <span className="hover:text-white transition-colors cursor-pointer">TechPrep</span>
                <span className="opacity-20">/</span>
                <span className="text-white">DSA</span>
              </nav>
              <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Data Structures & Algorithms</h1>
              <p className="text-sm text-brand-muted max-w-xl">
                Company-wise questions, curated by frequency. Track your progress as you go.
              </p>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 md:px-6 flex items-center gap-5">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest font-bold text-brand-muted">Your Progress</div>
                <div className="text-xl font-display font-bold">{stats.total} <span className="text-brand-muted text-sm italic font-normal">/ 450 solved</span></div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-white/5 flex items-center justify-center relative overflow-hidden group">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-white/20 transition-all duration-700"
                  style={{ height: `${Math.min(100, (stats.total / 450) * 100)}%` }}
                />
                <Database size={18} className="text-white/40 group-hover:text-white transition-colors relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-10 mt-8 space-y-8">

        {/* Company Filter Row */}
        <div className="relative group">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {companies.map(company => (
              <button
                key={company}
                onClick={() => setSelectedCompany(company)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 border ${selectedCompany === company
                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  : "bg-white/[0.03] text-brand-muted border-white/10 hover:border-white/30 hover:text-white"
                  }`}
              >
                {company}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-2 border-y border-white/5">
          <div className="flex flex-wrap items-center gap-3">
            <SelectField
              label="Difficulty"
              options={difficulties}
              value={filters.difficulty}
              onChange={(v) => setFilters(f => ({ ...f, difficulty: v }))}
            />
            <SelectField
              label="Topic"
              options={topics}
              value={filters.topic}
              onChange={(v) => setFilters(f => ({ ...f, topic: v }))}
            />
            <SelectField
              label="Status"
              options={statuses}
              value={filters.status}
              onChange={(v) => setFilters(f => ({ ...f, status: v }))}
            />
          </div>

          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder="Search problems..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-white/40 placeholder:text-brand-muted/50 transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters(f => ({ ...f, searchQuery: "" }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatChip label="Easy" solved={stats.easy} total={180} color="text-emerald-400" />
          <StatChip label="Medium" solved={stats.medium} total={210} color="text-amber-400" />
          <StatChip label="Hard" solved={stats.hard} total={60} color="text-rose-400" />
          <StatChip label="Total" solved={stats.total} total={450} color="text-white" />
        </div>

        {/* Problem List Table */}
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0b]/50 overflow-hidden backdrop-blur-sm shadow-2xl relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/[0.02] border-b border-white/10 sticky top-0 z-20 backdrop-blur-md">
                <tr className="text-[10px] uppercase tracking-widest font-bold text-brand-muted/70">
                  <th className="py-4 px-6 w-12 text-center">#</th>
                  <th className="py-4 px-4 w-12 text-center">Status</th>
                  <th className="py-4 px-4">Problem Name</th>
                  <th className="py-4 px-4">Difficulty</th>
                  <th className="py-4 px-4">Topic</th>
                  <th className="py-4 px-4 text-center">Freq</th>
                  <th className="py-4 px-4">Resources</th>
                  <th className="py-4 px-4 text-right">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                <AnimatePresence initial={false}>
                  {filteredProblems.length > 0 ? (
                    filteredProblems.map((p, idx) => (
                      <ProblemRow
                        key={p.id}
                        problem={p}
                        index={idx + 1}
                        isSolved={solvedProblems.has(p.id)}
                        onToggle={() => toggleSolved(p.id)}
                        note={notes[p.id]}
                        isEditingNote={editingNote === p.id}
                        onEditNote={() => setEditingNote(p.id)}
                        onSaveNote={(text) => saveNote(p.id, text)}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-24">
                        <EmptyState
                          onClear={() => {
                            setSelectedCompany("All");
                            setFilters({ difficulty: "All", topic: "All", status: "All", searchQuery: "" });
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
    </DashboardShell>
  );
}

function StatChip({ label, solved, total, color }: { label: string, solved: number, total: number, color: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] flex items-center justify-between group overflow-hidden relative">
      <div className="space-y-1 relative z-10">
        <div className="text-[10px] uppercase tracking-widest font-bold text-brand-muted/70 group-hover:text-white/40 transition-colors">{label}</div>
        <div className="text-lg font-display font-bold">
          <span className={color}>{solved}</span>
          <span className="text-xs text-brand-muted/50 font-normal"> / {total}</span>
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 h-px transition-all duration-1000 ease-out opacity-30"
        style={{ width: `${(solved / total) * 100}%`, background: 'currentColor' }}
      />
    </div>
  );
}

function ProblemRow({ problem, index, isSolved, onToggle, note, isEditingNote, onEditNote, onSaveNote }: {
  problem: Problem,
  index: number,
  isSolved: boolean,
  onToggle: () => void,
  note?: string,
  isEditingNote: boolean,
  onEditNote: () => void,
  onSaveNote: (text: string) => void
}) {
  const [localNote, setLocalNote] = useState(note || "");

  const diffStyles = {
    Easy: "text-emerald-400 bg-emerald-400/5 border-emerald-400/20",
    Medium: "text-amber-400 bg-amber-400/5 border-amber-400/20",
    Hard: "text-rose-400 bg-rose-400/5 border-rose-400/20"
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`group transition-all duration-300 ${isSolved ? "bg-emerald-400/[0.01]" : "hover:bg-white/[0.02]"}`}
    >
      <td className="py-4 px-6 text-[11px] font-mono text-brand-muted border-r border-white/[0.02] tabular-nums text-center">
        {String(index).padStart(2, '0')}
      </td>
      <td className="py-4 px-4">
        <div className="flex justify-center">
          <button
            onClick={onToggle}
            className={`w-5 h-5 rounded-md border transition-all duration-300 flex items-center justify-center ${isSolved
              ? "bg-white border-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]"
              : "border-white/10 hover:border-white/30 text-transparent"
              }`}
          >
            <CheckCircle2 size={12} />
          </button>
        </div>
      </td>
      <td className="py-4 px-4 min-w-[200px]">
        <div className="space-y-1">
          <div className={`text-sm tracking-tight font-medium transition-all ${isSolved ? "text-brand-muted line-through" : "text-white group-hover:underline cursor-pointer decoration-white/30 underline-offset-4"}`}>
            {problem.name}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-hidden">
            {problem.companies.slice(0, 3).map(c => (
              <span key={c} className="text-[9px] uppercase tracking-wider text-brand-muted/40 font-bold whitespace-nowrap">{c}</span>
            ))}
            {problem.companies.length > 3 && <span className="text-[9px] text-brand-muted/20 font-bold">+{problem.companies.length - 3}</span>}
          </div>
        </div>
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${diffStyles[problem.difficulty]}`}>
          {problem.difficulty}
        </span>
      </td>
      <td className="py-4 px-4 whitespace-nowrap font-medium text-[11px] text-brand-muted/80">
        <span className="px-1.5 py-0.5 rounded bg-white/5">
          {problem.topic}
        </span>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center justify-center gap-0.5" title={`Asked 40+ times at ${problem.companies.join(", ")}`}>
          {[...Array(3)].map((_, i) => (
            <Star
              key={i}
              size={11}
              className={i < problem.frequency ? "text-amber-400 fill-amber-400" : "text-white/5"}
            />
          ))}
        </div>
      </td>
      <td className="py-4 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <a href={problem.leetcode} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] uppercase font-bold text-white/40 hover:text-white transition-colors group/link px-2 py-1 border border-white/5 rounded-md hover:bg-white/5">
            LC <ExternalLink size={10} className="group-hover/link:translate-x-0.5 transition-transform" />
          </a>
          <a href={problem.gfg} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400/40 hover:text-emerald-400 transition-colors group/link px-2 py-1 border border-emerald-400/5 rounded-md hover:bg-emerald-400/5">
            GFG <ExternalLink size={10} className="group-hover/link:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        {isEditingNote ? (
          <div className="flex items-center gap-2 justify-end">
            <input
              autoFocus
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] w-32 focus:outline-none focus:border-white/30"
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
              onBlur={() => onSaveNote(localNote)}
              onKeyDown={(e) => e.key === 'Enter' && onSaveNote(localNote)}
            />
          </div>
        ) : (
          <button
            onClick={onEditNote}
            className={`p-1.5 rounded transition-all ${note ? "text-white/60 bg-white/5" : "text-white/10 hover:text-white/40 hover:bg-white/5"}`}
          >
            {note ? <span className="text-[10px] font-medium max-w-[80px] truncate block opacity-80">{note}</span> : <Pencil size={12} />}
          </button>
        )}
      </td>
    </motion.tr>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 text-brand-muted/20">
        <Filter size={24} />
      </div>
      <h3 className="text-xl font-display font-bold mb-2">No problems match your filters</h3>
      <p className="text-sm text-brand-muted/60 max-w-sm mb-8">
        Try adjusting your filters or search query to find the problems you're looking for.
      </p>
      <button
        onClick={onClear}
        className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-white/90 active:scale-95 transition-all flex items-center gap-2 group"
      >
        Clear all filters <Trash2 size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}