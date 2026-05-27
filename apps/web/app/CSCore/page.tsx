"use client";

import { useState } from "react";
import { Lock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ── Data ──────────────────────────────────────────────────────────────────────

const SUBJECTS = ["DSA", "OS", "DBMS", "OOP", "CN"] as const;
type Subject = (typeof SUBJECTS)[number];

const TOPICS: Record<Subject, string[]> = {
  DSA:  ["Arrays","Linked Lists","Stacks & Queues","Trees","Graphs","Sorting","Recursion","DP","Hashing","Complexity"],
  OS:   ["Processes","Threads","Memory Management","Scheduling","Deadlocks","File Systems","Synchronization","Virtual Memory","I/O","Paging"],
  DBMS: ["ER Model","Normalization","SQL","Transactions","Indexing","ACID","Joins","Keys","Stored Procedures","NoSQL"],
  OOP:  ["Classes & Objects","Inheritance","Polymorphism","Encapsulation","Abstraction","Interfaces","Design Patterns","SOLID","Constructors","Overloading"],
  CN:   ["OSI Model","TCP/IP","HTTP","DNS","Routing","Subnetting","Protocols","Sockets","Firewalls","Bandwidth"],
};

type QBank = Record<Subject, Record<string, string[]>>;

const QUESTIONS: QBank = {
  DSA: {
    "Arrays": [
      "What is the time complexity of accessing an element in an array by index?",
      "Explain the difference between a static array and a dynamic array.",
      "How does the sliding window technique work? Give an example problem.",
      "What is the two-pointer approach and when is it useful?",
      "Explain Kadane's algorithm for the Maximum Subarray problem.",
    ],
    "Linked Lists": [
      "What is the difference between a singly and doubly linked list?",
      "How do you detect a cycle in a linked list? (Floyd's algorithm)",
      "How do you reverse a linked list iteratively?",
      "What is the time complexity of insertion at the head vs tail of a linked list?",
      "How would you find the middle element of a linked list in one pass?",
    ],
    "Stacks & Queues": [
      "What is the difference between a stack and a queue?",
      "How do you implement a queue using two stacks?",
      "Explain the use of a monotonic stack with an example.",
      "What is a deque and when would you use it?",
      "How do you implement a min-stack that returns the minimum in O(1)?",
    ],
    "Trees": [
      "What is the difference between BFS and DFS tree traversal?",
      "Explain inorder, preorder, and postorder traversal.",
      "What is a balanced binary search tree? Give an example.",
      "What is the height of a complete binary tree with n nodes?",
      "How do you check if a binary tree is symmetric?",
    ],
    "Graphs": [
      "What is the difference between a directed and undirected graph?",
      "Explain Dijkstra's algorithm and its time complexity.",
      "What is topological sorting and when is it applicable?",
      "How does BFS differ from DFS in graph traversal?",
      "What is a disjoint set (Union-Find) and what problems does it solve?",
    ],
    "Sorting": [
      "What is the best, average, and worst case time complexity of QuickSort?",
      "Why is MergeSort preferred over QuickSort for linked lists?",
      "What is a stable sorting algorithm? Give two examples.",
      "Explain Counting Sort and when it is more efficient than comparison sorts.",
      "What is the time complexity lower bound for comparison-based sorting?",
    ],
    "Recursion": [
      "What is the base case and recursive case in recursion?",
      "Explain tail recursion and why it is important.",
      "What is the call stack and how does recursion use it?",
      "How do you solve the Tower of Hanoi problem recursively?",
      "What is memoization and how does it relate to recursion?",
    ],
    "DP": [
      "What is the difference between top-down and bottom-up dynamic programming?",
      "Explain the 0/1 Knapsack problem and its DP solution.",
      "What is the Longest Common Subsequence (LCS) problem?",
      "How do you identify if a problem can be solved with DP?",
      "What is the time and space complexity of the Fibonacci DP solution?",
    ],
    "Hashing": [
      "How does a hash table handle collisions? Name two methods.",
      "What is the load factor and why does it matter?",
      "What is a hash function? What makes a good hash function?",
      "Explain the difference between HashMap and HashSet.",
      "What is the average time complexity of insert, delete, and lookup in a hash table?",
    ],
    "Complexity": [
      "What is Big-O notation? What does it measure?",
      "What is the difference between O(n log n) and O(n²)?",
      "What does amortized time complexity mean? Give an example.",
      "What is space complexity? How is it different from time complexity?",
      "Explain best, worst, and average case complexity with an example.",
    ],
  },
  OS: {
    "Processes":         ["What is a process? How does it differ from a program?","What are the different states of a process?","What is a PCB (Process Control Block)?","What is the difference between a process and a thread?","Explain context switching and its overhead."],
    "Threads":           ["What is a thread? What resources does it share with other threads?","What is the difference between user-level and kernel-level threads?","What are the benefits of multithreading?","What is a race condition?","What is thread synchronization?"],
    "Memory Management": ["What is the difference between stack and heap memory?","What is memory fragmentation? Explain internal vs external fragmentation.","What is garbage collection?","What is a memory leak?","Explain the buddy system of memory allocation."],
    "Scheduling":        ["What is CPU scheduling?","Explain FCFS, SJF, and Round Robin scheduling algorithms.","What is preemptive vs non-preemptive scheduling?","What is the convoy effect in FCFS scheduling?","What is the difference between response time and turnaround time?"],
    "Deadlocks":         ["What are the four necessary conditions for a deadlock?","What is deadlock prevention vs deadlock avoidance?","Explain the Banker's algorithm.","What is deadlock detection and recovery?","What is a safe state in the context of deadlocks?"],
    "File Systems":      ["What is a file system?","What is an inode?","Explain FAT vs NTFS.","What is a directory?","What is journaling in file systems?"],
    "Synchronization":   ["What is a mutex?","What is a semaphore? Binary vs counting?","What is a monitor?","Explain the producer-consumer problem.","What is priority inversion?"],
    "Virtual Memory":    ["What is virtual memory?","What is demand paging?","What is a page fault?","What is thrashing?","What is the working set model?"],
    "I/O":               ["What are the different I/O techniques: programmed, interrupt-driven, DMA?","What is buffering?","What is spooling?","What is a device driver?","What is DMA (Direct Memory Access)?"],
    "Paging":            ["What is paging in OS?","What is a page table?","What is TLB?","What is the difference between paging and segmentation?","What is multi-level paging?"],
  },
  DBMS: {
    "ER Model":           ["What is an ER diagram?","What is the difference between an entity and an attribute?","What is a weak entity?","What are the types of relationships in ER?","What is a composite attribute?"],
    "Normalization":      ["What is database normalization?","Explain 1NF, 2NF, 3NF.","What is BCNF?","What is denormalization and when is it used?","What is a functional dependency?"],
    "SQL":                ["What is the difference between WHERE and HAVING?","What is a subquery?","Explain GROUP BY with an example.","What is the difference between UNION and UNION ALL?","What is an index in SQL?"],
    "Transactions":       ["What is a database transaction?","What are the ACID properties?","What is the difference between COMMIT and ROLLBACK?","What is a savepoint?","What is a deadlock in DBMS context?"],
    "Indexing":           ["What is an index in a database?","What is the difference between clustered and non-clustered indexes?","What is a B-Tree index?","When should you avoid indexing?","What is a composite index?"],
    "ACID":               ["What does Atomicity mean?","What does Consistency mean?","What does Isolation mean?","What does Durability mean?","How do databases ensure ACID properties?"],
    "Joins":              ["What is an INNER JOIN?","What is the difference between LEFT JOIN and RIGHT JOIN?","What is a FULL OUTER JOIN?","What is a CROSS JOIN?","What is a self-join?"],
    "Keys":               ["What is a primary key?","What is a foreign key?","What is a candidate key?","What is a composite key?","What is a surrogate key?"],
    "Stored Procedures":  ["What is a stored procedure?","What is the difference between a stored procedure and a function?","What are the advantages of stored procedures?","What is a trigger?","What is a view?"],
    "NoSQL":              ["What is NoSQL?","What are the types of NoSQL databases?","When would you choose NoSQL over SQL?","What is eventual consistency?","What is CAP theorem?"],
  },
  OOP: {
    "Classes & Objects":  ["What is a class? What is an object?","What is the difference between a class and an object?","What is instantiation?","What are instance variables vs class variables?","What is a constructor?"],
    "Inheritance":        ["What is inheritance in OOP?","What is the difference between single and multiple inheritance?","What is method overriding?","What is the Liskov Substitution Principle?","What is constructor chaining?"],
    "Polymorphism":       ["What is polymorphism?","What is compile-time vs runtime polymorphism?","What is method overloading?","What is method overriding?","What is dynamic dispatch?"],
    "Encapsulation":      ["What is encapsulation?","What are access modifiers?","Why is encapsulation important?","What is a getter/setter?","What is data hiding?"],
    "Abstraction":        ["What is abstraction in OOP?","What is an abstract class?","What is the difference between abstraction and encapsulation?","What is an interface?","When to use abstract class vs interface?"],
    "Interfaces":         ["What is an interface?","Can an interface have a constructor?","What is the difference between an interface and an abstract class?","What is multiple interface implementation?","What is a marker interface?"],
    "Design Patterns":    ["What is a design pattern?","What is the Singleton pattern?","What is the Factory pattern?","What is the Observer pattern?","What is the difference between Strategy and State patterns?"],
    "SOLID":              ["What does SOLID stand for?","Explain the Single Responsibility Principle.","What is the Open/Closed Principle?","What is the Dependency Inversion Principle?","What is the Interface Segregation Principle?"],
    "Constructors":       ["What is a constructor?","What is a default constructor?","What is constructor overloading?","What is a copy constructor?","What is the difference between constructor and method?"],
    "Overloading":        ["What is method overloading?","What is operator overloading?","How does Java handle method overloading?","What is the difference between overloading and overriding?","Can constructors be overloaded?"],
  },
  CN: {
    "OSI Model":   ["What are the 7 layers of the OSI model?","What does each layer of the OSI model do?","What is the difference between OSI and TCP/IP model?","What layer does HTTP operate on?","What is the role of the transport layer?"],
    "TCP/IP":      ["What is the TCP/IP model?","What is the difference between TCP and UDP?","What is the three-way handshake?","What is a socket?","What is the difference between IPv4 and IPv6?"],
    "HTTP":        ["What is HTTP?","What is the difference between HTTP and HTTPS?","What are the common HTTP methods?","What is an HTTP status code? Give examples.","What is the difference between HTTP/1.1 and HTTP/2?"],
    "DNS":         ["What is DNS?","How does DNS resolution work?","What is an A record?","What is a CNAME record?","What is DNS caching?"],
    "Routing":     ["What is routing?","What is the difference between static and dynamic routing?","What is BGP?","What is OSPF?","What is a routing table?"],
    "Subnetting":  ["What is subnetting?","What is a subnet mask?","What is CIDR notation?","What is the difference between public and private IP?","What is NAT?"],
    "Protocols":   ["What is a network protocol?","What is ARP?","What is ICMP?","What is DHCP?","What is FTP?"],
    "Sockets":     ["What is a socket?","What is the difference between stream and datagram sockets?","What is a port number?","What is a well-known port? Give examples.","What is socket binding?"],
    "Firewalls":   ["What is a firewall?","What is the difference between stateful and stateless firewalls?","What is a DMZ?","What is packet filtering?","What is a proxy firewall?"],
    "Bandwidth":   ["What is bandwidth?","What is the difference between bandwidth and throughput?","What is latency?","What is jitter?","What is network congestion?"],
  },
};

const DIFFICULTIES = ["Easy", "Intermediate", "Advanced"] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function CSCorePage() {
  const [subject, setSubject] = useState<Subject>("DSA");
  const [topic, setTopic]     = useState<string>("Arrays");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const handleSubjectChange = (s: Subject) => {
    setSubject(s);
    setTopic(TOPICS[s][0]);
    setAnswers({});
    setChecked({});
  };

  const questions    = QUESTIONS[subject]?.[topic] ?? [];
  const checkedCount = questions.filter((_, i) => checked[`${subject}-${topic}-${i}`]).length;

  const handleCheck = (key: string) => setChecked(prev => ({ ...prev, [key]: true }));

  return (
    <div className="min-h-screen bg-brand-bg text-white dot-background selection:bg-white selection:text-black pb-20">

      {/* ── Page Header ── */}
      <header className="pt-10 pb-8 border-b border-white/5 bg-brand-bg/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 space-y-6">
          <div className="space-y-1">
            <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-muted font-bold">
              <span className="hover:text-white transition-colors cursor-pointer">DevPrep</span>
              <span className="opacity-20">/</span>
              <span className="text-white">CS Core</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">CS Core</h1>
            <p className="text-sm text-brand-muted max-w-xl">
              Topic-wise questions to crack your interviews
            </p>
          </div>

          {/* Subject Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => handleSubjectChange(s)}
                className={`flex-shrink-0 px-5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 border ${
                  subject === s
                    ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    : "bg-white/[0.03] text-brand-muted border-white/10 hover:border-white/30 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-6">

        {/* Topic Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {TOPICS[subject].map(t => (
            <button
              key={t}
              onClick={() => { setTopic(t); setAnswers({}); setChecked({}); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 border ${
                topic === t
                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                  : "bg-transparent text-brand-muted border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-2 py-2 border-y border-white/5">
          {DIFFICULTIES.map(d => {
            const locked = d !== "Easy";
            return (
              <button
                key={d}
                disabled={locked}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 border ${
                  d === "Easy"
                    ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    : "bg-transparent text-brand-muted/30 border-white/[0.06] cursor-not-allowed"
                }`}
              >
                {locked && <Lock size={10} className="opacity-50" />}
                {d}
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-brand-muted">
              <span className="text-white font-bold">{checkedCount}</span> / {questions.length} completed
            </span>
            <span className="text-[10px] uppercase tracking-widest text-brand-muted/40 font-bold">
              {topic} · {subject}
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full bg-white/40 transition-all duration-500 ease-out"
              style={{ width: `${questions.length > 0 ? (checkedCount / questions.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Question Cards */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {questions.map((q, i) => {
              const key = `${subject}-${topic}-${i}`;
              const isChecked = checked[key];
              return (
                <motion.div
                  key={key}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className={`rounded-2xl border p-5 transition-all duration-300 ${
                    isChecked
                      ? "border-white/10 bg-white/[0.02]"
                      : "border-white/10 bg-[#0a0a0b]/50 hover:border-white/20"
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-all duration-300 ${
                      isChecked
                        ? "bg-white border-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        : "border-white/10 text-brand-muted/40"
                    }`}>
                      {isChecked
                        ? <CheckCircle2 size={12} />
                        : <span className="text-[9px] font-mono font-bold">{String(i + 1).padStart(2, "0")}</span>
                      }
                    </div>
                    <p className={`text-sm font-medium leading-relaxed transition-colors ${
                      isChecked ? "text-brand-muted line-through decoration-white/20" : "text-white"
                    }`}>
                      {q}
                    </p>
                  </div>

                  {/* Answer textarea */}
                  <textarea
                    placeholder="Type your answer here..."
                    rows={3}
                    value={answers[key] ?? ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-brand-muted/40 focus:outline-none focus:border-white/30 resize-none transition-colors font-sans"
                  />

                  {/* Check button */}
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => handleCheck(key)}
                      disabled={isChecked}
                      className={`px-5 py-2 rounded-full text-xs font-bold tracking-tight transition-all duration-300 ${
                        isChecked
                          ? "bg-white/5 text-brand-muted border border-white/10 cursor-default"
                          : "bg-white text-black border border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-white/90 active:scale-95"
                      }`}
                    >
                      {isChecked ? "✓ Answered" : "Check Answer"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
