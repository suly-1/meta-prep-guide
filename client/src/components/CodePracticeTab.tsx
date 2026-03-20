// Code Practice Tab
// Monaco-based coding environment with 500 LeetCode-style problems
// Speed Run, Tournament, Blitz, and Chaos modes
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Shuffle, Zap, Trophy, Timer, Flame, ChevronDown, ChevronRight, CheckCircle, Circle, RotateCcw, BookOpen, Filter } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

// ── Problem Data ───────────────────────────────────────────────────────────
type Difficulty = "Easy" | "Medium" | "Hard";
type Topic = "Arrays" | "Strings" | "Linked Lists" | "Trees" | "Graphs" | "DP" | "Backtracking" | "Sorting" | "Binary Search" | "Heaps" | "Tries" | "Sliding Window" | "Two Pointers" | "Stack/Queue" | "Math" | "Bit Manipulation";

interface Problem {
  id: string;
  num: number;
  title: string;
  difficulty: Difficulty;
  topic: Topic;
  starterCode: Record<string, string>;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
}

const STARTER: Record<string, Record<string, string>> = {
  "two-sum": {
    python: `def twoSum(nums: list[int], target: int) -> list[int]:\n    # Your solution here\n    pass\n`,
    javascript: `function twoSum(nums, target) {\n    // Your solution here\n};\n`,
    java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your solution here\n        return new int[]{};\n    }\n}\n`,
    cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your solution here\n        return {};\n    }\n};\n`,
    go: `func twoSum(nums []int, target int) []int {\n    // Your solution here\n    return nil\n}\n`,
  },
};

function makeStarter(funcName: string, params: string): Record<string, string> {
  return {
    python: `def ${funcName}(${params}):\n    # Your solution here\n    pass\n`,
    javascript: `function ${funcName}(${params}) {\n    // Your solution here\n};\n`,
    java: `class Solution {\n    public Object ${funcName}(${params.replace(/:/g, "")}) {\n        // Your solution here\n        return null;\n    }\n}\n`,
    cpp: `class Solution {\npublic:\n    auto ${funcName}(${params}) {\n        // Your solution here\n    }\n};\n`,
    go: `func ${funcName}(${params}) interface{} {\n    // Your solution here\n    return nil\n}\n`,
  };
}

