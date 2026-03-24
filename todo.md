# Meta Prep Guide — TODO

## Completed

- [x] Basic prep guide HTML with all tabs
- [x] Dark mode toggle
- [x] Anki/Quizlet CSV export
- [x] Interview day countdown widget
- [x] Progress sharing card
- [x] Full mock history log
- [x] Recruiter-ready summary card
- [x] Daily notification reminder
- [x] Streak tracker
- [x] Weak patterns drill mode
- [x] Peer comparison stats on recruiter card
- [x] React web app with all features
- [x] Upgrade to full-stack (web-db-user)
- [x] Install socket.io and set up WebSocket server
- [x] DB schema: rooms, session_events, scorecards, leaderboard_entries tables
- [x] AI Interviewer Mode (LLM follow-up questions + structured feedback)
- [x] Session Replay engine (event recorder + timeline scrubber)
- [x] Interviewer Scorecard (rubric sliders + AI coaching note + report)
- [x] CollabRoom page with shared whiteboard + live chat + all three features
- [x] TopNav collab tab wired up
- [x] Vitest tests for collab procedures (6 tests passing)
- [x] Replace 8-week timeline with strict 4-week plan
- [x] Add 2-week fast-track plan with toggle between Standard / Fast-Track views
- [x] Voice-to-STAR transcription procedure (Whisper API + LLM structuring)
- [x] Answer Quality Scorer procedure (LLM scoring on Specificity, Impact, IC-level)
- [x] Weekly Progress Email Digest procedure (owner notification)

## Pending — Coding Practice Features

- [x] AI-Enabled Round guide (Coditioning article content integrated into Coding tab)
- [x] CTCI 500 Question Tracker (Dinesh Varyani spreadsheet — first 50 shown with search/filter)
- [x] Load all 500 CTCI problems with pagination
- [x] Add Meta Frequency tags to CTCI problems
- [x] Voice-to-STAR recorder UI in BehavioralTab

## Disclaimer Gate

- [x] Full-screen disclaimer gate component (React web app)
- [x] Full-screen disclaimer gate injected into standalone HTML file
- [x] Update disclaimer text to new legal-grade version (both web app + standalone HTML)

## New Features — Round 3

- [x] Pattern Dependency Graph (d3-force, Coding tab, mastered nodes glow green)
- [x] 60-day Heatmap Calendar (Overview tab, daily activity grid)
- [x] Anonymous Leaderboard (server-side DB, opt-in, hero section)

## New Features — Round 4

- [x] ML System Design guide section in System Design tab (from systemdesignhandbook.com)

## New Features — Round 5

- [x] Achievement Badges UI (hero section, unlock on milestones)
- [x] Time-Boxed Pattern Sprint Mode (5 random unmastered patterns, 2 min each)
- [x] Offline PWA support (service worker + manifest.json)

- [ ] Monaco in-browser code editor with test cases for 20 patterns
- [ ] Time-Boxed Pattern Sprint Mode (5 patterns, 2 min each)
- [ ] Pattern Dependency Graph (d3-force interactive graph)

## Pending — Behavioral & STAR Features

- [ ] Voice-to-STAR UI (microphone recording + STAR display in BehavioralTab)
- [ ] Answer Quality Scorer UI (text input + score display in BehavioralTab)
- [ ] Behavioral Question Randomizer (Surprise Me button + hidden focus area)

## Pending — Progress & Analytics Features

- [ ] Heatmap Calendar (GitHub-style 90-day activity grid)
- [ ] Readiness Trend Chart (Recharts line chart with localStorage history)
- [ ] Weekly Progress Email Digest UI (trigger button in OverviewTab)

## Pending — UX & Accessibility Features

- [ ] Focus Mode (F key — hides nav/hero/footer, shows only drill + large timer)
- [ ] Keyboard Navigation overlay (J/K move, Enter expand, R reveal, 1-5 rate, ? overlay)
- [ ] Offline PWA (service worker + manifest.json for offline use)

## Pending — Social & Gamification Features

- [x] Anonymous Leaderboard (opt-in, server-side, top streaks/patterns/mocks)
- [ ] Achievement Badges (First Blood, On Fire, Half-Way There, Mock Veteran, IC7 Ready)

## New Features — Round 6

- [x] Behavioral Question Randomizer ("Surprise Me" button, random unrated question, 3-min STAR timer)
- [x] Readiness Trend Chart (14-day line chart in Overview tab, localStorage)
- [x] Focus Mode (F-key toggle, hides nav/hero/footer, shows only active tab + large timer)

## New Features — Round 7

- [x] Interview Day Countdown Widget in top nav (days remaining, links to checklist in Overview tab)

## New Features — Round 8

- [x] Per-Pattern Time Tracker (log drill minutes per pattern, show time-invested bar on pattern cards)
- [x] Spaced Repetition Alerts (due-for-review badge on Coding and Behavioral tab buttons)
- [x] STAR Story PDF Exporter (Export Cheat Sheet button in STAR Story Bank)

## New Features — Round 9

- [x] CTCI Daily Challenge (Problem of the Day auto-highlight, unsolved High-freq)
- [x] Keyboard Navigation Overlay (? key help modal with all shortcuts)
- [x] Monaco In-Browser Code Editor on CTCI problem rows
- [x] Pattern Mastery Heatmap in Coding tab (enhanced: mastery ring, time-invested overlay, category breakdown, tooltips)

## New Features — Round 10

- [x] Weekly Progress Email Digest UI (Send Weekly Digest button in Overview tab)
- [x] CTCI Streak Tracker (consecutive daily challenge completions, flame counter in CTCI banner)
- [x] AI Hint System (Get Hint button in inline code editor, LLM-powered, no spoilers)

## New Features — Round 11

- [x] CTCI Problem Notes (persistent notes panel per problem, Markdown cheat sheet export)
- [x] Behavioral Answer Scorer UI (STAR answer text area + LLM rubric: Specificity, Impact, IC-level)
- [x] Readiness Goal Setter (target % + date, daily task card with patterns/stories needed per day)

## New Features — Round 12

- [x] Move CTCI section to top of Coding tab (no content/style changes)
- [x] Mock Interview Simulator (45-min session, 1 coding + 2 behavioral, LLM debrief)
- [x] Pattern Dependency Unlock Flow (grey out advanced patterns until prerequisites rated ≥3)

## New Features — Round 13

- [x] Per-pattern "Stuck?" 3-step hint ladder (gentle → medium → full walkthrough, LLM-powered)

## New Features — Round 14

- [x] Mock Interview History (localStorage persistence + Past Sessions accordion in simulator)
- [x] Prerequisite Unlock Celebration (confetti burst + toast when pattern unlocked)
- [x] Hint Usage Analytics (track hint counts per pattern, Most-hinted badge in Overview)

