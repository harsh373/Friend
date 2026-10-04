import mongoose from "mongoose";
import { analyzeEntry } from "../ai/analyzeEntry";
import { connectDatabase } from "../config/db";
import { JournalEntry } from "../models/JournalEntry";
import type { Mood } from "../models/JournalEntry";
import { Memory } from "../models/Memory";
import { OpenLoop } from "../models/OpenLoop";

// A fictional student's journal, written to show the Insights features.
// Dates are relative to the day you run the script, so the story always ends "today".

interface SeedEntry {
  daysAgo: number;
  mood: Mood;
  line: string;
  summary: string;
  drained?: string;
  tomorrow?: string;
}

const SEED: SeedEntry[] = [
  {
    daysAgo: 34,
    mood: "neutral",
    line: "Slow start to the month, mostly planning.",
    summary:
      "Spent the morning making a list of everything I want to get done this month. I need to update my resume, finish my portfolio, call Rahul about the startup intro, and return the library books. Then I spent the afternoon scrolling and watching videos and barely touched the list. Stayed up until 2 again.",
    drained: "Scrolling on my phone for hours without noticing.",
    tomorrow: "Start with the resume before I open any app.",
  },
  {
    daysAgo: 33,
    mood: "tough",
    line: "Did nothing I planned.",
    summary:
      "Woke up late after sleeping around 3. Meant to work on the resume, ended up reorganising my desktop and watching videos. By evening I was annoyed at myself. I keep saying I will start and then I don't.",
    drained: "Late sleep and a groggy morning.",
    tomorrow: "Sleep before 1 and actually open the resume.",
  },
  {
    daysAgo: 31,
    mood: "neutral",
    line: "Lecture, then an idea on the way back.",
    summary:
      "Walking back from the lecture I passed three different fest posters on the notice board, and my WhatsApp groups are full of event forwards I never read. Thought: what if there was one place where every college event on campus is listed and students could actually find them? Maybe a college event marketplace. Wrote it in my notes and forgot about it for the rest of the day.",
  },
  {
    daysAgo: 30,
    mood: "good",
    line: "Helped Meera debug her project.",
    summary:
      "Good day. Meera's Flask project was failing and we fixed it together in two hours. I forgot how much I like this: someone has a problem, you work it out, it works. Also had an idea for a study group matching app where people find partners for the same subject. Not sure which idea is better, maybe I should just pick one.",
  },
  {
    daysAgo: 28,
    mood: "tough",
    line: "Another late night, wasted morning.",
    summary:
      "Stayed up until 3 scrolling again and slept through my first class. I still haven't called Rahul and it has been two weeks since he offered the intro. Feels like I'm drifting while everyone around me has a project or an internship lined up.",
    drained: "Scrolling at night instead of sleeping.",
    tomorrow: "Leave the phone outside the room.",
  },
  {
    daysAgo: 27,
    mood: "neutral",
    line: "Watched tutorials, built nothing.",
    summary:
      "Watched four hours of a React tutorial and did not build a single thing. I think I use tutorials to feel productive. Also thought about a fitness tracker idea, but that feels random. I jump between ideas too much: one week it is study groups, the next it is something else.",
  },
  {
    daysAgo: 25,
    mood: "tough",
    line: "Skipped the gym and the plan.",
    summary:
      "Low energy day and I couldn't start anything. Opened the resume file, stared at it, closed it. I really need to update my resume before the internship deadlines come up. Ate late, slept late.",
  },
  {
    daysAgo: 24,
    mood: "neutral",
    line: "Returned the library books at last.",
    summary:
      "Finally returned the library books before the fine got worse. One thing off the list. In the evening I kept thinking about the event marketplace idea. Sketched how a student could find events by interest instead of digging through WhatsApp forwards. The same idea keeps coming back to me.",
  },
  {
    daysAgo: 22,
    mood: "good",
    line: "A talk gave me energy.",
    summary:
      "Went to a talk by a senior who built a small product as a student and got an internship because of it. It made me realise a working demo matters more than a line on a resume. Maybe I should build the college event discovery thing properly. Came home and wrote down the first screens.",
    tomorrow: "Set up the project repo and the first page.",
  },
  {
    daysAgo: 21,
    mood: "neutral",
    line: "Set up the repo and not much else.",
    summary:
      "Created the repo and a basic Express server, then got stuck for an hour deciding on the database design and ended up on YouTube. I want to apply for a startup internship this month but I have nothing to show yet. My portfolio is still empty and I need to finish it.",
  },
  {
    daysAgo: 19,
    mood: "tough",
    line: "Slept until noon.",
    summary:
      "Slept until noon and the whole morning was gone. Felt unmotivated for most of the day and did nothing useful. Told myself tomorrow will be different.",
    drained: "Sleeping late and losing the whole morning.",
  },
  {
    daysAgo: 18,
    mood: "neutral",
    line: "Short coding session.",
    summary:
      "Wrote the events model and a list page. Only ninety minutes, but it was the first real progress. I still haven't called Rahul. I keep postponing it because I feel I have nothing to show him yet.",
  },
  {
    daysAgo: 17,
    mood: "good",
    line: "Morning walk, then a solid build session.",
    summary:
      "Started taking a short walk before opening the laptop and it helped more than I expected. Built the event listing and filter by category. Three hours of focused work with no scrolling. This is what a good day feels like.",
    tomorrow: "Do the walk again and build the event detail page.",
  },
  {
    daysAgo: 16,
    mood: "good",
    line: "Called Rahul.",
    summary:
      "I finally called Rahul. He was friendly and said the startup is looking for interns next month. He asked me to send a resume and something I have built. So now I really need to update my resume and finish my portfolio. At least the call is done.",
  },
  {
    daysAgo: 14,
    mood: "good",
    line: "Prototype nearly working.",
    summary:
      "The event discovery prototype now lets you browse events and save the ones you like. Showed Meera and she immediately asked where she could find the robotics club event. That reaction made me think this could be useful. The college event marketplace idea finally feels real.",
  },
  {
    daysAgo: 13,
    mood: "neutral",
    line: "Good build, bad sleep.",
    summary:
      "Spent the day on the search feature. Went to bed at 3 again because I kept coding after midnight. Productive, but I woke up tired. I have to fix my sleep schedule, it keeps wrecking my mornings.",
    drained: "Late sleep again.",
    tomorrow: "Stop coding at midnight.",
  },
  {
    daysAgo: 12,
    mood: "good",
    line: "Showed the prototype to a few friends.",
    summary:
      "Showed the prototype to Dev, Meera and two others in the hostel. They found two bugs and asked for a way to add their own club events. Writing down their feedback made me happy. My list now: event submission form, better mobile layout, reminders.",
  },
  {
    daysAgo: 10,
    mood: "special",
    line: "Applied for my first internship.",
    summary:
      "Applied to a startup internship using my old resume and the prototype link. I know I should have updated the resume first, but I didn't want to delay any longer. Feels good to have done something. I still need to properly update my resume and finish my portfolio page.",
  },
  {
    daysAgo: 9,
    mood: "good",
    line: "Event submission form works.",
    summary:
      "Built the form so clubs can add their own events. Dev tested it and broke it in a minute, which was useful. Four hours of focused work and dinner at a normal time for once.",
    tomorrow: "Fix the date validation bug and the mobile layout.",
  },
  {
    daysAgo: 8,
    mood: "neutral",
    line: "Slow day, fixed the mobile layout.",
    summary:
      "Fixed the mobile layout, which took longer than expected. Scrolled for a while in the evening again, but caught myself earlier than before. I keep saying I will finish my portfolio and then I build the product instead. I think the product matters more right now anyway.",
  },
  {
    daysAgo: 7,
    mood: "tough",
    line: "Felt behind after seeing other people's offers.",
    summary:
      "A few friends posted internship offers and I felt behind for a couple of hours. Then I opened the project and worked on it and felt better. No reply yet from the startup I applied to. I should follow up with them if I don't hear back this week.",
  },
  {
    daysAgo: 6,
    mood: "good",
    line: "Walk, build, and a real plan.",
    summary:
      "Morning walk again. Decided to stop jumping between ideas: the study group app and the fitness tracker are gone, and I am only building the college event platform now. Wrote a one page plan: launch to one campus group, get 30 people to use it, and learn from it.",
    tomorrow: "Post the link in the robotics club group.",
  },
  {
    daysAgo: 5,
    mood: "special",
    line: "First real users.",
    summary:
      "Posted the link in two club groups and 40 people signed up in a day. Someone from the cultural club asked if they could list their fest. I have never had strangers use something I built. Stayed up late replying, but it felt worth it.",
  },
  {
    daysAgo: 4,
    mood: "good",
    line: "Fixed the signup bug and added reminders.",
    summary:
      "Spent the day on bugs from the new users. Fixed the signup problem and added email reminders for saved events. Two people asked for a feed based on their interests instead of a plain list, which feels like a good sign. I slept late again though, close to 2.",
    drained: "Answering messages until late at night.",
    tomorrow: "Sleep earlier and take a walk before starting.",
  },
  {
    daysAgo: 3,
    mood: "neutral",
    line: "Quiet day, mostly planning.",
    summary:
      "Planned the week. I want to apply to three more internships and finally update my resume with the project on it. I also still need to finish my portfolio page, which I keep not doing. The project is what I want to focus on now, not new ideas.",
  },
  {
    daysAgo: 2,
    mood: "good",
    line: "Slept before one and it showed.",
    summary:
      "Slept at midnight for the first time in weeks and felt clear in the morning. Walked, then built the organiser dashboard for clubs. The startup replied asking for a quick call next week. I need to prepare a short demo for it.",
  },
  {
    daysAgo: 1,
    mood: "good",
    line: "Practised the demo for the call.",
    summary:
      "Practised a two minute demo of the event platform. I still haven't updated my resume, which is embarrassing given the call, and I will do it tonight. Thinking about what next month looks like: keep building, get the cultural club fest listed, and apply to more internships.",
  },
  {
    daysAgo: 0,
    mood: "good",
    line: "Walked first, then reworked the demo.",
    summary:
      "Walked before opening the laptop. Reworked the demo flow so it fits in two minutes. The portfolio page is still blank, I will get to it after the call.",
  },
];

