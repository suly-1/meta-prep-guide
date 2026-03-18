// ── Design: Bold Engineering Dashboard ─────────────────────────────────────
// Dark charcoal base, Space Grotesk headings, Inter body
// Blue (Meta), Emerald (mastered), Amber (weak), Orange (streak)

export const PATTERNS = [
  { id: "sliding-window",  name: "Sliding Window",          diff: "Medium", freq: 5, desc: "Fixed or variable-size window sliding over array/string. Optimal for subarray/substring problems.", examples: ["Max Subarray","Longest Substring No Repeat","Min Window Substring"], keyIdea: "Expand right, shrink left when condition violated" },
  { id: "two-pointers",    name: "Two Pointers",            diff: "Easy",   freq: 5, desc: "Two indices moving toward each other or in same direction. Eliminates nested loops.", examples: ["Two Sum II","Container With Most Water","3Sum"], keyIdea: "Sort first, then converge or co-move pointers" },
  { id: "fast-slow",       name: "Fast & Slow Pointers",    diff: "Medium", freq: 4, desc: "Floyd's cycle detection. One pointer moves 2× faster. Detects cycles in linked lists.", examples: ["Linked List Cycle","Find Duplicate Number","Middle of Linked List"], keyIdea: "If cycle exists, fast catches slow" },
  { id: "binary-search",   name: "Binary Search Variants",  diff: "Medium", freq: 5, desc: "Beyond sorted arrays — search on answer space, rotated arrays, and 2D matrices.", examples: ["Search Rotated Array","Find Min in Rotated","Koko Eating Bananas"], keyIdea: "Define search space, eliminate half each step" },
  { id: "bfs",             name: "BFS / Level-Order",       diff: "Medium", freq: 5, desc: "Queue-based exploration. Shortest path in unweighted graphs, tree level traversal.", examples: ["Binary Tree Level Order","Shortest Path in Grid","Word Ladder"], keyIdea: "Use deque; track visited set for graphs" },
  { id: "dfs-backtrack",   name: "DFS / Backtracking",      diff: "Hard",   freq: 5, desc: "Recursive exploration with pruning. Permutations, combinations, path finding.", examples: ["Subsets","Permutations","N-Queens","Word Search"], keyIdea: "Choose → Explore → Unchoose (backtrack)" },
  { id: "dynamic-prog",    name: "Dynamic Programming",     diff: "Hard",   freq: 5, desc: "Memoization or tabulation to avoid recomputation. Optimal substructure + overlapping subproblems.", examples: ["Coin Change","Longest Common Subsequence","House Robber"], keyIdea: "Define state, recurrence, base case" },
  { id: "greedy",          name: "Greedy Algorithms",       diff: "Medium", freq: 4, desc: "Locally optimal choices lead to globally optimal solution. Prove correctness by exchange argument.", examples: ["Jump Game","Gas Station","Merge Intervals"], keyIdea: "Sort by key metric, make greedy choice" },
  { id: "heap-priority",   name: "Heap / Priority Queue",   diff: "Medium", freq: 4, desc: "Efficient min/max extraction. Top-K problems, merge K sorted lists, median of stream.", examples: ["Kth Largest Element","Merge K Sorted Lists","Find Median from Data Stream"], keyIdea: "heapq in Python; maintain heap size = K" },
  { id: "intervals",       name: "Intervals",               diff: "Medium", freq: 4, desc: "Sort by start time. Merge overlapping, find gaps, schedule meetings.", examples: ["Merge Intervals","Insert Interval","Meeting Rooms II"], keyIdea: "Sort by start; merge if curr.start <= prev.end" },
  { id: "monotonic-stack", name: "Monotonic Stack",         diff: "Medium", freq: 3, desc: "Stack maintaining monotone order. Next greater/smaller element problems.", examples: ["Daily Temperatures","Largest Rectangle in Histogram","Trapping Rain Water"], keyIdea: "Pop when current breaks monotone property" },
  { id: "trie",            name: "Trie (Prefix Tree)",      diff: "Medium", freq: 3, desc: "Tree for string prefix operations. Autocomplete, spell check, IP routing.", examples: ["Implement Trie","Word Search II","Design Add and Search Words"], keyIdea: "Each node = one char; isEnd marks word boundary" },
  { id: "union-find",      name: "Union-Find (DSU)",        diff: "Medium", freq: 3, desc: "Disjoint set union for connectivity. Path compression + union by rank for near-O(1).", examples: ["Number of Islands","Redundant Connection","Accounts Merge"], keyIdea: "find() with path compression; union by rank" },
  { id: "graph-advanced",  name: "Topological Sort",        diff: "Hard",   freq: 3, desc: "Kahn's algorithm (BFS) or DFS post-order. Detect cycles, order dependencies.", examples: ["Course Schedule","Alien Dictionary","Parallel Courses"], keyIdea: "In-degree 0 nodes go first; decrement neighbors" },
];

