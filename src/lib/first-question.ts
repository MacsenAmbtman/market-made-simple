// The one opening question first-time phone visitors see. Fictional company only; it teaches
// one idea and never tells anyone to buy or sell.

export const FIRST_QUESTION = {
  question: "Daily Grind Coffee (fictional) reports record profits. What usually pushes a share price up?",
  options: [
    "More people wanting to buy the shares",
    "The company printing more shares",
    "The coffee getting cheaper",
  ],
  answer: 0,
  teach: "Prices move with demand: good news can make more people want a slice of the company, and that pushes the price up.",
} as const;
