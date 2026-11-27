/**
 * The DSA sheet: company-tagged interview problems with LeetCode and GeeksforGeeks links.
 * Problem ids are stored with each user's progress, so never renumber them.
 */

export interface DsaProblem {
  id: number;
  name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  frequency: number; // 1-3, how often it's reported in interviews
  companies: string[];
  leetcode: string;
  gfg: string;
}

export const DSA_PROBLEMS: DsaProblem[] = [
  { id: 1, name: "Two Sum", difficulty: "Easy", topic: "Arrays", frequency: 3, companies: ["Google", "Amazon", "Meta"], leetcode: "https://leetcode.com/problems/two-sum", gfg: "https://www.geeksforgeeks.org/two-sum/" },
  {
    id: 2,
    name: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Arrays",
    frequency: 3,
    companies: ["Google", "Amazon", "Flipkart"],
    leetcode: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
    gfg: "https://www.geeksforgeeks.org/best-time-to-buy-and-sell-stock/",
  },
  {
    id: 3,
    name: "Maximum Subarray",
    difficulty: "Medium",
    topic: "Arrays",
    frequency: 3,
    companies: ["Google", "Microsoft", "Amazon"],
    leetcode: "https://leetcode.com/problems/maximum-subarray",
    gfg: "https://www.geeksforgeeks.org/maximum-subarray-problem-kadanes-algorithm/",
  },
  {
    id: 4,
    name: "Merge Intervals",
    difficulty: "Medium",
    topic: "Arrays",
    frequency: 2,
    companies: ["Google", "Meta", "Razorpay"],
    leetcode: "https://leetcode.com/problems/merge-intervals",
    gfg: "https://www.geeksforgeeks.org/merging-intervals/",
  },
  {
    id: 5,
    name: "Product of Array Except Self",
    difficulty: "Medium",
    topic: "Arrays",
    frequency: 2,
    companies: ["Amazon", "Microsoft"],
    leetcode: "https://leetcode.com/problems/product-of-array-except-self",
    gfg: "https://www.geeksforgeeks.org/a-product-array-puzzle/",
  },
  {
    id: 6,
    name: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: "Sliding Window",
    frequency: 3,
    companies: ["Google", "Amazon", "Zepto"],
    leetcode: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
    gfg: "https://www.geeksforgeeks.org/length-of-the-longest-substring-without-repeating-characters/",
  },
  {
    id: 7,
    name: "Valid Parentheses",
    difficulty: "Easy",
    topic: "Stacks & Queues",
    frequency: 3,
    companies: ["Google", "Meta", "Adobe"],
    leetcode: "https://leetcode.com/problems/valid-parentheses",
    gfg: "https://www.geeksforgeeks.org/check-for-balanced-parentheses-in-an-expression/",
  },
  {
    id: 8,
    name: "Climbing Stairs",
    difficulty: "Easy",
    topic: "DP",
    frequency: 2,
    companies: ["Amazon", "Flipkart"],
    leetcode: "https://leetcode.com/problems/climbing-stairs",
    gfg: "https://www.geeksforgeeks.org/count-ways-reach-nth-stair/",
  },
  {
    id: 9,
    name: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    topic: "Trees",
    frequency: 3,
    companies: ["Google", "Amazon", "Microsoft"],
    leetcode: "https://leetcode.com/problems/binary-tree-level-order-traversal",
    gfg: "https://www.geeksforgeeks.org/level-order-tree-traversal/",
  },
  {
    id: 10,
    name: "Number of Islands",
    difficulty: "Medium",
    topic: "Graphs",
    frequency: 3,
    companies: ["Google", "Amazon", "Flipkart", "Zepto"],
    leetcode: "https://leetcode.com/problems/number-of-islands",
    gfg: "https://www.geeksforgeeks.org/find-number-of-islands/",
  },
  {
    id: 11,
    name: "Coin Change",
    difficulty: "Medium",
    topic: "DP",
    frequency: 2,
    companies: ["Amazon", "Microsoft", "Razorpay"],
    leetcode: "https://leetcode.com/problems/coin-change",
    gfg: "https://www.geeksforgeeks.org/coin-change-dp-7/",
  },
  {
    id: 12,
    name: "Word Break",
    difficulty: "Medium",
    topic: "DP",
    frequency: 2,
    companies: ["Google", "Meta"],
    leetcode: "https://leetcode.com/problems/word-break",
    gfg: "https://www.geeksforgeeks.org/word-break-problem-dp-32/",
  },
  {
    id: 13,
    name: "LRU Cache",
    difficulty: "Hard",
    topic: "Linked Lists",
    frequency: 3,
    companies: ["Google", "Amazon", "Flipkart", "Razorpay"],
    leetcode: "https://leetcode.com/problems/lru-cache",
    gfg: "https://www.geeksforgeeks.org/lru-cache-implementation/",
  },
  {
    id: 14,
    name: "Median of Sorted Arrays",
    difficulty: "Hard",
    topic: "Binary Search",
    frequency: 2,
    companies: ["Google", "Meta", "Amazon"],
    leetcode: "https://leetcode.com/problems/median-of-two-sorted-arrays",
    gfg: "https://www.geeksforgeeks.org/median-of-two-sorted-arrays/",
  },
  {
    id: 15,
    name: "Trapping Rain Water",
    difficulty: "Hard",
    topic: "Arrays",
    frequency: 3,
    companies: ["Google", "Amazon", "Microsoft", "Adobe"],
    leetcode: "https://leetcode.com/problems/trapping-rain-water",
    gfg: "https://www.geeksforgeeks.org/trapping-rain-water/",
  },
];

export const DSA_COMPANIES = ["Google", "Meta", "Amazon", "Microsoft", "Flipkart", "Razorpay", "Zepto", "Adobe"];

export const DSA_TOPICS = [...new Set(DSA_PROBLEMS.map((p) => p.topic))].sort();

export const COMPANY_LOGO: Record<string, string> = {
  Google: "https://www.google.com/s2/favicons?domain=google.com&sz=32",
  Meta: "https://www.google.com/s2/favicons?domain=meta.com&sz=32",
  Amazon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=32",
  Microsoft: "https://www.google.com/s2/favicons?domain=microsoft.com&sz=32",
  Flipkart: "https://www.google.com/s2/favicons?domain=flipkart.com&sz=32",
  Razorpay: "https://www.google.com/s2/favicons?domain=razorpay.com&sz=32",
  Zepto: "https://www.google.com/s2/favicons?domain=zeptonow.com&sz=32",
  Adobe: "https://www.google.com/s2/favicons?domain=adobe.com&sz=32",
};

/** The LeetCode slug of a problem, which is also its slug in the coding round when it's offered there. */
export const leetcodeSlug = (p: DsaProblem) => p.leetcode.replace(/\/+$/, "").split("/").pop() ?? "";
