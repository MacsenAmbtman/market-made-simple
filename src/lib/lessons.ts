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
  track?: "day-trading"; // lessons outside the core investing course
  level?: "Beginner" | "Intermediate" | "Advanced";
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
  {
    "slug": "day-trading-basics",
    "title": "Day Trading Basics",
    "emoji": "",
    "blurb": "What day traders actually do, and the honest odds.",
    "minutes": 5,
    "reward": 500,
    "track": "day-trading",
    "level": "Beginner",
    "slides": [
      {
        "emoji": "",
        "title": "Investing vs. day trading",
        "body": "Investors buy a company and hold for years, letting the business grow. Day traders buy and sell within the same day, trying to profit from small price moves. Every position is closed before the market shuts at 4:00 PM.",
        "callout": "Day trading = no shares held overnight."
      },
      {
        "emoji": "",
        "title": "Market hours",
        "body": "The main US stock market is open 9:30 AM to 4:00 PM Eastern time. The first and last 30 minutes are usually the busiest and most jumpy, because that's when news gets priced in and big funds trade."
      },
      {
        "emoji": "",
        "title": "Small moves, many trades",
        "body": "A long-term investor might hope for 8 to 10 percent a year. A day trader tries to catch moves of a fraction of a percent, many times. That means you need to be right often, and small mistakes add up fast."
      },
      {
        "emoji": "",
        "title": "Reading the chart",
        "body": "Day traders watch price charts split into short time slices, like 1 minute or 5 minutes. Each slice is often drawn as a candlestick: a box showing where the price opened and closed, with thin lines for the highest and lowest prices in that slice.",
        "callout": "Green candle = closed higher than it opened. Red = closed lower."
      },
      {
        "emoji": "",
        "title": "Volume",
        "body": "Volume is how many shares changed hands. A price move on high volume means lots of people agree on it. A move on low volume is easier to reverse."
      },
      {
        "emoji": "",
        "title": "The honest odds",
        "body": "Studies of real accounts keep finding the same thing: most people who day trade lose money, and only a small share make steady profits over the years. That's why Stockify lets you practise with pretend money first.",
        "callout": "Treat day trading here as a skill game, not a way to get rich quick."
      }
    ],
    "quiz": [
      {
        "q": "What makes a trade a day trade?",
        "options": [
          "Holding a stock for at least a year",
          "Buying and selling it within the same day",
          "Only buying stocks under $10",
          "Trading on weekends"
        ],
        "answer": 1,
        "explain": "Day traders open and close their positions in the same session."
      },
      {
        "q": "A green candlestick means...",
        "options": [
          "The price closed higher than it opened in that time slice",
          "The stock pays a dividend",
          "The market is closed",
          "Volume was zero"
        ],
        "answer": 0,
        "explain": "Green candles close above their opening price; red candles close below it."
      },
      {
        "q": "What do studies of real day traders usually find?",
        "options": [
          "Almost everyone profits",
          "Most lose money over time",
          "It is guaranteed income",
          "Fees don't matter"
        ],
        "answer": 1,
        "explain": "Most day traders lose money, so practising risk-free is a smart first step."
      }
    ]
  },
  {
    "slug": "day-trading-risk",
    "title": "Managing Risk Like a Pro",
    "emoji": "",
    "blurb": "Stop-losses, position size and the 1% rule.",
    "minutes": 6,
    "reward": 750,
    "track": "day-trading",
    "level": "Intermediate",
    "slides": [
      {
        "emoji": "",
        "title": "Protect first, profit second",
        "body": "Good traders think about how much they could lose before thinking about how much they could win. One bad trade without a plan can wipe out a week of small gains."
      },
      {
        "emoji": "",
        "title": "The stop-loss",
        "body": "A stop-loss is an order that sells automatically if the price falls to a level you pick. If you buy at $50 with a stop at $49, the most you plan to lose is about $1 a share, even if you look away.",
        "callout": "Decide your exit before you enter."
      },
      {
        "emoji": "",
        "title": "The 1% rule",
        "body": "Many traders never risk more than 1 to 2 percent of their account on one trade. With $10,000, that's $100 to $200. Lose ten trades in a row and you still have most of your money to keep learning."
      },
      {
        "emoji": "",
        "title": "Position size",
        "body": "Work backwards from your risk. If you'll risk $100 and your stop is $1 below your entry, you can buy 100 shares. If the stop is $2 away, buy 50. The stop decides the size, not your excitement."
      },
      {
        "emoji": "",
        "title": "Risk vs. reward",
        "body": "Before entering, compare what you could lose with what you hope to gain. Risking $1 to make $2 (a 1-to-2 ratio) means you can be wrong more than half the time and still come out ahead."
      },
      {
        "emoji": "",
        "title": "Spread and slippage",
        "body": "Every trade has a small hidden cost: the gap between the buying and selling price (the spread), plus slippage when prices move fast. Day traders pay these costs many times a day, so they matter much more than for long-term investors."
      }
    ],
    "quiz": [
      {
        "q": "You buy at $40 and set a stop-loss at $38. What does the stop do?",
        "options": [
          "Buys more at $38",
          "Sells automatically if the price falls to $38",
          "Locks the price at $40",
          "Cancels the trade at 4 PM"
        ],
        "answer": 1,
        "explain": "A stop-loss sells for you if the price drops to your chosen level."
      },
      {
        "q": "With a $10,000 account and the 1% rule, the most you'd risk on one trade is about...",
        "options": [
          "$10",
          "$100",
          "$1,000",
          "$5,000"
        ],
        "answer": 1,
        "explain": "1% of $10,000 is $100."
      },
      {
        "q": "You risk $1 a share to try to make $3. That's a risk-to-reward ratio of...",
        "options": [
          "3 to 1",
          "1 to 3",
          "1 to 1",
          "It can't be measured"
        ],
        "answer": 1,
        "explain": "Risking 1 to make 3 is a 1-to-3 ratio, which gives you room to be wrong sometimes."
      }
    ]
  },
  {
    "slug": "day-trading-advanced",
    "title": "Patterns, Psychology and Rules",
    "emoji": "",
    "blurb": "Support, resistance, news and the mistakes that sink traders.",
    "minutes": 7,
    "reward": 1000,
    "track": "day-trading",
    "level": "Advanced",
    "slides": [
      {
        "emoji": "",
        "title": "Support and resistance",
        "body": "Support is a price where a falling stock has stopped and bounced before, because buyers stepped in. Resistance is a price where a rising stock has stalled, because sellers showed up. Traders watch these levels for possible entries and exits."
      },
      {
        "emoji": "",
        "title": "Moving averages and VWAP",
        "body": "A moving average smooths out the price to show the trend. VWAP (volume-weighted average price) is the average price paid so far today, weighted by volume. Many traders see price above VWAP as strength and below it as weakness.",
        "callout": "Indicators describe the past; they don't predict the future."
      },
      {
        "emoji": "",
        "title": "News moves markets",
        "body": "Earnings reports, economic data and headlines can make a stock jump or gap in seconds. Fast moves create opportunity, but also wider spreads and more slippage. Many beginners do better sitting out the first few minutes after big news."
      },
      {
        "emoji": "",
        "title": "Your brain is the biggest risk",
        "body": "The common mistakes are emotional: chasing a stock after it already jumped (fear of missing out), revenge trading to win back a loss, and moving your stop-loss because you hope it will turn around. A written plan for every trade helps you avoid all three."
      },
      {
        "emoji": "",
        "title": "Rules and taxes",
        "body": "In the US, brokers have special rules for people who day trade often in small accounts, and some limit how many day trades you can make. Profits from short trades are usually taxed at higher rates than long-term investments. Check the current rules where you live before trading real money."
      },
      {
        "emoji": "",
        "title": "Keep a journal",
        "body": "Serious traders record every trade: why they entered, where their stop was, and what happened. After a few weeks, patterns show up, like losing most money in the first 15 minutes. Use the Day Trading mode to build this habit risk-free.",
        "callout": "Measure yourself against buy-and-hold. If you can't beat it on paper, don't try it with real money."
      }
    ],
    "quiz": [
      {
        "q": "A stock keeps bouncing up from $25. Traders would call $25...",
        "options": [
          "Resistance",
          "Support",
          "VWAP",
          "The spread"
        ],
        "answer": 1,
        "explain": "A level where buyers keep stepping in is support."
      },
      {
        "q": "You lost money on a trade and immediately make a bigger one to win it back. This is called...",
        "options": [
          "Revenge trading",
          "Hedging",
          "Dollar-cost averaging",
          "A stop-loss"
        ],
        "answer": 0,
        "explain": "Revenge trading is an emotional mistake that often makes losses bigger."
      },
      {
        "q": "What's a good test before day trading with real money?",
        "options": [
          "Trade only on news days",
          "Consistently beat buy-and-hold on paper first",
          "Skip stop-losses to save money",
          "Use your whole account on one trade"
        ],
        "answer": 1,
        "explain": "If your practice results can't beat simply holding, real money will likely do worse once fees are added."
      }
    ]
  },
];

/** Planned modules shown on the dashboard but not yet playable. */
export const upcoming = [
  { title: "Compound Interest Magic", emoji: "✨", blurb: "How money grows on its own growth." },
  { title: "Index Funds vs. Single Stocks", emoji: "🧺", blurb: "One basket or one egg?" },
  { title: "Dividends Explained", emoji: "💸", blurb: "Getting paid just for holding." },
];

/** The core investing course; day-trading lessons live in their own track. */
export const courseLessons = lessons.filter((l) => !l.track);
export const dayTradingLessons = lessons.filter((l) => l.track === "day-trading");

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
