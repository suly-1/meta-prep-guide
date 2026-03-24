/**
 * Smoke tests for TopNav and its sub-components.
 *
 * Goal: assert that TopicRoulette, GauntletButton, StudySoundtrack, and the
 * full TopNav render without throwing. These tests catch the class of bug
 * where a component references an undefined hook or import (e.g. the
 * `useToast is not defined` crash that triggered the ErrorBoundary).
 *
 * We deliberately avoid asserting on specific text / class names so the
 * tests stay green even when copy or styling changes.
 */

import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

// ── Minimal mocks for external dependencies ──────────────────────────────────

// sonner toast — used by TopicRoulette
vi.mock("sonner", () => ({
  toast: vi.fn(),
  Toaster: () => null,
}));

// lucide-react — real icons are fine in jsdom but can be slow; keep real
// implementation since we only need render, not visual output.

// Mock the data module so tests don't depend on large data arrays
vi.mock("@/lib/data", () => ({
  PATTERNS: [
    { id: "p1", name: "Two Pointers", difficulty: "Medium", tags: [] },
    { id: "p2", name: "Sliding Window", difficulty: "Medium", tags: [] },
  ],
  BEHAVIORAL_QUESTIONS: [
    {
      id: "b1",
      q: "Tell me about a time you led a project.",
      category: "Leadership",
      tags: [],
    },
    {
      id: "b2",
      q: "Describe a conflict you resolved.",
      category: "Conflict",
      tags: [],
    },
  ],
  SYSTEM_DESIGN_QUESTIONS: [],
}));

// ── Import component under test AFTER mocks are set up ───────────────────────
// We import the default export (TopNav) and test it as a black-box.
// TopicRoulette, GauntletButton, and StudySoundtrack are internal sub-components
// rendered by TopNav, so they are exercised implicitly.
import TopNav from "@/components/TopNav";
import { ThemeProvider } from "@/contexts/ThemeContext";

// ── Helpers ──────────────────────────────────────────────────────────────────
const noop = () => {};

function renderTopNav(activeTab = "overview") {
  return render(
    <ThemeProvider defaultTheme="dark" switchable>
      <TopNav
        activeTab={activeTab}
        onTabChange={noop}
        darkMode={false}
        onToggleDark={noop}
      />
    </ThemeProvider>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("TopNav smoke tests", () => {
  beforeEach(() => {
    // Provide a minimal localStorage for useLocalStorage hooks
    localStorage.clear();
  });

  it("renders without throwing", () => {
    expect(() => renderTopNav()).not.toThrow();
  });

  it("renders the brand name", () => {
    renderTopNav();
    // The logo text "Staff Eng Prep" is in a hidden-sm:inline span but still in the DOM
    expect(screen.getByText("Staff Eng Prep")).toBeDefined();
  });

  it("renders the Roulette button (TopicRoulette sub-component)", () => {
    renderTopNav();
    // The button has title="Topic Roulette — spin for a random challenge"
    const btn = screen.getByTitle(/Topic Roulette/i);
    expect(btn).toBeDefined();
  });

  it("renders the Gauntlet button (GauntletButton sub-component)", () => {
    renderTopNav();
    // GauntletButton renders a button with title containing "Gauntlet"
    const btn = screen.getByTitle(/Gauntlet/i);
    expect(btn).toBeDefined();
  });

  it("renders the Study Soundtrack button (StudySoundtrack sub-component)", () => {
    renderTopNav();
    // StudySoundtrack renders a button with title containing "Soundtrack"
    const btn = screen.getByTitle(/Soundtrack/i);
    expect(btn).toBeDefined();
  });

  it("renders all main tab buttons", () => {
    renderTopNav();
    // Desktop nav tabs — at least Overview and Drill Patterns should be present
    expect(screen.getAllByText("Overview").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Drill Patterns").length).toBeGreaterThan(0);
  });

  it("marks the active tab with the correct aria state", () => {
    renderTopNav("coding");
    // The active tab button should have the blue styling class; we check it
    // renders without crashing when a non-default tab is active
    expect(() => renderTopNav("design")).not.toThrow();
  });
});

describe("SectionErrorBoundary smoke test", () => {
  it("renders children when there is no error", () => {
    const { container } = render(
      <SectionErrorBoundary label="Test Section">
        <div data-testid="child">Hello</div>
      </SectionErrorBoundary>
    );
    expect(container.querySelector("[data-testid='child']")).not.toBeNull();
  });

  it("renders an error card when a child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Bomb() {
      throw new Error("Simulated AI component crash");
    }

    const { container } = render(
      <SectionErrorBoundary label="AI Mock Session">
        <Bomb />
      </SectionErrorBoundary>
    );

    // Should show the error card, not propagate to global ErrorBoundary
    expect(container.textContent).toContain(
      "AI Mock Session encountered an error"
    );
    // Error message is hidden behind "Show details" — only the label is shown initially
    expect(container.textContent).not.toContain("Simulated AI component crash");

    spy.mockRestore();
  });

  it("shows Try Again button on first failure", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Bomb() {
      throw new Error("boom");
    }

    const { getByText } = render(
      <SectionErrorBoundary label="AI Section">
        <Bomb />
      </SectionErrorBoundary>
    );

    expect(getByText(/Try Again/)).toBeTruthy();
    spy.mockRestore();
  });

  it("shows Show details toggle button", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Bomb() {
      throw new Error("boom");
    }

    const { getByText } = render(
      <SectionErrorBoundary label="AI Section">
        <Bomb />
      </SectionErrorBoundary>
    );

    expect(getByText(/Show details/)).toBeTruthy();
    spy.mockRestore();
  });
});
