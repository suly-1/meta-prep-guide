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
- [ ] XFN Mock Session — 3 XFN questions × 12-min timers + AI scorecard at end (mirrors Full Mock Session flow)
- [ ] AI Coach History — persist AI Coach questions + scored answers to localStorage per project, reviewable without re-running LLM
- [ ] Planner PDF Export — one-page interview brief PDF download with all project fields

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
