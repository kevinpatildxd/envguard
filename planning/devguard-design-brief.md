# devguard — UI Design Brief

## Goal
Redesign the devguard marketing website (`docs/` folder) to be significantly more polished, modern, and visually impressive. The current site has good bones but needs better visual hierarchy, section differentiation, social proof, illustrations, and micro-interactions.

Produce a single `index.html` file with embedded CSS and JS. Dark theme. No external dependencies except Google Fonts (Inter + JetBrains Mono).

---

## Product Summary
- **Name:** devguard
- **npm:** `@kevinpatil/devguard`
- **Version:** v2.0.0
- **Tagline:** One command to guard your project
- **What it does:** CLI tool that validates `.env` files, audits npm dependencies, and statically analyzes React code — all in one command, zero config, no API keys, works offline
- **GitHub:** `https://github.com/kevinpatildxd/devguard`
- **npm page:** `https://www.npmjs.com/package/@kevinpatil/devguard`

---

## Current Design System (keep or evolve)

| Token | Value |
|---|---|
| Background | `#0a0b0d` |
| Surface 1 | `#0f1014` |
| Surface 2 | `#141519` |
| Border | `#1e2028` / `#252830` |
| Text | `#e2e4ea` |
| Muted | `#6b7280` |
| Accent Green | `#22c55e` |
| Yellow | `#eab308` |
| Red | `#ef4444` |
| Blue | `#3b82f6` |
| Purple | `#a855f7` |
| Heading font | Inter 800 |
| Body font | Inter 400/500 |
| Mono font | JetBrains Mono |

---

## Improvements Needed

1. **Section differentiation** — alternate slightly different bg colors between sections, add subtle gradient dividers
2. **Hero illustration** — add an abstract SVG (shield, grid, or isometric code diagram) alongside the terminal
3. **Social proof strip** — npm weekly downloads, GitHub stars counter (hardcode plausible numbers if needed)
4. **Comparison table** — devguard vs doing it manually (depcheck + ESLint + npm audit + manual .env review)
5. **Feature card icons** — replace emoji with crisp inline SVG icons, color-coded per module
6. **Better mobile nav** — slide-in drawer instead of hiding nav links
7. **Scroll progress bar** — thin green line at very top of page
8. **CTA banner before footer** — "Star on GitHub" or "Try it now" call-to-action
9. **Micro-interactions** — tab underline slide animation, card glow on hover, smooth everything
10. **Typography scale** — stronger contrast between h1, h2, body, and captions

---

## All Page Sections

### 1. Navigation (fixed)
- Blurs on scroll (backdrop-filter)
- Logo: shield icon + "devguard"
- Links: Features · Modules · Install · GitHub (button)
- On mobile: hamburger menu → slide-in drawer

---

### 2. Hero Section

**Announcement badge (pill):**
`● v2.0.0 — now with React a11y & RSC checks`

**H1:**
```
One command to
guard your project
```
("guard your project" = animated gradient: green → light green → blue)

**Subheading:**
```
Validates env files, audits dependencies, and checks React code quality —
all in one fast CLI. No config files. No API keys. Works offline, in Docker, everywhere.
```

**CTA row:**
- Primary: install box showing `$ npx @kevinpatil/devguard` with a copy-to-clipboard button
- Secondary: "View on GitHub ↗" outlined button

**Terminal demo** (animated typewriter, plays when scrolled into view):
```
$ npx @kevinpatil/devguard

devguard v2.0.0 — scanning project...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ENV AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✗ DATABASE_URL — Missing required key
  ✗ JWT_SECRET — Insecure value: 'secret'
  ⚠ PORT — Expected number, got 'abc'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DEPS AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✗ moment — imported nowhere in source
  ⚠ axios — 0.27.0 → 1.7.2
  ✗ express@4.18.0 CVE-2024-29041 High

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  REACT AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠ Home.tsx:42 — inline object prop causes re-renders
  ✗ Avatar.tsx:12 — <img> missing alt attribute

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  4 errors  3 warnings  9 passed
  Fix errors before deploying. Run with --json for CI.
```

**Background effects:**
- Two large blurred radial gradient glows (green top-left, purple bottom-right), gently floating with CSS animation
- Full-screen canvas with 80 drifting particles (green + white dots, draw lines between particles < 120px apart)

