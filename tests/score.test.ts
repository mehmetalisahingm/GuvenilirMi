import { describe, expect, it } from "vitest";
import { calculateConfidence, calculateScore, verdictFor } from "../lib/scanner/score";
import type { AnalysisSignal } from "../lib/scanner/types";

function signal(overrides: Partial<AnalysisSignal>): AnalysisSignal {
  return {
    id: "test",
    category: "transport",
    label: "test",
    status: "pass",
    impact: 0,
    evidence: "test",
    explanation: "test",
    ...overrides,
  };
}

describe("deterministic scoring", () => {
  it("adds impacts to the fixed baseline and clamps 0-100", () => {
    expect(calculateScore([signal({ impact: 10 }), signal({ impact: -8 })])).toBe(60);
    expect(calculateScore([signal({ impact: 100 })])).toBe(100);
    expect(calculateScore([signal({ impact: -100 })])).toBe(0);
  });

  it("does not penalize informational unknowns", () => {
    expect(calculateScore([signal({ status: "info", impact: 0 })])).toBe(58);
  });

  it("returns insufficient when confidence is too low", () => {
    expect(verdictFor(95, 30).level).toBe("insufficient");
  });

  it("maps score bands without hidden randomness", () => {
    expect(verdictFor(82, 80).level).toBe("low");
    expect(verdictFor(70, 80).level).toBe("guarded");
    expect(verdictFor(50, 80).level).toBe("mixed");
    expect(verdictFor(30, 80).level).toBe("high");
  });

  it("confidence grows as independent categories are observed", () => {
    const narrow = calculateConfidence([signal({ category: "transport", status: "pass" })]);
    const broad = calculateConfidence([
      signal({ category: "transport", status: "pass" }),
      signal({ category: "domain", status: "pass" }),
      signal({ category: "dns", status: "pass" }),
      signal({ category: "headers", status: "pass" }),
      signal({ category: "content", status: "pass" }),
    ]);
    expect(broad).toBeGreaterThan(narrow);
  });
});
