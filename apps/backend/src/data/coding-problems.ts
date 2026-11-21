/**
 * Problems for the coding round. Solutions are JavaScript functions that the browser runs
 * against `tests` (each test calls `functionName(...args)` and deep-compares the result
 * with `expected`); the first `exampleCount` tests are shown in the statement.
 */

export interface CodingTest {
    args: unknown[];
    expected: unknown;
}

export interface CodingProblem {
    slug: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    topic: string;
    statement: string[];
    constraints: string[];
    functionName: string;
    starterCode: string;
    exampleCount: number;
    tests: CodingTest[];
}

const starter = (name: string, params: string, doc: string) =>
    `/**\n${doc}\n */\nfunction ${name}(${params}) {\n  // Write your solution here\n}\n`;

export const CODING_PROBLEMS: CodingProblem[] = [
    {
        slug: "two-sum",
        title: "Two Sum",
        difficulty: "Easy",
        topic: "Arrays",
        statement: [
            "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.",
            "Each input has exactly one solution, and you may not use the same element twice. Return the two indices in increasing order.",
        ],
        constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i], target ≤ 10⁹", "Exactly one valid answer exists"],
        functionName: "twoSum",
        starterCode: starter("twoSum", "nums, target", " * @param {number[]} nums\n * @param {number} target\n * @return {number[]}"),
        exampleCount: 2,
        tests: [
            { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
            { args: [[3, 2, 4], 6], expected: [1, 2] },
            { args: [[3, 3], 6], expected: [0, 1] },
            { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
            { args: [[0, 4, 3, 0], 0], expected: [0, 3] },
        ],
    },
    {
        slug: "valid-parentheses",
        title: "Valid Parentheses",
        difficulty: "Easy",
        topic: "Stacks & Queues",
        statement: [
            "Given a string s containing just the characters ( ) { } [ ], decide whether it is valid.",
            "A string is valid when every open bracket is closed by the same type of bracket, in the correct order.",
        ],
        constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of brackets only"],
        functionName: "isValid",
        starterCode: starter("isValid", "s", " * @param {string} s\n * @return {boolean}"),
        exampleCount: 3,
        tests: [
            { args: ["()"], expected: true },
            { args: ["()[]{}"], expected: true },
            { args: ["(]"], expected: false },
            { args: ["([)]"], expected: false },
            { args: ["{[]}"], expected: true },
            { args: ["(("], expected: false },
            { args: ["]"], expected: false },
        ],
    },
    {
        slug: "best-time-to-buy-and-sell-stock",
        title: "Best Time to Buy and Sell Stock",
        difficulty: "Easy",
        topic: "Arrays",
        statement: [
            "You are given an array prices where prices[i] is the price of a stock on day i.",
            "Choose one day to buy and a later day to sell. Return the maximum profit you can make, or 0 if no profit is possible.",
        ],
        constraints: ["1 ≤ prices.length ≤ 10⁵", "0 ≤ prices[i] ≤ 10⁴"],
        functionName: "maxProfit",
        starterCode: starter("maxProfit", "prices", " * @param {number[]} prices\n * @return {number}"),
        exampleCount: 2,
        tests: [
            { args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
            { args: [[7, 6, 4, 3, 1]], expected: 0 },
            { args: [[1]], expected: 0 },
            { args: [[2, 4, 1, 7]], expected: 6 },
            { args: [[3, 3, 3]], expected: 0 },
        ],
    },
    {
        slug: "longest-substring-without-repeating-characters",
        title: "Longest Substring Without Repeating Characters",
        difficulty: "Medium",
        topic: "Sliding Window",
        statement: ["Given a string s, return the length of the longest substring that has no repeating characters."],
        constraints: ["0 ≤ s.length ≤ 5 × 10⁴", "s consists of letters, digits, symbols and spaces"],
        functionName: "lengthOfLongestSubstring",
        starterCode: starter("lengthOfLongestSubstring", "s", " * @param {string} s\n * @return {number}"),
        exampleCount: 3,
        tests: [
            { args: ["abcabcbb"], expected: 3 },
            { args: ["bbbbb"], expected: 1 },
            { args: ["pwwkew"], expected: 3 },
            { args: [""], expected: 0 },
            { args: [" "], expected: 1 },
            { args: ["abba"], expected: 2 },
            { args: ["dvdf"], expected: 3 },
        ],
    },
    {
        slug: "product-of-array-except-self",
        title: "Product of Array Except Self",
        difficulty: "Medium",
        topic: "Arrays",
        statement: [
            "Given an integer array nums, return an array answer where answer[i] is the product of every element of nums except nums[i].",
            "Solve it in O(n) time without using division.",
        ],
        constraints: ["2 ≤ nums.length ≤ 10⁵", "-30 ≤ nums[i] ≤ 30", "Every product fits in a 32-bit integer"],
        functionName: "productExceptSelf",
        starterCode: starter("productExceptSelf", "nums", " * @param {number[]} nums\n * @return {number[]}"),
        exampleCount: 2,
        tests: [
            { args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
            { args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
            { args: [[2, 3]], expected: [3, 2] },
            { args: [[1, 1, 1, 1]], expected: [1, 1, 1, 1] },
        ],
    },
    {
        slug: "merge-intervals",
        title: "Merge Intervals",
        difficulty: "Medium",
        topic: "Arrays",
        statement: [
            "Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals.",
            "Return the merged intervals sorted by start.",
        ],
        constraints: ["1 ≤ intervals.length ≤ 10⁴", "0 ≤ start ≤ end ≤ 10⁴"],
        functionName: "merge",
        starterCode: starter("merge", "intervals", " * @param {number[][]} intervals\n * @return {number[][]}"),
        exampleCount: 2,
        tests: [
            { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
            { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
            { args: [[[1, 4], [0, 4]]], expected: [[0, 4]] },
            { args: [[[1, 4], [2, 3]]], expected: [[1, 4]] },
            { args: [[[5, 6]]], expected: [[5, 6]] },
        ],
    },
    {
        slug: "number-of-islands",
        title: "Number of Islands",
        difficulty: "Medium",
        topic: "Graphs",
        statement: [
            "Given a grid of \"1\" (land) and \"0\" (water), return the number of islands.",
            "An island is land connected horizontally or vertically, surrounded by water. Everything outside the grid is water.",
        ],
        constraints: ["1 ≤ rows, cols ≤ 300", "grid[i][j] is \"0\" or \"1\""],
        functionName: "numIslands",
        starterCode: starter("numIslands", "grid", " * @param {string[][]} grid\n * @return {number}"),
        exampleCount: 2,
        tests: [
            {
                args: [[["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]]],
                expected: 1,
            },
            {
                args: [[["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]]],
                expected: 3,
            },
            { args: [[["0"]]], expected: 0 },
            { args: [[["1", "0", "1"], ["0", "1", "0"], ["1", "0", "1"]]], expected: 5 },
        ],
    },
    {
        slug: "coin-change",
        title: "Coin Change",
        difficulty: "Medium",
        topic: "DP",
        statement: [
            "You are given coin denominations coins and a total amount.",
            "Return the fewest coins needed to make up the amount, or -1 if it can't be made. You have an unlimited number of each coin.",
        ],
        constraints: ["1 ≤ coins.length ≤ 12", "1 ≤ coins[i] ≤ 2³¹ - 1", "0 ≤ amount ≤ 10⁴"],
        functionName: "coinChange",
        starterCode: starter("coinChange", "coins, amount", " * @param {number[]} coins\n * @param {number} amount\n * @return {number}"),
        exampleCount: 3,
        tests: [
            { args: [[1, 2, 5], 11], expected: 3 },
            { args: [[2], 3], expected: -1 },
            { args: [[1], 0], expected: 0 },
            { args: [[186, 419, 83, 408], 6249], expected: 20 },
            { args: [[2, 5, 10, 1], 27], expected: 4 },
        ],
    },
    {
        slug: "trapping-rain-water",
        title: "Trapping Rain Water",
        difficulty: "Hard",
        topic: "Arrays",
        statement: [
            "Given n non-negative integers for an elevation map where each bar has width 1, return how much rain water it can trap.",
        ],
        constraints: ["1 ≤ height.length ≤ 2 × 10⁴", "0 ≤ height[i] ≤ 10⁵"],
        functionName: "trap",
        starterCode: starter("trap", "height", " * @param {number[]} height\n * @return {number}"),
        exampleCount: 2,
        tests: [
            { args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
            { args: [[4, 2, 0, 3, 2, 5]], expected: 9 },
            { args: [[1]], expected: 0 },
            { args: [[3, 0, 3]], expected: 3 },
            { args: [[5, 4, 1, 2]], expected: 1 },
        ],
    },
];

export const findCodingProblem = (slug: string) => CODING_PROBLEMS.find((p) => p.slug === slug);