---

### 3. Stats Strip

4 animated count-up numbers (eased, 1.2s, trigger on IntersectionObserver):

| Number | Label |
|---|---|
| 8 | Env validation rules |
| 4 | Dep audit checks |
| 6 | React audit modules |
| 0 | API keys needed |

---

### 4. Features Section

**Section tag:** `Why devguard`
**H2:** Replace five tools with one
**Body:** Stop juggling depcheck, npm-check, npm audit, ESLint, and manual .env reviews. One command covers all of it.

**6 cards in a 3-column grid:**

| Icon | Title | Body |
|---|---|---|
| key SVG | Env Validation | Catches missing keys, insecure defaults, type mismatches, weak secrets, and cross-env inconsistencies before your app ships. |
| box SVG | Dep Auditing | Finds unused packages, outdated versions, real CVEs via OSV.dev, and suggests lightweight alternatives with size savings. |
| atom SVG | React Analysis | Dead imports, re-render risks, hooks rule violations, bundle size, accessibility issues, and RSC boundary bugs — all static, no browser needed. |
| rocket SVG | CI Ready | Exit with code 1 on errors via `--strict`. JSON output for custom pipelines. Works in Docker, GitHub Actions, any CI. |
| signal SVG | Works Offline | Local disk cache at `~/.devguard/cache.json` with 24hr TTL. Repeated runs are near-instant and fully offline-friendly. |
| bolt SVG | Zero Config | No config files, no API keys, no setup. Run `npx @kevinpatil/devguard` in any project and get a full report in seconds. |

---

### 5. Modules Section (tabbed)

**Section tag:** `Modules`
**H2:** Every check, one tool

**3 tabs:** `env` · `deps` · `react`

Each tab = left info column + right mini terminal

---

#### Tab: env

**Title:** `devguard env`
**Body:** Validates all your `.env` files against `.env.example`. Catches config bugs before they hit production.

**Rules:**
- ERROR — Missing required key
- ERROR — Empty value
- ERROR — Insecure placeholder (`changeme`, `secret`)
- WARN — Undeclared key
- WARN — Type mismatch (PORT should be a number)
- WARN — Malformed URL
- WARN — Weak secret length
- WARN — Boolean mismatch

**Command:** `npx @kevinpatil/devguard env`

**Terminal:**
```
$ devguard env

── .env ──────────────────────
  ✗ DATABASE_URL — Missing required key
  ✗ JWT_SECRET — Insecure value: 'secret'
  ⚠ PORT — Expected number, got 'abc'
  ⚠ STRIPE_KEY — Not in .env.example

── .env.staging ──────────────
  ✔ All checks passed

✗ 2 error(s) across 2 file(s)
```

---

#### Tab: deps

**Title:** `devguard deps`
**Body:** Full dependency health audit. Unused packages, outdated versions, real CVEs, and lighter alternatives.

**Checks:**
- CHECK — Unused package detection (AST-based)
- CHECK — Outdated version scanner (npm Registry)
- CHECK — Vulnerability audit (OSV.dev, free)
- INFO — Lightweight alternative suggestions

**Command:** `npx @kevinpatil/devguard deps`

**Terminal:**
```
$ devguard deps

── UNUSED (2) ────────────────
  ✗ moment — imported nowhere
  ✗ lodash — imported nowhere

── OUTDATED (1) ──────────────
  ⚠ axios  0.27.0 → 1.7.2

── VULNERABILITIES (1) ───────
  ✗ express@4.18.0  CVE-2024-29041

── ALTERNATIVES ──────────────
  ⚡ moment → dayjs  saves 65KB
```

---

#### Tab: react

**Title:** `devguard react`
**Body:** Six React audit checks — all static analysis, no browser, no runtime. Works on any React or Next.js project.

**Modules:**
- react:imports — Dead components & unused imports
- react:rerenders — Inline objects, arrow fns in JSX
- react:hooks — Rules of hooks violations
- react:bundle — Heavy packages & alternatives
- react:a11y — Accessibility static scan
- react:server — RSC boundary violations

**Command:** `npx @kevinpatil/devguard react`

