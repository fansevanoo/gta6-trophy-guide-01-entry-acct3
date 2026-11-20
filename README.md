# The Platinum Vault

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/fansevanoo/gta6-trophy-guide-01-entry-acct3/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/fansevanoo/gta6-trophy-guide-01-entry-acct3/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

A navy and gold museum for the 55 GTA VI PS5 trophies. Enter four grade halls, inspect cited acquisition notes, and maintain separate Jason and Lucia collections. Independent guide, MIT licensed, with original interface art and no Rockstar assets.

## Use

Serve `app/` with any static server and open `index.html`. All runtime files are local; there are no remote requests, external fonts or external links in the app. A browser using direct `file://` access must permit local-file reads; the verification scripts enable Chromium's `--allow-file-access-from-files`. Standard static hosting requires no special flags.

Progress and meditation counters persist in localStorage. Export a JSON save for backup and import it to restore. Share serializes the collection to the URL hash; the link contains your progress but no account identity. Print generates a spoiler-aware checklist. The spoiler shield protects every hidden trophy until earned, individually opened or globally revealed.

Keyboard: `j` / `k` move between exhibits, `x` toggles the selected trophy, `/` focuses search. Inputs retain their normal typing behavior. Visible keyboard focus, semantic controls, high-contrast text and responsive layouts support WCAG AA use.

## Evidence

The data was authored from `trophies.md` and `sources.md` in the supplied research repository, read in this session. Exact official names/descriptions follow that record; all guides and steps are freshly paraphrased. 18 numbered sources resolve inside the offline Sources panel. Eight were full reads and ten detailed excerpts in the supplied research. The panel records all ten disagreements and clearly distinguishes unresolved triggers from verified identity data. No claim of direct gameplay testing or Rockstar authorship is made.

The Chapter 1 balcony meditation is a precaution, not a confirmed necessity. Fair Game's exact animal trigger remains unresolved. Time estimates are approximate; remaining hours are a simple count-weighted estimate rather than a measured gameplay model. The planner prioritizes an unearned #28 before other work and offers queues for 30/60/120-minute sessions; completing every queued trophy within that time is not guaranteed.

## Build and verify

Use Node 22.23.4 from `/home/hatch/workspace/tools/node-v22.23.4-linux-x64/bin` on PATH.

```
node verify-data.mjs
node verify-browser.mjs
node take-shots.mjs
MAKEFUN_OUTPUT_DIR=/tmp/trophy-out-acct3 node main.ts
```

The scripts use the preinstalled Playwright Core and Chromium headless shell. Screenshots are the only generated binary assets. `main.ts` copies the app and final screenshots, then writes a deterministic dossier with the unchanged vendored library. No dependency installation or network is required. `shots.json` identifies the four 1280 × 800 views and the first-name cover.

Owner metadata and the vendored library are preserved. No submission, seal, push or commit is performed by this build.