export const BEHAVIORAL_QUESTIONS = [
  // Conflict & Influence
  { id:"bq1",  area:"Conflict & Influence",  q:"Tell me about a time you disagreed with your manager or a senior stakeholder on a technical decision. What did you do?",                hint:"Show data-driven persuasion, not stubbornness. Outcome matters." },
  { id:"bq2",  area:"Conflict & Influence",  q:"Describe a situation where you had to influence a team or org that didn't report to you.",                                            hint:"Emphasize coalition-building and shared goals." },
  { id:"bq3",  area:"Conflict & Influence",  q:"Tell me about a time you had to push back on a product or business requirement.",                                                     hint:"Show you understand trade-offs and escalate appropriately." },
  { id:"bq4",  area:"Conflict & Influence",  q:"Describe a time when two teams had conflicting priorities and you had to broker a resolution.",                                        hint:"Focus on alignment, not just compromise." },
  { id:"bq5",  area:"Conflict & Influence",  q:"Tell me about a time you changed someone's mind using data or a prototype.",                                                           hint:"Concrete evidence beats opinion every time." },
  { id:"bq6",  area:"Conflict & Influence",  q:"Describe a time you had to navigate a politically sensitive technical decision.",                                                      hint:"Show EQ alongside technical judgment." },
  { id:"bq7",  area:"Conflict & Influence",  q:"Tell me about a time you successfully advocated for a technical investment that had no immediate business payoff.",                    hint:"Long-term thinking, ROI framing, stakeholder buy-in." },
  // Ownership & Ambiguity
  { id:"bq8",  area:"Ownership & Ambiguity", q:"Tell me about a time you took ownership of a problem that wasn't technically yours to solve.",                                        hint:"Show initiative and cross-functional thinking." },
  { id:"bq9",  area:"Ownership & Ambiguity", q:"Describe a project where the requirements were unclear. How did you move forward?",                                                   hint:"Structured ambiguity resolution: clarify, prototype, iterate." },
  { id:"bq10", area:"Ownership & Ambiguity", q:"Tell me about a time you had to make a significant decision with incomplete information.",                                             hint:"Show risk assessment and reversibility thinking." },
  { id:"bq11", area:"Ownership & Ambiguity", q:"Describe a situation where you identified a critical problem before it became a crisis.",                                             hint:"Proactive monitoring, early signals, preventive action." },
  { id:"bq12", area:"Ownership & Ambiguity", q:"Tell me about a time you had to define the scope of a project from scratch.",                                                         hint:"Show how you scoped, prioritized, and got alignment." },
  { id:"bq13", area:"Ownership & Ambiguity", q:"Describe a time you had to say no to a feature request. How did you handle it?",                                                      hint:"Principled prioritization, not just refusal." },
  { id:"bq14", area:"Ownership & Ambiguity", q:"Tell me about a time you had to pivot a project mid-execution. What triggered it and how did you manage it?",                         hint:"Adaptability + stakeholder communication." },
  // Scale & Impact
  { id:"bq15", area:"Scale & Impact",        q:"Tell me about the most technically complex system you've designed or significantly contributed to.",                                   hint:"Quantify scale: QPS, latency, data volume, team size." },
  { id:"bq16", area:"Scale & Impact",        q:"Describe a time when your technical decision had org-wide or company-wide impact.",                                                    hint:"IC7: show you influenced beyond your immediate team." },
  { id:"bq17", area:"Scale & Impact",        q:"Tell me about a time you improved engineering efficiency or developer productivity at scale.",                                          hint:"Tooling, process, platform — quantify the multiplier effect." },
  { id:"bq18", area:"Scale & Impact",        q:"Describe a project where you had to balance speed of delivery with long-term technical quality.",                                      hint:"Show judgment: when to incur tech debt and when to pay it down." },
  { id:"bq19", area:"Scale & Impact",        q:"Tell me about a time you reduced costs or improved performance significantly in production.",                                           hint:"Quantify: latency %, cost savings $, throughput improvement." },
  { id:"bq20", area:"Scale & Impact",        q:"Describe a time you led a migration or platform change that affected many teams.",                                                     hint:"Strangler fig, feature flags, rollback plan, incremental delivery." },
  { id:"bq21", area:"Scale & Impact",        q:"Tell me about a technical investment that paid off significantly over time.",                                                           hint:"Show long-term thinking and compounding returns." },
  // Failure & Learning
  { id:"bq22", area:"Failure & Learning",    q:"Tell me about a significant technical failure or outage you were responsible for. What happened and what did you learn?",             hint:"Own it fully. Show systemic fix, not just a patch." },
  { id:"bq23", area:"Failure & Learning",    q:"Describe a time when you were wrong about a technical approach. How did you course-correct?",                                         hint:"Intellectual humility + data-driven pivot." },
  { id:"bq24", area:"Failure & Learning",    q:"Tell me about a time a project you led failed to meet its goals. What would you do differently?",                                     hint:"Root cause analysis, not blame. Show growth." },
  { id:"bq25", area:"Failure & Learning",    q:"Describe a time you received critical feedback that was hard to hear. How did you respond?",                                          hint:"Show openness to feedback and concrete behavior change." },
  { id:"bq26", area:"Failure & Learning",    q:"Tell me about a time you shipped something that had unintended negative consequences.",                                                hint:"Monitoring, rollback, post-mortem, prevention." },
  { id:"bq27", area:"Failure & Learning",    q:"Describe a time you underestimated the complexity of a project. What happened?",                                                      hint:"Estimation skills, early signals, course correction." },
  { id:"bq28", area:"Failure & Learning",    q:"Tell me about a time you had to deliver bad news to stakeholders. How did you handle it?",                                            hint:"Transparency, options, path forward." },
];

