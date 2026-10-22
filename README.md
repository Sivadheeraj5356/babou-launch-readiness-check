# Launch Readiness Check

A client-side heuristic review for ship-to-marketing workflows, built with Babou's problem in mind: every deploy is potential marketing, but only if someone spots the campaign-worthy change and the launch kit is actually complete.

Paste release-note entries as `change | <text>` and launch-kit items as `asset | <text>`, one per line, and the tool flags:

- **CAMPAIGN_SIGNAL** - a change that reads as user-facing, a possible campaign candidate
- **INTERNAL_CHANGE** - a change that reads as chore/refactor-style, probably not campaign material
- **TOO_MANY_SIGNALS** - more candidates than a focused launch narrative usually carries
- **MISSING_DEMO / MISSING_SOCIAL / MISSING_DOC_LINK** - campaign candidates exist but that launch piece is not listed
- **NO_CAMPAIGN_SIGNAL** - no user-facing wording in the release at all
- **UNPARSED** - lines that do not match the expected format

Plain HTML, CSS and JavaScript. No build step, no external services.

## Run

Open `index.html` in a browser, paste changes and assets, click "Run readiness check".

## Test

```
npm test
```

## Limitations

This is a keyword-level heuristic screen, not a marketing judgement:

- It matches wording patterns; whether a change actually matters to users is a product decision. Every finding says "verify".
- A campaign-worthy change written in dry language will be missed; an internal chore written in launch language will be flagged.
- It checks that launch assets are listed, not that they exist, are good, or are done.
- Tests verify the rules match their intended sample patterns; they do not prove real launches are assessed correctly.
