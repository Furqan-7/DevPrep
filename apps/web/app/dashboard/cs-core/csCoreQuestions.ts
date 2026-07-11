export type Subject = "os" | "dbms" | "oop" | "cn";
export type Difficulty = "easy" | "intermediate" | "advanced";

export type Question = {
  id: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  question: string;
  answer: string;
  diagramKey: string | null;
  companies: { name: string; domain: string }[];
  relatedTopics: string[];
};

const C = (name: string, domain: string) => ({ name, domain });

export const CS_CORE_QUESTIONS: Question[] = [
  // ── OS — Processes ──────────────────────────────────────────────────────────
  {
    id: "os-processes-1",
    subject: "os",
    topic: "Processes",
    difficulty: "easy",
    question: "What is the difference between a process and a thread?",
    answer:
      "A process is an independent program in execution with its own memory space, while a thread is a lightweight unit of execution within a process that shares the process's memory with other threads. Creating a thread is cheaper than creating a process because there's no separate memory space to set up.",
    diagramKey: null,
    companies: [C("Google","google.com"), C("Microsoft","microsoft.com"), C("Amazon","amazon.com")],
    relatedTopics: ["Scheduling", "Memory Management"],
  },
  {
    id: "os-processes-2",
    subject: "os",
    topic: "Processes",
    difficulty: "easy",
    question: "What are the different states a process can be in?",
    answer:
      "A process moves through New, Ready, Running, Waiting (or Blocked), and Terminated. It enters Ready once loaded, moves to Running when scheduled by the CPU, can drop to Waiting if it needs I/O, and returns to Ready once that I/O completes.",
    diagramKey: "process-states",
    companies: [C("Amazon","amazon.com"), C("Flipkart","flipkart.com")],
    relatedTopics: ["Scheduling", "Deadlocks"],
  },
  {
    id: "os-processes-3",
    subject: "os",
    topic: "Processes",
    difficulty: "intermediate",
    question:
      "What is a deadlock, and what four conditions must hold for one to occur?",
    answer:
      "A deadlock is a state where a set of processes are each waiting on a resource held by another process in the same set, so none can proceed. It requires all four Coffman conditions simultaneously: mutual exclusion, hold and wait, no preemption, and circular wait.",
    diagramKey: "deadlock-conditions",
    companies: [C("Microsoft","microsoft.com"), C("Adobe","adobe.com")],
    relatedTopics: ["Deadlocks", "Scheduling"],
  },
  {
    id: "os-processes-4",
    subject: "os",
    topic: "Processes",
    difficulty: "intermediate",
    question: "What is context switching and why is it expensive?",
    answer:
      "Context switching is saving the state of a currently running process and loading the state of another so the CPU can switch between them. It's expensive because it involves saving registers, memory maps, and other state, plus the CPU cache is often cold for the newly scheduled process.",
    diagramKey: null,
    companies: [C("Google","google.com"), C("Zepto","zeptonow.com")],
    relatedTopics: ["Scheduling", "Memory Management"],
  },

  // ── OS — Scheduling ─────────────────────────────────────────────────────────
  {
    id: "os-scheduling-1",
    subject: "os",
    topic: "Scheduling",
    difficulty: "easy",
    question:
      "What is the difference between preemptive and non-preemptive scheduling?",
    answer:
      "In preemptive scheduling, the OS can interrupt a running process to give the CPU to another, higher-priority process. In non-preemptive scheduling, once a process starts running, it holds the CPU until it finishes or voluntarily yields.",
    diagramKey: null,
    companies: [C("Amazon","amazon.com"), C("Microsoft","microsoft.com")],
    relatedTopics: ["Processes", "Deadlocks"],
  },
  {
    id: "os-scheduling-2",
    subject: "os",
    topic: "Scheduling",
    difficulty: "easy",
    question:
      "What is the difference between throughput, turnaround time, and waiting time?",
    answer:
      "Throughput is the number of processes completed per unit time. Turnaround time is the total time from submission to completion of a process. Waiting time is the total time a process spends in the ready queue waiting for the CPU.",
    diagramKey: null,
    companies: [C("Flipkart","flipkart.com"), C("Adobe","adobe.com")],
    relatedTopics: ["Processes", "Memory Management"],
  },

  // ── OS — Deadlocks ──────────────────────────────────────────────────────────
  {
    id: "os-deadlocks-1",
    subject: "os",
    topic: "Deadlocks",
    difficulty: "intermediate",
    question:
      "What is a deadlock, and what four conditions must hold for one to occur?",
    answer:
      "A deadlock is a state where a set of processes are each waiting on a resource held by another process in the same set, so none can proceed. It requires all four Coffman conditions simultaneously: mutual exclusion, hold and wait, no preemption, and circular wait.",
    diagramKey: "deadlock-conditions",
    companies: [C("Google","google.com"), C("Microsoft","microsoft.com"), C("Razorpay","razorpay.com")],
    relatedTopics: ["Processes", "Scheduling"],
  },
  {
    id: "os-deadlocks-2",
    subject: "os",
    topic: "Deadlocks",
    difficulty: "intermediate",
    question:
      "What is the difference between deadlock prevention and deadlock avoidance?",
    answer:
      "Prevention removes one of the four necessary conditions ahead of time, for example by forcing processes to request all resources upfront. Avoidance lets processes request resources dynamically but only grants a request if the resulting state is still safe, using algorithms like Banker's algorithm.",
    diagramKey: null,
    companies: [C("Amazon","amazon.com"), C("Microsoft","microsoft.com")],
    relatedTopics: ["Processes", "Memory Management"],
  },

  // ── OS — Memory Management ──────────────────────────────────────────────────
  {
    id: "os-memory-1",
    subject: "os",
    topic: "Memory Management",
    difficulty: "intermediate",
    question: "What is the difference between paging and segmentation?",
    answer:
      "Paging divides memory into fixed-size blocks called pages, which avoids external fragmentation but can cause internal fragmentation. Segmentation divides memory into variable-size logical segments based on the program's structure, which avoids internal fragmentation but can cause external fragmentation.",
    diagramKey: null,
    companies: [C("Google","google.com"), C("Flipkart","flipkart.com")],
    relatedTopics: ["Processes", "Deadlocks"],
  },
  {
    id: "os-memory-2",
    subject: "os",
    topic: "Memory Management",
    difficulty: "easy",
    question: "What is virtual memory and why is it used?",
    answer:
      "Virtual memory lets a process use more memory than what's physically available by mapping virtual addresses to physical memory or disk, allowing programs to run without fitting entirely in RAM and enabling memory isolation between processes.",
    diagramKey: null,
    companies: [C("Microsoft","microsoft.com"), C("Amazon","amazon.com")],
    relatedTopics: ["Processes", "Scheduling"],
  },

  // ── DBMS — Keys and Normalization ───────────────────────────────────────────
  {
    id: "dbms-keys-1",
    subject: "dbms",
    topic: "Keys and Normalization",
    difficulty: "easy",
    question: "What is the difference between a primary key and a foreign key?",
    answer:
      "A primary key uniquely identifies each row in its own table and cannot be null. A foreign key is a column in one table that references the primary key of another table, used to enforce a relationship between the two tables.",
    diagramKey: null,
    companies: [C("Amazon","amazon.com"), C("Flipkart","flipkart.com"), C("Microsoft","microsoft.com")],
    relatedTopics: ["Transactions"],
  },
  {
    id: "dbms-keys-2",
    subject: "dbms",
    topic: "Keys and Normalization",
    difficulty: "easy",
    question: "What is normalization and why is it used?",
    answer:
      "Normalization is the process of organizing tables to reduce data redundancy and avoid update anomalies, by splitting data into related tables and defining relationships between them using keys.",
    diagramKey: null,
    companies: [C("Google","google.com"), C("Razorpay","razorpay.com")],
    relatedTopics: ["Transactions"],
  },
  {
    id: "dbms-keys-3",
    subject: "dbms",
    topic: "Keys and Normalization",
    difficulty: "intermediate",
    question: "What is the difference between DELETE, TRUNCATE, and DROP?",
    answer:
      "DELETE removes rows based on a condition and can be rolled back, TRUNCATE removes all rows at once and resets identity counters with minimal logging, and DROP removes the entire table structure along with its data.",
    diagramKey: null,
    companies: [C("Amazon","amazon.com"), C("Adobe","adobe.com")],
    relatedTopics: ["Transactions"],
  },

  // ── DBMS — Transactions ─────────────────────────────────────────────────────
  {
    id: "dbms-transactions-1",
    subject: "dbms",
    topic: "Transactions",
    difficulty: "easy",
    question: "What are ACID properties in a database?",
    answer:
      "Atomicity means a transaction either fully completes or fully fails. Consistency means a transaction brings the database from one valid state to another. Isolation means concurrent transactions don't interfere with each other's intermediate state. Durability means once committed, changes survive even a crash.",
    diagramKey: null,
    companies: [C("Google","google.com"), C("Microsoft","microsoft.com"), C("Flipkart","flipkart.com")],
    relatedTopics: ["Keys and Normalization"],
  },
  {
    id: "dbms-transactions-2",
    subject: "dbms",
    topic: "Transactions",
    difficulty: "intermediate",
    question:
      "What is the difference between a clustered and non-clustered index?",
    answer:
      "A clustered index determines the physical order of rows in a table, so a table can have only one. A non-clustered index is a separate structure that points back to the actual row, so a table can have many.",
    diagramKey: null,
    companies: [C("Amazon","amazon.com"), C("Razorpay","razorpay.com")],
    relatedTopics: ["Keys and Normalization"],
  },

  // ── OOP — Fundamentals ──────────────────────────────────────────────────────
  {
    id: "oop-fundamentals-1",
    subject: "oop",
    topic: "Fundamentals",
    difficulty: "easy",
    question: "What are the four pillars of OOP?",
    answer:
      "Encapsulation bundles data and methods together and restricts direct access to internal state. Abstraction hides implementation details behind a simple interface. Inheritance lets a class reuse behavior from a parent class. Polymorphism lets the same interface behave differently depending on the underlying object.",
    diagramKey: null,
    companies: [C("Google","google.com"), C("Amazon","amazon.com"), C("Microsoft","microsoft.com")],
    relatedTopics: ["Design"],
  },
  {
    id: "oop-fundamentals-2",
    subject: "oop",
    topic: "Fundamentals",
    difficulty: "easy",
    question:
      "What is the difference between method overloading and overriding?",
    answer:
      "Overloading is defining multiple methods with the same name but different parameters within the same class, resolved at compile time. Overriding is redefining a parent class's method in a child class with the same signature, resolved at runtime.",
    diagramKey: null,
    companies: [C("Flipkart","flipkart.com"), C("Adobe","adobe.com")],
    relatedTopics: ["Design"],
  },

  // ── OOP — Design ────────────────────────────────────────────────────────────
  {
    id: "oop-design-1",
    subject: "oop",
    topic: "Design",
    difficulty: "intermediate",
    question:
      "What is the difference between an abstract class and an interface?",
    answer:
      "An abstract class can have both implemented and unimplemented methods and supports shared state, while an interface only defines method signatures with no implementation. A class can implement multiple interfaces but typically extend only one abstract class.",
    diagramKey: null,
    companies: [C("Google","google.com"), C("Microsoft","microsoft.com")],
    relatedTopics: ["Fundamentals"],
  },

  // ── CN — Fundamentals ───────────────────────────────────────────────────────
  {
    id: "cn-fundamentals-1",
    subject: "cn",
    topic: "Fundamentals",
    difficulty: "easy",
    question: "What is the difference between TCP and UDP?",
    answer:
      "TCP is connection-oriented, guarantees ordered and reliable delivery via acknowledgments and retransmission, but has more overhead. UDP is connectionless, doesn't guarantee delivery or order, but is faster and used where speed matters more than reliability, like video streaming.",
    diagramKey: null,
    companies: [C("Amazon","amazon.com"), C("Zepto","zeptonow.com"), C("Microsoft","microsoft.com")],
    relatedTopics: ["Layers"],
  },
  {
    id: "cn-fundamentals-2",
    subject: "cn",
    topic: "Fundamentals",
    difficulty: "intermediate",
    question:
      "What happens when you type a URL into a browser and press enter?",
    answer:
      "The browser resolves the domain to an IP via DNS, opens a TCP connection to the server (with a TLS handshake if HTTPS), sends an HTTP request, receives the response, and renders the page, fetching any additional resources it references.",
    diagramKey: null,
    companies: [C("Google","google.com"), C("Flipkart","flipkart.com")],
    relatedTopics: ["Layers"],
  },

  // ── CN — Layers ─────────────────────────────────────────────────────────────
  {
    id: "cn-layers-1",
    subject: "cn",
    topic: "Layers",
    difficulty: "easy",
    question: "What are the layers of the OSI model?",
    answer:
      "Physical, Data Link, Network, Transport, Session, Presentation, and Application, from bottom to top. Real-world networking mostly follows the simpler TCP/IP model, but OSI is still used as a conceptual reference.",
    diagramKey: null,
    companies: [C("Microsoft","microsoft.com"), C("Amazon","amazon.com")],
    relatedTopics: ["Fundamentals"],
  },
];

/** All unique subjects in display order */
export const SUBJECTS: { key: Subject; label: string }[] = [
  { key: "os", label: "OS" },
  { key: "dbms", label: "DBMS" },
  { key: "oop", label: "OOP" },
  { key: "cn", label: "CN" },
];

/** Returns all unique topics for a subject, preserving insertion order */
export function getTopics(subject: Subject): string[] {
  return [
    ...new Set(
      CS_CORE_QUESTIONS.filter((q) => q.subject === subject).map(
        (q) => q.topic
      )
    ),
  ];
}

/** Returns all questions for a subject + topic */
export function getQuestions(subject: Subject, topic: string): Question[] {
  return CS_CORE_QUESTIONS.filter(
    (q) => q.subject === subject && q.topic === topic
  );
}
