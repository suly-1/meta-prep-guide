/**
 * YandexAlgorithmTrainer — Feature #20
 * Yandex-style algorithm problems with strict time limits (20 min),
 * no hints, and a binary pass/fail verdict.
 * Focuses on the hardest Meta-adjacent patterns: segment trees, advanced DP,
 * string algorithms, and competitive-programming-style problems.
 * Trains candidates to perform under pressure without AI assistance.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Swords,
  Timer,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Trophy,
  Flame,
  Lock,
  Unlock,
  Settings,
  Medal,
  BarChart2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface YandexProblem {
  id: string;
  title: string;
  difficulty: "C" | "D" | "E";
  timeLimit: number; // seconds
  memoryLimit: string;
  tags: string[];
  statement: string;
  constraints: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  solution: string; // hidden until reveal
  keyInsight: string;
  metaRelevance: string;
}

// Enhancement types and constants
type HintThreshold = 25 | 50 | 75 | 100;
const HINT_THRESHOLD_LABELS: Record<HintThreshold, string> = {
  25: "25% elapsed",
  50: "50% elapsed",
  75: "75% elapsed",
  100: "timer ends",
};
const LS_COMPLETED = "yandex-trainer-completed";
const LS_HISTORY = "yandex-trainer-history-v2";
const LS_HINT_THRESHOLD = "yandex-trainer-hint-threshold";
interface ProblemAttempt { verdict: "pass" | "fail"; elapsed: number; ts: number; }
interface ProblemHistory { attempts: ProblemAttempt[]; bestTime: number | null; }
type HistoryMap = Record<string, ProblemHistory>;
function loadHistory(): HistoryMap {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY) || "{}"); } catch { return {}; }
}
function saveHistory(h: HistoryMap) { localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }
function loadHintThreshold(): HintThreshold {
  try {
    const v = Number(localStorage.getItem(LS_HINT_THRESHOLD));
    if ([25, 50, 75, 100].includes(v)) return v as HintThreshold;
  } catch {}
  return 100;
}

const PROBLEMS: YandexProblem[] = [
  {
    id: "max-subarray-circular",
    title: "Maximum Circular Subarray Sum",
    difficulty: "C",
    timeLimit: 1200,
    memoryLimit: "256 MB",
    tags: ["Kadane's", "Prefix Sum", "Circular Array"],
    statement: `Given a circular integer array nums of length n, return the maximum possible sum of a non-empty subarray of nums.

A circular array means the end of the array connects to the beginning. Formally, the next element of nums[i] is nums[(i + 1) % n] and the previous element of nums[i] is nums[(i - 1 + n) % n].

A subarray may only include each element of the fixed buffer nums at most once.`,
    constraints: `n == nums.length
1 ≤ n ≤ 3 × 10⁴
-3 × 10⁴ ≤ nums[i] ≤ 3 × 10⁴`,
    examples: [
      { input: "nums = [1,-2,3,-2]", output: "3", explanation: "Subarray [3] has maximum sum 3." },
      { input: "nums = [5,-3,5]", output: "10", explanation: "Subarray [5,5] (circular) has maximum sum 10." },
      { input: "nums = [-3,-2,-3]", output: "-2", explanation: "Subarray [-2] has maximum sum -2." },
    ],
    solution: `def maxSubarraySumCircular(nums):
    # Case 1: max subarray is non-circular → standard Kadane's
    def kadane(arr):
        max_sum = cur = arr[0]
        for x in arr[1:]:
            cur = max(x, cur + x)
            max_sum = max(max_sum, cur)
        return max_sum
    
    # Case 2: max subarray is circular → total_sum - min_subarray
    def kadane_min(arr):
        min_sum = cur = arr[0]
        for x in arr[1:]:
            cur = min(x, cur + x)
            min_sum = min(min_sum, cur)
        return min_sum
    
    max_wrap = sum(nums) - kadane_min(nums)
    # Edge case: all negative → max_wrap = 0 (empty subarray), use non-circular
    return max(kadane(nums), max_wrap) if max_wrap != 0 else kadane(nums)`,
    keyInsight: "Two cases: (1) non-circular → Kadane's max. (2) circular → total_sum - Kadane's min. The circular case wraps around, so the complement is the minimum subarray.",
    metaRelevance: "Tests Kadane's mastery + circular array thinking. Appears in Meta E5/E6 coding screens as a follow-up to standard max subarray.",
  },
  {
    id: "longest-palindromic-subsequence",
    title: "Minimum Deletions to Make Palindrome",
    difficulty: "C",
    timeLimit: 1200,
    memoryLimit: "256 MB",
    tags: ["DP", "LCS", "Palindrome"],
    statement: `Given a string s, find the minimum number of characters you need to delete to make s a palindrome.

Return the minimum number of deletions required.`,
    constraints: `1 ≤ s.length ≤ 1000
s consists only of lowercase English letters`,
    examples: [
      { input: 's = "aebcbda"', output: "2", explanation: 'Delete "e" and "d" to get "abcba".' },
      { input: 's = "geeksforgeeks"', output: "8" },
    ],
    solution: `def minDeletions(s):
    # Key insight: min deletions = n - LPS (Longest Palindromic Subsequence)
    # LPS(s) = LCS(s, reverse(s))
    n = len(s)
    t = s[::-1]
    # LCS DP
    dp = [[0] * (n + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, n + 1):
            if s[i-1] == t[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    lps = dp[n][n]
    return n - lps`,
    keyInsight: "min_deletions = n - LPS(s). LPS = LCS(s, reverse(s)). Classic 2D DP reduction.",
    metaRelevance: "Tests DP problem reduction skills. Meta E6+ candidates must identify the LCS→LPS connection without hints.",
  },
  {
    id: "sliding-window-median",
    title: "Sliding Window Median",
    difficulty: "D",
    timeLimit: 1800,
    memoryLimit: "256 MB",
    tags: ["Heap", "Two Heaps", "Sliding Window"],
    statement: `The median is the middle value in an ordered integer list. If the size of the list is even, there is no middle value. So the median is the mean of the two middle values.

Given an array nums and a sliding window of size k, return the median array for each window in the original array.`,
    constraints: `1 ≤ k ≤ nums.length ≤ 10⁵
-2³¹ ≤ nums[i] ≤ 2³¹ - 1`,
    examples: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[1.00000,-1.00000,-1.00000,3.00000,5.00000,6.00000]" },
      { input: "nums = [1,2,3,4,2,3,1,4,2], k = 3", output: "[2.00000,3.00000,3.00000,3.00000,2.00000,3.00000,2.00000]" },
    ],
    solution: `import heapq
from collections import defaultdict

def medianSlidingWindow(nums, k):
    lo = []  # max-heap (negated)
    hi = []  # min-heap
    lazy = defaultdict(int)  # lazy deletion counts
    
    def balance():
        while lo and lazy[-lo[0]]:
            lazy[-lo[0]] -= 1
            heapq.heappop(lo)
        while hi and lazy[hi[0]]:
            lazy[hi[0]] -= 1
            heapq.heappop(hi)
    
    def add(x):
        if lo and x <= -lo[0]:
            heapq.heappush(lo, -x)
        else:
            heapq.heappush(hi, x)
    
    def rebalance():
        while len(lo) > len(hi) + 1:
            heapq.heappush(hi, -heapq.heappop(lo))
        while len(hi) > len(lo):
            heapq.heappush(lo, -heapq.heappop(hi))
    
    def get_median():
        if k % 2 == 1:
            return float(-lo[0])
        return (-lo[0] + hi[0]) / 2.0
    
    for i in range(k):
        add(nums[i])
    rebalance()
    
    result = [get_median()]
    for i in range(k, len(nums)):
        add(nums[i])
        out = nums[i - k]
        lazy[out] += 1
        if out <= -lo[0]:
            if len(lo) > len(hi) + 1:
                heapq.heappush(hi, -heapq.heappop(lo))
                balance()
        else:
            if len(hi) > len(lo):
                heapq.heappush(lo, -heapq.heappop(hi))
                balance()
        balance()
        result.append(get_median())
    return result`,
    keyInsight: "Two-heap approach with lazy deletion. Max-heap (lo) stores lower half, min-heap (hi) stores upper half. Lazy deletion avoids O(n) removal.",
    metaRelevance: "Tests heap mastery + lazy deletion pattern. Exact problem type seen in Meta E6/E7 final rounds.",
  },
  {
    id: "count-of-range-sum",
    title: "Count of Range Sum",
    difficulty: "E",
    timeLimit: 2400,
    memoryLimit: "256 MB",
    tags: ["Merge Sort", "Prefix Sum", "Divide & Conquer"],
    statement: `Given an integer array nums and two integers lower and upper, return the number of range sums that lie in [lower, upper] inclusive.

Range sum S(i, j) is defined as the sum of the elements in nums between indices i and j inclusive, where i ≤ j.`,
    constraints: `1 ≤ nums.length ≤ 10⁵
-2³¹ ≤ nums[i] ≤ 2³¹ - 1
-10⁵ ≤ lower ≤ upper ≤ 10⁵
The answer is guaranteed to fit in a 32-bit integer.`,
    examples: [
      { input: "nums = [-2,5,-1], lower = -2, upper = 2", output: "3", explanation: "The three ranges are [0,0], [2,2], and [0,2]." },
      { input: "nums = [0], lower = 0, upper = 0", output: "1" },
    ],
    solution: `def countRangeSum(nums, lower, upper):
    prefix = [0]
    for x in nums:
        prefix.append(prefix[-1] + x)
    
    def merge_count(arr):
        if len(arr) <= 1:
            return arr, 0
        mid = len(arr) // 2
        left, lc = merge_count(arr[:mid])
        right, rc = merge_count(arr[mid:])
        count = lc + rc
        
        # Count valid pairs: lower <= right[j] - left[i] <= upper
        j = k = 0
        for l in left:
            while j < len(right) and right[j] - l < lower:
                j += 1
            while k < len(right) and right[k] - l <= upper:
                k += 1
            count += k - j
        
        # Merge
        merged = []
        i = j = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i]); i += 1
            else:
                merged.append(right[j]); j += 1
        merged.extend(left[i:])
        merged.extend(right[j:])
        return merged, count
    
    _, total = merge_count(prefix)
    return total`,
    keyInsight: "Prefix sum + merge sort. During merge, count pairs (i from left, j from right) where lower ≤ prefix[j] - prefix[i] ≤ upper using two pointers on sorted halves.",
    metaRelevance: "Classic 'hard' problem requiring merge sort + prefix sum combination. Tests whether candidates can adapt merge sort to counting problems.",
  },
  {
    id: "minimum-window-subsequence",
    title: "Minimum Window Subsequence",
    difficulty: "D",
    timeLimit: 1800,
    memoryLimit: "256 MB",
    tags: ["Two Pointers", "DP", "String"],
    statement: `Given strings s1 and s2, return the minimum window in s1 which will contain s2 as a subsequence. If there is no such window in s1 that covers all characters in s2, return the empty string "".

In the case that there are multiple minimum-length windows, return the one with the left-most starting index.`,
    constraints: `1 ≤ s1.length ≤ 2 × 10⁴
1 ≤ s2.length ≤ 100
s1 and s2 consist of lowercase English letters`,
    examples: [
      { input: 's1 = "abcdebdde", s2 = "bde"', output: '"bcde"', explanation: '"bcde" is the answer because it occurs before "bdde" which has the same length.' },
      { input: 's1 = "jmeqksfrsdcmsiwvaovztaqenprpvnbstl", s2 = "u"', output: '""' },
    ],
    solution: `def minWindow(s1, s2):
    n, m = len(s1), len(s2)
    best_start, best_len = -1, float('inf')
    
    i = 0
    while i < n:
        # Forward pass: find end of window containing s2 as subsequence
        j = 0
        while i < n and j < m:
            if s1[i] == s2[j]:
                j += 1
            i += 1
        if j < m:
            break  # s2 not found
        
        end = i  # exclusive end
        
        # Backward pass: shrink from end to find minimal start
        k = m - 1
        i -= 1
        while k >= 0:
            if s1[i] == s2[k]:
                k -= 1
            i -= 1
        i += 1  # i is now the start of the minimal window
        
        window_len = end - i
        if window_len < best_len:
            best_len = window_len
            best_start = i
        
        i += 1  # advance past current start to find next window
    
    return s1[best_start:best_start + best_len] if best_start != -1 else ""`,
    keyInsight: "Forward pass finds a valid window end, backward pass shrinks it to minimal start. Advance start by 1 and repeat. O(n*m) time.",
    metaRelevance: "Tests two-pointer mastery with subsequence (not substring) constraint. Common in Meta E5 follow-up rounds.",
  },
  // ── NEW: Fenwick Tree, Segment Tree, Suffix Array, Offline BIT, Augmented BST ──
  {
    id: "range-sum-fenwick",
    title: "Range Sum Query with Point Updates (Fenwick Tree)",
    difficulty: "D",
    timeLimit: 1800,
    memoryLimit: "256 MB",
    tags: ["Fenwick Tree", "BIT", "Prefix Sum", "Range Query"],
    statement: `Design a data structure that supports two operations on an integer array nums:

1. update(i, delta): Add delta to nums[i].
2. sumRange(left, right): Return the sum of nums[left..right] inclusive.

Both operations must run in O(log n) time. Implement the NumArray class:
- NumArray(int[] nums): Initializes the object with nums.
- void update(int i, int delta): Adds delta to nums[i].
- int sumRange(int left, int right): Returns sum of nums[left..right].`,
    constraints: `1 ≤ nums.length ≤ 3 × 10⁴
-100 ≤ nums[i] ≤ 100
0 ≤ i < nums.length
-100 ≤ delta ≤ 100
0 ≤ left ≤ right < nums.length
At most 3 × 10⁴ calls to update and sumRange`,
    examples: [
      {
        input: "nums = [1,3,5], sumRange(0,2)",
        output: "9",
        explanation: "No updates. Sum = 1+3+5 = 9.",
      },
      {
        input: "nums = [1,3,5], update(1,2), sumRange(0,2)",
        output: "11",
        explanation: "After update(1,2): nums[1] becomes 3+2=5. Sum = 1+5+5 = 11.",
      },
    ],
    solution: `class NumArray:
    def __init__(self, nums):
        n = len(nums)
        self.n = n
        self.bit = [0] * (n + 1)  # 1-indexed
        for i, v in enumerate(nums):
            self._update(i + 1, v)  # build BIT
    
    def _update(self, i, delta):
        while i <= self.n:
            self.bit[i] += delta
            i += i & (-i)  # move to parent
    
    def _prefix(self, i):
        s = 0
        while i > 0:
            s += self.bit[i]
            i -= i & (-i)  # move to responsible ancestor
        return s
    
    def update(self, i, delta):
        self._update(i + 1, delta)  # convert to 1-indexed
    
    def sumRange(self, left, right):
        return self._prefix(right + 1) - self._prefix(left)`,
    keyInsight: "BIT stores partial sums. i & (-i) isolates the lowest set bit — it's the 'responsibility range' of index i. Update propagates up; prefix query propagates down. O(log n) both ways.",
    metaRelevance: "Fenwick trees appear in Meta E6 interviews as the 'optimal' follow-up to naive prefix sum when updates are required. Interviewers expect you to derive the bit manipulation from first principles.",
  },
  {
    id: "range-min-segment-tree",
    title: "Range Minimum Query with Point Updates (Segment Tree)",
    difficulty: "D",
    timeLimit: 1800,
    memoryLimit: "256 MB",
    tags: ["Segment Tree", "Range Query", "Point Update"],
    statement: `Design a data structure for an integer array nums that supports:

1. update(i, val): Set nums[i] = val.
2. queryMin(left, right): Return the minimum of nums[left..right].

Both operations must run in O(log n). Implement the SegTree class:
- SegTree(int[] nums): Builds the segment tree.
- void update(int i, int val): Updates index i to val.
- int queryMin(int left, int right): Returns minimum in range.`,
    constraints: `1 ≤ nums.length ≤ 10⁵
-10⁹ ≤ nums[i] ≤ 10⁹
0 ≤ i < nums.length
0 ≤ left ≤ right < nums.length
At most 10⁵ calls to update and queryMin`,
    examples: [
      {
        input: "nums = [1,3,2,7,9,11], queryMin(1,5)",
        output: "2",
        explanation: "Min of [3,2,7,9,11] = 2.",
      },
      {
        input: "nums = [1,3,2,7,9,11], update(2,6), queryMin(1,5)",
        output: "3",
        explanation: "After update(2,6): nums=[1,3,6,7,9,11]. Min of [3,6,7,9,11] = 3.",
      },
    ],
    solution: `class SegTree:
    def __init__(self, nums):
        n = len(nums)
        self.n = n
        self.tree = [float('inf')] * (4 * n)
        self._build(nums, 0, 0, n - 1)
    
    def _build(self, nums, node, start, end):
        if start == end:
            self.tree[node] = nums[start]
        else:
            mid = (start + end) // 2
            self._build(nums, 2*node+1, start, mid)
            self._build(nums, 2*node+2, mid+1, end)
            self.tree[node] = min(self.tree[2*node+1], self.tree[2*node+2])
    
    def update(self, i, val, node=0, start=0, end=None):
        if end is None: end = self.n - 1
        if start == end:
            self.tree[node] = val
        else:
            mid = (start + end) // 2
            if i <= mid:
                self.update(i, val, 2*node+1, start, mid)
            else:
                self.update(i, val, 2*node+2, mid+1, end)
            self.tree[node] = min(self.tree[2*node+1], self.tree[2*node+2])
    
    def queryMin(self, l, r, node=0, start=0, end=None):
        if end is None: end = self.n - 1
        if r < start or end < l: return float('inf')  # out of range
        if l <= start and end <= r: return self.tree[node]  # fully covered
        mid = (start + end) // 2
        return min(
            self.queryMin(l, r, 2*node+1, start, mid),
            self.queryMin(l, r, 2*node+2, mid+1, end)
        )`,
    keyInsight: "Segment tree stores aggregate per range. Build bottom-up. Query: skip out-of-range, return if fully covered, else recurse both halves. Update: recurse to leaf, propagate up. O(log n) both.",
    metaRelevance: "Segment trees are the canonical answer to 'range query + point update' in Meta E6/E7 interviews. Interviewers test whether you can implement it from scratch in 25 minutes.",
  },
  {
    id: "longest-common-substring-suffix-array",
    title: "Longest Common Substring (Suffix Array + LCP)",
    difficulty: "E",
    timeLimit: 2400,
    memoryLimit: "256 MB",
    tags: ["Suffix Array", "LCP Array", "Kasai's Algorithm", "String"],
    statement: `Given two strings s and t, return the length of their longest common substring.

A substring is a contiguous sequence of characters within a string.

You must solve this in O((n+m) log(n+m)) or better using a suffix array approach. The naive O(n²) DP solution is not accepted (TLE for large inputs).`,
    constraints: `1 ≤ s.length, t.length ≤ 10⁵
s and t consist of lowercase English letters`,
    examples: [
      { input: 's = "abcde", t = "abfce"', output: "2", explanation: '"ab" and "ce" are both common substrings of length 2.' },
      { input: 's = "zxabcdezy", t = "yzabcdezx"', output: "6", explanation: '"abcdez" is the longest common substring.' },
    ],
    solution: `def longestCommonSubstring(s, t):
    # Concatenate with sentinel characters
    # s$t# where $ < # < 'a' prevents cross-boundary matches
    combined = s + '$' + t + '#'
    n = len(combined)
    ns = len(s)
    
    # Build suffix array (simplified O(n log²n) for clarity)
    sa = sorted(range(n), key=lambda i: combined[i:])
    
    # Build LCP array using Kasai's O(n) algorithm
    rank = [0] * n
    for i, s_idx in enumerate(sa):
        rank[s_idx] = i
    
    lcp = [0] * n
    h = 0
    for i in range(n):
        if rank[i] > 0:
            j = sa[rank[i] - 1]
            while i + h < n and j + h < n and combined[i+h] == combined[j+h]:
                h += 1
            lcp[rank[i]] = h
            if h > 0: h -= 1
    
    # Max LCP between adjacent SA entries from different strings
    best = 0
    for i in range(1, n):
        a, b = sa[i-1], sa[i]
        from_s_a = a < ns
        from_s_b = b < ns
        if from_s_a != from_s_b:  # different strings
            best = max(best, lcp[i])
    return best`,
    keyInsight: "Concatenate s+'$'+t+'#', build suffix array + LCP (Kasai). The answer is max LCP[i] where SA[i-1] and SA[i] come from different strings. Sentinel chars prevent cross-boundary matches.",
    metaRelevance: "Suffix array + LCP is the gold standard for string problems at Meta E7. Tests whether you can implement Kasai's O(n) LCP construction and understand the sentinel trick.",
  },
  {
    id: "count-distinct-offline-bit",
    title: "Count Distinct Values in Ranges (Offline + BIT)",
    difficulty: "E",
    timeLimit: 2400,
    memoryLimit: "256 MB",
    tags: ["Fenwick Tree", "Offline Queries", "Sweep Line", "Coordinate Compression"],
    statement: `Given an integer array nums and q queries, each query (l, r) asks: how many distinct values are in nums[l..r]?

Process all queries offline to achieve O((n + q) log n) time.

Return an array of answers for each query in the original order.`,
    constraints: `1 ≤ nums.length ≤ 10⁵
1 ≤ q ≤ 10⁵
0 ≤ l ≤ r < nums.length
1 ≤ nums[i] ≤ 10⁵`,
    examples: [
      {
        input: "nums = [1,2,1,3,2], queries = [(0,4),(0,2),(1,3)]",
        output: "[3, 2, 3]",
        explanation: "Range [0,4]={1,2,3}=3 distinct. Range [0,2]={1,2}=2. Range [1,3]={2,1,3}=3.",
      },
    ],
    solution: `def countDistinct(nums, queries):
    n = len(nums)
    
    # BIT for point update, prefix sum query
    bit = [0] * (n + 1)
    def update(i, delta):
        i += 1  # 1-indexed
        while i <= n:
            bit[i] += delta
            i += i & (-i)
    def prefix(i):
        i += 1
        s = 0
        while i > 0:
            s += bit[i]
            i -= i & (-i)
        return s
    def query(l, r):
        return prefix(r) - (prefix(l-1) if l > 0 else 0)
    
    # Sort queries by right endpoint
    indexed_queries = sorted(enumerate(queries), key=lambda x: x[1][1])
    
    last_occ = {}  # last_occurrence[v] = last index where value v appeared
    answers = [0] * len(queries)
    j = 0  # pointer into nums
    
    for qi, (l, r) in indexed_queries:
        while j <= r:
            v = nums[j]
            if v in last_occ:
                update(last_occ[v], -1)  # remove old occurrence
            update(j, +1)               # add new occurrence
            last_occ[v] = j
            j += 1
        answers[qi] = query(l, r)
    
    return answers`,
    keyInsight: "Sort queries by right endpoint. Sweep right; for each value, remove its previous occurrence from BIT and add current position. Query BIT for [l,r] counts only the rightmost occurrence of each distinct value in the range.",
    metaRelevance: "Offline query processing + BIT is a canonical Meta E7 pattern. Tests whether you can combine sweep line, lazy deletion, and Fenwick trees — a combination that appears in real Meta infrastructure problems.",
  },
  {
    id: "kth-smallest-bst-range",
    title: "K-th Smallest in BST within Range",
    difficulty: "D",
    timeLimit: 1800,
    memoryLimit: "256 MB",
    tags: ["BST", "Order Statistics", "Augmented Tree", "In-order Traversal"],
    statement: `Given the root of a Binary Search Tree (BST) and two integers lo and hi, find the k-th smallest value among all nodes with values in the inclusive range [lo, hi].

If fewer than k nodes exist in the range, return -1.

You must solve this in O(h + k) time where h is the height of the BST, without collecting all range elements first.`,
    constraints: `The number of nodes in the tree is in the range [1, 10⁴].
1 ≤ Node.val ≤ 10⁵
1 ≤ lo ≤ hi ≤ 10⁵
1 ≤ k ≤ 10⁴`,
    examples: [
      {
        input: "BST: [5,3,7,2,4,6,8], lo=3, hi=7, k=2",
        output: "4",
        explanation: "Nodes in [3,7]: {3,4,5,6,7}. 2nd smallest = 4.",
      },
      {
        input: "BST: [5,3,7,2,4,6,8], lo=6, hi=8, k=4",
        output: "-1",
        explanation: "Only 3 nodes in [6,8]: {6,7,8}. k=4 exceeds count.",
      },
    ],
    solution: `def kthSmallestInRange(root, lo, hi, k):
    # Generator-based in-order with BST pruning
    def inorder(node):
        if not node:
            return
        # Prune left if node.val <= lo (no smaller valid nodes there)
        if node.val > lo:
            yield from inorder(node.left)
        if lo <= node.val <= hi:
            yield node.val
        # Prune right if node.val >= hi
        if node.val < hi:
            yield from inorder(node.right)
    
    count = 0
    for val in inorder(root):
        count += 1
        if count == k:
            return val
    return -1

# Augmented BST approach (O(h) per query after O(n) build):
# Each node stores left_size = count of nodes in left subtree.
# rank_of_lo = count_less_than(root, lo)
# total_in_range = count_leq(root, hi) - rank_of_lo
# if k > total_in_range: return -1
# else: find (rank_of_lo + k)-th smallest in full BST`,
    keyInsight: "Generator-based in-order with BST pruning: skip left subtree if node.val <= lo, skip right if node.val >= hi. For O(h) per query: augment each node with subtree count, use rank arithmetic.",
    metaRelevance: "Order-statistics trees appear in Meta E6/E7 system design follow-ups (e.g., 'find the median of a stream in a range'). Tests BST augmentation — a pattern Meta interviewers use to distinguish IC6 from IC7.",
  },
];

const DIFF_COLORS: Record<string, string> = {
  C: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  D: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  E: "text-red-400 bg-red-500/10 border-red-500/30",
};

const DIFF_LABELS: Record<string, string> = {
  C: "C — Medium",
  D: "D — Hard",
  E: "E — Expert",
};

export default function YandexAlgorithmTrainer() {
  const [active, setActive] = useState(false);
  const [problemIdx, setProblemIdx] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [verdict, setVerdict] = useState<"pass" | "fail" | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(LS_COMPLETED) || "[]")); } catch { return new Set(); }
  });
  const [history, setHistory] = useState<HistoryMap>(() => loadHistory());
  const [hintThreshold, setHintThreshold] = useState<HintThreshold>(() => loadHintThreshold());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Collect all unique tags across all problems
  const allTags = Array.from(new Set(PROBLEMS.flatMap((p) => p.tags))).sort();

  const problem = PROBLEMS[problemIdx];
  const timeLimit = problem.timeLimit;
  const remaining = Math.max(0, timeLimit - elapsed);
  const pct = (elapsed / timeLimit) * 100;

  const startTimer = useCallback(() => {
    setTimerRunning(true);
    setElapsed(0);
    setVerdict(null);
    setShowSolution(false);
  }, []);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if (e + 1 >= timeLimit) {
            setTimerRunning(false);
            setVerdict("fail");
            toast.error("Time's up! Review the solution.");
            return timeLimit;
          }
          return e + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, timeLimit]);

  const handlePass = () => {
    stopTimer();
    setVerdict("pass");
    const newCompleted = new Set(completedIds);
    newCompleted.add(problem.id);
    setCompletedIds(newCompleted);
    localStorage.setItem(LS_COMPLETED, JSON.stringify([...newCompleted]));
    const newHistory = { ...history };
    const prev = newHistory[problem.id] ?? { attempts: [], bestTime: null };
    const attempt: ProblemAttempt = { verdict: "pass", elapsed, ts: Date.now() };
    const newBest = prev.bestTime === null ? elapsed : Math.min(prev.bestTime, elapsed);
    newHistory[problem.id] = { attempts: [...prev.attempts, attempt], bestTime: newBest };
    setHistory(newHistory);
    saveHistory(newHistory);
    toast.success(`Solved in ${formatTime(elapsed)}!${newBest === elapsed ? " New personal best!" : ""}`);
  };

  const handleFail = () => {
    stopTimer();
    setVerdict("fail");
    setShowSolution(true);
    const newHistory = { ...history };
    const prev = newHistory[problem.id] ?? { attempts: [], bestTime: null };
    const attempt: ProblemAttempt = { verdict: "fail", elapsed, ts: Date.now() };
    newHistory[problem.id] = { attempts: [...prev.attempts, attempt], bestTime: prev.bestTime };
    setHistory(newHistory);
    saveHistory(newHistory);
    toast.error("Study the solution carefully.");
  };

  const handleReset = () => {
    stopTimer();
    setElapsed(0);
    setVerdict(null);
    setShowSolution(false);
    setTimerRunning(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const timerColor = remaining <= 120
    ? "text-red-400"
    : remaining <= 300
    ? "text-amber-400"
    : "text-emerald-400";
  const hintUnlocked = !timerRunning || pct >= hintThreshold;
  const getProblemStreak = (id: string): number => {
    const attempts = history[id]?.attempts ?? [];
    let streak = 0;
    for (let i = attempts.length - 1; i >= 0; i--) {
      if (attempts[i].verdict === "pass") streak++;
      else break;
    }
    return streak;
  };
  const getProblemBestTime = (id: string): number | null => history[id]?.bestTime ?? null;
  const handleHintThresholdChange = (t: HintThreshold) => {
    setHintThreshold(t);
    localStorage.setItem(LS_HINT_THRESHOLD, String(t));
    toast.success("Hint threshold updated.");
  };

  if (!active) {
    if (showLeaderboard) {
      const ranked = PROBLEMS
        .map((p) => ({ ...p, bestTime: getProblemBestTime(p.id), streak: getProblemStreak(p.id), attempts: history[p.id]?.attempts.length ?? 0 }))
        .filter((p) => p.bestTime !== null)
        .sort((a, b) => (a.bestTime ?? Infinity) - (b.bestTime ?? Infinity));
      const attempted = PROBLEMS.filter((p) => (history[p.id]?.attempts.length ?? 0) > 0 && !completedIds.has(p.id));
      const unstarted = PROBLEMS.filter((p) => !history[p.id] || history[p.id].attempts.length === 0);
      return (
        <div className="prep-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><BarChart2 size={16} className="text-amber-400" /><span className="font-bold text-sm text-foreground">Personal Leaderboard</span></div>
            <button onClick={() => setShowLeaderboard(false)} className="text-xs text-muted-foreground hover:text-foreground">Back</button>
          </div>
          {ranked.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs"><Trophy size={28} className="mx-auto mb-2 opacity-30" />No solved problems yet.</div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Solved by best time</p>
              {ranked.map((p, rank) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/30 border border-border">
                  <span className={`text-xs font-black w-5 shrink-0 ${rank === 0 ? "text-amber-400" : rank === 1 ? "text-slate-300" : "text-muted-foreground"}`}>#{rank + 1}</span>
                  <div className="flex-1 min-w-0"><p className="text-xs font-medium text-foreground truncate">{p.title}</p><p className="text-[10px] text-muted-foreground">{p.attempts} attempt{p.attempts !== 1 ? "s" : ""}</p></div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.streak >= 2 && <span className="flex items-center gap-0.5 text-[10px] text-orange-400 font-bold"><Flame size={10} />{p.streak}x</span>}
                    <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400"><Clock size={10} />{formatTime(p.bestTime!)}</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${DIFF_COLORS[p.difficulty]}`}>{p.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {attempted.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Attempted, not solved</p>
              {attempted.map((p) => {
                const failCount = history[p.id]?.attempts.filter((a) => a.verdict === "fail").length ?? 0;
                return (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
                    <XCircle size={12} className="text-red-400 shrink-0" />
                    <span className="flex-1 text-xs text-muted-foreground truncate">{p.title}</span>
                    <span className="text-[10px] text-red-400">{failCount} fail{failCount !== 1 ? "s" : ""}</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${DIFF_COLORS[p.difficulty]}`}>{p.difficulty}</span>
                  </div>
                );
              })}
            </div>
          )}
          {unstarted.length > 0 && <p className="text-[10px] text-muted-foreground">{unstarted.length} problem{unstarted.length !== 1 ? "s" : ""} not yet attempted.</p>}
        </div>
      );
    }
    if (showSettings) {
      return (
        <div className="prep-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Settings size={16} className="text-muted-foreground" /><span className="font-bold text-sm text-foreground">Trainer Settings</span></div>
            <button onClick={() => setShowSettings(false)} className="text-xs text-muted-foreground hover:text-foreground">Back</button>
          </div>
          <div className="rounded-lg bg-secondary/30 border border-border p-4 space-y-3">
            <div className="flex items-center gap-2"><Unlock size={14} className="text-amber-400" /><span className="text-sm font-semibold text-foreground">Hint Unlock Threshold</span></div>
            <p className="text-xs text-muted-foreground">Controls when the solution can be revealed during a session.</p>
            <div className="grid grid-cols-2 gap-2">
              {([25, 50, 75, 100] as HintThreshold[]).map((t) => (
                <button key={t} onClick={() => handleHintThresholdChange(t)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${hintThreshold === t ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"}`}>
                  {t === 100 ? <span className="flex items-center justify-center gap-1.5"><Lock size={11} /> Timer ends (strict)</span>
                    : <span className="flex items-center justify-center gap-1.5"><Unlock size={11} /> {HINT_THRESHOLD_LABELS[t]}</span>}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">Current: <span className="text-amber-300 font-semibold">{HINT_THRESHOLD_LABELS[hintThreshold]}</span></p>
          </div>
          <div className="rounded-lg bg-secondary/30 border border-border p-4 space-y-2">
            <span className="text-sm font-semibold text-foreground">Reset Progress</span>
            <p className="text-xs text-muted-foreground">Clears all attempt history and solved status.</p>
            <button onClick={() => { if (confirm("Reset all progress?")) { localStorage.removeItem(LS_COMPLETED); localStorage.removeItem(LS_HISTORY); setCompletedIds(new Set()); setHistory({}); toast.success("Progress reset."); setShowSettings(false); } }}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all">Reset All Progress</button>
          </div>
        </div>
      );
    }
    return (
      <div className="prep-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0"><Swords size={18} className="text-red-400" /></div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Yandex Algorithm Trainer</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Hard problems · Strict time limits · Binary pass/fail</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{completedIds.size}/{PROBLEMS.length} solved</span>
            <button onClick={() => setShowLeaderboard(true)} title="Personal leaderboard" className="p-1.5 rounded-lg bg-secondary/50 border border-border text-muted-foreground hover:text-amber-400 transition-all"><Medal size={13} /></button>
            <button onClick={() => setShowSettings(true)} title="Settings" className="p-1.5 rounded-lg bg-secondary/50 border border-border text-muted-foreground hover:text-foreground transition-all"><Settings size={13} /></button>
            <button onClick={() => setActive(true)} className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all">Enter Arena</button>
          </div>
        </div>
        {/* Tag filter chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-all ${
              selectedTag === null
                ? "bg-red-600 border-red-500 text-white"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({PROBLEMS.length})
          </button>
          {allTags.map((tag) => {
            const count = PROBLEMS.filter((p) => p.tags.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-all ${
                  selectedTag === tag
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROBLEMS.filter((p) => selectedTag === null || p.tags.includes(selectedTag)).map((p) => {
            const streak = getProblemStreak(p.id);
            const best = getProblemBestTime(p.id);
            const attempts = history[p.id]?.attempts.length ?? 0;
            return (
              <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                completedIds.has(p.id) ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : attempts > 0 ? "bg-red-500/5 border-red-500/20 text-muted-foreground"
                : "bg-secondary/30 border-border text-muted-foreground"}`}>
                {completedIds.has(p.id) ? <Trophy size={12} className="text-emerald-400 shrink-0" />
                  : attempts > 0 ? <XCircle size={12} className="text-red-400/60 shrink-0" />
                  : <Lock size={12} className="opacity-40 shrink-0" />}
                <span className="truncate flex-1">{p.title}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {streak >= 2 && <span className="flex items-center gap-0.5 text-[10px] text-orange-400 font-bold"><Flame size={9} />{streak}</span>}
                  {best !== null && <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono"><Clock size={9} />{formatTime(best)}</span>}
                  <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${DIFF_COLORS[p.difficulty]}`}>{p.difficulty}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {hintThreshold === 100
            ? <><Lock size={9} /> Hints locked until timer ends (strict mode)</>
            : <><Unlock size={9} /> Hints unlock at {HINT_THRESHOLD_LABELS[hintThreshold]} — <button onClick={() => setShowSettings(true)} className="text-amber-400 hover:underline">change</button></>
          }
        </div>
      </div>
    );
  }
  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-red-400" />
          <span className="font-bold text-sm text-foreground">Yandex Algorithm Trainer</span>
          <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${DIFF_COLORS[problem.difficulty]}`}>
            {DIFF_LABELS[problem.difficulty]}
          </span>
        </div>
        <button
          onClick={() => { handleReset(); setActive(false); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Problem navigation */}
      <div className="flex gap-1.5 flex-wrap">
        {PROBLEMS.map((p, i) => (
          <button
            key={p.id}
            onClick={() => { setProblemIdx(i); handleReset(); }}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all border ${
              i === problemIdx
                ? "bg-red-700 border-red-600 text-white"
                : completedIds.has(p.id)
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {completedIds.has(p.id) ? "✓ " : ""}{i + 1}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="rounded-lg bg-secondary/30 border border-border p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Timer size={14} className={timerColor} />
            <span className={`font-mono font-black text-xl ${timerColor}`}>
              {formatTime(remaining)}
            </span>
            <span className="text-[10px] text-muted-foreground">/ {formatTime(timeLimit)}</span>
          </div>
          <div className="flex items-center gap-2">
            {!timerRunning && verdict === null && (
              <button
                onClick={startTimer}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all"
              >
                <Play size={11} /> Start
              </button>
            )}
            {timerRunning && (
              <>
                <button
                  onClick={handlePass}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
                >
                  <CheckCircle size={11} /> Solved
                </button>
                <button
                  onClick={handleFail}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all"
                >
                  <XCircle size={11} /> Give Up
                </button>
              </>
            )}
            {verdict !== null && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground transition-all"
              >
                <RotateCcw size={11} /> Retry
              </button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              pct >= 80 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>

      {/* Verdict banner */}
      {verdict && (
        <div className={`rounded-lg border p-3 flex items-center gap-3 ${
          verdict === "pass"
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-red-500/10 border-red-500/30"
        }`}>
          {verdict === "pass" ? (
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          ) : (
            <XCircle size={18} className="text-red-400 shrink-0" />
          )}
          <div>
            <div className={`text-sm font-bold ${verdict === "pass" ? "text-emerald-300" : "text-red-300"}`}>
              {verdict === "pass"
                ? `Solved in ${formatTime(elapsed)} — ${elapsed <= timeLimit * 0.6 ? "Excellent!" : "Good job!"}`
                : "Time expired or gave up — study the solution"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {verdict === "pass"
                ? "This problem is now marked as solved in your archive."
                : "Understanding the key insight is more important than getting it right first try."}
            </div>
          </div>
        </div>
      )}

      {/* Problem statement */}
      <div className="rounded-lg bg-secondary/30 border border-border p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm text-foreground">{problem.title}</h3>
          <div className="flex gap-1 flex-wrap justify-end">
            {problem.tags.map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] text-muted-foreground border border-border">
                {t}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{problem.statement}</p>
        <div className="text-[10px] text-muted-foreground font-mono bg-secondary/40 rounded p-2">
          <span className="font-semibold text-foreground">Constraints:</span>
          <br />
          {problem.constraints}
        </div>

        {/* Examples */}
        <div>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showExamples ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            Examples ({problem.examples.length})
          </button>
          {showExamples && (
            <div className="mt-2 space-y-2">
              {problem.examples.map((ex, i) => (
                <div key={i} className="rounded bg-secondary/40 border border-border p-2 text-[11px] font-mono">
                  <div><span className="text-muted-foreground">Input: </span><span className="text-foreground">{ex.input}</span></div>
                  <div><span className="text-muted-foreground">Output: </span><span className="text-emerald-400">{ex.output}</span></div>
                  {ex.explanation && (
                    <div className="text-muted-foreground mt-1 font-sans text-[10px]">{ex.explanation}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Meta relevance */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <Flame size={12} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-300">{problem.metaRelevance}</p>
      </div>

      {/* Solution reveal */}
      <div>
        <button
          onClick={() => setShowSolution(!showSolution)}
          disabled={timerRunning}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {showSolution ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {timerRunning ? "Stop timer to reveal solution" : "Reveal solution + key insight"}
        </button>
        {showSolution && (
          <div className="mt-2 space-y-3">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <p className="text-[11px] font-semibold text-amber-300 mb-1">Key Insight</p>
              <p className="text-xs text-amber-200/80">{problem.keyInsight}</p>
            </div>
            <div className="rounded-lg bg-secondary/30 border border-border p-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">Reference Solution (Python)</p>
              <pre className="text-[11px] text-foreground font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {problem.solution}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={() => { setProblemIdx(Math.max(0, problemIdx - 1)); handleReset(); }}
          disabled={problemIdx === 0}
          className="px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
        >
          ← Prev
        </button>
        <span className="text-[10px] text-muted-foreground">
          {completedIds.size}/{PROBLEMS.length} solved
        </span>
        <button
          onClick={() => { setProblemIdx(Math.min(PROBLEMS.length - 1, problemIdx + 1)); handleReset(); }}
          disabled={problemIdx === PROBLEMS.length - 1}
          className="px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
