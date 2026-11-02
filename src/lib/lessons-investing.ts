// Investing lessons for Units 2-5 of the course, plus the two extra questions added to each
// original lesson. Educational only: fictional companies in examples, no recommendations,
// and any historical figure is labelled as historical and not guaranteed.

import type { Lesson, QuizQuestion } from "./lessons";

const lesson = (l: Omit<Lesson, "emoji" | "reward" | "slides"> & { slides: Omit<Lesson["slides"][number], "emoji">[] }): Lesson => ({
  ...l,
  emoji: "",
  reward: 500,
  slides: l.slides.map((s) => ({ emoji: "", ...s })),
});

export const investingLessons: Lesson[] = [
  // ---------------- Unit 2: Growing your money ----------------
  lesson({
    slug: "compound-interest",
    title: "Compound Interest Magic",
    blurb: "How money grows on its own growth.",
    minutes: 5,
    slides: [
      {
        title: "Growth on top of growth",
        body: "Compounding means your earnings start earning too. Put $1,000 somewhere that grows 10% a year and you have $1,100 after one year. In year two you earn 10% on $1,100, not $1,000, so you end with $1,210.",
        callout: "Compounding = earning returns on your past returns.",
      },
      {
        title: "Simple vs. compound",
        body: "With simple interest you only ever earn on the original amount: $1,000 at 10% for three years gives $1,300. With compounding, the same three years gives $1,331. The gap looks tiny at first, then grows every year.",
      },
      {
        title: "Time does the heavy lifting",
        body: "Imagine $1,000 growing at 7% a year with nothing added. After 10 years it's about $1,967. After 20 years, about $3,870. After 30 years, about $7,612. The last ten years add more than the first twenty.",
        stat: { value: "~$7,612", label: "$1,000 after 30 years at 7% a year (an example, not a promise)" },
      },
      {
        title: "The Rule of 72",
        body: "A handy shortcut: divide 72 by a yearly growth rate to estimate how many years it takes to double. At 8% a year, 72 ÷ 8 = 9, so money roughly doubles in about 9 years. At 4%, it takes about 18.",
        callout: "Rule of 72: years to double ≈ 72 ÷ yearly rate.",
      },
      {
        title: "Starting early matters",
        body: "Because the biggest growth comes late, extra years are powerful. $5,000 left alone for 40 years at 7% a year grows to about $74,900. Start ten years later and the same money has far less time to snowball.",
      },
      {
        title: "It works against you too",
        body: "Debt compounds as well. Leave $1,000 on a card charging 20% a year, pay nothing, and it grows to about $1,200 after one year and $1,440 after two. Real investments also don't grow by the same amount every year — some years they fall.",
        callout: "Past performance never guarantees future results.",
      },
    ],
    quiz: [
      {
        q: "You invest $200 and it grows 10% a year, compounding. Roughly how much do you have after 2 years?",
        options: ["$240", "$242", "$220", "$400"],
        answer: 1,
        explain: "Year one: $200 × 1.10 = $220. Year two: $220 × 1.10 = $242. The extra $2 is growth on last year's growth.",
      },
      {
        q: "Using the Rule of 72, about how long does money take to double at 6% a year?",
        options: ["About 6 years", "About 24 years", "About 12 years", "About 72 years"],
        answer: 2,
        explain: "72 ÷ 6 = 12, so roughly 12 years. It's an estimate, not an exact answer.",
      },
      {
        q: "Why does starting to invest earlier usually help so much?",
        options: ["Growth has more years to build on earlier growth", "Early investors pay no fees", "Young people get higher interest rates", "Money invested early can't lose value"],
        answer: 0,
        explain: "Compounding needs time. The extra years at the end are when the snowball is biggest.",
      },
      {
        q: "Which $1,000 would likely end up largest, assuming the same yearly rate?",
        options: ["Earning simple interest for 30 years", "Kept as cash at home for 30 years", "Compounding for 10 years", "Compounding for 30 years"],
        answer: 3,
        explain: "Same rate, more years and growth on growth beats both simple interest and a shorter time.",
      },
      {
        q: "What happens to an unpaid credit card balance that charges compound interest?",
        options: ["It shrinks slowly on its own", "It can grow because interest is charged on past interest", "Interest is only charged once", "The bank pays you interest instead"],
        answer: 1,
        explain: "Compounding works on debt too, which is why high-interest debt can grow quickly.",
      },
    ],
  }),
  lesson({
    slug: "index-funds-vs-stocks",
    title: "Index Funds vs. Single Stocks",
    blurb: "One basket or one egg?",
    minutes: 5,
    slides: [
      {
        title: "What is an index?",
        body: "An index is a list that tracks a group of stocks, like a scoreboard for part of the market. The S&P 500, for example, follows about 500 large US companies. The index itself is just a measurement — you can't buy it directly.",
      },
      {
        title: "What is an index fund?",
        body: "An index fund is a fund that buys the stocks in an index so it moves almost exactly like it. One purchase gives you a small slice of every company on the list.",
        callout: "Index fund = buy the whole list in one go.",
      },
      {
        title: "The single-stock bet",
        body: "Buying one company's shares is a focused bet. If Glow Foods (fictional) does brilliantly, you do too. If it hits trouble, your whole investment can fall a lot — and companies sometimes fail completely.",
      },
      {
        title: "Spreading the risk",
        body: "In an index fund, one company falling hard only dents the total a little, because it's one of many. That's diversification. The fund can still drop when the whole market falls, so it isn't risk-free.",
        callout: "Diversification lowers the damage from any single company.",
      },
      {
        title: "Fees and effort",
        body: "Index funds don't need a team picking winners, so many charge very low yearly fees. Picking single stocks well means researching each company and keeping up with its news.",
      },
      {
        title: "Many people use both",
        body: "Some investors keep most of their money in broad funds and a small slice in companies they want to follow closely. There's no single right mix — it depends on your goals and how much risk you can stomach.",
        callout: "This is education, not advice about what to buy.",
      },
    ],
    quiz: [
      {
        q: "What does an index fund try to do?",
        options: ["Beat the market by picking the best stocks", "Move in line with an index by holding its stocks", "Guarantee a fixed yearly return", "Only buy small companies"],
        answer: 1,
        explain: "An index fund copies its index, so its performance closely follows that index.",
      },
      {
        q: "You hold one company's stock and it reports terrible news. Compared with an index fund, what's likely?",
        options: ["Your loss is bigger because all your money is in that company", "Nothing changes for either", "The index fund falls more", "Your stock is protected by the exchange"],
        answer: 0,
        explain: "A single stock has no other companies to cushion a fall. In a fund it's one of many.",
      },
      {
        q: "Which statement about index funds is true?",
        options: ["They can't lose money", "They always beat single stocks", "They can still fall when the whole market falls", "They charge the highest fees"],
        answer: 2,
        explain: "Diversification spreads company risk, but a broad market drop still pulls the fund down.",
      },
      {
        q: "Why do many index funds have low fees?",
        options: ["The government pays their costs", "They never trade any shares", "They only hold one stock", "They follow a list instead of paying a team to pick stocks"],
        answer: 3,
        explain: "Tracking a list is cheaper than researching and choosing individual companies.",
      },
      {
        q: "What best describes the S&P 500?",
        options: ["A single company", "An index tracking about 500 large US companies", "A type of savings account", "A government bond"],
        answer: 1,
        explain: "It's a measurement of a group of stocks. Funds that track it are what people actually buy.",
      },
    ],
  }),
  lesson({
    slug: "dividends",
    title: "Dividends Explained",
    blurb: "Getting paid just for holding.",
    minutes: 5,
    slides: [
      {
        title: "Sharing the profits",
        body: "A dividend is cash a company pays to its shareholders, usually from its profits. Many pay every three months (quarterly). If you own the shares on the right date, the money lands in your account.",
      },
      {
        title: "Working out the cash",
        body: "Dividends are quoted per share. If Maple Utilities (fictional) pays $0.50 per share each quarter and you own 100 shares, you get $50 a quarter — $200 over a year.",
        callout: "Dividend cash = dividend per share × shares you own.",
      },
      {
        title: "Dividend yield",
        body: "Yield compares the yearly dividend with the share price. A stock at $50 paying $2 a year has a yield of 2 ÷ 50 = 4%. If the price falls and the dividend stays the same, the yield goes up.",
      },
      {
        title: "Not guaranteed",
        body: "Companies decide each time whether to pay. In hard times they can cut or stop dividends. A very high yield can be a warning sign that the market expects a cut.",
        callout: "A high yield isn't automatically a good deal.",
      },
      {
        title: "Scenario: dividend news",
        body: "You own 20 shares of a fictional utility company. A dividend announcement just hit — what do you do?",
        scenario: {
          id: "maple-dividend",
          sym: "MPLU",
          company: "Maple Utilities (fictional)",
          headline: "Maple Utilities raises its dividend for the tenth year in a row",
          source: "MarketWire",
          startPrice: 50,
          owned: 20,
          gap: 0.02,
          drift: 0.03,
          best: "hold",
          feedback: {
            buy: "You bought after the news, paying a slightly higher price. One announcement is a thin reason to buy — look at whether the business can keep affording the payments.",
            hold: "You kept your shares and your growing stream of dividend cash. A steady payout raise suggests the business is healthy, though it's never guaranteed.",
            sell: "You sold and gave up future dividends. Selling can be fine as part of a plan, but this news was good for owners.",
          },
        },
      },
      {
        title: "Reinvesting dividends",
        body: "Many brokers let you automatically use dividends to buy more shares (often called a DRIP). More shares means bigger future dividends — compounding in action. Some growing companies pay no dividend and reinvest profits in the business instead.",
      },
    ],
    quiz: [
      {
        q: "You own 40 shares and the company pays $0.25 per share each quarter. How much do you get per quarter?",
        options: ["$4", "$40", "$10", "$100"],
        answer: 2,
        explain: "40 × $0.25 = $10 per quarter, or $40 over a full year.",
      },
      {
        q: "A $40 stock pays $2 in dividends a year. What's its dividend yield?",
        options: ["5%", "2%", "20%", "8%"],
        answer: 0,
        explain: "Yield = yearly dividend ÷ price = 2 ÷ 40 = 5%.",
      },
      {
        q: "A stock suddenly shows a very high dividend yield. What's a sensible first thought?",
        options: ["It's free money", "Dividends can never be cut", "High yields always mean a strong company", "The price may have fallen because investors expect a cut"],
        answer: 3,
        explain: "Yield rises when the price falls. A huge yield can mean the market doubts the payment will last.",
      },
      {
        q: "What does reinvesting dividends do?",
        options: ["Turns dividends into a loan", "Uses the cash to buy more shares, which can pay more dividends later", "Doubles the dividend straight away", "Locks your shares so you can't sell"],
        answer: 1,
        explain: "Reinvesting adds shares, so future payouts are bigger — growth building on growth.",
      },
      {
        q: "Which statement about dividends is true?",
        options: ["Every company must pay one", "They're paid by the stock exchange", "A company can choose to pay none and reinvest profits instead", "They're guaranteed for as long as you hold"],
        answer: 2,
        explain: "Dividends are optional. Many growing companies keep profits to expand.",
      },
    ],
  }),
  lesson({
    slug: "dollar-cost-averaging",
    title: "Dollar-Cost Averaging",
    blurb: "Investing a little, regularly, no matter the price.",
    minutes: 5,
    slides: [
      {
        title: "A little at a time",
        body: "Dollar-cost averaging means investing the same amount on a regular schedule — say $100 every month — whatever the price is that day. You stop trying to guess the perfect moment.",
        callout: "Same amount, same schedule, any price.",
      },
      {
        title: "More shares when prices dip",
        body: "A fixed amount buys more shares when the price is low and fewer when it's high. $100 buys 10 shares at $10, but 20 shares at $5.",
      },
      {
        title: "A worked example",
        body: "You invest $100 a month for three months in a fictional fund priced $10, then $5, then $10. You get 10 + 20 + 10 = 40 shares for $300. Your average cost is $300 ÷ 40 = $7.50 a share, below the average price of about $8.33.",
        stat: { value: "$7.50", label: "average cost per share in this example" },
      },
      {
        title: "Why it helps your head",
        body: "Nobody can reliably predict short-term moves. A schedule takes the decision — and the stress — out of each purchase, and stops you waiting forever for a dip that may not come.",
      },
      {
        title: "What it doesn't do",
        body: "Dollar-cost averaging doesn't guarantee a profit or protect you if prices keep falling for a long time. If you already have a lump sum, investing it all at once has historically often done better, because markets have tended to rise over long periods — but that's not guaranteed either.",
        callout: "A habit, not a promise.",
      },
      {
        title: "Making it automatic",
        body: "Many brokers and workplace plans let you set up automatic monthly investments. Pick an amount you can keep up comfortably, even in months when the news is scary.",
      },
    ],
    quiz: [
      {
        q: "What is dollar-cost averaging?",
        options: ["Investing the same amount on a regular schedule", "Buying only when prices hit a low", "Selling a little every month", "Converting money between currencies"],
        answer: 0,
        explain: "It's a fixed amount at fixed times, regardless of price.",
      },
      {
        q: "You invest $60 each month. The price is $6, then $3. How many shares do you have in total?",
        options: ["20", "15", "30", "18"],
        answer: 2,
        explain: "$60 ÷ $6 = 10 shares, then $60 ÷ $3 = 20 shares. 10 + 20 = 30.",
      },
      {
        q: "When the price drops, what happens to your regular fixed investment?",
        options: ["It buys fewer shares", "It buys more shares", "It's paused automatically", "It costs more"],
        answer: 1,
        explain: "The same money stretches further when each share is cheaper.",
      },
      {
        q: "Which is a fair statement about dollar-cost averaging?",
        options: ["It guarantees you'll make money", "It protects you from all losses", "It always beats investing a lump sum", "It helps you invest steadily without timing the market"],
        answer: 3,
        explain: "Its main strength is consistency. It doesn't promise profits.",
      },
      {
        q: "Why does a fixed schedule help many beginners?",
        options: ["It removes the urge to guess the perfect moment", "It means you never check your account", "It avoids all fees", "It makes prices go up"],
        answer: 0,
        explain: "Deciding in advance takes emotion and guesswork out of each purchase.",
      },
    ],
  }),

  // ---------------- Unit 3: Reading a company ----------------
  lesson({
    slug: "earnings-reports",
    title: "What Earnings Reports Tell You",
    blurb: "The company report card, in plain English.",
    minutes: 6,
    slides: [
      {
        title: "The quarterly report card",
        body: "Public companies report their results regularly — in the US, every three months. An earnings report shows how much money came in, how much was spent and what was left over.",
      },
      {
        title: "Revenue vs. profit",
        body: "Revenue is all the money from sales. Profit (also called net income or earnings) is what's left after paying every cost. A company can sell a lot and still lose money if its costs are higher.",
        callout: "Revenue = money in. Profit = money left over.",
      },
      {
        title: "Earnings per share",
        body: "EPS splits profit across every share. If Nimbus Software (fictional) earns $10 million and has 5 million shares, its EPS is $10 million ÷ 5 million = $2 per share.",
      },
      {
        title: "Results vs. expectations",
        body: "Before a report, analysts publish estimates. Prices often react to the gap between the results and those expectations. A company can grow profits and still see its shares fall if investors hoped for more.",
        callout: "Markets react to surprises, not just to good or bad numbers.",
      },
      {
        title: "Scenario: mixed results",
        body: "You own 12 shares of a fictional software company. Its report is out — sales beat estimates, but the outlook is weaker.",
        scenario: {
          id: "nimbus-guidance",
          sym: "NMBS",
          company: "Nimbus Software (fictional)",
          headline: "Nimbus beats sales estimates but cuts its forecast for next year",
          source: "Financial Daily",
          startPrice: 90,
          owned: 12,
          gap: -0.07,
          drift: -0.05,
          best: "hold",
          feedback: {
            buy: "You bought into the drop. That's a bet the market overreacted — reasonable only if you've studied why the forecast was cut.",
            hold: "You held and took the dip. One weaker outlook doesn't always change the long-term story, but it's worth reading why the company expects less.",
            sell: "You sold on the news. If the forecast cut changes your view of the business, that's a fair decision — just make sure it's a reason, not a reflex.",
          },
        },
      },
      {
        title: "Guidance looks ahead",
        body: "Many companies also share guidance: what they expect for the coming months. Investors care about the future, so a lower forecast can move the price more than last quarter's results.",
      },
    ],
    quiz: [
      {
        q: "What's the difference between revenue and profit?",
        options: ["They mean the same thing", "Profit is what's left of revenue after costs", "Revenue is what's left after costs", "Profit only counts overseas sales"],
        answer: 1,
        explain: "Revenue is all the money from sales; profit is what remains after paying for everything.",
      },
      {
        q: "A fictional company earns $6 million profit and has 3 million shares. What's its EPS?",
        options: ["$18", "$0.50", "$3", "$2"],
        answer: 3,
        explain: "EPS = profit ÷ shares = $6 million ÷ 3 million = $2 per share.",
      },
      {
        q: "A company's profit grows 10%, but its shares fall after the report. What's a likely reason?",
        options: ["Investors expected even more", "The exchange made an error", "Profit growth always lowers prices", "Shares can't rise after reports"],
        answer: 0,
        explain: "Prices react to results versus expectations. Good can still disappoint.",
      },
      {
        q: "What is a company's guidance?",
        options: ["Rules for buying its stock", "The CEO's salary", "Its forecast for upcoming results", "A list of its shareholders"],
        answer: 2,
        explain: "Guidance is the company's own outlook, which investors watch closely.",
      },
      {
        q: "Can a company with large revenue still lose money?",
        options: ["No, high revenue means profit", "Only if it pays dividends", "Only if it's small", "Yes, if its costs are higher than its revenue"],
        answer: 3,
        explain: "Profit depends on costs too. Big sales with bigger costs still means a loss.",
      },
    ],
  }),
  lesson({
    slug: "pe-ratios",
    title: "Price-to-Earnings Ratios",
    blurb: "Is a stock cheap or pricey for what it earns?",
    minutes: 5,
    slides: [
      {
        title: "Price isn't the whole story",
        body: "A $500 share isn't automatically expensive, and a $5 share isn't automatically cheap. What matters is how much you pay compared with what the company earns.",
      },
      {
        title: "The P/E ratio",
        body: "The price-to-earnings ratio divides the share price by earnings per share. Ridgeway Tools (fictional) trades at $50 and earns $2.50 per share, so its P/E is 50 ÷ 2.50 = 20.",
        callout: "P/E = share price ÷ earnings per share.",
      },
      {
        title: "Reading the number",
        body: "A P/E of 20 means investors are paying $20 for every $1 the company earned last year. A higher P/E usually means people expect faster growth ahead; a lower one can mean slower expected growth or more worry.",
      },
      {
        title: "Compare like with like",
        body: "Normal P/E levels differ a lot between industries. Comparing a fast-growing software company with a steady supermarket chain tells you little. It's more useful to compare similar companies, or one company with its own past.",
      },
      {
        title: "When P/E breaks",
        body: "If a company has no profit, or a loss, the P/E doesn't mean much. One unusual year — a big one-off sale or charge — can also make the number look strange.",
      },
      {
        title: "One clue, not a verdict",
        body: "A low P/E can be a bargain or a warning sign. A high P/E can reflect real growth or too much excitement. Use it as a starting question, alongside the business itself.",
        callout: "No single number tells you whether to buy.",
      },
    ],
    quiz: [
      {
        q: "A stock costs $30 and earns $3 per share. What's its P/E?",
        options: ["90", "33", "10", "3"],
        answer: 2,
        explain: "P/E = $30 ÷ $3 = 10.",
      },
      {
        q: "What does a P/E of 25 mean?",
        options: ["Investors pay $25 for each $1 of yearly earnings", "The company earns $25 per share", "The stock will rise 25%", "The share price is $25"],
        answer: 0,
        explain: "P/E compares price with earnings: $25 paid per $1 earned.",
      },
      {
        q: "Two fictional companies in the same industry: Alder Co. has a P/E of 40, Birch Co. has 10. What's a fair reading?",
        options: ["Birch is definitely the better buy", "Investors expect more growth from Alder", "Alder earns four times more money", "Both will grow at the same speed"],
        answer: 1,
        explain: "A higher P/E usually reflects higher growth expectations — not a guarantee either way.",
      },
      {
        q: "Why is comparing P/E ratios across very different industries tricky?",
        options: ["P/E is illegal in some industries", "Every industry has the same P/E", "Only banks have P/E ratios", "Typical P/E levels differ between industries"],
        answer: 3,
        explain: "Growth rates and risks vary by industry, so normal P/E levels do too.",
      },
      {
        q: "A company lost money last year. What happens to its P/E?",
        options: ["It becomes very useful", "It doesn't give a meaningful reading", "It equals the share price", "It shows the company is cheap"],
        answer: 1,
        explain: "With no earnings, there's nothing sensible to divide by, so the ratio isn't meaningful.",
      },
    ],
  }),
  lesson({
    slug: "market-cap",
    title: "Market Cap: Big vs. Small Companies",
    blurb: "How the market measures a company's size.",
    minutes: 5,
    slides: [
      {
        title: "What market cap means",
        body: "Market capitalisation is the total value of all a company's shares. Multiply the share price by the number of shares. Pine Valley Bikes (fictional) has 10 million shares at $20, so its market cap is $200 million.",
        callout: "Market cap = share price × number of shares.",
      },
      {
        title: "Share price can mislead",
        body: "A company with a $500 share price can be smaller than one with a $50 share price, if it has far fewer shares. Market cap is the real size comparison.",
      },
      {
        title: "Large, mid and small",
        body: "Investors group companies by size. Rough definitions vary, but large caps are usually worth tens of billions of dollars or more, small caps a few hundred million to a couple of billion, and mid caps sit in between.",
      },
      {
        title: "Big companies",
        body: "Large companies are often established, with steady sales and many customers. Their share prices tend to swing less than small companies', but they may grow more slowly from here.",
      },
      {
        title: "Small companies",
        body: "Small companies can have more room to grow, but they're often less proven, more sensitive to bad news and can move a lot in a day. Some grow into giants; many don't.",
        callout: "More room to grow usually comes with more risk.",
      },
      {
        title: "Size in a portfolio",
        body: "Many broad funds hold companies in proportion to their market cap, so the biggest companies make up the largest share. Knowing that helps you understand what you actually own.",
      },
    ],
    quiz: [
      {
        q: "A fictional company has 50 million shares at $4 each. What's its market cap?",
        options: ["$54 million", "$12.5 million", "$4 million", "$200 million"],
        answer: 3,
        explain: "50 million × $4 = $200 million.",
      },
      {
        q: "Company X has a $500 share price; Company Y has a $50 share price. Which is bigger?",
        options: ["You can't tell without knowing how many shares each has", "Company X, because its price is higher", "Company Y, because its price is lower", "They're the same size"],
        answer: 0,
        explain: "Size depends on price × shares. A high price with few shares can still be a small company.",
      },
      {
        q: "Compared with large companies, small companies typically...",
        options: ["Never go out of business", "Swing more in price but may have more room to grow", "Pay the biggest dividends", "Have prices that never change"],
        answer: 1,
        explain: "Smaller firms often carry more risk and more growth potential.",
      },
      {
        q: "What does market cap measure?",
        options: ["A company's yearly profit", "How many employees it has", "The total market value of all its shares", "The price of one share"],
        answer: 2,
        explain: "It's the market's total price tag for the company's shares.",
      },
      {
        q: "In a fund that weights companies by market cap, which companies make up the biggest portion?",
        options: ["The newest ones", "The ones with the highest share price", "The ones with the most employees", "The ones with the largest market caps"],
        answer: 3,
        explain: "Market-cap weighting gives the most money to the most valuable companies.",
      },
    ],
  }),

  // ---------------- Unit 4: Building a portfolio ----------------
  lesson({
    slug: "stocks-bonds-cash",
    title: "Stocks, Bonds and Cash",
    blurb: "The three building blocks of most portfolios.",
    minutes: 6,
    slides: [
      {
        title: "Three building blocks",
        body: "Most portfolios are built from three main types of investment, called asset classes: stocks (owning part of companies), bonds (lending money) and cash (savings you can reach quickly).",
      },
      {
        title: "Bonds: you're the lender",
        body: "A bond is a loan to a government or company. In return they pay you interest and promise to repay the loan on a set date. A $1,000 bond paying 5% a year pays $50 a year until it ends.",
        callout: "Stock = owner. Bond = lender.",
      },
      {
        title: "Cash: the safety cushion",
        body: "Cash in a savings account is easy to reach and rarely falls in value, but it usually grows slowly. Over time, rising prices (inflation) can shrink what it can buy.",
      },
      {
        title: "Different jobs, different risks",
        body: "Historically, stocks have grown the most over long periods but swing the most. Bonds have usually been steadier with lower returns. Cash is the steadiest and usually grows the least. None of this is guaranteed.",
      },
      {
        title: "Scenario: a rough week",
        body: "You hold a fictional fund made only of stocks. Markets are sliding — what do you do?",
        scenario: {
          id: "harbor-slide",
          sym: "HRBR",
          company: "Harbor Total Market Fund (fictional)",
          headline: "Stocks slide for a fifth day; bond prices hold steady",
          source: "MarketWire",
          startPrice: 100,
          owned: 25,
          gap: -0.05,
          drift: -0.02,
          best: "hold",
          feedback: {
            buy: "You added more while prices were lower. That can work for long-term money you won't need soon — but only if you can stomach further drops.",
            hold: "You stuck with your plan. Rough weeks are normal for stocks. A mix that includes bonds or cash can make weeks like this easier to sit through.",
            sell: "You sold during the slide and locked in the loss. If drops like this make you want to sell, a mix with more bonds or cash may suit you better.",
          },
        },
      },
      {
        title: "Mixing them",
        body: "Your mix — called asset allocation — is one of the biggest decisions you make. People investing for decades often hold more stocks; people who'll need the money soon often hold more bonds and cash.",
        callout: "Your timeline shapes your mix.",
      },
    ],
    quiz: [
      {
        q: "When you buy a bond, what are you doing?",
        options: ["Buying part of a company", "Lending money in return for interest", "Opening a savings account", "Betting on a share price"],
        answer: 1,
        explain: "A bond is a loan. You're paid interest and expect the money back at the end.",
      },
      {
        q: "A $2,000 bond pays 4% interest a year. How much interest is that each year?",
        options: ["$4", "$800", "$40", "$80"],
        answer: 3,
        explain: "4% of $2,000 = $80 a year.",
      },
      {
        q: "What's a key downside of keeping all long-term money in cash?",
        options: ["Inflation can shrink what it buys over time", "It can drop 50% in a day", "It can't be withdrawn", "It always loses money each year"],
        answer: 0,
        explain: "Cash is steady, but if prices rise faster than its interest, you lose buying power.",
      },
      {
        q: "Someone needs their money in one year for a house deposit. Which mix generally fits better?",
        options: ["All in one small company", "Mostly stocks", "Mostly cash and bonds", "Borrowing to buy more stocks"],
        answer: 2,
        explain: "Short timelines leave little time to recover from a stock drop, so steadier assets usually fit better.",
      },
      {
        q: "What is asset allocation?",
        options: ["Choosing one stock", "How your money is split between stocks, bonds and cash", "The fee a broker charges", "A type of bond"],
        answer: 1,
        explain: "It's your overall mix across asset classes.",
      },
    ],
  }),
  lesson({
    slug: "etfs-and-fees",
    title: "ETFs and Why Fees Matter",
    blurb: "Small percentages, big long-term differences.",
    minutes: 6,
    slides: [
      {
        title: "What is an ETF?",
        body: "An ETF (exchange-traded fund) is a fund that holds a basket of investments and trades on a stock exchange like a single share. Many ETFs track an index, but some follow other strategies.",
        callout: "ETF = a basket you can buy like one stock.",
      },
      {
        title: "Expense ratios",
        body: "Funds charge a yearly fee called the expense ratio, taken as a percentage of what you hold. On $10,000, a 1% fee costs about $100 a year; a 0.1% fee costs about $10.",
      },
      {
        title: "Fees compound too",
        body: "Fees come out every year, so they eat into growth that would have compounded. A small-looking difference grows into a big one over decades.",
      },
      {
        title: "The 30-year gap",
        body: "Say $10,000 is invested for 30 years and the investments grow 7% a year before fees (an example, not a prediction). With a 0.1% fee you'd end with about $74,000. With a 1% fee, about $57,400.",
        stat: { value: "~$16,600", label: "less after 30 years with a 1% fee vs 0.1% in this example" },
      },
      {
        title: "Other costs",
        body: "Some brokers charge trading commissions, and every trade has a small spread between buying and selling prices. Trading often adds up these costs.",
      },
      {
        title: "Fees you can control",
        body: "You can't control what the market does, but you can see and compare fees before you invest. A fund's expense ratio is listed in its documents. Cheaper isn't always better, but it's always worth knowing what you pay.",
        callout: "Check the expense ratio before you invest.",
      },
    ],
    quiz: [
      {
        q: "What makes an ETF different from a traditional mutual fund?",
        options: ["It trades on an exchange like a share", "It can only hold one stock", "It has no fees ever", "It's guaranteed by the government"],
        answer: 0,
        explain: "ETFs are baskets that you buy and sell on an exchange during the trading day.",
      },
      {
        q: "You hold $20,000 in a fund with a 0.5% expense ratio. Roughly how much is the yearly fee?",
        options: ["$10", "$1,000", "$50", "$100"],
        answer: 3,
        explain: "0.5% of $20,000 = $100 a year.",
      },
      {
        q: "Why can a 1% fee matter so much over 30 years?",
        options: ["It's charged only once", "It reduces the amount left to compound every year", "It doubles each year", "It's added to your returns"],
        answer: 1,
        explain: "Money taken in fees can't grow, and that lost growth compounds over time.",
      },
      {
        q: "Two funds hold almost identical investments. One charges 0.05%, the other 0.75%. What's most likely over many years?",
        options: ["The pricier fund wins because it costs more", "They end up exactly the same", "The cheaper fund leaves you with more, all else equal", "Fees don't affect returns"],
        answer: 2,
        explain: "With the same holdings, lower costs mean more of the growth stays with you.",
      },
      {
        q: "Where can you usually find a fund's expense ratio?",
        options: ["It's kept secret", "In the fund's documents or fact sheet", "Only after you sell", "On the company's product packaging"],
        answer: 1,
        explain: "Funds publish their fees, so you can compare before investing.",
      },
    ],
  }),
  lesson({
    slug: "rebalancing",
    title: "Rebalancing",
    blurb: "Keeping your mix on track as markets move.",
    minutes: 5,
    slides: [
      {
        title: "Your mix drifts",
        body: "Say you choose 60% stocks and 40% bonds. As prices move, those percentages change on their own. After a strong year for stocks you might be at 70/30 without doing anything.",
      },
      {
        title: "A worked example",
        body: "You start with $10,000: $6,000 in stocks and $4,000 in bonds. Stocks grow to $8,000 while bonds stay at $4,000. Your total is $12,000, and stocks are now about 67% — more risk than you planned.",
      },
      {
        title: "Bringing it back",
        body: "Rebalancing means returning to your chosen mix. 60% of $12,000 is $7,200 and 40% is $4,800, so you'd move $800 from stocks to bonds.",
        stat: { value: "$800", label: "moved from stocks to bonds to get back to 60/40" },
      },
      {
        title: "Why bother?",
        body: "Rebalancing keeps your risk at the level you chose. It also nudges you to trim what has risen and add to what has lagged — the opposite of chasing what's hot.",
        callout: "Rebalancing controls risk; it doesn't promise higher returns.",
      },
      {
        title: "How often?",
        body: "Common approaches are once a year, or whenever a part drifts more than a set amount, like 5 percentage points. Checking every day usually just adds costs and stress.",
      },
      {
        title: "Ways to do it",
        body: "You can sell some of what's grown, or simply point new money at what's fallen behind. Selling can trigger taxes in some accounts, so many people rebalance with new contributions first.",
      },
    ],
    quiz: [
      {
        q: "Why does a portfolio's mix drift over time?",
        options: ["Brokers change it without telling you", "Different investments grow at different rates", "Fees change your percentages", "It doesn't drift"],
        answer: 1,
        explain: "When one part grows faster, it becomes a bigger share of the total.",
      },
      {
        q: "Your target is 50/50. You have $9,000 in stocks and $3,000 in bonds. How much would you move to rebalance?",
        options: ["$6,000 to bonds", "$1,500 to bonds", "$4,500 to stocks", "$3,000 from stocks to bonds"],
        answer: 3,
        explain: "Total $12,000, so 50/50 means $6,000 each. Move $3,000 from stocks to bonds.",
      },
      {
        q: "What's the main purpose of rebalancing?",
        options: ["Keeping your risk at the level you chose", "Guaranteeing higher returns", "Avoiding all taxes", "Predicting the next market move"],
        answer: 0,
        explain: "It brings your mix — and so your risk — back to your plan.",
      },
      {
        q: "Which is a common, sensible rebalancing schedule?",
        options: ["Every hour", "Never, under any circumstances", "Once a year or when the mix drifts by a set amount", "Only when the news is scary"],
        answer: 2,
        explain: "Regular, rule-based checks keep you on track without constant trading.",
      },
      {
        q: "How can you rebalance without selling anything?",
        options: ["Ask the fund to change its price", "Put new money into the part that's fallen behind", "Wait for prices to fix themselves", "It's impossible"],
        answer: 1,
        explain: "Directing new contributions to the underweight part gradually restores your mix.",
      },
    ],
  }),
  lesson({
    slug: "tax-friendly-accounts",
    title: "Tax-Friendly Investment Accounts",
    blurb: "Accounts that can help your money grow with less tax.",
    minutes: 6,
    slides: [
      {
        title: "The account matters",
        body: "Where you hold investments can matter as much as what you hold. Many countries offer special accounts with tax benefits to encourage people to save and invest.",
      },
      {
        title: "Two common types of benefit",
        body: "Some accounts let you pay in before tax and pay tax when you take money out later. Others use money you've already paid tax on, then let growth and withdrawals be tax-free if you follow the rules.",
        callout: "Tax relief now, or tax-free later — the rules decide which.",
      },
      {
        title: "Examples around the world",
        body: "In the US, people use workplace 401(k) plans and IRAs, including Roth IRAs. In the UK, ISAs let investments grow free of UK tax, and workplace pensions offer tax relief. Canada has TFSAs and RRSPs, and Australia has superannuation.",
      },
      {
        title: "Free money from employers",
        body: "Some workplace plans add an employer contribution when you pay in, sometimes called a match. Not collecting a match can mean leaving part of your pay on the table.",
      },
      {
        title: "Rules and limits",
        body: "These accounts have yearly limits on how much you can put in, and some restrict when you can take money out without a penalty. The limits and rules change, so always check the current ones.",
        callout: "Check current rules where you live — they change often.",
      },
      {
        title: "Where to start",
        body: "Look up the official tax authority or government guidance for your country, or ask a qualified adviser. Knowing which accounts exist is a big first step; the investments inside them are a separate choice.",
      },
    ],
    quiz: [
      {
        q: "Why do governments offer tax-friendly investment accounts?",
        options: ["To encourage people to save and invest", "To pick stocks for you", "To guarantee returns", "To stop people investing"],
        answer: 0,
        explain: "Tax benefits reward people for saving for the future.",
      },
      {
        q: "Which pair are both examples of tax-friendly accounts in different countries?",
        options: ["A US IRA and a UK ISA", "A credit card and a mortgage", "A current account and a debit card", "A car loan and a student loan"],
        answer: 0,
        explain: "IRAs (US) and ISAs (UK) are both accounts with tax benefits for saving and investing.",
      },
      {
        q: "Your employer offers to add money when you contribute to your workplace plan. What is this usually called?",
        options: ["A dividend", "A capital gain", "An employer match", "A spread"],
        answer: 2,
        explain: "An employer match is extra money your employer adds based on what you pay in.",
      },
      {
        q: "What's the best way to know this year's contribution limits?",
        options: ["Assume they never change", "Copy last year's limits from a friend", "There are no limits", "Check current official guidance for your country"],
        answer: 3,
        explain: "Limits and rules change, so check up-to-date official sources where you live.",
      },
      {
        q: "Which statement about these accounts is true?",
        options: ["They guarantee your investments will rise", "Some limit when you can withdraw without penalties", "They're identical in every country", "You can put in unlimited amounts"],
        answer: 1,
        explain: "Many have withdrawal rules and yearly limits, and they differ between countries.",
      },
    ],
  }),

  // ---------------- Unit 5: The investor mindset ----------------
  lesson({
    slug: "bull-and-bear-markets",
    title: "Bull and Bear Markets",
    blurb: "The market's big moods, and how to ride them.",
    minutes: 5,
    slides: [
      {
        title: "Bulls and bears",
        body: "A bull market is a long stretch of rising prices; a bear market is a long stretch of falling ones. A common definition of a bear market is a fall of 20% or more from a recent high.",
        callout: "Bull = charging up. Bear = swiping down.",
      },
      {
        title: "Corrections",
        body: "A smaller drop of around 10% from a recent high is often called a correction. Corrections happen fairly often and are a normal part of investing.",
      },
      {
        title: "Nobody rings a bell",
        body: "You only know for sure that a bull or bear market started or ended looking back. Even professionals struggle to call the turning points in advance.",
      },
      {
        title: "The long view",
        body: "Historically, broad stock markets have spent more time rising than falling, and bull markets have tended to last longer than bear markets. That's history, not a guarantee about the future.",
      },
      {
        title: "Scenario: a bear market",
        body: "You've held a fictional broad-market fund for years. It's now down over 20% from its high. What do you do?",
        scenario: {
          id: "summit-bear",
          sym: "SMMT",
          company: "Summit Broad Market Fund (fictional)",
          headline: "Markets officially enter bear territory as fears grow",
          source: "Financial Daily",
          startPrice: 80,
          owned: 30,
          gap: -0.04,
          drift: 0.02,
          best: "hold",
          feedback: {
            buy: "You added while prices were down. For long-term money that's been a reasonable approach historically — but bears can keep falling, so only use money you won't need.",
            hold: "You held through the fear, and the fund recovered part of its drop here. Historically, staying invested through bear markets has usually beaten trying to jump in and out.",
            sell: "You sold near a low and missed the rebound. Selling in a panic can turn a temporary drop into a permanent loss.",
          },
        },
      },
      {
        title: "Plan before the storm",
        body: "Bear markets are easier to handle if you've decided in advance what you'll do. Money you'll need soon shouldn't be in stocks, so a drop doesn't force you to sell at a bad time.",
        callout: "Past performance never guarantees future results.",
      },
    ],
    quiz: [
      {
        q: "What is a bear market commonly defined as?",
        options: ["A rise of 20% or more", "A fall of 20% or more from a recent high", "Any single bad day", "A market that's closed"],
        answer: 1,
        explain: "A 20% drop from a recent peak is the usual rule of thumb.",
      },
      {
        q: "An index falls 10% from its recent high, then steadies. What's this usually called?",
        options: ["A correction", "A crash of 50%", "A bull market", "A dividend"],
        answer: 0,
        explain: "A drop of about 10% is commonly called a correction.",
      },
      {
        q: "Why is it hard to profit by jumping out before bear markets and back in before recoveries?",
        options: ["It's illegal", "Bear markets never recover", "Turning points are usually only clear looking back", "Markets only move once a year"],
        answer: 2,
        explain: "You'd need to be right twice — when to leave and when to return — which few manage.",
      },
      {
        q: "Which statement about history is fair?",
        options: ["Markets rise every single year", "Bear markets always last longer than bull markets", "History guarantees future gains", "Bull markets have tended to last longer than bear markets, but that's not guaranteed"],
        answer: 3,
        explain: "That's the historical pattern, and history doesn't promise the future.",
      },
      {
        q: "What helps most in handling a bear market calmly?",
        options: ["Deciding your plan in advance and keeping soon-needed money out of stocks", "Checking prices every few minutes", "Borrowing to buy more", "Following whatever social media says"],
        answer: 0,
        explain: "A plan made in calm times stops fear from making the decision.",
      },
    ],
  }),
  lesson({
    slug: "emotions-and-money",
    title: "Your Emotions vs. Your Money",
    blurb: "Why your brain is your biggest investing risk.",
    minutes: 5,
    slides: [
      {
        title: "Brains aren't built for markets",
        body: "Our instincts helped us survive, not invest. They push us to run from danger and follow the crowd — useful in the wild, costly when prices move.",
      },
      {
        title: "Losses hurt more",
        body: "Many people feel a loss about twice as strongly as an equal gain. This loss aversion can make you sell in a panic, or hold a losing investment too long hoping to break even.",
      },
      {
        title: "Fear of missing out",
        body: "When a stock is all over social media, it's tempting to jump in. By then the price has often already jumped, and you may be buying from the people who got in early.",
        callout: "If everyone's talking about it, the easy gains may be gone.",
      },
      {
        title: "Scenario: the hype",
        body: "You own 5 shares of a fictional tech company. It just shot up on social media buzz. What do you do?",
        scenario: {
          id: "moonbyte-hype",
          sym: "MOON",
          company: "MoonByte Labs (fictional)",
          headline: "MoonByte shares soar as posts about the company go viral",
          source: "MarketWire",
          startPrice: 20,
          owned: 5,
          gap: 0.25,
          drift: 0.05,
          feedback: {
            buy: "You bought at the hyped-up price, and much of the jump faded as the buzz cooled. Chasing a spike is a classic fear-of-missing-out move.",
            hold: "You held your small position calmly. The spike faded but you still had a gain — and you didn't add more at the top.",
            sell: "You took profits during the hype. Locking in gains can be sensible when a jump is driven by buzz rather than the business — as long as it's part of a plan.",
          },
        },
      },
      {
        title: "Overconfidence and checking",
        body: "A few lucky wins can make anyone feel like an expert, leading to bigger risks. Checking your portfolio constantly also makes normal ups and downs feel scarier than they are.",
      },
      {
        title: "Rules beat feelings",
        body: "Write down your plan: what you'll invest, how often, and what you'll do when prices drop. Automatic investing and fewer check-ins make it easier to follow when emotions run high.",
        callout: "Decide when calm; follow it when stressed.",
      },
    ],
    quiz: [
      {
        q: "What is loss aversion?",
        options: ["Feeling losses more strongly than equal gains", "Avoiding all investments", "A type of insurance", "Only buying stocks that rise"],
        answer: 0,
        explain: "Losses tend to sting more than gains feel good, which can push people into rash moves.",
      },
      {
        q: "A fictional stock jumps 40% in a week and everyone online is talking about it. What's the main risk of buying now?",
        options: ["The broker will refuse the trade", "You may be paying a price already inflated by hype", "Stocks can't rise after big jumps", "There's no risk at all"],
        answer: 1,
        explain: "By the time something is everywhere, a lot of the move may already be priced in.",
      },
      {
        q: "How can checking your portfolio many times a day hurt you?",
        options: ["It raises your fees automatically", "It makes your investments fall", "It makes normal swings feel scarier and tempts rash decisions", "It's not allowed"],
        answer: 2,
        explain: "Seeing every wiggle magnifies emotion. Less checking usually means calmer decisions.",
      },
      {
        q: "After three lucky wins in a row, someone doubles their bet size. Which bias is this?",
        options: ["Loss aversion", "Dollar-cost averaging", "Diversification", "Overconfidence"],
        answer: 3,
        explain: "A short winning streak can feel like skill and encourage bigger risks than planned.",
      },
      {
        q: "What's one of the best defences against emotional investing?",
        options: ["A written plan with rules set in advance", "Following the loudest online voices", "Reacting quickly to every headline", "Investing only when you feel excited"],
        answer: 0,
        explain: "Rules made while calm help you act sensibly when markets are stressful.",
      },
    ],
  }),
  lesson({
    slug: "investing-scams",
    title: "Spotting Investing Scams",
    blurb: "The red flags that protect your money.",
    minutes: 5,
    slides: [
      {
        title: "Too good to be true",
        body: "The biggest red flag is a promise of high returns with little or no risk. Real investments that can grow a lot can also fall. Anyone guaranteeing big profits is either mistaken or lying.",
        callout: "Guaranteed high returns = walk away.",
      },
      {
        title: "Pressure and secrecy",
        body: "Scammers rush you: \"only today\", \"limited spots\", \"don't tell anyone\". Legitimate investments will still be there after you've taken time to check.",
      },
      {
        title: "Pump and dump",
        body: "Groups hype a little-known stock to push its price up, then sell their shares to the people who rushed in. When they stop buying, the price collapses and late buyers are left with the loss.",
      },
      {
        title: "Ponzi schemes",
        body: "A Ponzi scheme pays earlier investors with money from new ones, not from real profits. It looks great until new money slows down — then it collapses and most people lose what they put in.",
      },
      {
        title: "Impersonators",
        body: "Scammers pretend to be celebrities, banks or friends on social media and messaging apps, often asking for crypto or gift cards. A real firm won't ask you to pay in gift cards or send money to a stranger.",
      },
      {
        title: "Check before you pay",
        body: "Look up whether a firm is registered with your country's financial regulator — such as the SEC or FINRA in the US, or the FCA in the UK. If in doubt, don't invest, and report suspicious offers to the regulator.",
        callout: "Verify the firm yourself, using the regulator's official website.",
      },
    ],
    quiz: [
      {
        q: "A message promises \"guaranteed 30% a month, zero risk\". What's the right move?",
        options: ["Invest a little to test it", "Treat it as a scam and don't send money", "Invest more to get bigger returns", "Ask the sender if it's real"],
        answer: 1,
        explain: "Guaranteed high returns with no risk don't exist. That promise alone is enough to walk away.",
      },
      {
        q: "How does a pump and dump work?",
        options: ["A company pays dividends early", "A fund rebalances its holdings", "Promoters hype a stock, then sell to the buyers they attracted", "A regulator lowers interest rates"],
        answer: 2,
        explain: "The hype pushes the price up so the promoters can sell high, leaving others with the crash.",
      },
      {
        q: "Where does a Ponzi scheme get the money it pays to investors?",
        options: ["From new investors' money", "From company profits", "From the government", "From dividends"],
        answer: 0,
        explain: "It recycles new deposits as fake returns, which is why it collapses when new money dries up.",
      },
      {
        q: "Someone online asks you to pay for an investment with gift cards. What does that suggest?",
        options: ["It's a normal payment method for brokers", "It's a tax-friendly account", "It's a secure way to invest", "It's a strong sign of a scam"],
        answer: 3,
        explain: "Real investment firms don't take gift cards. Untraceable payment methods are a scammer favourite.",
      },
      {
        q: "What's a good way to check whether an investment firm is legitimate?",
        options: ["Trust the testimonials on its website", "Look it up on your financial regulator's official website", "See if it has lots of followers", "Ask the firm's own salesperson"],
        answer: 1,
        explain: "Regulators keep public registers. Check them yourself rather than relying on the firm's claims.",
      },
    ],
  }),
  lesson({
    slug: "first-investing-plan",
    title: "Your First Investing Plan",
    blurb: "Pull it all together into a simple plan.",
    minutes: 6,
    slides: [
      {
        title: "Start with a goal",
        body: "Investing works better with a purpose: a home in ten years, retirement in forty, or simply growing your savings. Your goal tells you how long the money can stay invested.",
      },
      {
        title: "Build a safety net first",
        body: "Before investing, many people keep an emergency fund in savings — often a few months of essential costs — and pay off high-interest debt. That way a surprise bill doesn't force you to sell investments at a bad time.",
        callout: "Emergency fund first, then invest.",
      },
      {
        title: "Match money to time",
        body: "Money you need within a few years usually belongs somewhere steady. Money you won't touch for many years can usually take more ups and downs in exchange for more growth potential.",
      },
      {
        title: "Know your risk comfort",
        body: "Imagine your investments falling 30% in a few months. Would you hold on? Your honest answer helps decide your mix of stocks, bonds and cash.",
      },
      {
        title: "Keep it simple and automatic",
        body: "A simple plan often works best: diversified, low-cost investments, a regular amount invested automatically, and the right tax-friendly accounts where you live.",
        callout: "Simple, cheap, automatic, diversified.",
      },
      {
        title: "Review, don't react",
        body: "Check in once or twice a year: are you on track, does your mix need rebalancing, has your life changed? Write your plan down so headlines don't rewrite it for you. This lesson is education, not personal advice.",
      },
    ],
    quiz: [
      {
        q: "Why is it useful to set a goal before investing?",
        options: ["It guarantees returns", "It tells you how long the money can stay invested", "It removes all risk", "Brokers require it by law"],
        answer: 1,
        explain: "Your goal sets your timeline, which shapes how much risk makes sense.",
      },
      {
        q: "Why do many people build an emergency fund before investing?",
        options: ["So a surprise bill doesn't force them to sell investments at a bad time", "Because savings always grow faster than stocks", "To avoid ever investing", "Because emergency funds pay dividends"],
        answer: 0,
        explain: "A cash cushion means short-term needs don't derail long-term investments.",
      },
      {
        q: "Which money is generally better suited to stock investing?",
        options: ["Rent due next month", "Money for a holiday in three months", "Money you won't need for 20 years", "Your emergency fund"],
        answer: 2,
        explain: "Long timelines give investments time to recover from drops.",
      },
      {
        q: "Your investments drop 30%. Thinking about this in advance mainly helps you...",
        options: ["Predict the next drop", "Avoid all losses", "Pick the best stock", "Choose a mix you can actually stick with"],
        answer: 3,
        explain: "Knowing your comfort with drops helps you pick a mix you won't abandon in a panic.",
      },
      {
        q: "How often does a simple plan usually need a review?",
        options: ["Every hour", "Once or twice a year, or when your life changes", "Only after a market crash", "Never"],
        answer: 1,
        explain: "Regular, calm check-ins keep you on track without reacting to every headline.",
      },
    ],
  }),
];

