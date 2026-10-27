// Lesson manager: module content, quiz scoring, and progress saved to localStorage.
// Passing a quiz grants one-time bonus capital through the rewards ledger.

import { notifyLocalWrite } from "./local-store";
import { grantReward, hasReward } from "./rewards";
import type { Scenario } from "./scenarios";

export type Slide = {
  emoji: string;
  title: string;
  body: string;
  callout?: string; // highlighted key takeaway
  stat?: { value: string; label: string };
  scenario?: Scenario; // interactive Buy / Hold / Sell news scenario
};
export type QuizQuestion = { q: string; options: string[]; answer: number; explain: string };
export type Lesson = {
  slug: string;
  title: string;
  emoji: string;
  blurb: string;
  minutes: number;
  reward: number; // bonus simulator cash for passing the quiz
  slides: Slide[];
  quiz: QuizQuestion[];
};

export const PASS_SCORE = 2; // correct answers out of 3 needed to pass

export const lessons: Lesson[] = [
  {
    slug: "what-is-a-stock",
    title: "What is a Stock?",
    emoji: "🧩",
    blurb: "Owning a tiny slice of a real company.",
    minutes: 5,
    reward: 500,
    slides: [
      {
        emoji: "🍕",
        title: "A slice of the pie",
        body: "A stock (also called a share) is a tiny piece of ownership in a company. Buy one share of a coffee chain and you own a sliver of every café, bean and espresso machine it has.",
        callout: "Shareholder = part-owner of the business.",
      },
      {
        emoji: "🏗️",
        title: "Why companies sell shares",
        body: "Companies sell shares to raise money to grow — opening stores, building products, hiring people — without taking out a loan. In return, shareholders get a stake in the company's future success.",
        callout: "An IPO (initial public offering) is the first time a company sells shares to the public.",
      },
      {
        emoji: "🏛️",
        title: "Where stocks trade",
        body: "After an IPO, shares are bought and sold between investors on stock exchanges like the NYSE and Nasdaq. You don't call the company — you place an order through a broker app. Each stock has a short ticker symbol, like AAPL for Apple.",
      },
      {
        emoji: "📈",
        title: "Two ways to make money",
        body: "1) The share price rises and you sell for more than you paid — that profit is a capital gain. 2) Some companies share their profits with owners as regular cash payments called dividends.",
        callout: "Prices can also fall — you can sell for less than you paid.",
      },
      {
        emoji: "⚖️",
        title: "What sets the price?",
        body: "A stock's price is simply what buyers and sellers agree on right now. When more people want to buy than sell, the price rises; when more want to sell, it falls. Expectations about future profits drive those decisions.",
        callout: "A stock price is the market's best guess about a company's future, updated every second.",
      },
      {
        emoji: "🚨",
        title: "Scenario: breaking news",
        body: "You own 10 shares of a coffee chain. Watch the market, then decide what to do when the headline hits.",
        scenario: {
          id: "bean-earnings",
          sym: "BEAN",
          company: "Daily Grind Coffee (fictional)",
          headline: "Daily Grind Coffee posts record profits, plans 200 new cafés",
          source: "MarketWire",
          startPrice: 48,
          owned: 10,
          gap: 0.08,
          drift: 0.11,
          best: "hold",
          feedback: {
            buy: "You bought after the news — but the price had already jumped before you could click. Markets price in news within seconds, so chasing headlines usually means paying the new, higher price.",
            hold: "As a part-owner, your shares rose with the company's brighter future. Good news for the business is good news for its owners.",
            sell: "You locked in a quick gain, but missed the further rise as more investors piled in. Selling isn't wrong — just make sure it's part of your plan, not a reaction to a headline.",
          },
        },
      },
    ],
    quiz: [
      {
        q: "What does owning a share of a company mean?",
        options: ["You lent the company money", "You own a small piece of the company", "You're an employee of the company", "The company owes you a fixed payment"],
        answer: 1,
        explain: "A share is a slice of ownership. Lending money to a company is a bond, not a stock.",
      },
      {
        q: "What is a ticker symbol?",
        options: ["The fee your broker charges", "Today's share price", "A short code that identifies a stock, like AAPL", "The number of shares a company has"],
        answer: 2,
        explain: "Tickers are short codes exchanges use to identify stocks — AAPL is Apple, KO is Coca-Cola.",
      },
      {
        q: "Which are the two ways a stock can make you money?",
        options: ["A monthly salary and bonuses", "Fixed interest and a guaranteed refund", "Free products and discounts", "The price rising, and dividends"],
        answer: 3,
        explain: "Capital gains (selling for more than you paid) and dividends (shared profits). Neither is guaranteed.",
      },
    ],
  },
  {
    slug: "risk-and-reward",
    title: "Understanding Risk & Reward",
    emoji: "🎢",
    blurb: "Why prices wiggle — and how to handle it.",
    minutes: 6,
    reward: 750,
    slides: [
      {
        emoji: "🎢",
        title: "Prices wiggle",
        body: "Stock prices move up and down every day. Volatility is how much — and how quickly — a price swings. In the Paper Simulator, watch how much more Tesla (TSLA) jumps around than Coca-Cola (KO).",
        callout: "Volatility = the size of the swings, not the direction.",
      },
      {
        emoji: "⚖️",
        title: "The trade-off",
        body: "Higher potential rewards almost always come with higher risk. A savings account barely grows but rarely loses money. Stocks can grow much more over time, but can also drop sharply along the way.",
        callout: "If something promises high returns with no risk, treat it as a red flag.",
      },
      {
        emoji: "🧺",
        title: "Don't put all your eggs in one basket",
        body: "Diversification means spreading your money across many investments, so one bad company can't sink you. An index fund like one tracking the S&P 500 (SPY in the simulator) holds about 500 large US companies in a single purchase.",
      },
      {
        emoji: "⏳",
        title: "Time smooths the ride",
        body: "Over a single year the market can fall hard — the S&P 500 dropped about 37% in 2008. But over long periods it has historically averaged roughly 10% a year before inflation. Staying invested through the dips has mattered more than timing them.",
        stat: { value: "~10%", label: "S&P 500 long-run average yearly return (not guaranteed)" },
      },
      {
        emoji: "🚨",
        title: "Scenario: the market drops",
        body: "You own 10 shares of an S&P 500 index fund. Fear is spreading — what do you do?",
        scenario: {
          id: "index-dip",
          sym: "SPY",
          company: "S&P 500 index fund",
          headline: "Stocks tumble as recession fears grip Wall Street",
          source: "Financial Daily",
          startPrice: 500,
          owned: 10,
          gap: -0.045,
          drift: -0.015,
          best: "hold",
          feedback: {
            buy: "You bought the dip at a lower price, and the market recovered part of its fall. Adding to a diversified fund when it's \"on sale\" can work for long-term investors — as long as it's money you won't need soon.",
            hold: "You stayed calm, and the fund won back part of its drop. Historically, sitting tight through dips has done better than panic-selling.",
            sell: "You sold near the bottom and locked in the loss — then the price recovered without you. Panic-selling during a drop is one of the most common beginner mistakes.",
          },
        },
      },
      {
        emoji: "🧘",
        title: "Know your risk tolerance",
        body: "Only invest money you won't need for a few years, and keep an emergency fund in savings first. Ask yourself: if this dropped 30% next month, could I hold on without panicking?",
        callout: "Past performance never guarantees future results.",
      },
    ],
    quiz: [
      {
        q: "What does volatility describe?",
        options: ["How much and how quickly a price moves", "How profitable a company is", "How many shares exist", "Whether a stock pays dividends"],
        answer: 0,
        explain: "Volatility measures the size of price swings. A volatile stock can move a lot in either direction.",
      },
      {
        q: "Why might a beginner choose an index fund over a single stock?",
        options: ["It can never lose money", "It's guaranteed to beat every single stock", "It spreads risk across many companies", "It doesn't trade on an exchange"],
        answer: 2,
        explain: "An index fund diversifies across many companies, so one company's bad news hurts much less. It can still fall.",
      },
      {
        q: "An app promises 50% returns a year with zero risk. What's the best reaction?",
        options: ["Invest everything right away", "Treat it as a red flag — high returns come with high risk", "It's normal for index funds", "Borrow money to invest more"],
        answer: 1,
        explain: "Risk and reward travel together. \"Guaranteed\" high returns are a classic sign of a scam.",
      },
    ],
  },
  {
    slug: "market-orders",
    title: "How Market Orders Work",
    emoji: "🛒",
    blurb: "What actually happens when you press Buy.",
    minutes: 6,
    reward: 1000,
    slides: [
      {
        emoji: "📝",
        title: "Placing an order",
        body: "An order is an instruction to your broker: which stock (the ticker), buy or sell, how many shares, and what type of order. The order type decides when and at what price your trade happens.",
      },
      {
        emoji: "⚡",
        title: "Market orders",
        body: "A market order says \"buy (or sell) right now at the best price available.\" For popular stocks it fills almost instantly. The catch: you don't control the exact price — you get whatever the market offers at that moment.",
        callout: "Market order = speed over price control.",
      },
      {
        emoji: "🏷️",
        title: "Bid, ask & the spread",
        body: "The bid is the highest price buyers are currently offering; the ask is the lowest price sellers will accept. A market buy usually fills at the ask, and a market sell at the bid. The small gap between them is the spread.",
        callout: "Heavily traded stocks usually have spreads of just a cent or two.",
      },
      {
        emoji: "🚨",
        title: "Scenario: a fast market",
        body: "You own 15 shares of an electric-car maker. Bad news hits and the price moves fast — watch what happens to a market order.",
        scenario: {
          id: "zapp-gap",
          sym: "ZAPP",
          company: "Zapp Electric (fictional)",
          headline: "Zapp Electric misses earnings; shares gap lower at the open",
          source: "MarketWire",
          startPrice: 80,
          owned: 15,
          gap: -0.12,
          drift: -0.1,
          slippage: 0.012,
          feedback: {
            buy: "Your market buy filled above the last price you saw — that's slippage, common when prices move fast. A limit order would have capped what you paid.",
            hold: "You held through the drop. The price steadied a little, but bad earnings can weigh on a stock for a while — holding is a bet that the business recovers.",
            sell: "Your market sell filled instantly, but below the last price on screen because buyers had pulled back. In fast markets, market orders trade price certainty for speed.",
          },
        },
      },
      {
        emoji: "🎯",
        title: "Limit orders",
        body: "A limit order sets your price: the most you'll pay when buying, or the least you'll accept when selling. It only fills at that price or better — so you control the price, but the order might never fill if the market doesn't get there.",
      },
      {
        emoji: "🧪",
        title: "Try it yourself",
        body: "Head to the Paper Simulator. Buy one share with a market order and see it fill instantly. Then place a limit buy a little below the current price and watch whether the market comes to you.",
        callout: "Passing this quiz adds $1,000 of bonus cash to practice with.",
      },
    ],
    quiz: [
      {
        q: "What does a market order do?",
        options: ["Waits until the price hits a number you choose", "Buys or sells right away at the best available price", "Only executes when the market closes", "Guarantees you the lowest price of the day"],
        answer: 1,
        explain: "Market orders prioritise speed: they fill immediately at whatever the best current price is.",
      },
      {
        q: "You place a market buy order. Which price do you typically pay?",
        options: ["The bid price", "Yesterday's closing price", "The ask price", "The average price of the day"],
        answer: 2,
        explain: "Buyers pay what sellers are asking. Sellers using market orders receive the bid.",
      },
      {
        q: "You only want to buy a stock if its price drops to $50. Which order fits?",
        options: ["A limit buy order at $50", "A market buy order", "A market sell order", "A limit sell order at $50"],
        answer: 0,
        explain: "A limit buy at $50 will only fill at $50 or lower — exactly what you want.",
      },
    ],
  },
];