export const STAR_STORIES = [
  { id:"s1", title:"Led cross-team migration",       tags:["Ownership","Scale","Execution"],   template:"S: Legacy monolith causing 40% of incidents\nT: Migrate 3 teams to new service mesh\nA: Designed strangler fig pattern, feature flags, 6-month rollout\nR: 40% incident reduction, 2× deploy frequency" },
  { id:"s2", title:"Resolved production outage",     tags:["Failure","Ownership","Speed"],      template:"S: P0 outage, 500k users affected\nT: Diagnose and restore within SLA\nA: Led war room, identified DB connection pool exhaustion, hotfix + long-term fix\nR: Restored in 47 min, implemented circuit breaker" },
  { id:"s3", title:"Influenced architectural decision", tags:["Conflict","Strategy","Data"],   template:"S: Team wanted to use vendor X, I had concerns\nT: Convince leadership with data\nA: Built proof-of-concept, benchmark comparison, TCO analysis\nR: Team adopted my recommendation, saved $200k/yr" },
  { id:"s4", title:"Grew junior engineer",            tags:["Mentorship","Culture","Impact"],   template:"S: Junior engineer struggling with system design\nT: Upskill to IC4 level in 6 months\nA: Weekly 1:1s, design reviews, stretch projects, feedback loops\nR: Promoted to IC4, now leading a feature independently" },
  { id:"s5", title:"Defined technical roadmap",       tags:["Strategy","Roadmap","IC7"],        template:"S: Org lacked 2-year technical vision\nT: Define roadmap aligned to business goals\nA: Stakeholder interviews, competitive analysis, RFC process, OKR alignment\nR: Roadmap adopted, 3 major initiatives launched" },
  { id:"s6", title:"Improved system performance",     tags:["Scale","Impact","Execution"],      template:"S: API latency at p99 = 800ms, impacting conversion\nT: Reduce to <200ms\nA: Profiling, caching layer, query optimization, async processing\nR: p99 = 140ms, 12% conversion improvement" },
  { id:"s7", title:"Navigated ambiguous project",     tags:["Ambiguity","Ownership","Clarity"], template:"S: Stakeholders had conflicting visions for new product\nT: Define scope and get alignment\nA: User research, prototype, structured decision framework, design doc\nR: Shipped MVP in 8 weeks, 85% stakeholder satisfaction" },
  { id:"s8", title:"Built engineering culture",       tags:["Culture","Mentorship","Scale"],    template:"S: Team had inconsistent code quality and slow reviews\nT: Raise engineering bar without slowing velocity\nA: Coding standards doc, automated linting, PR template, weekly tech talks\nR: Review time -30%, defect rate -25%, team NPS +20" },
];