/** Two new questions for each original lesson, added after its first three. */
export const extraQuestions: Record<string, QuizQuestion[]> = {
  "what-is-a-stock": [
    {
      q: "Why might a company choose to sell shares to the public?",
      options: ["To raise money to grow without taking a loan", "Because the law requires every company to", "To pay its employees' taxes", "To lower its share price"],
      answer: 0,
      explain: "Selling shares raises money for growth. In return, buyers become part-owners.",
    },
    {
      q: "More people want to buy a stock than sell it. What usually happens to the price?",
      options: ["It falls", "It stays exactly the same", "It rises", "Trading stops for the day"],
      answer: 2,
      explain: "When buyers outnumber sellers, they compete by paying more, pushing the price up.",
    },
  ],
  "risk-and-reward": [
    {
      q: "What does diversification mean?",
      options: ["Putting all your money in your favourite company", "Spreading money across many investments", "Selling whenever prices fall", "Only buying stocks with high prices"],
      answer: 1,
      explain: "Spreading money out means one bad investment can't sink everything.",
    },
    {
      q: "Before investing, what's a sensible step for money you might need soon?",
      options: ["Invest it all in one volatile stock", "Borrow more to invest alongside it", "Ignore it", "Keep it in savings, like an emergency fund"],
      answer: 3,
      explain: "Money needed soon shouldn't be exposed to big drops, so many people keep an emergency fund in savings.",
    },
  ],
  "market-orders": [
    {
      q: "A stock's bid is $20.00 and its ask is $20.02. What's the spread?",
      options: ["$0.02", "$40.02", "$20.01", "$2.00"],
      answer: 0,
      explain: "The spread is the gap between the ask and the bid: $20.02 − $20.00 = $0.02.",
    },
    {
      q: "What's the main trade-off of a limit order?",
      options: ["It always fills instantly", "It costs double", "You control the price, but it might never fill", "It can only be used to sell"],
      answer: 2,
      explain: "A limit order waits for your price or better, so if the market never gets there, nothing happens.",
    },
  ],
  "day-trading-basics": [
    {
      q: "A price jumps on very low volume. What does that suggest?",
      options: ["The move is guaranteed to continue", "Few shares traded, so the move may be easier to reverse", "The market is closed", "The stock pays a dividend"],
      answer: 1,
      explain: "Low volume means fewer people backed the move, so it can fade more easily.",
    },
    {
      q: "Why are the first and last 30 minutes of the trading day often the jumpiest?",
      options: ["Prices are frozen then", "Only beginners trade then", "Fees are lower then", "News gets priced in and big funds trade then"],
      answer: 3,
      explain: "The open and close are when a lot of orders and news hit the market at once.",
    },
  ],
  "day-trading-risk": [
    {
      q: "You'll risk $200 and your stop-loss is $2 below your entry price. How many shares fit that plan?",
      options: ["400", "50", "100", "200"],
      answer: 2,
      explain: "Shares = risk ÷ distance to stop = $200 ÷ $2 = 100 shares.",
    },
    {
      q: "Why do spread and slippage matter more to day traders than long-term investors?",
      options: ["Day traders pay these small costs many times a day", "Long-term investors don't pay any costs", "They only apply to day trades", "They're refunded to investors"],
      answer: 0,
      explain: "Small costs repeated across many trades add up quickly.",
    },
  ],
  "day-trading-advanced": [
    {
      q: "What is VWAP?",
      options: ["The highest price of the day", "A type of stop-loss", "The average price paid today, weighted by volume", "The price at yesterday's close"],
      answer: 2,
      explain: "VWAP weights each price by how many shares traded there, giving the day's average price paid.",
    },
    {
      q: "A rising stock keeps stalling around the same price as sellers show up. What's that level called?",
      options: ["Support", "Resistance", "The spread", "A dividend"],
      answer: 1,
      explain: "Resistance is where rising prices have stalled before because sellers stepped in.",
    },
  ],
};
