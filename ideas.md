# Meta Interview Prep Guide — Design Brainstorm

<response>
<text>
## Idea 1: Technical Terminal / Hacker Aesthetic
**Design Movement:** Neo-brutalist terminal UI meets modern SaaS dashboard
**Core Principles:**
- Monospace type for data, sans-serif for prose — sharp contrast between "machine" and "human" text
- High-contrast dark background (#0d1117 GitHub-dark) with electric blue (#0866ff) and green (#00d084) accents
- Dense information layout — no wasted space, every pixel earns its place
- Borders as structure — thin 1px lines define zones instead of shadows

**Color Philosophy:** Dark slate base evokes focus and seriousness. Electric blue (Meta brand) for interactive elements. Emerald green for success/mastery states. Amber for warnings/weak spots. Red for urgency (countdown < 7 days).

**Layout Paradigm:** Left sidebar for navigation (fixed), right main content area with tabbed sections. Data-dense cards with minimal padding. Monospace numbers for stats.

**Signature Elements:** Blinking cursor on active inputs. Code-block-style callouts. Terminal-style progress bars.

**Interaction Philosophy:** Instant feedback, no animations for data — only for state transitions. Keyboard-first.

**Animation:** Subtle fade-in for tab switches. Number counters animate on mount. No decorative motion.

**Typography:** JetBrains Mono for stats/code, Inter for body, bold weight for headings.
</text>
<probability>0.08</probability>
</response>

<response>
<text>
## Idea 2: Premium Study Dashboard — Structured Clarity
**Design Movement:** Swiss International Typographic Style meets modern productivity app (Notion/Linear aesthetic)
**Core Principles:**
- Strict typographic hierarchy: one display font (DM Serif Display) for section titles, one sans (DM Sans) for everything else
- Warm off-white background (#fafaf8) with deep navy (#0f172a) text — feels like a premium printed guide
- Generous whitespace with tight internal card spacing — breathing room at macro level, density at micro level
- Color used sparingly: Meta blue (#0866ff) as the single accent, semantic colors only for status

**Color Philosophy:** Warm paper-white base creates a "premium textbook" feel. Deep navy for authority. Blue accent used only for interactive and active states. Subtle warm gray for secondary content.

**Layout Paradigm:** Full-width sticky top nav with role tabs. Content in a centered 860px column. Cards use a 2-column grid that collapses to 1 on mobile. Floating elements (countdown, share) anchored to viewport corners.

**Signature Elements:** Thin navy left-border accent on section headers. Numbered step indicators. Pill badges for difficulty levels.

**Interaction Philosophy:** Deliberate, calm interactions. Hover states are gentle. Focus on reading and reviewing over gamification.

**Animation:** Smooth 200ms ease-out for tab switches. Accordion expand/collapse. Streak counter pulses once on mount.

**Typography:** DM Serif Display (700) for h1/h2, DM Sans (400/600) for body/labels, monospace for code snippets.
</text>
<probability>0.07</probability>
</response>

<response>
<text>
## Idea 3: Bold Engineering Dashboard — Data-Forward
**Design Movement:** Bauhaus functionalism meets modern data visualization (Vercel/Linear dark dashboard)
**Core Principles:**
- Pure function drives form: every element exists to communicate information, not decorate
- Deep charcoal (#111827) background with crisp white text — maximum readability for long study sessions
- Asymmetric layout: narrow left panel for navigation context, wide right panel for content
- Strong typographic scale: massive numbers for stats, tight labels beneath

**Color Philosophy:** Charcoal base for focus. Pure white for primary content. Blue (#3b82f6) for Meta brand and interactive states. Emerald (#10b981) for mastered/complete. Amber (#f59e0b) for weak/in-progress. Red (#ef4444) for urgent (streak broken, interview soon).

**Layout Paradigm:** Sticky top bar with role selector + dark toggle. Full-bleed hero with streak and countdown inline. Tabbed content below with 3-column card grids. Floating countdown badge bottom-right.

**Signature Elements:** Large stat numbers with small labels below (like a monitoring dashboard). Horizontal progress bars with percentage labels. Color-coded pattern grid (green/amber/red by mastery).

**Interaction Philosophy:** Every interaction gives immediate visual feedback. Ratings update in real-time. Filters animate in/out. Streak counter has a fire emoji pulse.

**Animation:** Framer Motion for tab transitions (slide + fade). Counter animations on first render. Card hover lifts with shadow. Weak-spot filter causes non-matching cards to fade out.

**Typography:** Space Grotesk (700/800) for headings and stats, Inter (400/500) for body, JetBrains Mono for code and ratings.
</text>
<probability>0.09</probability>
</response>

---

## Selected Design: Idea 3 — Bold Engineering Dashboard

**Rationale:** This is a tool used by engineers preparing for one of the most important interviews of their career. The design should feel like a professional monitoring dashboard — serious, data-forward, and confidence-inspiring. The dark theme reduces eye strain during long study sessions. The large stat numbers and color-coded mastery grid give instant visual feedback on progress.

**Chosen palette:**
- Background: `#111827` (gray-900)
- Surface: `#1f2937` (gray-800)
- Border: `#374151` (gray-700)
- Primary text: `#f9fafb` (gray-50)
- Secondary text: `#9ca3af` (gray-400)
- Accent blue: `#3b82f6` (blue-500, Meta brand)
- Success green: `#10b981` (emerald-500)
- Warning amber: `#f59e0b` (amber-500)
- Danger red: `#ef4444` (red-500)
- Streak orange: `#f97316` (orange-500)

**Fonts:** Space Grotesk (headings + stats) + Inter (body) — loaded from Google Fonts