## New Features — Round 15

- [x] Integrate Meta System Design Interview Prep 2026 guide into System Design tab (highlighted, emoji-rich, fun + challenging)
- [x] CTCI Problem Difficulty Estimator (self-assessment vs official, divergence analytics)
- [x] AI Study Session Planner (30/60/90-min plans, LLM-powered, SR + hint + goal data)

## New Features — Round 16

- [x] CTCI Divergence Report (Perception vs Reality card in Overview tab, top 5 blind spots)
- [x] Behavioral Story Strength Tracker (persist rating history per story, sparkline trend lines)
- [x] System Design Flash Cards (flip-card drill mode in System Design tab, 15 cards, Got it/Review Again)

## New Features — Round 17

- [x] Add Technical Retrospective + XFN Partnership interview guides to Behavioral tab (highlighted, emoji-rich, do/don't sections, animated gradient border)

## New Features — Round 18

- [x] XFN Practice Questions — 6 XFN questions added to behavioral bank with "XFN Partnership" area tag (teal badge)
- [x] Technical Retrospective Project Planner — mini-form (project name, scope, trade-offs, biggest bug, outcome, lessons) + Excalidraw JSON export
- [x] Flash Card Spaced Repetition — "Review Again" schedules SM-2 SR review, "Got it" removes from queue, System Design tab badge shows due count in TopNav

## New Features — Round 19

- [x] Fix broken 8080 sandbox link in SystemDesignTab "Open full guide" button — replaced with permanent CDN URL
- [x] XFN Story Builder — 3 STAR templates, saves to localStorage, auto-populates Tech Retro Planner scope & outcome
- [x] Flash Card Custom Deck — add/edit/delete user Q&A cards, merged into drill mode & SR system
- [x] Tech Retro AI Coach — 🤖 AI Coach button on each saved project, calls LLM to generate 3 probing follow-up questions

## New Features — Round 20

- [x] XFN Question Randomizer — "Surprise Me (XFN)" button picks a random XFN question and starts a 3-min timer (Practice Mode style), teal timer ring
- [x] AI Coach Answer Evaluator — answer textarea + 📊 Score My Answer button per question, shows Specificity/Impact bars, IC level badge, coaching note, strengths, improvements

## New Features — Round 21

- [x] Move Technical Retrospective Project Planner (AI Studio Planner) to the top of the Behavioral tab
- [x] AI Coach Answer Evaluator — completed as part of Round 20

## New Features — Round 22

- [x] XFN Mock Session — 3 XFN questions × 12-min timers + AI scorecard at end (implemented in Round 24 as BehavioralMockSession)
- [x] AI Coach History — persist AI Coach questions + scored answers to localStorage per project (implemented in Round 20)
- [x] Planner PDF Export — PDF export via jsPDF added to ProgressExport in Round 26

## New Features — Round 23

- [x] System Design Mock Session — full 5-phase mock round (~38 min) in System Design tab, random question from all 12 SYSTEM_DESIGN_QUESTIONS, per-phase timers (violet ring → amber → red), answer capture, phase hints, AI scorecard (Overall/Requirements/Architecture/Scalability/Communication, IC level, strengths, improvements, follow-up questions)

## New Features — Round 24

- [x] Mock Session History — persist completed System Design mock sessions to localStorage, review past attempts with scores and answers, delete entries
- [x] Custom Question Picker — choose specific question or filter by IC level (IC6+/IC7+) before starting mock, 🎲 Random button
- [x] Behavioral Mock Session (XFN) — 3 XFN questions × 12-min timers, STAR phase tabs, teal timer ring, AI scorecard (Collaboration/Conflict/Alignment/Communication, IC level, strengths, improvements, follow-up questions), history with expand/delete

## New Features — Round 25

- [x] Combined Readiness Dashboard — Overview tab aggregates System Design + XFN mock scores into IC readiness gauge with per-dimension breakdown
- [x] Mock Session Comparison — side-by-side diff view in both System Design and XFN History panels, color-coded deltas per dimension
- [x] Coding Mock Session — 5-phase 45-min round (Problem Understanding → Approach → Pseudocode → Complexity → Edge Cases), pattern picker with difficulty filter + random, AI scorecard (Correctness/Complexity/Code Quality/Communication, IC level, optimal hint, follow-ups), history with compare mode

## New Features — Round 26 (previously planned)

- [x] Full Mock Day Simulator — chained Coding + System Design + XFN Behavioral with combined AI scorecard, in Overview tab
- [x] Coding Mock Live Code Editor — Monaco editor in pseudocode phase (language selector: Python/JS/Java/C++)
- [x] Readiness Export PDF — jsPDF one-page PDF from ProgressExport, alongside existing TXT export

## New Features — Round 27 (Coding Tab)

- [x] Pattern Cheat Sheet Overlay — slide-in panel per pattern with canonical template code + 1-click copy
- [x] CTCI Problem Tagging — custom tags per problem with tag filter in search bar
- [x] Complexity Quick-Reference Card — pinned Big-O card for all data structures at top of Coding tab
- [x] Pattern Video Links — curated YouTube link per pattern on the pattern card
- [x] Coding Mock Replay — read-only replay of all 5 phase answers with AI scorecard annotations (via History expand)

## New Features — Round 28 (Behavioral Tab)

- [x] STAR Story Word Count & Pacing Guide — live word count + color-coded target range + speaking time estimate in AnswerScorer
- [x] Behavioral Question Difficulty Tiers — Easy/Medium/Hard tier field on all questions, tier filter dropdown in question list
- [ ] Answer Recording Mode — deferred: requires mic permission flow
- [ ] XFN Stakeholder Map Builder — deferred: requires diagram library
- [ ] Behavioral Mock Difficulty Selector — deferred: small ROI

## New Features — Round 29 (System Design Tab)

- [x] Design Pattern Library — searchable card library of 12 system design patterns (CQRS, Saga, Circuit Breaker, etc.) in SystemDesignExtras
- [x] Capacity Estimation Calculator — interactive calculator: QPS + data size + retention → storage/bandwidth/memory in SystemDesignExtras
- [ ] System Design Diagram Templates — deferred: covered by Excalidraw export
- [x] Flash Card CSV Import — paste CSV (question,answer) to bulk-import custom flash cards in SystemDesignExtras

## New Features — Round 30 (Overview & UX)

- [x] Daily Study Checklist — personalized daily tasks based on SR due items, weakest patterns, interview date; resets at midnight
- [x] Interview Countdown Urgency Mode — Final Sprint banner with 7-day high-ROI checklist when < 7 days remain
- [ ] Progress Snapshot Share Card — deferred: html2canvas has deployment constraints
- [x] Dark/Light Theme Toggle — sun/moon toggle already in TopNav, preference persisted to localStorage
- [x] Global Search — ⌘K command palette searching across 200+ items (patterns, CTCI, behavioral questions, system design topics, flash cards)
- [x] Onboarding Checklist — 5-step guided checklist for new users (set date, rate patterns, add story, flash drill, run mock); dismissible

## New Features — Round 39

- [ ] IC level badge in Coding Mock running session header (next to phase timer)
- [ ] Onboarding step auto-complete: rate 3 patterns auto-checks step 2, mock completion auto-checks step 5
- [ ] Onboarding progress DB sync (tRPC mutation + query, merges with localStorage for logged-in users)

## New Features — Round 38

- [x] Coding Mock IC6/IC7 difficulty selector on entry card with level-specific AI rubric (mirrors XFN mock toggle; blue for IC6, violet for IC7)
- [x] Deep-link chips on each Onboarding Checklist step (navigates to correct tab+section via URL params + popstate)

## New Features — Round 37

### Navigation & Discoverability

- [x] ⌥5 keyboard shortcut for Collab tab Quick Action
- [x] ? icon button in every Quick Actions bar to open keyboard shortcut modal
- [x] Deep-link URL routing (?tab=coding&section=mock) with section scroll support
- [x] Interview countdown banner across all tabs (when ≤7 days away, amber banner)

### Coding Tab

- [x] Explain this pattern AI button (LLM, IC6/IC7 level-aware, expandable panel per card)
- [x] Code snippet library — Cheat Sheet already covers Python templates; sprint timer already exists as SprintMode
- [x] Weak pattern sprint timer — already exists as SprintMode in CodingTab

### Behavioral Tab

- [x] STAR story version history (up to 5 drafts per question, localStorage)
- [x] Behavioral question randomizer with hidden focus (Surprise Me button in Quick Actions)
- [x] XFN mock transcript export (Download .md button in done view)
- [x] STAR answer word-count indicator (green/amber/red per text area)

### System Design Tab

- [x] Diagram template SVG preview thumbnails in the template cards (inline SVG, dark theme)
- [x] Capacity calculator presets (News Feed, Messenger, Instagram one-click buttons)
- [x] Weak areas callout in SD scorecard (lowest 1-2 dimensions in red with progress bars)

### Progress & Gamification

- [x] Achievement badge share card (toast with 📤 Share button at 25/50/75/90/100% milestones)
- [x] Heatmap PNG export (Download PNG button in HeatmapCalendar header)

### Already Exist (skipped)

- [x] Tab badge counters — already in TopNav (SR due counts per tab)
- [x] Breadcrumb trail in mock sessions — breadcrumb.tsx exists; step indicators in XFN/Full Mock sessions
- [x] Spaced repetition scheduler — already in OverviewExtras and CodingTab
- [x] SD mock history log — already in SystemDesignMockSession (HISTORY_KEY, HistoryPanel)
- [x] SD question timer — already in SystemDesignMockSession (per-phase timer with pause/reset)
- [x] Readiness trend sparkline — already in OverviewTab (14-day sparkline chart)
- [x] Peer comparison for behavioral readiness — already in OverviewTab (recruiter card with peer benchmarks)
- [x] Weekly email digest — deferred (requires backend email sending; not in scope)

## New Features — Round 36

- [x] Update ? keyboard shortcut help modal with Alt+1–4 entries (new Quick Actions section with ⌥1–4 entries)
- [x] Share button in streak milestone toasts (custom JSX toast with 📤 Share button, copies tweet to clipboard)
- [x] Quick Actions sticky bar on Collab tab (Start Collab Session scrolls to form, View Leaderboard scrolls to hero-leaderboard)

## New Features — Round 35

- [x] Alt+1–4 keyboard shortcuts for Quick Actions primary buttons with ⌥N badge labels (wired in Home.tsx handleKeyDown)
- [x] Streak milestone toasts at 7, 14, 30, 60, 100 days (fires once per milestone per day, stored in localStorage)
- [x] Start SD Mock third button in System Design Quick Actions bar (scrolls to SystemDesignMockSession)

## New Features — Round 34

- [x] Quick Actions sticky row on SystemDesignTab (Open Diagram Template, Start Capacity Calc)
- [x] Streak tooltip on Overview Quick Actions bar (longest streak + last active date on hover)
- [x] New Plan secondary button alongside Resume Today's Plan (clears today's plan from localStorage and scrolls to planner)