/** Planned modules shown on the dashboard but not yet playable. */
export const upcoming = [
  { title: "Compound Interest Magic", emoji: "✨", blurb: "How money grows on its own growth." },
  { title: "Index Funds vs. Single Stocks", emoji: "🧺", blurb: "One basket or one egg?" },
  { title: "Dividends Explained", emoji: "💸", blurb: "Getting paid just for holding." },
];

export const getLesson = (slug: string) => lessons.find((l) => l.slug === slug);
export const rewardId = (slug: string) => `lesson:${slug}`;

// ---------- progress ----------

export type LessonProgress = {
  slide: number; // last slide viewed, for resuming
  completed: boolean;
  bestScore: number;
  attempts: number;
  lastScore?: number | undefined;
  lastAttemptAt?: number | undefined;
  completedAt?: number | undefined;
};

export const LESSONS_KEY = "stockify:lessons";
const LEGACY_KEY = "stockify-completed"; // pre-quiz completions: string[] of slugs

const blank = (): LessonProgress => ({ slide: 0, completed: false, bestScore: 0, attempts: 0 });

function readAll(): Record<string, LessonProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LESSONS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, LessonProgress>) : {};
    }
    // Carry over completions saved by the earlier version of the app.
    const legacy: unknown = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
    if (!Array.isArray(legacy)) return {};
    return Object.fromEntries(legacy.filter((s) => getLesson(s)).map((s) => [s, { ...blank(), completed: true }]));
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, LessonProgress>) {
  try {
    localStorage.setItem(LESSONS_KEY, JSON.stringify(all));
  } catch {
    // Storage blocked — progress just won't persist.
  }
  notifyLocalWrite(LESSONS_KEY);
}