export const SYSTEM_DESIGN_QUESTIONS = [
  { title:"Design Facebook News Feed",        level:"IC6+", tags:["Fan-out","Ranking","Pagination"] },
  { title:"Design Facebook Messenger",        level:"IC6+", tags:["WebSockets","Message Storage","Presence"] },
  { title:"Design Instagram",                 level:"IC6+", tags:["CDN","Media Storage","Feed Generation"] },
  { title:"Design WhatsApp",                  level:"IC6+", tags:["E2E Encryption","Message Queue","Delivery Receipts"] },
  { title:"Design a Distributed Cache",       level:"IC7+", tags:["Consistent Hashing","Eviction","Replication"] },
  { title:"Design Search Autocomplete",       level:"IC6+", tags:["Trie","Top-K","Ranking"] },
  { title:"Design a Notification System",     level:"IC6+", tags:["Push/Pull","Fanout","Delivery Guarantees"] },
  { title:"Design a Rate Limiter",            level:"IC6+", tags:["Token Bucket","Sliding Window","Distributed"] },
  { title:"Design a URL Shortener",           level:"IC6+", tags:["Hashing","Redirection","Analytics"] },
  { title:"Design a Distributed Job Queue",   level:"IC7+", tags:["At-least-once","Idempotency","Priority"] },
  { title:"Design Meta's Ad Targeting",       level:"IC7+", tags:["ML Pipeline","Real-time Bidding","Privacy"] },
  { title:"Design a Distributed File System", level:"IC7+", tags:["Replication","Consistency","Fault Tolerance"] },
];

export const RESOURCES = [
  { tag:"Coding",        title:"NeetCode 150",                          url:"https://neetcode.io/practice",                      desc:"Curated 150 problems covering all major patterns. Best ROI for Meta prep." },
  { tag:"System Design", title:"System Design Primer",                  url:"https://github.com/donnemartin/system-design-primer", desc:"Comprehensive GitHub resource covering all distributed systems concepts." },
  { tag:"System Design", title:"HelloInterview — Level Expectations",   url:"https://www.hellointerview.com",                    desc:"Definitive guide on IC5/IC6/IC7 system design expectations and signals." },
  { tag:"Behavioral",    title:"Lenny's Newsletter — Meta Hiring",      url:"https://www.lennysnewsletter.com",                  desc:"Insider perspective on Meta's hiring bar, leveling, and behavioral signals." },
  { tag:"Coding",        title:"Blind 75 — LeetCode",                   url:"https://leetcode.com/discuss/general-discussion/460599", desc:"The original curated 75 problems. Covers all essential patterns for FAANG." },
  { tag:"System Design", title:"Designing Data-Intensive Applications",  url:"https://dataintensive.net",                        desc:"The definitive book on distributed systems. Essential for IC6/IC7 design rounds." },
  { tag:"Behavioral",    title:"Meta Engineering Blog",                  url:"https://engineering.fb.com",                       desc:"Real Meta engineering challenges and solutions. Great for behavioral story context." },
];

