import type { Request, Response } from "express";
import { AINotConfiguredError } from "../ai/provider";
import { buildWeeklyOverview, generateReflection } from "../ai/weekly";
import { isValidWeekStart } from "../utility/dayKey";

function requireWeekStart(req: Request, res: Response): string | null {
  const weekStart = req.params.weekStart;
  if (!isValidWeekStart(weekStart)) {
    res.status(400).json({ message: "weekStart must be a Monday, like 2026-09-28" });
    return null;
  }
  return weekStart;
}

// GET /api/insights/weekly/2026-09-28
export async function getWeeklyInsights(req: Request, res: Response): Promise<void> {
  const weekStart = requireWeekStart(req, res);
  if (!weekStart) return;
  res.status(200).json(await buildWeeklyOverview(weekStart));
}

// POST /api/insights/weekly/2026-09-28/generate
export async function generateWeeklyInsights(req: Request, res: Response): Promise<void> {
  const weekStart = requireWeekStart(req, res);
  if (!weekStart) return;

  try {
    const result = await generateReflection(weekStart);
    if (result === "busy") {
      res.status(409).json({ message: "Already writing this week's reflection" });
      return;
    }
    res.status(200).json({ generated: result === "generated", overview: await buildWeeklyOverview(weekStart) });
  } catch (error) {
    if (error instanceof AINotConfiguredError) {
      res.status(503).json({ message: "AI is not configured" });
      return;
    }
    console.error("Weekly reflection failed:", error instanceof Error ? error.message : "unknown error");
    res.status(502).json({ message: "Could not write the reflection" });
  }
}