const PAUSE_MS = 1500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Matches the app's 4 AM day rollover, then counts back whole days.
function dayKey(daysAgo: number): string {
  const day = new Date(Date.now() - 4 * 60 * 60 * 1000);
  day.setDate(day.getDate() - daysAgo);
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${date}`;
}

async function main() {
  const analyzeOnly = process.argv.includes("--analyze-only");

  await connectDatabase();
  const dbName = mongoose.connection.name;

  // The guard that protects your real journal.
  if (!/demo/i.test(dbName)) {
    console.error(`Refusing to run: the database "${dbName}" does not look like a demo database.`);
    console.error('Put "demo" in the database name at the end of MONGODB_URI (for example journal_demo) and try again.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`Using database: ${dbName}`);

  if (!analyzeOnly) {
    await Promise.all([JournalEntry.deleteMany({}), Memory.deleteMany({}), OpenLoop.deleteMany({})]);
    for (const seed of SEED) {
      await new JournalEntry({
        date: dayKey(seed.daysAgo),
        mood: seed.mood,
        whatIDidToday: seed.line,
        dailySummary: seed.summary,
        whatDrainedMe: seed.drained ?? "",
        tomorrowDifferent: seed.tomorrow ?? "",
      }).save();
    }
    console.log(`Inserted ${SEED.length} entries`);
  }

  // Oldest first, so an open loop exists before a later entry can finish it.
  const ordered = [...SEED].sort((a, b) => b.daysAgo - a.daysAgo);
  let failed = 0;
  for (const seed of ordered) {
    const date = dayKey(seed.daysAgo);
    try {
      const result = await analyzeEntry(date);
      console.log(`${date}: ${result.status}${result.embedded ? "" : " (no embedding)"}`);
      if (result.status === "analyzed") await sleep(PAUSE_MS);
    } catch (error) {
      failed += 1;
      console.error(`${date}: failed - ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  const [memories, openLoops, resolved] = await Promise.all([
    Memory.countDocuments(),
    OpenLoop.countDocuments({ status: "open" }),
    OpenLoop.countDocuments({ status: "resolved" }),
  ]);
  console.log(`Done. ${memories} memories, ${openLoops} open loops, ${resolved} resolved loops.`);
  if (failed > 0) console.log(`${failed} days failed. Run again with --analyze-only to retry just the analysis.`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});