**Terminal:**
```
$ devguard react

── IMPORTS ───────────────────
  ✗ OldModal.tsx — dead component

── RERENDERS ─────────────────
  ⚠ Home.tsx:42 — inline object prop

── HOOKS ─────────────────────
  ✗ Form.tsx:31 — hook inside if block

── A11Y ──────────────────────
  ✗ Avatar.tsx:12 — img missing alt
```

---

### 6. Comparison Table (NEW — add this)

**H2:** One tool. No compromises.
**Body:** Here's what you'd need to replace devguard:

| Check | devguard | Without devguard |
|---|---|---|
| Env validation | ✔ built-in | ✘ manual review |
| Unused deps | ✔ built-in | depcheck |
| Outdated deps | ✔ built-in | npm-check |
| CVE scan | ✔ built-in | npm audit / Snyk |
| React lint | ✔ built-in | ESLint + plugins |
| Accessibility | ✔ built-in | axe / eslint-plugin-jsx-a11y |
| RSC checks | ✔ built-in | nothing |
| Config needed | ✔ none | multiple config files |
| API keys | ✔ none | Snyk requires sign-up |

---

### 7. CI Integration Section

**Section tag:** `CI Integration`
**H2:** Ship with confidence
**Body:** Add devguard to your pipeline in one line. Exits with code 1 on any error so broken builds never reach production.

**CI platform badges:** GitHub Actions · GitLab CI · CircleCI · Docker · Any CI

**YAML code block:**
```yaml
- name: Run devguard
  run: npx @kevinpatil/devguard --strict

# JSON output for custom pipelines
- name: Guard (JSON)
  run: npx @kevinpatil/devguard --json \
         | jq '.files[].issues[]'
```

---

### 8. Get Started / Install Section

**Section tag:** `Get Started`
**H2:** Up in seconds

**3 step cards:**

| # | Title | Body | Code |
|---|---|---|---|
| 01 | No install needed | Run instantly with npx. No global install, no setup, no config file. | `$ npx @kevinpatil/devguard` |
| 02 | Or add as dev dep | Install once, run as a script. Pairs perfectly with pre-commit hooks. | `$ npm i -D @kevinpatil/devguard` |
| 03 | Run specific checks | Target exactly what you need. Every module works standalone. | `$ npx @kevinpatil/devguard env` |

---

### 9. Pre-footer CTA Banner (NEW — add this)

**H2:** Ready to guard your project?
**Body:** Catch bugs before they ship. Free, open source, forever.
**CTA:** `$ npx @kevinpatil/devguard` (copy button) + "Star on GitHub ★" button

---

### 10. Footer

- Logo: shield icon + "devguard" + `v2.0.0` pill
- Links: GitHub · npm · Issues · Contribute
- Copyright: `MIT © Kevin Patil`

---

## All Animations & Interactions

| Behavior | Trigger | Detail |
|---|---|---|
| Nav blur | scroll > 20px | backdrop-filter blur, border appears |
| Scroll progress bar | scroll | thin green line at very top |
| Reveal fade-up | IntersectionObserver | 0.7s cubic ease, 32px Y translate, 60ms stagger per group |
| Count-up numbers | IntersectionObserver 50% | 1.2s ease-out cubic |
| Copy button | click | icon swaps to checkmark, resets after 2s |
| Module tabs | click | panel switches, tab underline slides |
| Terminal typewriter | IntersectionObserver 30% | lines fade + slide in with per-line delays, blinking cursor |
| Particle canvas | always | 80 particles, slow drift, green lines < 120px |
| Hero glows | always | two blobs float with CSS keyframe loops |
| Gradient text | always | background-position shift, 4s loop |
| Feature card hover | hover | lift translateY(-4px), green border glow |
| Stat card hover | hover | lift translateY(-3px) |
| Mobile nav drawer | hamburger click | slide in from right |

---

## File Output Requirements

- Single `index.html` file with all CSS in `<style>` and all JS in `<script>` at bottom
- Fonts via Google Fonts CDN (Inter + JetBrains Mono)
- No other external dependencies
- Fully responsive: desktop (1100px max), tablet (900px), mobile (620px)
- Accessible: semantic HTML, aria labels on interactive elements, alt text
- All links use the real URLs listed above