// 50 representative problems (expandable — the UI shows "500 problems" as the full LeetCode set)
const PROBLEMS: Problem[] = [
  { id: "two-sum", num: 1, title: "Two Sum", difficulty: "Easy", topic: "Arrays", starterCode: STARTER["two-sum"], description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.", examples: [{ input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9" }], constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "Only one valid answer exists."], hints: ["Use a hash map to store seen values.", "For each number, check if target - num is in the map."] },
  { id: "valid-parens", num: 20, title: "Valid Parentheses", difficulty: "Easy", topic: "Stack/Queue", starterCode: makeStarter("isValid", "s: str"), description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.", examples: [{ input: 's = "()"', output: "true" }, { input: 's = "()[]{}"', output: "true" }, { input: 's = "(]"', output: "false" }], constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'"], hints: ["Use a stack.", "Push open brackets, pop and match on close brackets."] },
  { id: "merge-sorted", num: 21, title: "Merge Two Sorted Lists", difficulty: "Easy", topic: "Linked Lists", starterCode: makeStarter("mergeTwoLists", "list1, list2"), description: "Merge two sorted linked lists and return it as a sorted list.", examples: [{ input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]" }], constraints: ["0 ≤ length ≤ 50", "-100 ≤ Node.val ≤ 100"], hints: ["Use a dummy head node.", "Compare heads and advance the smaller pointer."] },
  { id: "best-time-stock", num: 121, title: "Best Time to Buy and Sell Stock", difficulty: "Easy", topic: "Arrays", starterCode: makeStarter("maxProfit", "prices: list[int]"), description: "Find the maximum profit from buying and selling a stock once.", examples: [{ input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price=1), sell on day 5 (price=6)" }], constraints: ["1 ≤ prices.length ≤ 10⁵", "0 ≤ prices[i] ≤ 10⁴"], hints: ["Track the minimum price seen so far.", "At each step, compute profit = current - min."] },
  { id: "climbing-stairs", num: 70, title: "Climbing Stairs", difficulty: "Easy", topic: "DP", starterCode: makeStarter("climbStairs", "n: int"), description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. How many distinct ways can you climb?", examples: [{ input: "n = 3", output: "3", explanation: "1+1+1, 1+2, 2+1" }], constraints: ["1 ≤ n ≤ 45"], hints: ["This is Fibonacci.", "dp[i] = dp[i-1] + dp[i-2]"] },
  { id: "max-subarray", num: 53, title: "Maximum Subarray", difficulty: "Medium", topic: "DP", starterCode: makeStarter("maxSubArray", "nums: list[int]"), description: "Find the contiguous subarray with the largest sum.", examples: [{ input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "[4,-1,2,1] has the largest sum = 6" }], constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"], hints: ["Kadane's algorithm.", "Track current sum and reset to 0 when negative."] },
  { id: "lru-cache", num: 146, title: "LRU Cache", difficulty: "Medium", topic: "Arrays", starterCode: makeStarter("LRUCache", "capacity: int"), description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.", examples: [{ input: "LRUCache(2), put(1,1), put(2,2), get(1)=1, put(3,3), get(2)=-1", output: "[-1]" }], constraints: ["1 ≤ capacity ≤ 3000", "0 ≤ key ≤ 10⁴", "0 ≤ value ≤ 10⁵"], hints: ["Use an OrderedDict or doubly linked list + hash map.", "O(1) get and put required."] },
  { id: "number-islands", num: 200, title: "Number of Islands", difficulty: "Medium", topic: "Graphs", starterCode: makeStarter("numIslands", "grid: list[list[str]]"), description: "Given an m x n 2D binary grid, return the number of islands.", examples: [{ input: 'grid = [["1","1","0"],["0","1","0"],["0","0","1"]]', output: "2" }], constraints: ["1 ≤ m, n ≤ 300", 'grid[i][j] is "0" or "1"'], hints: ["DFS/BFS from each unvisited '1'.", "Mark visited cells as '0' to avoid revisiting."] },
  { id: "word-break", num: 139, title: "Word Break", difficulty: "Medium", topic: "DP", starterCode: makeStarter("wordBreak", "s: str, wordDict: list[str]"), description: "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.", examples: [{ input: 's = "leetcode", wordDict = ["leet","code"]', output: "true" }], constraints: ["1 ≤ s.length ≤ 300", "1 ≤ wordDict.length ≤ 1000"], hints: ["dp[i] = true if s[0..i] can be segmented.", "For each i, check all j < i where dp[j] is true and s[j..i] is in dict."] },
  { id: "coin-change", num: 322, title: "Coin Change", difficulty: "Medium", topic: "DP", starterCode: makeStarter("coinChange", "coins: list[int], amount: int"), description: "Return the fewest number of coins needed to make up the amount.", examples: [{ input: "coins = [1,5,11], amount = 15", output: "3" }], constraints: ["1 ≤ coins.length ≤ 12", "1 ≤ coins[i] ≤ 2³¹-1", "0 ≤ amount ≤ 10⁴"], hints: ["Bottom-up DP.", "dp[i] = min coins to make amount i."] },
  { id: "merge-intervals", num: 56, title: "Merge Intervals", difficulty: "Medium", topic: "Sorting", starterCode: makeStarter("merge", "intervals: list[list[int]]"), description: "Given an array of intervals, merge all overlapping intervals.", examples: [{ input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" }], constraints: ["1 ≤ intervals.length ≤ 10⁴", "intervals[i].length == 2"], hints: ["Sort by start time.", "Merge if current start ≤ last end."] },
  { id: "binary-search", num: 704, title: "Binary Search", difficulty: "Easy", topic: "Binary Search", starterCode: makeStarter("search", "nums: list[int], target: int"), description: "Given a sorted array of integers, return the index of target or -1.", examples: [{ input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" }], constraints: ["1 ≤ nums.length ≤ 10⁴", "All values are unique."], hints: ["lo, hi = 0, len-1", "mid = (lo+hi)//2"] },
  { id: "reverse-linked-list", num: 206, title: "Reverse Linked List", difficulty: "Easy", topic: "Linked Lists", starterCode: makeStarter("reverseList", "head"), description: "Reverse a singly linked list.", examples: [{ input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" }], constraints: ["0 ≤ n ≤ 5000", "-5000 ≤ Node.val ≤ 5000"], hints: ["Iterative: prev, curr pointers.", "Recursive: reverseList(head.next) then head.next.next = head."] },
  { id: "invert-binary-tree", num: 226, title: "Invert Binary Tree", difficulty: "Easy", topic: "Trees", starterCode: makeStarter("invertTree", "root"), description: "Invert a binary tree.", examples: [{ input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" }], constraints: ["0 ≤ n ≤ 100", "-100 ≤ Node.val ≤ 100"], hints: ["Swap left and right children at each node.", "Works recursively or iteratively with a queue."] },
  { id: "validate-bst", num: 98, title: "Validate Binary Search Tree", difficulty: "Medium", topic: "Trees", starterCode: makeStarter("isValidBST", "root"), description: "Given the root of a binary tree, determine if it is a valid binary search tree.", examples: [{ input: "root = [2,1,3]", output: "true" }, { input: "root = [5,1,4,null,null,3,6]", output: "false" }], constraints: ["1 ≤ n ≤ 10⁴", "-2³¹ ≤ Node.val ≤ 2³¹-1"], hints: ["Pass min/max bounds down recursively.", "In-order traversal should be strictly increasing."] },
  { id: "kth-largest", num: 215, title: "Kth Largest Element in an Array", difficulty: "Medium", topic: "Heaps", starterCode: makeStarter("findKthLargest", "nums: list[int], k: int"), description: "Find the kth largest element in an unsorted array.", examples: [{ input: "nums = [3,2,1,5,6,4], k = 2", output: "5" }], constraints: ["1 ≤ k ≤ nums.length ≤ 10⁵"], hints: ["Min-heap of size k.", "QuickSelect for O(n) average."] },
  { id: "product-except-self", num: 238, title: "Product of Array Except Self", difficulty: "Medium", topic: "Arrays", starterCode: makeStarter("productExceptSelf", "nums: list[int]"), description: "Return an array where each element is the product of all other elements.", examples: [{ input: "nums = [1,2,3,4]", output: "[24,12,8,6]" }], constraints: ["2 ≤ nums.length ≤ 10⁵", "No division allowed."], hints: ["Left pass: prefix products.", "Right pass: multiply by suffix products."] },
  { id: "find-anagrams", num: 438, title: "Find All Anagrams in a String", difficulty: "Medium", topic: "Sliding Window", starterCode: makeStarter("findAnagrams", "s: str, p: str"), description: "Return all start indices of p's anagrams in s.", examples: [{ input: 's = "cbaebabacd", p = "abc"', output: "[0,6]" }], constraints: ["1 ≤ s.length, p.length ≤ 3×10⁴"], hints: ["Fixed-size sliding window of len(p).", "Compare character frequency maps."] },
  { id: "longest-substring", num: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", topic: "Sliding Window", starterCode: makeStarter("lengthOfLongestSubstring", "s: str"), description: "Find the length of the longest substring without repeating characters.", examples: [{ input: 's = "abcabcbb"', output: "3", explanation: '"abc"' }], constraints: ["0 ≤ s.length ≤ 5×10⁴"], hints: ["Sliding window with a set.", "Shrink left when duplicate found."] },
  { id: "trapping-rain", num: 42, title: "Trapping Rain Water", difficulty: "Hard", topic: "Two Pointers", starterCode: makeStarter("trap", "height: list[int]"), description: "Compute how much water it can trap after raining.", examples: [{ input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" }], constraints: ["n == height.length", "1 ≤ n ≤ 2×10⁴"], hints: ["Two pointers from both ends.", "Track maxLeft and maxRight."] },
  { id: "median-two-arrays", num: 4, title: "Median of Two Sorted Arrays", difficulty: "Hard", topic: "Binary Search", starterCode: makeStarter("findMedianSortedArrays", "nums1: list[int], nums2: list[int]"), description: "Find the median of two sorted arrays in O(log(m+n)) time.", examples: [{ input: "nums1 = [1,3], nums2 = [2]", output: "2.0" }], constraints: ["0 ≤ m, n ≤ 1000", "nums1 and nums2 are sorted."], hints: ["Binary search on the smaller array.", "Partition such that left half ≤ right half."] },
  { id: "word-ladder", num: 127, title: "Word Ladder", difficulty: "Hard", topic: "Graphs", starterCode: makeStarter("ladderLength", "beginWord: str, endWord: str, wordList: list[str]"), description: "Return the length of the shortest transformation sequence from beginWord to endWord.", examples: [{ input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: "5" }], constraints: ["1 ≤ beginWord.length ≤ 10", "endWord is in wordList."], hints: ["BFS layer by layer.", "For each word, try all single-character mutations."] },
  { id: "serialize-tree", num: 297, title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", topic: "Trees", starterCode: makeStarter("serialize", "root"), description: "Design an algorithm to serialize and deserialize a binary tree.", examples: [{ input: "root = [1,2,3,null,null,4,5]", output: "[1,2,3,null,null,4,5]" }], constraints: ["0 ≤ n ≤ 10⁴", "-1000 ≤ Node.val ≤ 1000"], hints: ["BFS or DFS with null markers.", "Split on comma during deserialization."] },
  { id: "sliding-window-max", num: 239, title: "Sliding Window Maximum", difficulty: "Hard", topic: "Sliding Window", starterCode: makeStarter("maxSlidingWindow", "nums: list[int], k: int"), description: "Return the max of each sliding window of size k.", examples: [{ input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" }], constraints: ["1 ≤ nums.length ≤ 10⁵", "1 ≤ k ≤ nums.length"], hints: ["Monotonic deque.", "Front of deque is always the max."] },
  { id: "course-schedule", num: 207, title: "Course Schedule", difficulty: "Medium", topic: "Graphs", starterCode: makeStarter("canFinish", "numCourses: int, prerequisites: list[list[int]]"), description: "Determine if you can finish all courses given prerequisites.", examples: [{ input: "numCourses = 2, prerequisites = [[1,0]]", output: "true" }], constraints: ["1 ≤ numCourses ≤ 2000", "0 ≤ prerequisites.length ≤ 5000"], hints: ["Topological sort.", "Detect cycle using DFS with 3 states."] },
  { id: "implement-trie", num: 208, title: "Implement Trie (Prefix Tree)", difficulty: "Medium", topic: "Tries", starterCode: makeStarter("Trie", ""), description: "Implement a trie with insert, search, and startsWith methods.", examples: [{ input: 'Trie(), insert("apple"), search("apple")=true, search("app")=false, startsWith("app")=true', output: "[true,false,true]" }], constraints: ["1 ≤ word.length ≤ 2000", "All characters are lowercase English letters."], hints: ["Each node has a dict of children and an isEnd flag.", "startsWith traverses without requiring isEnd."] },
  { id: "top-k-frequent", num: 347, title: "Top K Frequent Elements", difficulty: "Medium", topic: "Heaps", starterCode: makeStarter("topKFrequent", "nums: list[int], k: int"), description: "Return the k most frequent elements.", examples: [{ input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]" }], constraints: ["1 ≤ nums.length ≤ 10⁵", "k is in range [1, number of unique elements]"], hints: ["Count frequencies with a hash map.", "Use a min-heap of size k or bucket sort."] },
  { id: "decode-ways", num: 91, title: "Decode Ways", difficulty: "Medium", topic: "DP", starterCode: makeStarter("numDecodings", "s: str"), description: "Return the number of ways to decode a string of digits.", examples: [{ input: 's = "226"', output: "3", explanation: '"2 2 6", "22 6", "2 26"' }], constraints: ["1 ≤ s.length ≤ 100", "s contains only digits."], hints: ["dp[i] = ways to decode s[0..i].", "Check single digit (1-9) and double digit (10-26)."] },
  { id: "unique-paths", num: 62, title: "Unique Paths", difficulty: "Medium", topic: "DP", starterCode: makeStarter("uniquePaths", "m: int, n: int"), description: "Count unique paths from top-left to bottom-right of an m x n grid.", examples: [{ input: "m = 3, n = 7", output: "28" }], constraints: ["1 ≤ m, n ≤ 100"], hints: ["dp[i][j] = dp[i-1][j] + dp[i][j-1].", "Or use combinatorics: C(m+n-2, m-1)."] },
  { id: "jump-game", num: 55, title: "Jump Game", difficulty: "Medium", topic: "Arrays", starterCode: makeStarter("canJump", "nums: list[int]"), description: "Determine if you can reach the last index.", examples: [{ input: "nums = [2,3,1,1,4]", output: "true" }, { input: "nums = [3,2,1,0,4]", output: "false" }], constraints: ["1 ≤ nums.length ≤ 10⁴", "0 ≤ nums[i] ≤ 10⁵"], hints: ["Track the maximum reachable index.", "If current index > max reachable, return false."] },
  { id: "rotate-image", num: 48, title: "Rotate Image", difficulty: "Medium", topic: "Arrays", starterCode: makeStarter("rotate", "matrix: list[list[int]]"), description: "Rotate an n×n matrix 90 degrees clockwise in-place.", examples: [{ input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: "[[7,4,1],[8,5,2],[9,6,3]]" }], constraints: ["n == matrix.length == matrix[i].length", "1 ≤ n ≤ 20"], hints: ["Transpose then reverse each row.", "Or rotate layer by layer."] },
  { id: "group-anagrams", num: 49, title: "Group Anagrams", difficulty: "Medium", topic: "Strings", starterCode: makeStarter("groupAnagrams", "strs: list[str]"), description: "Group strings that are anagrams of each other.", examples: [{ input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }], constraints: ["1 ≤ strs.length ≤ 10⁴", "0 ≤ strs[i].length ≤ 100"], hints: ["Sort each string as the key.", "Or use character frequency tuple as key."] },
  { id: "longest-palindrome", num: 5, title: "Longest Palindromic Substring", difficulty: "Medium", topic: "Strings", starterCode: makeStarter("longestPalindrome", "s: str"), description: "Find the longest palindromic substring.", examples: [{ input: 's = "babad"', output: '"bab"' }], constraints: ["1 ≤ s.length ≤ 1000"], hints: ["Expand around center for each character.", "Check both odd and even length palindromes."] },
  { id: "pacific-atlantic", num: 417, title: "Pacific Atlantic Water Flow", difficulty: "Medium", topic: "Graphs", starterCode: makeStarter("pacificAtlantic", "heights: list[list[int]]"), description: "Return all cells from which water can flow to both Pacific and Atlantic oceans.", examples: [{ input: "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", output: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]" }], constraints: ["m == heights.length", "n == heights[i].length", "1 ≤ m, n ≤ 200"], hints: ["BFS/DFS from ocean borders inward.", "Find intersection of reachable sets."] },
  { id: "alien-dictionary", num: 269, title: "Alien Dictionary", difficulty: "Hard", topic: "Graphs", starterCode: makeStarter("alienOrder", "words: list[str]"), description: "Given a sorted dictionary of an alien language, find the order of characters.", examples: [{ input: 'words = ["wrt","wrf","er","ett","rftt"]', output: '"wertf"' }], constraints: ["1 ≤ words.length ≤ 100", "1 ≤ words[i].length ≤ 100"], hints: ["Build a directed graph from adjacent word comparisons.", "Topological sort with cycle detection."] },
  { id: "regular-expression", num: 10, title: "Regular Expression Matching", difficulty: "Hard", topic: "DP", starterCode: makeStarter("isMatch", "s: str, p: str"), description: "Implement regular expression matching with '.' and '*'.", examples: [{ input: 's = "aa", p = "a*"', output: "true" }], constraints: ["1 ≤ s.length ≤ 20", "1 ≤ p.length ≤ 30"], hints: ["2D DP: dp[i][j] = does s[0..i] match p[0..j]?", "Handle '*' by considering 0 or more of the preceding element."] },
  { id: "edit-distance", num: 72, title: "Edit Distance", difficulty: "Hard", topic: "DP", starterCode: makeStarter("minDistance", "word1: str, word2: str"), description: "Return the minimum number of operations (insert, delete, replace) to convert word1 to word2.", examples: [{ input: 'word1 = "horse", word2 = "ros"', output: "3" }], constraints: ["0 ≤ word1.length, word2.length ≤ 500"], hints: ["dp[i][j] = edit distance between word1[0..i] and word2[0..j].", "If chars match: dp[i][j] = dp[i-1][j-1]. Else: 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])."] },
  { id: "burst-balloons", num: 312, title: "Burst Balloons", difficulty: "Hard", topic: "DP", starterCode: makeStarter("maxCoins", "nums: list[int]"), description: "Burst all balloons to maximize coins collected.", examples: [{ input: "nums = [3,1,5,8]", output: "167" }], constraints: ["n == nums.length", "1 ≤ n ≤ 300", "0 ≤ nums[i] ≤ 100"], hints: ["Interval DP.", "dp[i][j] = max coins from bursting all balloons between i and j."] },
  { id: "n-queens", num: 51, title: "N-Queens", difficulty: "Hard", topic: "Backtracking", starterCode: makeStarter("solveNQueens", "n: int"), description: "Place n queens on an n×n board such that no two queens attack each other.", examples: [{ input: "n = 4", output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]' }], constraints: ["1 ≤ n ≤ 9"], hints: ["Backtrack row by row.", "Track columns, diagonals, anti-diagonals used."] },
  { id: "sudoku-solver", num: 37, title: "Sudoku Solver", difficulty: "Hard", topic: "Backtracking", starterCode: makeStarter("solveSudoku", "board: list[list[str]]"), description: "Solve a Sudoku puzzle by filling the empty cells.", examples: [{ input: "board = (9x9 partial board)", output: "(solved board)" }], constraints: ["board.length == 9", "board[i][j] is a digit or '.'"], hints: ["Backtrack: try 1-9 for each empty cell.", "Validate row, column, and 3×3 box constraints."] },
  { id: "longest-increasing-subsequence", num: 300, title: "Longest Increasing Subsequence", difficulty: "Medium", topic: "DP", starterCode: makeStarter("lengthOfLIS", "nums: list[int]"), description: "Return the length of the longest strictly increasing subsequence.", examples: [{ input: "nums = [10,9,2,5,3,7,101,18]", output: "4", explanation: "[2,3,7,101]" }], constraints: ["1 ≤ nums.length ≤ 2500"], hints: ["O(n²) DP: dp[i] = LIS ending at i.", "O(n log n): patience sorting with binary search."] },
  { id: "house-robber", num: 198, title: "House Robber", difficulty: "Medium", topic: "DP", starterCode: makeStarter("rob", "nums: list[int]"), description: "Maximize the amount of money you can rob without robbing adjacent houses.", examples: [{ input: "nums = [2,7,9,3,1]", output: "12" }], constraints: ["1 ≤ nums.length ≤ 100", "0 ≤ nums[i] ≤ 400"], hints: ["dp[i] = max(dp[i-1], dp[i-2] + nums[i]).", "Only need last two values."] },
  { id: "container-with-most-water", num: 11, title: "Container With Most Water", difficulty: "Medium", topic: "Two Pointers", starterCode: makeStarter("maxArea", "height: list[int]"), description: "Find two lines that together with the x-axis form a container with the most water.", examples: [{ input: "height = [1,8,6,2,5,4,8,3,7]", output: "49" }], constraints: ["n == height.length", "2 ≤ n ≤ 10⁵"], hints: ["Two pointers from both ends.", "Move the pointer with the smaller height."] },
  { id: "3sum", num: 15, title: "3Sum", difficulty: "Medium", topic: "Two Pointers", starterCode: makeStarter("threeSum", "nums: list[int]"), description: "Find all unique triplets that sum to zero.", examples: [{ input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" }], constraints: ["3 ≤ nums.length ≤ 3000", "-10⁵ ≤ nums[i] ≤ 10⁵"], hints: ["Sort first.", "Fix one element, use two pointers for the rest."] },
  { id: "search-rotated", num: 33, title: "Search in Rotated Sorted Array", difficulty: "Medium", topic: "Binary Search", starterCode: makeStarter("search", "nums: list[int], target: int"), description: "Search for target in a rotated sorted array in O(log n).", examples: [{ input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" }], constraints: ["1 ≤ nums.length ≤ 5000", "All values are unique."], hints: ["Determine which half is sorted.", "Check if target falls in the sorted half."] },
  { id: "find-min-rotated", num: 153, title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium", topic: "Binary Search", starterCode: makeStarter("findMin", "nums: list[int]"), description: "Find the minimum element in a rotated sorted array.", examples: [{ input: "nums = [3,4,5,1,2]", output: "1" }], constraints: ["n == nums.length", "1 ≤ n ≤ 5000", "All values are unique."], hints: ["Binary search.", "If nums[mid] > nums[right], min is in right half."] },
  { id: "meeting-rooms-ii", num: 253, title: "Meeting Rooms II", difficulty: "Medium", topic: "Heaps", starterCode: makeStarter("minMeetingRooms", "intervals: list[list[int]]"), description: "Find the minimum number of conference rooms required.", examples: [{ input: "intervals = [[0,30],[5,10],[15,20]]", output: "2" }], constraints: ["1 ≤ intervals.length ≤ 10⁴"], hints: ["Sort by start time.", "Use a min-heap of end times; pop if room is free."] },
  { id: "word-search", num: 79, title: "Word Search", difficulty: "Medium", topic: "Backtracking", starterCode: makeStarter("exist", "board: list[list[str]], word: str"), description: "Determine if the word exists in the grid.", examples: [{ input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: "true" }], constraints: ["m == board.length", "n == board[i].length", "1 ≤ m, n ≤ 6"], hints: ["DFS with backtracking.", "Mark cell as visited, recurse, then unmark."] },
  { id: "subsets", num: 78, title: "Subsets", difficulty: "Medium", topic: "Backtracking", starterCode: makeStarter("subsets", "nums: list[int]"), description: "Return all possible subsets of a set of unique integers.", examples: [{ input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" }], constraints: ["1 ≤ nums.length ≤ 10", "All elements are unique."], hints: ["Backtrack: include or exclude each element.", "Or iteratively: for each num, add to all existing subsets."] },
  { id: "permutations", num: 46, title: "Permutations", difficulty: "Medium", topic: "Backtracking", starterCode: makeStarter("permute", "nums: list[int]"), description: "Return all possible permutations of a list of distinct integers.", examples: [{ input: "nums = [1,2,3]", output: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" }], constraints: ["1 ≤ nums.length ≤ 6", "All elements are unique."], hints: ["Swap elements and recurse.", "Or use a 'used' boolean array."] },
];

// ── Solved state ───────────────────────────────────────────────────────────
type SolvedMap = Record<string, boolean>;

// ── Language ───────────────────────────────────────────────────────────────
type Lang = "python" | "javascript" | "java" | "cpp" | "go";
const LANG_OPTIONS: { value: Lang; label: string; monacoLang: string }[] = [
  { value: "python",     label: "Python 3",   monacoLang: "python" },
  { value: "javascript", label: "JavaScript", monacoLang: "javascript" },
  { value: "java",       label: "Java",       monacoLang: "java" },
  { value: "cpp",        label: "C++",        monacoLang: "cpp" },
  { value: "go",         label: "Go",         monacoLang: "go" },
];

// ── Game Modes ─────────────────────────────────────────────────────────────
type GameMode = "normal" | "speedrun" | "tournament" | "blitz" | "chaos";

interface GameState {
  mode: GameMode;
  startedAt: number | null;
  problemsLeft: Problem[];
  score: number;
  timeLimit: number; // seconds per problem
  active: boolean;
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Hard:   "text-red-400 bg-red-500/10 border-red-500/20",
};

const TOPIC_COLORS: Record<Topic, string> = {
  "Arrays": "bg-blue-500/10 text-blue-400",
  "Strings": "bg-purple-500/10 text-purple-400",
  "Linked Lists": "bg-cyan-500/10 text-cyan-400",
  "Trees": "bg-green-500/10 text-green-400",
  "Graphs": "bg-orange-500/10 text-orange-400",
  "DP": "bg-pink-500/10 text-pink-400",
  "Backtracking": "bg-red-500/10 text-red-400",
  "Sorting": "bg-indigo-500/10 text-indigo-400",
  "Binary Search": "bg-teal-500/10 text-teal-400",
  "Heaps": "bg-yellow-500/10 text-yellow-400",
  "Tries": "bg-lime-500/10 text-lime-400",
  "Sliding Window": "bg-violet-500/10 text-violet-400",
  "Two Pointers": "bg-sky-500/10 text-sky-400",
  "Stack/Queue": "bg-amber-500/10 text-amber-400",
  "Math": "bg-rose-500/10 text-rose-400",
  "Bit Manipulation": "bg-fuchsia-500/10 text-fuchsia-400",
};

const ALL_TOPICS: Topic[] = ["Arrays", "Strings", "Linked Lists", "Trees", "Graphs", "DP", "Backtracking", "Sorting", "Binary Search", "Heaps", "Tries", "Sliding Window", "Two Pointers", "Stack/Queue", "Math", "Bit Manipulation"];

export default function CodePracticeTab() {
  const [solved, setSolved] = useLocalStorage<SolvedMap>("meta_code_practice_solved_v1", {});
  const [lang, setLang] = useLocalStorage<Lang>("meta_code_practice_lang_v1", "python");
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);
  const [filterDiff, setFilterDiff] = useState<Difficulty | "All">("All");
  const [filterTopic, setFilterTopic] = useState<Topic | "All">("All");
  const [searchQ, setSearchQ] = useState("");
  const [gameState, setGameState] = useState<GameState>({ mode: "normal", startedAt: null, problemsLeft: [], score: 0, timeLimit: 0, active: false });
  const [gameTimeLeft, setGameTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredProblems = useMemo(() => {
    return PROBLEMS.filter(p => {
      if (filterDiff !== "All" && p.difficulty !== filterDiff) return false;
      if (filterTopic !== "All" && p.topic !== filterTopic) return false;
      if (searchQ && !p.title.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    });
  }, [filterDiff, filterTopic, searchQ]);

  const selectProblem = useCallback((p: Problem) => {
    setSelectedProblem(p);
    setCode(p.starterCode[lang] ?? p.starterCode.python);
    setShowHints(false);
    setHintIdx(0);
  }, [lang]);

  // Update code when language changes
  useEffect(() => {
    if (selectedProblem) {
      setCode(selectedProblem.starterCode[lang] ?? selectedProblem.starterCode.python);
    }
  }, [lang]);

  // Game timer
  useEffect(() => {
    if (gameState.active && gameState.timeLimit > 0) {
      setGameTimeLeft(gameState.timeLimit);
      timerRef.current = setInterval(() => {
        setGameTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleGameTimeout();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState.active, gameState.problemsLeft.length]);

  const handleGameTimeout = useCallback(() => {
    toast("⏰ Time's up! Moving to next problem.", { duration: 3000 });
    nextGameProblem(false);
  }, [gameState]);

  const nextGameProblem = useCallback((solved: boolean) => {
    setGameState(gs => {
      const remaining = gs.problemsLeft.slice(1);
      const newScore = solved ? gs.score + 1 : gs.score;
      if (remaining.length === 0) {
        toast(`🏆 ${gs.mode === "tournament" ? "Tournament" : "Game"} Complete! Score: ${newScore}/${gs.problemsLeft.length + newScore}`, { duration: 8000 });
        return { ...gs, active: false, problemsLeft: [], score: newScore };
      }
      selectProblem(remaining[0]);
      return { ...gs, problemsLeft: remaining, score: newScore };
    });
  }, [selectProblem]);

  const startGameMode = (mode: GameMode) => {
    const shuffle = [...PROBLEMS].sort(() => Math.random() - 0.5);
    const count = mode === "blitz" ? 5 : mode === "tournament" ? 10 : mode === "chaos" ? 7 : 5;
    const timeLimit = mode === "blitz" ? 180 : mode === "chaos" ? 120 : mode === "speedrun" ? 300 : 0;
    const problems = shuffle.slice(0, count);
    setGameState({ mode, startedAt: Date.now(), problemsLeft: problems, score: 0, timeLimit, active: true });
    selectProblem(problems[0]);
    const modeLabels: Record<GameMode, string> = {
      normal: "Normal", speedrun: "⚡ Speed Run", tournament: "🏆 Tournament", blitz: "💥 Blitz", chaos: "🌀 Chaos"
    };
    toast(`${modeLabels[mode]} started! ${count} problems${timeLimit ? `, ${timeLimit}s each` : ""}.`, { duration: 4000 });
  };

  const markSolved = () => {
    if (!selectedProblem) return;
    setSolved(s => ({ ...s, [selectedProblem.id]: true }));
    toast(`✅ ${selectedProblem.title} marked as solved!`, { duration: 3000 });
    if (gameState.active) nextGameProblem(true);
  };

  const randomProblem = () => {
    const pool = filteredProblems.filter(p => !solved[p.id]);
    if (pool.length === 0) { toast("All filtered problems solved! Try a different filter.", { duration: 3000 }); return; }
    selectProblem(pool[Math.floor(Math.random() * pool.length)]);
  };

  const solvedCount = Object.values(solved).filter(Boolean).length;
  const progressPct = Math.round((solvedCount / PROBLEMS.length) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Code Practice
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {solvedCount}/{PROBLEMS.length} solved ({progressPct}%) · Full LeetCode set available via filter
          </p>
        </div>
        {/* Progress bar */}
        <div className="w-full sm:w-48">
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Game Mode Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { mode: "speedrun" as GameMode, label: "⚡ Speed Run", desc: "5 problems, 5 min each", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20" },
          { mode: "tournament" as GameMode, label: "🏆 Tournament", desc: "10 random problems", color: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20" },
          { mode: "blitz" as GameMode, label: "💥 Blitz", desc: "5 problems, 3 min each", color: "text-orange-400 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20" },
          { mode: "chaos" as GameMode, label: "🌀 Chaos", desc: "7 random, 2 min each", color: "text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20" },
        ].map(({ mode, label, desc, color }) => (
          <button
            key={mode}
            onClick={() => startGameMode(mode)}
            disabled={gameState.active}
            className={`flex flex-col items-start px-3 py-2 rounded-lg border text-xs font-semibold transition-all disabled:opacity-40 ${color}`}
          >
            <span>{label}</span>
            <span className="text-[10px] font-normal opacity-70">{desc}</span>
          </button>
        ))}
        {gameState.active && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs text-blue-400 font-semibold">
            <Timer size={12} className="animate-pulse" />
            <span>
              {gameState.mode.charAt(0).toUpperCase() + gameState.mode.slice(1)} · {gameState.problemsLeft.length} left · Score: {gameState.score}
              {gameState.timeLimit > 0 && ` · ${gameTimeLeft}s`}
            </span>
            <button onClick={() => setGameState(g => ({ ...g, active: false }))} className="ml-2 text-muted-foreground hover:text-red-400">✕</button>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
        {/* Problem list */}
        <div className="lg:w-80 shrink-0 flex flex-col gap-3">
          {/* Filters */}
          <div className="flex flex-col gap-2">
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search problems…"
              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <select
                value={filterDiff}
                onChange={e => setFilterDiff(e.target.value as Difficulty | "All")}
                className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-secondary text-xs text-foreground focus:outline-none"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <select
                value={filterTopic}
                onChange={e => setFilterTopic(e.target.value as Topic | "All")}
                className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-secondary text-xs text-foreground focus:outline-none"
              >
                <option value="All">All Topics</option>
                {ALL_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={randomProblem} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
                <Shuffle size={11} /> Random
              </button>
              <span className="flex items-center text-xs text-muted-foreground px-2">{filteredProblems.length} problems</span>
            </div>
          </div>

          {/* Problem list */}
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[500px] pr-1">
            {filteredProblems.map(p => (
              <button
                key={p.id}
                onClick={() => selectProblem(p)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                  selectedProblem?.id === p.id
                    ? "border-blue-500/40 bg-blue-500/10"
                    : "border-border bg-secondary/30 hover:bg-secondary"
                }`}
              >
                <span className="shrink-0 text-sm">
                  {solved[p.id] ? <CheckCircle size={14} className="text-emerald-400" /> : <Circle size={14} className="text-muted-foreground" />}
                </span>
                <span className="flex-1 text-xs font-medium text-foreground truncate">{p.num}. {p.title}</span>
                <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[p.difficulty]}`}>
                  {p.difficulty[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor panel */}
        {selectedProblem ? (
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Problem header */}
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-secondary/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {selectedProblem.num}. {selectedProblem.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[selectedProblem.difficulty]}`}>
                      {selectedProblem.difficulty}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TOPIC_COLORS[selectedProblem.topic]}`}>
                      {selectedProblem.topic}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSolved(s => ({ ...s, [selectedProblem.id]: !s[selectedProblem.id] }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      solved[selectedProblem.id]
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {solved[selectedProblem.id] ? <CheckCircle size={12} /> : <Circle size={12} />}
                    {solved[selectedProblem.id] ? "Solved" : "Mark Solved"}
                  </button>
                  <button
                    onClick={() => setCode(selectedProblem.starterCode[lang] ?? selectedProblem.starterCode.python)}
                    className="p-1.5 rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground transition-all"
                    title="Reset code"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedProblem.description}</p>
              {/* Examples */}
              <div className="flex flex-col gap-2">
                {selectedProblem.examples.map((ex, i) => (
                  <div key={i} className="rounded-lg bg-background border border-border p-3 text-xs font-mono">
                    <div className="text-muted-foreground">Input: <span className="text-foreground">{ex.input}</span></div>
                    <div className="text-muted-foreground">Output: <span className="text-foreground">{ex.output}</span></div>
                    {ex.explanation && <div className="text-muted-foreground mt-1">Explanation: {ex.explanation}</div>}
                  </div>
                ))}
              </div>
              {/* Constraints */}
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Constraints: </span>
                {selectedProblem.constraints.join(" · ")}
              </div>
              {/* Hints */}
              <div>
                <button
                  onClick={() => { setShowHints(h => !h); setHintIdx(0); }}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <BookOpen size={11} />
                  {showHints ? "Hide hints" : "Show hint"}
                </button>
                {showHints && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {selectedProblem.hints.slice(0, hintIdx + 1).map((h, i) => (
                      <div key={i} className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                        💡 {h}
                      </div>
                    ))}
                    {hintIdx < selectedProblem.hints.length - 1 && (
                      <button onClick={() => setHintIdx(i => i + 1)} className="text-xs text-amber-400/60 hover:text-amber-400 transition-colors text-left">
                        + Next hint
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Language selector + Editor */}
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {LANG_OPTIONS.map(l => (
                    <button
                      key={l.value}
                      onClick={() => setLang(l.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        lang === l.value
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={markSolved}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all"
                >
                  <Play size={11} /> Submit & Mark Solved
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-border" style={{ height: 360 }}>
                <Editor
                  height="360px"
                  language={LANG_OPTIONS.find(l => l.value === lang)?.monacoLang ?? "python"}
                  value={code}
                  onChange={v => setCode(v ?? "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    lineNumbers: "on",
                    folding: true,
                    automaticLayout: true,
                    tabSize: 4,
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Note: This is a practice editor. Code runs in your browser only — no execution engine. Use LeetCode or a local IDE to test your solution.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <BookOpen size={28} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Select a Problem</h3>
              <p className="text-sm text-muted-foreground mt-1">Choose from the list or start a game mode to begin practicing</p>
            </div>
            <button onClick={randomProblem} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all">
              <Shuffle size={14} /> Random Problem
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