export const PREP_TIMELINE = [
  { week:"Weeks 1–2", focus:"Foundation",   items:["Complete NeetCode patterns 1–7 (arrays, strings, trees)","Set up behavioral story bank (6 core stories)","Read DDIA chapters 1–5"] },
  { week:"Weeks 3–4", focus:"Depth",        items:["Complete NeetCode patterns 8–14 (graphs, DP, heaps)","Practice 2 system design problems end-to-end","Refine behavioral stories with STAR format"] },
  { week:"Weeks 5–6", focus:"Speed",        items:["Timed coding sessions (35 min per problem)","Mock system design with a peer","Full behavioral mock (record yourself)"] },
  { week:"Week 7",    focus:"Simulation",   items:["Full mock interview day (coding + design + behavioral)","Review weak patterns — focus drill mode","Rest and review notes"] },
  { week:"Week 8",    focus:"Final Polish", items:["Light coding maintenance (2–3 problems/day)","Review all STAR stories aloud","Logistics: CoderPad setup, time zone, quiet space"] },
];

export const INTERVIEW_DAY_CHECKLIST = [
  { phase:"Evening Before", items:["Review your top 3 STAR stories aloud","Skim pattern quick-reference cards","Prepare CoderPad / IDE setup","Set two alarms, plan your commute/login","Get 8 hours of sleep"] },
  { phase:"Morning Of",     items:["Light exercise or walk","Review IC6/IC7 expectations one more time","Eat a real meal","Test audio/video if remote","Arrive or log in 10 min early"] },
  { phase:"During",         items:["Clarify requirements before coding","Think aloud — narrate your approach","Write clean, readable code","Test with examples including edge cases","Ask for hints if stuck > 5 min"] },
  { phase:"After",          items:["Write down every question asked","Note what went well and what didn't","Send thank-you note within 24 hours","Debrief with a peer or mentor"] },
];

export const META_VALUES = [
  { name:"Move Fast",              desc:"Ship quickly, learn from real data, iterate. Speed is a feature." },
  { name:"Be Bold",                desc:"Take calculated risks. Comfortable with failure as a learning mechanism." },
  { name:"Focus on Impact",        desc:"Work on things that matter most. Ruthless prioritization." },
  { name:"Be Open",                desc:"Share information broadly. Transparency builds trust." },
  { name:"Build Social Value",     desc:"Technology that connects people and creates positive impact." },
  { name:"Live in the Future",     desc:"Think 10 years ahead. Build for where the world is going." },
];

export const IC_COMPARISON = [
  { dimension:"Scope",              ic6:"Team-level technical leadership",           ic7:"Org-level technical leadership" },
  { dimension:"Team Influence",     ic6:"~25–30 engineers + sister teams",           ic7:"30–50+ engineers across multiple teams" },
  { dimension:"Project Scale",      ic6:"Leads major initiatives",                   ic7:"Leads portfolios of initiatives" },
  { dimension:"Orientation",        ic6:"Technically driven, connected to business", ic7:"Business & product driven through technical work" },
  { dimension:"Partnerships",       ic6:"Project-level XFN collaboration",           ic7:"Long-term strategic XFN partnerships" },
  { dimension:"Industry Awareness", ic6:"Deep domain expertise",                     ic7:"Actively monitors trends & competition" },
  { dimension:"Communication",      ic6:"Clear within team and org",                 ic7:"Communicates across disciplines and all levels" },
];

// Peer comparison benchmarks (simulated aggregate data)
export const PEER_BENCHMARKS = {
  patternsTop20: 11,
  patternsTop50: 7,
  storiesTop20: 6,
  storiesTop50: 4,
  mockAvgTop20: 4.2,
  streakTop20: 21,
};