export function getProgress(slug: string): LessonProgress {
  return { ...blank(), ...readAll()[slug] };
}

export function getAllProgress(): Record<string, LessonProgress> {
  const all = readAll();
  return Object.fromEntries(lessons.map((l) => [l.slug, { ...blank(), ...all[l.slug] }]));
}

export function getCompleted(): string[] {
  const all = getAllProgress();
  return lessons.filter((l) => all[l.slug]?.completed).map((l) => l.slug);
}

export function saveSlide(slug: string, slide: number) {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[slug] = { ...blank(), ...all[slug], slide };
  writeAll(all);
}

export const scoreQuiz = (lesson: Lesson, answers: number[]) => lesson.quiz.filter((q, i) => answers[i] === q.answer).length;

export type QuizOutcome = { score: number; passed: boolean; rewardGranted: number; alreadyRewarded: boolean };

/** Record a finished quiz attempt; passing marks the lesson complete and grants its reward once. */
export function recordQuiz(lesson: Lesson, answers: number[]): QuizOutcome {
  const score = scoreQuiz(lesson, answers);
  const passed = score >= PASS_SCORE;
  const all = readAll();
  const prev = { ...blank(), ...all[lesson.slug] };
  all[lesson.slug] = {
    ...prev,
    attempts: prev.attempts + 1,
    lastScore: score,
    lastAttemptAt: Date.now(),
    bestScore: Math.max(prev.bestScore, score),
    completed: prev.completed || passed,
    completedAt: prev.completedAt ?? (passed ? Date.now() : undefined),
  };
  writeAll(all);

  const alreadyRewarded = hasReward(rewardId(lesson.slug));
  const granted = passed && !alreadyRewarded && grantReward({ id: rewardId(lesson.slug), amount: lesson.reward, label: `Passed “${lesson.title}”` });
  return { score, passed, rewardGranted: granted ? lesson.reward : 0, alreadyRewarded };
}

export function isRewarded(slug: string) {
  return hasReward(rewardId(slug));
}
