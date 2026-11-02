# Swift Bank Adherence

A coded prototype of an office-adherence dashboard for a fictional global bank, built for a product case study. Every number is computed in the browser from a seeded dataset, so every visitor sees the same story.

## Run it

```bash
npm install
npm run dev          # local dev server
npm run build        # type-check and build the static site into dist/
npm run build:single # one self-contained HTML file in dist-single/, handy for quick previews
```

## Deploy on Railway

1. Push this folder to a GitHub repo and create a Railway service from it.
2. Railway detects Node. Set the build command to `npm run build` and the start command to `npm start`.
3. `npm start` serves `dist/` on Railway's `$PORT`. Add a custom domain under the service's Settings > Networking.

## Deep links

View state lives in the URL, so the case study can link straight to a persona and window:

- `?as=priya` · `?as=kenji` · `?as=marcus` · `?as=catherine`
- `&w=1M` · `3M` · `6M` · `1Y`

## How the data works

- `src/data/generate.ts` builds four persona org trees (Priya 7, Kenji 4, Marcus 140, Catherine 2,400) with 104 weeks of person-weeks each. People are modeled as habitual: each team's profile sets what share of its people are regulars, which keeps team numbers stable week to week. The story beats (Jordan's slide, Alex's missing PTO, Rafael's decline, Ana's climb, the EMEA leave-feed delay, Frankfurt as the lowest office) are seeded on purpose.
- `src/data/adherence.ts` holds the rules: a week is adherent with 3+ credit days; adherence is adherent weeks divided by counted weeks; weeks with missing feed data are flagged and left out of trend calculations.
- `src/data/model.ts` turns a persona and window into everything Home shows, including the plain-language headlines.

## What's built

- Home for all three tiers (Team, Org, Enterprise) with the demo view switcher
- Time windows: 1M, 3M, 6M, 1Y, with month-sized heatmap cells past 13 weeks
- Sorted tables with expandable team rows, heatmap tooltips, and trend
- Regions and offices (Enterprise), offices and stats (Org)
- Incomplete-data treatment and notice
- Message and Escalate composer (simulated; nothing is sent)

Next: People, Managers, Locations, Data status, How it works, and the "before" screen.