## New Features — Round 33

- [x] Streak counter in Overview Quick Actions row (🔥 N days inline)
- [x] Resume Today's Plan button — replaces Plan Today's Session if a plan was already generated today; full plan stored in localStorage and auto-restored on page load
- [x] Quick Actions sticky row on CodingTab (Start Coding Mock, Jump to Weak Patterns + activates weak-only filter)
- [x] Quick Actions sticky row on BehavioralTab (Record STAR Answer, Start XFN Mock)

## New Features — Round 32

- [x] Move AI Study Session Planner and Full Mock Day Simulator to top of Overview tab (above LevelCards)
- [x] Quick Actions sticky row at top of Overview (Plan Today's Session / Start Full Mock Day scroll buttons)
- [x] Last Session summary chip on StudySessionPlanner and FullMockDaySimulator
- [x] Collapse IC6/IC7 comparison cards by default

## New Features — Round 31

- [x] Answer Recording Mode — Voice-to-STAR recorder already implemented in VoiceToStar.tsx (MediaRecorder, S3 upload, Whisper transcription, STAR structuring, AI scoring)
- [x] Behavioral Mock Difficulty Selector — IC6 vs IC7 toggle added to XFN Behavioral Mock Session entry card; icMode passed to xfnMockScorecard procedure with level-specific rubric
- [x] System Design Diagram Templates — 3 pre-built Excalidraw JSON templates (News Feed, Messenger, Instagram) in SystemDesignDiagramTemplates.tsx with Download + Open buttons

## New Features — Round 40

- [x] Sync patternRatings to DB (new user_ratings table, tRPC get/save, merge on mount)
- [x] Sync bqRatings to DB (same table, separate type field)
- [x] Onboarding all-done confetti burst + share-to-Twitter toast
- [x] Tab badge counters: Coding (weak patterns + SR due), Behavioral (weak BQs), System Design (SR due flash cards)

## New Features — Round 41

- [x] CTCI progress DB sync (solved state + self-difficulty estimates, new ctci_progress table)
- [x] Mock session history DB sync (Coding, System Design, XFN — new mock_sessions table)
- [x] Badge breakdown popover (Coding: weak patterns list; Behavioral: weak BQ stories list)

## New Features — Round 42

- [x] Full-screen disclaimer modal (blocks access, checkbox acknowledgment, localStorage persistence)
- [x] Bump disclaimer key to v2 so all existing users see it fresh on next visit

## New Features — Round 43

- [x] Add disclaimer_acknowledged_at column to users table (DB migration)
- [x] tRPC mutation: disclaimer.acknowledge — writes timestamp for logged-in users
- [x] tRPC query: disclaimer.status — returns acknowledged_at for the current user
- [x] Wire frontend: call mutation on "I Understand" click for logged-in users
- [x] Show "Acknowledged on [date]" status in Overview tab for logged-in users

## New Features — Round 44

- [x] Admin-only tRPC query: disclaimer.adminReport — returns all users with name, email, acknowledgedAt, role
- [x] Admin audit table UI — sortable table showing acknowledged/not-acknowledged users
- [x] Route /admin/disclaimer — protected, only visible to admin role users

## New Features — Round 45

- [x] Block app access until disclaimer acknowledged — for logged-in users verify DB record, not just localStorage

## New Features — Round 46

- [ ] Add pnpm build:standalone script (rebuild + CDN upload in one command, prints new link)

## New Features — Round 47 (PREP SCREEN parity)

- [ ] S/M/L Density Selector in toolbar (compact/comfortable/spacious layout)
- [ ] Gauntlet Mode — 7-tab timed unbroken run challenge
- [ ] Topic Roulette — spin for random pattern/BQ/SD challenge
- [ ] Study Soundtrack — ambient music toggle in toolbar
- [ ] Flashcard Flip Deck in Behavioral tab (type answer, word count, flip to see probes + IC6/IC7 sample answers)
- [ ] 8 Key Signals That Distinguish IC7 from IC6 in Behavioral tab
- [ ] Share Prep State URL (encode interview date + checklist progress into shareable URL)
- [ ] 10-Week Study Timeline option (alongside existing 4-week and 2-week plans)

## New Features — Batch 3 (AI Mock Interviewer, Leaderboard, SR Scheduler)

- [ ] AI Mock Interviewer — tRPC LLM procedure scoring STAR answers against IC7 signals rubric
- [ ] Peer Comparison Leaderboard — DB schema, opt-in, anonymised leaderboard UI
- [ ] Spaced Repetition Scheduler — daily "3 cards due today" prompt in Quick Actions row

## New Features — Day-Of Preparation

- [x] D-0 Interview Day Mode — 2-hour morning routine (warm-up, STAR reviews, design recap, breathing timer)
- [x] Last-Mile Cheat Sheet Generator — 1-page PDF (top 3 STAR stories, 5 weakest patterns, SD template)
- [x] Confidence Calibration Quiz — 10-question rapid-fire self-assessment with readiness score + focus recs

## New Features (Batch 4)

- [ ] Post-Interview Debrief Form (localStorage + PDF export)
- [ ] Mock Interviewer Persona Selector (tough vs supportive)
- [ ] Recruiter Email Draft Generator (LLM-powered)

## System Design Enhancements (Batch 5)

- [x] Guided Design Walkthrough Mode (LLM step-by-step coach)
- [x] Trade-off Decision Simulator (LLM scoring)
- [x] Meta-Specific Component Library (TAO, Memcache, Scuba, ZippyDB, Laser, Tupperware)
- [x] Scale Estimation Calculator (DAU/QPS/storage)
- [ ] System Design Question Bank with Difficulty Tiers
- [x] Architecture Anti-Pattern Detector (LLM)
- [x] Peer Design Review Simulator (LLM adversarial questions)
- [x] Design Doc Template Generator
- [x] Complexity Cheat Sheet (CAP theorem, latency numbers)
- [x] Explain Like a PM Mode (LLM)
- [x] Time-Boxed Practice Timer with phase checkpoints

## New Features (Batch 6)

- [ ] System Design Diagram Canvas (React Flow, Meta component nodes, PNG export)
- [ ] Mock Full Interview Day (4-round chained session, composite IC6/IC7 scorecard)
- [ ] Weak Area Auto-Drill (Drill this now button after AI scorecards)

## New Features (Batch 7 — Code Practice AI)

- [x] AI Solution Reviewer (IC6/IC7 rubric scoring, verdict, coaching note)
- [x] 3-Level Hint System (pattern recognition → approach → pseudocode skeleton)
- [x] Follow-Up Question Generator (2-3 interviewer follow-ups after solution)
- [x] Complexity Analyzer (actual vs optimal time/space with gap explanation)
- [x] Pattern Recognition Trainer (hide label, score candidate's pattern guess)
- [x] IC7 Optimization Challenge (auto-challenge after IC6-level solution)

## New Features (Batch 6)

- [ ] Session History — localStorage AI review score progression per problem
- [x] Weak Pattern Heatmap — topic score aggregation heatmap in Overview tab
- [ ] Voice Answer Mode — mic recording, Whisper transcription, AI STAR scoring in Behavioral tab

## New Features (Batch 7)

- [x] Score Trend Chart — sparkline in Session History panel showing score progression
- [x] Daily Drill Reminder — 3 weak patterns due today in Overview Quick Actions row
- [x] Voice Answer Replay — audio playback alongside transcript in VoiceAnswerMode

## New Features (Batch 8 — Failure Analysis Enhancements)

- [x] Failure Pattern Self-Assessment (8-question checklist, top-3 risks callout)
- [x] Interviewer Perspective Simulator (LLM design summary reviewer)
- [x] Failure Reason Drill Links (wire each failure to relevant tool)

## New Features (Batch 7)

- [x] Full Mock Interview Scorecard (4-round timed session, LLM composite IC6/IC7 promotion decision)
- [x] Personalized Weak-Spot Study Plan Generator (7-day plan from actual AI scores)

## Bug Fixes

- [x] System Design tab crash — root cause: useToast undefined in TopicRoulette (cached browser version from 05:04 AM); confirmed TopNav now uses toast from sonner correctly; removed duplicate Google Fonts @import from index.css

## New Features — Stability & DX Round

- [x] Wrap AI components in per-section ErrorBoundaries (SystemDesignMockSession, GuidedDesignWalkthrough, InterviewerPerspectiveSimulator, TradeoffDecisionSimulator, AntiPatternDetector, PeerDesignReview, ExplainLikeAPM)
- [x] Add Clear Site Cache button (footer + PWA service worker cache bust)
- [x] Vitest smoke tests for TopNav components (TopicRoulette, GauntletMode, StudySoundtrack render without throwing)
- [x] Run pnpm build:standalone after all features complete

## Performance & DX Round 2

- [x] Add Try Again retry button to SectionErrorBoundary
- [x] Split large app.js bundle with React.lazy + Suspense for heavy tabs
- [x] Add pnpm test:watch and husky + lint-staged pre-commit hooks
- [x] Run pnpm build:standalone

## Bug Fix — Standalone Build

- [x] Revert React.lazy tab imports to static imports (dynamic imports break standalone CDN build)
- [x] Run pnpm build:standalone

## Hero Banner Redesign

- [x] Generate 3 visual mockup options for new hero banner
- [x] User selects preferred option (Option C — navy/purple gradient, center-aligned)
- [x] Implement chosen banner design (Option A — CommunityBanner component)
- [x] Run pnpm build:standalone

## Banner & Content Round 3

- [ ] Add dismiss (×) button to CommunityBanner with localStorage persistence
- [ ] Add IC4/IC5 entry-level section to Coding tab
- [ ] Add IC4/IC5 entry-level section to Behavioral tab
- [ ] Add external link confirmation modal to CommunityBanner official links
- [ ] Run pnpm build:standalone

## Professional Protection Features

- [ ] #5: Rename all Meta-specific branding to FAANG/Staff Engineer framing
- [ ] #4: Add one-click share message copy button in hero section
- [ ] #1: Add Candidate-Initiated Discovery landing page
- [ ] Option A: Persistent "Not affiliated with Meta" banner on every tab
- [ ] Option D: "I am a job seeker" checkbox gate on first visit

## Protection Features Round 4 (from pasted_content_2.txt)

- [x] Update tagline to Option 2: "Everything the community learned the hard way — organized, refined, and ready for your 2026 interviews."
- [x] #2: Add "Community Contributors" author byline + published date to footer and hero
- [x] #5: Add Version E "not intended for distribution by employees" language to footer and How-to-Use section
- [x] #7: Add Terms of Use page accessible from footer
- [x] Deploy to GitHub Pages

## Protection Features Round 5

- [x] Rewrite DisclaimerGate wording to match relaxed footer tone (friendlier, less legal) — Option B4 selected
- [x] Deploy to GitHub Pages

## Deployment Status Badge

- [x] Add GITHUB_TOKEN secret for GitHub API access (public repo — no token needed)
- [x] Add tRPC procedure to fetch latest GitHub Actions run status
- [x] Build DeployStatus badge component (green/yellow/red) in footer
- [x] Deploy to GitHub Pages

## Static Build Fix (GitHub Pages)

- [x] Fix DisclaimerGate — use localStorage-only when no backend available
- [x] Fix DeployStatusBadge — call GitHub API directly from browser (no tRPC)
- [x] Deploy to GitHub Pages

## DisclaimerGate Cleanup

- [x] Remove GitHub repo link from community proof box in DisclaimerGate

## DisclaimerGate Copy Update (Option A + Option 1)

- [x] Update badge to Option A (Free community resource / built and shared by engineers)
- [x] Update checkbox to Option 1 (straightforward, no "found independently" language)

## Branding & Badge Cleanup

- [x] Remove GitHub deploy status badge from footer
- [x] Replace all "Staff Engineer Interview Prep Guide" with "Engineering Interview Prep"
- [x] Remove all "suly" / "suly-1" personal name references from codebase

## DisclaimerGate Improvements

- [x] Soften body text: replace "not affiliated with Meta, Google, Amazon, or any other company" with "not affiliated with any company"
- [x] Add warmer subtitle: replace "Takes 10 seconds — worth it" with "A note from the community"
- [x] Auto-skip gate for returning users already in DB (remove loading spinner delay)

## Level Label + Neutral Language Updates

- [x] Replace all IC4/IC5/IC6/IC7 with L4/L5/L6/L7 across entire codebase
- [x] Fix DisclaimerGate recruiter line: "Always pair it with whatever your recruiter sends you" → "Always pair it with any official guidance you receive"
- [x] Remove "Technical Screen Guide" and "Full Loop Interview Guide" buttons and their links
- [x] Fix TypeScript errors from IC→L rename (type union definitions still using IC5/IC6/IC7)
- [x] Make DisclaimerGate domain dynamic via window.location.hostname

## High-Impact Features (Audit Round — 10 Features)

- [ ] #1 AI Interviewer Interrupt Mode — System Design session with disruptive AI questions every 3-5 min, scores pivot/recovery quality
- [ ] #2 Back-of-Envelope Calculator with "Show Your Work" grading — AI grades math correctness, assumptions, and connection to architecture
- [ ] #3 "Tear Down My Design" Adversarial Review — AI finds 3 weakest points, attacks with follow-ups, scores defense quality
- [ ] #4 "Think Out Loud" Coaching Mode — voice memo during coding, AI scores narration quality (pattern named, complexity stated, bugs caught)
- [ ] #5 Pattern Recognition Speed Drill — 90-second drill: name the pattern, state complexity, name one edge case
- [ ] #6 Personalized Weak Pattern Remediation Plan — AI generates 5-problem sequence targeting the 2-3 weakest patterns
- [ ] #7 Story Coverage Matrix — visual matrix of STAR stories vs Meta behavioral focus areas, red cells = gaps
- [ ] #8 Interviewer Persona Stress Test with Scoring — live 3-exchange simulation with AI in character, scores composure/depth/quantification
- [ ] #9 Impact Quantification Coach — paste any STAR answer, AI highlights sentences missing metrics and suggests what to add
- [ ] #10 Personalized Interview Readiness Report — weekly AI-generated 1-page report synthesizing all data into top 3 action items

## New Features (Mar 23 2026)

- [ ] Fix all TypeScript errors in 10 new components (field name mismatches)
- [ ] Move all 10 high-impact features to the top of their respective tabs
- [ ] Add DB schema for score persistence (patterns, behavioral, system design scores per user)
- [ ] tRPC procedures: saveScores, loadScores for cross-device sync
- [ ] Build "Start Here" onboarding flow — 60-second guided tour → Readiness Report
- [ ] Build 7-Day Sprint Plan generator using Readiness Report data (printable/saveable)

## Phase Completion (Mar 23 2026 - Continued)

- [x] Move all 10 high-impact features to the top of their respective tabs
- [x] TypeScript: 0 errors, Tests: 26/26 passing
- [x] Deploy to GitHub Pages (www.metaguide.blog)
- [ ] Build "Start Here" Onboarding Flow (60-second guided tour routing to Readiness Report)
- [ ] Build 7-Day Sprint Plan Generator (day-by-day schedule from Readiness Report, printable)
- [ ] Score Persistence to DB (cross-device tracking with anonymized aggregate stats)

## New Features (Mar 23 2026 - User Requests)

- [ ] Fix CodingTab JSX structure issue (unclosed div from feature-to-top migration)
- [ ] General Feedback Mechanism (site-wide suggestion button → owner notification)
- [ ] 7-Day Sprint Feedback (sprint-specific suggestions sent to owner)
- [ ] Start Here Onboarding Flow (60-second guided tour → Readiness Report)
- [ ] 7-Day Sprint Plan Generator (day-by-day schedule, printable, shareable with mentor/peer)
- [ ] Sprint Plan Sharing (share link/copy for mentor or peer review)
- [ ] Progress & Performance Analytics Dashboard (charts from persistent scores)
- [ ] Score Persistence to DB (cross-device tracking, anonymized aggregate stats)

## Phase 3 Features (Mar 23 2026)

- [x] Fix CodingTab JSX structure (fragment → div wrapper)
- [x] General Feedback Mechanism (floating button + modal, DB + owner notification)
- [x] Start Here Onboarding Flow (60-second guided tour → Readiness Report)
- [x] 7-Day Sprint Plan Generator (AI-generated, printable, shareable)
- [x] Sprint Plan Feedback (sprint-specific suggestions)
- [x] Progress & Performance Analytics Dashboard
- [x] Score Persistence to DB (ScoreSyncBanner, cross-device sync)
- [x] All 10 features moved to top of their respective tabs

## Phase 4 Features (Mar 23 2026)

- [ ] Admin Feedback View (/admin/feedback, owner-only role-gated)
- [ ] Weekly email digest cron job (feedback summary to [owner email])
- [ ] Sprint Plan 100% celebration (confetti + modal)

## Phase 4 Features (Mar 23 2026)

- [ ] Promote owner to admin in DB
- [ ] Admin Feedback Dashboard (/admin/feedback, sortable table)
- [ ] Aggregate Anonymous Stats (feature usage vs pass-rate)
- [ ] Weekly email digest cron job ([owner email])
- [ ] Sprint Plan 100% celebration (confetti + modal)

## Phase 4 Completions (Mar 23, 2026)

- [x] Admin Feedback Dashboard (/admin/feedback) - role-gated, sortable table, CSV export
- [x] Aggregate Anonymous Stats (/admin/stats) - pattern/BQ heatmaps, feature engagement
- [x] Weekly email digest cron (every Monday 08:00 UTC, SMTP + Manus notification fallback)
- [x] Manual "Send Digest" button in admin dashboard
- [x] Sprint Plan 100% celebration - confetti + celebration modal
- [x] Task checkboxes in DayCard with per-day progress bars
- [x] Overall sprint progress bar
- [x] Admin nickname set to "Apex"
- [x] Owner name removed from DB and all code

## Phase 5 (Mar 23, 2026)

- [x] Fix standalone build crash - add sprintPlan/feedback/userScores mocks to trpc.standalone.ts
- [x] SMTP email delivery setup (Gmail, verified via nodemailer.verify())
- [x] Feedback triage status column (new/in_progress/done/dismissed) in DB + admin dashboard

## Phase 6 (Mar 23, 2026)

- [x] Add triage status counts to weekly digest email (New/In Progress/Done/Dismissed summary)
- [x] Instant email notification on new feedback submission (general + sprint plan)

## Phase 7 (Mar 23, 2026)

- [x] Analytics DB table (page_views, sessions, events, device info)
- [x] Client-side analytics tracker (page views, session duration, feature clicks, device)
- [x] Analytics tRPC router (ingest + admin report query)
- [x] Weekly analytics report email (visitors, sessions, hours, top features, device breakdown)
- [x] Top 3 unactioned feedback items section in weekly digest
- [x] /admin/analytics page for live in-app stats

## Phase 8 (Mar 23, 2026)

- [x] "Send Report Now" button on /admin/analytics (manual analytics email trigger)
- [x] DAU 7-day and 30-day line chart on /admin/analytics
- [x] Feature click heatmap badges ("N users today") on main site top-10 features

## Phase 9 (Mar 23, 2026)

- [x] APEX Picks section on homepage (curated feature recommendations for new visitors)
- [x] Admin quick-reply notes on feedback items (DB column + inline edit in /admin/feedback)
- [x] Daily unactioned feedback alert (cron: fires if 3+ new items, email to Apex)

## Phase 10 — APEX Picks A/B Rotation (Mar 24, 2026)

- [ ] apex_picks_sets DB table (id, week_label, picks JSON, is_active, created_at)
- [ ] tRPC: getActivePicks (public, weekly rotation), listPicksSets + upsertPicksSet + deletePicksSet (admin)
- [ ] Admin editor at /admin/apex-picks (CRUD for picks sets, activate toggle, week preview)
- [ ] Homepage ApexPicks component fetches from DB, falls back to hardcoded defaults
- [ ] Tests for getActivePicks rotation logic
- [x] pnpm build:standalone + deploy:github-pages

## Phase 10 — 25 High-Impact Features (Mar 24, 2026)

### TIER 1 — P0 (Week 1, highest offer impact)

- [ ] #3 Impact Quantification Coach — paste STAR answer, AI highlights sentences missing metrics, suggests specific numbers to add
- [ ] #7 Behavioral Story Coverage Matrix — visual matrix of stories vs Meta focus areas, red = gap, green = covered
- [ ] #6 45-Min Pressure Simulation — hard cutoff timer with time-management debrief (phase breakdown)

### TIER 1 — P1 (Week 2)

- [ ] #4 Seniority Level Calibrator — submit STAR story + target level, AI returns "Level Signal" badge + rewrite suggestion
- [ ] #5 Complexity Proof Trainer — AI challenges complexity claim, candidate must prove it, AI evaluates reasoning
- [ ] #9 Post-Interview Debrief Form — structured debrief form + AI analysis → prioritized fix list
- [ ] #10 10-Day Final Sprint Generator — AI reads all performance data, generates day-by-day personalized plan

### TIER 1 — P2 (Week 3)

- [ ] #1 Think Out Loud Trainer — voice recording during coding, AI scores narration quality (pattern named, complexity stated, bugs caught)
- [ ] #2 Adversarial Follow-Up Simulator — AI finds 3 weakest design points, fires follow-up questions, scores pivot quality
- [ ] #8 Interviewer Persona Stress Test — choose persona (skeptical/distracted/impatient), AI plays it throughout mock

### TIER 2 — P3 (Weeks 4-5)

- [ ] #14 Pattern Recognition Speed Drill — 90-sec drill: name pattern + complexity + edge case from problem statement only
- [ ] #20 Daily Warm-Up Routine — 15-min structured daily: 5min flashcards + 5min complexity proofs + 5min easy problem
- [ ] #21 Anti-Pattern Detector (enhanced) — 12 anti-patterns, free-text design input, flags each with fix + interviewer question
- [ ] #25 Offer Probability Dashboard — aggregates all signals into % offer probability with specific improvement actions
- [ ] #13 Back-of-Envelope Grader — grades reasoning chain not just final number (assumptions, units, sanity checks)
- [ ] #11 "Why This Company" Story Builder — 5-question interview → 90-sec genuine Why Meta narrative
- [ ] #15 XFN Stakeholder Map Builder — map real project onto stakeholder diagram, identify STAR story material
- [ ] #17 "Explain to a PM" Communication Trainer — AI plays PM, scores ability to bridge technical and business thinking
- [ ] #18 Weak Pattern Remediation Plan — 5-problem sequence for weakest pattern, ordered by difficulty
- [ ] #19 Story Freshness Tracker — flags over-rehearsed stories based on response time + word repetition
- [ ] #22 Offer Comparison Analyzer — 4-year total comp comparison across base/bonus/equity/signing/COL
- [ ] #23 "Day Before" Checklist and Mindset Protocol — structured day-before routine with breathing exercise
- [ ] #24 Interview Question Prediction Engine — predicts top 5 SD questions + top 3 behavioral areas by team + level
- [ ] #12 Negotiation Prep Module — AI recruiter persona, counter-offer practice, equity vs cash trade-offs
- [ ] #16 Recruiter Email Draft Generator — generates specific thank-you/follow-up email from mock session content

## Phase 10 — 25 High-Impact Features COMPLETED (Mar 24, 2026)

- [x] Offer Probability Dashboard — live signal aggregation from all prep data, weighted % score, top action items
- [x] Daily Warm-Up Routine — 15-min structured: flashcards (weakest patterns first) + complexity proofs + easy warm-up
- [x] 10-Day Final Sprint Generator — reads weak patterns/BQ/stories, generates personalized day-by-day plan
- [x] Seniority Level Calibrator — STAR story + target level → detected level badge + rewrite suggestion
- [x] Complexity Proof Trainer — AI evaluates reasoning chain, not just the answer; model proof provided
- [x] Post-Interview Debrief Form — structured debrief → likely outcome + prioritized fix list
- [x] "Why Meta" Story Builder — 5 inputs → authentic 90-sec narrative, avoids generic red flags
- [x] Interview Question Predictor — team-specific + level-specific question predictions (SD/behavioral/coding)
- [x] "Day Before" Checklist — 18 items across Logistics/Mental Prep/Content Review/Day-Of
- [x] All 9 components added to OverviewTab under "Offer Maximizer" section
- [x] TypeScript: 0 errors | Tests: 27/27 passing

## Phase 11 — Guided Learning Path & UX Polish (Mar 24, 2026)

- [x] Tab progress bars in TopNav (coding/behavioral mastery %, color-coded)
- [x] Section title typography upgrade (1rem, more breathing room)
- [x] Base font size bump (14px → 15px for reduced eye strain)
- [x] Tab labels renamed: Coding → "Drill Patterns", Behavioral → "Tell Stories"
- [x] Remove all guarantee language, replace with recommendation language
- [x] GuidedLearningPath component (4-phase wizard: Calibrate → Fix Gaps → Simulate → Final Sprint)
- [x] Wire GuidedLearningPath to top of OverviewTab above all other sections
- [x] pnpm build:standalone + deploy:github-pages

## Phase 12 — Favorites, Dark/Light Toggle, Progress Tracker (Mar 24, 2026)

- [ ] DB: favorite_questions table (userId, questionId, questionType, questionText, createdAt)
- [ ] tRPC: favorites.add, favorites.remove, favorites.list, favorites.toggle procedures
- [ ] FavoriteButton component (heart icon, optimistic toggle, works on coding + behavioral + design questions)
- [ ] FavoriteQuestions page at /favorites (grouped by type, quick-practice mode)
- [ ] Wire FavoriteButton into CodingTab, BehavioralTab, SystemDesignTab question cards
- [ ] Dark/Light mode toggle button in TopNav (sun/moon icon, uses existing ThemeProvider)
- [ ] Persist theme preference to localStorage
- [ ] InterviewProgressTracker page/component (performance charts over time)
- [ ] Track: pattern mastery trend, behavioral readiness trend, mock session scores, streak history
- [ ] Charts: line chart (readiness over time), bar chart (sessions per week), radar chart (category coverage)
- [ ] Wire InterviewProgressTracker into OverviewTab and add nav entry
- [ ] pnpm build:standalone + deploy:github-pages

## Phase 13 — Owner-Only Disclaimer Report Gate (Mar 24, 2026)

- [ ] Add ownerProcedure middleware (checks ctx.user.openId === OWNER_OPEN_ID)
- [ ] Gate disclaimer.auditReport tRPC procedure behind ownerProcedure
- [ ] Hide "View audit report →" link in DisclaimerStatusBadge for non-owners
- [ ] Add /admin/disclaimer route guard: redirect non-owners to 404
- [ ] pnpm build:standalone + deploy:github-pages

## Phase 14 — Security & Privacy Audit (Mar 24, 2026)

- [x] Full codebase security audit (server, client, DB, auth, API, secrets)
- [x] Fix all critical/high severity issues found (helmet, rate limiting, trust proxy, openId strip, body limit, owner gate)
- [x] Write security audit report for user
- [x] pnpm build:standalone + deploy:github-pages

## Phase 15 — Hybrid Access Gate (Mar 24, 2026)

- [ ] Add site_settings table to DB schema (lock_enabled, lock_start_date, lock_days, lock_message, manual_lock)
- [ ] Add tRPC procedures: checkAccess (public), getSiteSettings (ownerProcedure), updateSiteSettings (ownerProcedure)
- [ ] Build AccessGate component wrapping entire app (auto-lock after N days + manual lock, owner bypass)
- [ ] Build Admin Access Control panel at /admin/access (toggle lock, set start date, set message)
- [ ] Wire AccessGate into App.tsx
- [ ] TypeScript check, tests, build:standalone, deploy:github-pages

## Phase 16 — Security Fixes (Mar 24, 2026)

### HIGH severity

- [x] Fix #1: Move digest.send and collab.sendWeeklyDigest to protectedProcedure
- [x] Fix #2: Move uploadAudio to protectedProcedure + add server-side MIME/size validation
- [x] Fix #3: Add user ownership to leaderboard (require login to upsert/remove, FORBIDDEN on other user's entry)

### MEDIUM severity

- [x] Fix #4: Add typed schema to collab saveEvent (replace z.any() with typed union)
- [x] Fix #5: Move all 39 LLM endpoints to protectedProcedure (require login)
- [x] Fix #6: Add 30-day expiry check to getByShareToken query
- [x] Fix #7: Already using adminProcedure consistently in feedback.ts (verified)

### LOW severity

- [x] Fix #8: Change session cookie SameSite from "none" to "lax" (conditional on HTTPS)
- [x] Fix #9: No skip button exists in DisclaimerGate (verified — checkbox required, no bypass)

### Deploy

- [x] TypeScript check (0 errors), tests (30/30 passing), build:standalone, deploy:github-pages

## Phase 17 — User Blocking + security.txt (Mar 24, 2026)

- [x] Add `blocked` boolean column to users table in drizzle/schema.ts
- [x] Add blockUser / unblockUser procedures (ownerProcedure) in server/routers/adminUsers.ts
- [x] BlockedScreen component shown to blocked users on every page load (BlockedGate in App.tsx)
- [x] Build user management table at /admin/users with instant block/unblock toggle
- [x] Add /.well-known/security.txt (RFC 9116 compliant, contact: sulda00@gmail.com)
- [x] Add Users nav link in AdminFeedback header
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 18 — Block Hardening + Audit Log + Time-Lock Reset (Mar 24, 2026)

- [x] DB: add `block_reason` text column to users table
- [x] DB: add `user_events` table (id, actorId, targetId, eventType, metadata, createdAt)
- [x] Run pnpm db:push to migrate schema
- [x] Server-side block enforcement in protectedProcedure (throw FORBIDDEN if ctx.user.blocked === 1) — already present
- [x] Update blockUser mutation: accept optional reason, write to users.blockReason, write audit log row, send owner Manus notification
- [x] Update unblockUser mutation: write audit log row, send owner notification
- [x] Update /admin/users UI: reason input dialog on block, show blockReason in user row, audit log panel at bottom
- [x] Add "Reset Clock" button to /admin/access (sets lockStartDate to today, saves immediately)
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 19 — Cohort Reset, Login Activity, Export CSV, Block Expiry, Re-block (Mar 24, 2026)

- [x] DB: add `login_events` table (userId, createdAt) to record each login
- [x] DB: add `blockedUntil` timestamp column to users table
- [x] Run migration (direct SQL via mysql2)
- [x] Server: record login event on every successful OAuth callback
- [x] Server: cohortReset procedure — reset lockStartDate to today, clear all disclaimerAcknowledgedAt, send Manus notification
- [x] Server: blockUser mutation — accept optional blockedUntil date (expiryDays input)
- [x] Server: exportAuditLogCsv procedure — return CSV string of full user_events history
- [x] Server: reBlockUser procedure (re-apply block from audit log row)
- [x] Server: getUserLoginHistory procedure — last 5 login timestamps per user
- [x] UI: Cohort Reset card in /admin/access with amber confirmation dialog
- [x] UI: /admin/users — login activity (last 5 logins, expandable per user)
- [x] UI: /admin/users — Export Audit Log CSV download button
- [x] UI: /admin/users — Re-block shortcut in audit log rows (for unblock events)
- [x] UI: /admin/users — block dialog: optional "auto-unblock after N days" input
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 20 — Auto-unblock Middleware + Admin Nav + Feature Audit (Mar 24, 2026)

- [x] Add blockedUntil auto-unblock check to protectedProcedure in server/\_core/trpc.ts
- [x] TopNav: owner-only violet ShieldCheck icon → /admin/feedback (visible only when logged in as owner)
- [x] AdminFeedback header: full hub nav (Stats | Analytics | Access | Users)
- [x] Fix TopNav smoke tests: wrap with tRPC + QueryClient providers
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 21 — User Stats Summary Row + Disclaimer Toggle (Mar 24, 2026)

- [x] Server: getUserStats procedure — total users, weekly active (logged in last 7 days), currently blocked
- [x] UI: /admin/users — summary row at top (3 stat cards: Total Users / Active This Week / Blocked)
- [x] DB: add disclaimerEnabled int column to site_settings (default 1), migration applied
- [x] Server: getDisclaimerEnabled publicProcedure + setDisclaimerEnabled ownerProcedure
- [x] UI: /admin/access — Disclaimer Gate card with Switch (saves immediately, shows current state)
- [x] DisclaimerGate hook: respects disclaimerEnabled server flag (skips gate when disabled)
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 22 — Standalone Mock Hardening + Disclaimer Toggle UX (Mar 24, 2026)

- [x] trpc.standalone.ts: add adminUsers namespace (listUsers, blockUser, unblockUser, getUserStats, getUserLoginHistory, exportAuditLogCsv, reBlockUser, getAuditLog no-ops)
- [x] AdminAccess: add useUtils invalidation for siteAccess.getDisclaimerEnabled in setDisclaimerEnabled mutation onSuccess
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone (app.D7F2H-dN.js), deploy:github-pages, save checkpoint

## Phase 23 — Inactivity Alert, Disclaimer Link, useUtils Stub (Mar 24, 2026)

- [x] trpc.standalone.ts: add siteAccess.getDisclaimerEnabled to useUtils no-op object
- [x] trpc.standalone.ts: add auth.isOwner, favorites, progress namespaces + analytics.startSession/endSession stubs
- [x] Fix corrupted userScores.getAggregateStats and analytics.trackPageView sections in standalone mock
- [x] Server: checkInactiveUsers ownerProcedure — query users with last login > 14 days ago, send Manus notification
- [x] UI: /admin/access — add "View acknowledgment report →" link under Disclaimer Gate card
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone (app.D-C5OvW5.js), deploy:github-pages, save checkpoint

## Phase 24 — Definitive Standalone Mock Fix + Cron Job + Run Now Button (Mar 24, 2026)

- [x] Complete audit of ALL trpc.\* calls across entire client codebase (100+ procedures)
- [x] Fix standalone mock: rename getAuditLog → listEvents, add checkInactiveUsers stub
- [x] Server: inactivityAlert.ts cron job (daily 08:00 UTC) + registered in server/\_core/index.ts
- [x] UI: /admin/users — amber "Check Inactive" Run Now button in header
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] build:standalone, deploy:github-pages, save checkpoint

## Phase 25 — Fix feedback table query failure (Mar 24, 2026)

- [x] Diagnose feedback table SQL error: missing updatedAt column in DB (schema had it, migration was never applied)
- [x] ALTER TABLE feedback ADD COLUMN updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- [x] Create missing tables: apex_picks_sets, favorite_questions, progress_snapshots
- [x] Verified OWNER_OPEN_ID matches user ID 1 openId (6ZvUo3o3...) — admin shield icon works on live server
- [x] TypeScript: 0 errors | Tests: 30/30 passing
- [x] save checkpoint (no rebuild needed — DB-only fix)
