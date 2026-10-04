import { isAxiosError } from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { fetchWeeklyInsights, generateWeeklyReflection } from "../../api/weeklyInsights.api";
import type { WeeklyOverview } from "../../api/weeklyInsights.api";
import { DateChips, Disclosure, formatShort } from "./Evidence";

type LoadState = "loading" | "ready" | "error";

function shiftWeek(weekStart: string, weeks: number): string {
  const [year, month, day] = weekStart.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[12px] font-medium tracking-wide text-secondary">{children}</p>;
}

const primaryButton =
  "h-9 rounded-lg bg-text px-4 text-[13px] font-medium text-bg transition-opacity duration-150 hover:opacity-85 disabled:opacity-50";
const quietButton =
  "h-8 rounded-lg border border-border px-3 text-[13px] text-text transition-colors duration-150 hover:bg-hover disabled:opacity-50";
const arrowButton =
  "flex h-7 w-7 items-center justify-center rounded-md text-secondary transition-colors duration-150 hover:bg-hover hover:text-text disabled:opacity-30 disabled:hover:bg-transparent";

export default function WeeklyReflection({ currentWeekStart }: { currentWeekStart: string }) {
  const [weekStart, setWeekStart] = useState<string>(currentWeekStart);
  const [state, setState] = useState<LoadState>("loading");
  const [overview, setOverview] = useState<WeeklyOverview | null>(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const tokenRef = useRef(0);

  const load = useCallback((week: string) => {
    const token = ++tokenRef.current;
    setState("loading");
    setMessage("");
    fetchWeeklyInsights(week)
      .then((data) => {
        if (token !== tokenRef.current) return;
        setOverview(data);
        setState("ready");
      })
      .catch(() => {
        if (token === tokenRef.current) setState("error");
      });
  }, []);

  useEffect(() => {
    load(weekStart);
  }, [load, weekStart]);

  async function generate() {
    if (generating) return;
    setGenerating(true);
    setMessage("");
    const token = ++tokenRef.current;
    try {
      const result = await generateWeeklyReflection(weekStart);
      if (token !== tokenRef.current) return;
      setOverview(result.overview);
      if (!result.generated) setMessage("There aren't enough entries this week to write a reflection.");
    } catch (error) {
      if (token !== tokenRef.current) return;
      if (isAxiosError(error) && error.response?.status === 503) setMessage("AI isn't set up on this server yet.");
      else if (isAxiosError(error) && error.response?.status === 429)
        setMessage("Too many requests in a row. Wait a minute and try again.");
      else setMessage("Couldn't write the reflection just now. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  const canGoForward = weekStart < currentWeekStart;
  const weekEnd = overview?.weekEnd ?? shiftWeek(weekStart, 1);

  return (
    <section className="rounded-[18px] border border-border bg-surface px-6 py-6 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label>WEEKLY REFLECTION</Label>
          <p className="mt-1 text-[17px]">
            {formatShort(weekStart)} &ndash; {formatShort(shiftWeek(weekStart, 0) === weekStart ? weekEnd : weekStart)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous week"
            disabled={generating}
            onClick={() => setWeekStart(shiftWeek(weekStart, -1))}
            className={arrowButton}
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Next week"
            disabled={!canGoForward || generating}
            onClick={() => setWeekStart(shiftWeek(weekStart, 1))}
            className={arrowButton}
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {state === "loading" && <div className="h-24" aria-busy="true" />}

      {state === "error" && (
        <div className="mt-5">
          <p className="text-[15px]">This week&apos;s reflection couldn&apos;t be loaded.</p>
          <button type="button" onClick={() => load(weekStart)} className={"mt-3 " + quietButton}>
            Try again
          </button>
        </div>
      )}

      {state === "ready" && overview && (
        <div className="mt-6 space-y-8">
          <div>
            <Label>YOUR WEEK</Label>
            <p className="mt-2 text-[17px]">
              {overview.entryCount === 0
                ? "No journal entries this week."
                : `You wrote ${overview.entryCount} journal ${overview.entryCount === 1 ? "entry" : "entries"}.`}
            </p>
            {overview.entryDates.length > 0 && (
              <div className="mt-2">
                <DateChips dates={overview.entryDates} />
              </div>
            )}
            {overview.plan && (
              <p className="mt-3 text-[14px] text-secondary">
                You ticked off {overview.plan.completed} of {overview.plan.total} planned{" "}
                {overview.plan.total === 1 ? "item" : "items"}.
              </p>
            )}
          </div>

          {overview.themes.length > 0 && (
            <div>
              <Label>MOST PRESENT THEMES</Label>
              <p className="mt-1 text-[13px] text-tertiary">These topics appeared in the most entries this week.</p>
              <ul className="mt-3 space-y-4">
                {overview.themes.map((theme) => (
                  <li key={theme.title}>
                    <p className="text-[16px]">
                      {theme.title}{" "}
                      <span className="text-[13px] text-tertiary">
                        &middot; {theme.entriesThisWeek} {theme.entriesThisWeek === 1 ? "entry" : "entries"}
                      </span>
                    </p>
                    <div className="mt-1.5">
                      <DateChips dates={theme.sourceDates} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overview.followedThrough.length > 0 && (
            <div>
              <Label>THINGS YOU FOLLOWED THROUGH ON</Label>
              <ul className="mt-3 space-y-3">
                {overview.followedThrough.map((item) => (
                  <li key={item.title}>
                    <p className="text-[16px]">&#10003; {item.title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-secondary">
                      {formatShort(item.resolvedAt)}: &ldquo;{item.quote}&rdquo;
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overview.openLoops.length > 0 && (
            <div>
              <Label>STILL OPEN</Label>
              <ul className="mt-3 space-y-4">
                {overview.openLoops.map((loop) => (
                  <li key={loop.title}>
                    <p className="text-[16px]">&#9675; {loop.title}</p>
                    <div className="mt-1.5">
                      <DateChips dates={loop.sourceDates} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overview.reflection && (
            <>
              {overview.reflection.patterns.length > 0 && (
                <div>
                  <Label>RECURRING PATTERNS</Label>
                  <p className="mt-1 text-[13px] text-tertiary">
                    Found by the model and kept only when at least two entries back them up.
                  </p>
                  <ul className="mt-3 space-y-4">
                    {overview.reflection.patterns.map((pattern, index) => (
                      <li key={index}>
                        <p className="text-[16px] leading-relaxed">{pattern.text}</p>
                        <div className="mt-1.5">
                          <DateChips dates={pattern.sourceDates} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <Label>REFLECTION</Label>
                <p className="mt-2 text-[17px] leading-relaxed">{overview.reflection.text}</p>
                <p className="mt-2 text-[12px] text-tertiary">
                  Written by the model from this week&apos;s entries. It is an interpretation, not a fact.
                </p>
                {overview.reflection.stale && (
                  <p className="mt-2 text-[13px] text-secondary">Your entries have changed since this was written.</p>
                )}
                <button type="button" onClick={() => void generate()} disabled={generating} className={"mt-3 " + quietButton}>
                  {generating ? "Reading this week's entries..." : "Write it again"}
                </button>
              </div>
            </>
          )}

          {!overview.reflection && overview.entryCount >= 2 && (
            <div>
              <Label>REFLECTION</Label>
              <p className="mt-2 text-[15px] text-secondary">
                Write a short reflection from this week&apos;s entries, with the entries it came from.
              </p>
              <button type="button" onClick={() => void generate()} disabled={generating} className={"mt-3 " + primaryButton}>
                {generating ? "Reading this week's entries..." : "Write this week's reflection"}
              </button>
            </div>
          )}

          {!overview.reflection && overview.entryCount < 2 && overview.entryCount > 0 && (
            <p className="text-[14px] text-secondary">
              Two or more entries are needed before a reflection can say anything about patterns.
            </p>
          )}

          {message && <p className="text-[13px] text-alert">{message}</p>}

          {overview.entryDates.length > 0 && overview.reflection && (
            <div className="border-t border-border pt-4">
              <Disclosure label="View all entries from this week" openLabel="Hide entries">
                <DateChips dates={overview.entryDates} />
              </Disclosure>
            </div>
          )}
        </div>
      )}
    </section>
  );
}