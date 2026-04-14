# EnvGuard — GitHub Setup Guide (Open Source)

A complete, step-by-step guide to setting up the envguard repo the right way for open source.

---

## 1. Create the GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `envguard`
   - **Description:** `Zero-dependency CLI to validate .env files before your app ships`
   - **Visibility:** Public
   - **DO NOT** check "Add a README" (you'll push your own)
   - **Add .gitignore:** Node
   - **License:** MIT
3. Click **Create repository**

---

## 2. Initialize Git Locally

```bash
cd ~/Desktop/envguard
git init
git remote add origin https://github.com/YOUR_USERNAME/envguard.git
```

---

## 3. Create a .gitignore

```bash
printf 'node_modules/\ndist/\n.env\n.env.local\n.env.*.local\n*.tsbuildinfo\ncoverage/\n' > .gitignore
```

---

## 4. Set Up Branch Protection (main branch)

> **Do this AFTER step 9 (first push).** GitHub only shows status check names once the CI workflow has run at least once. If you do this now, you'll get: *"Required status checks cannot be empty."*

Go to: **Settings → Branches → Add rule**

- **Branch name pattern:** `main`
- Check: **Require a pull request before merging**
- Check: **Require status checks to pass before merging**
  - Search for and add: `test` (this appears after your first CI run)
- Check: **Do not allow bypassing the above settings**
- Click **Save changes**

This prevents direct pushes to main and enforces CI passes on PRs.

---

## 5. Add Repository Topics (for discoverability)

Go to the repo homepage → click the gear icon next to "About"

Type each topic separately and press **Space** or **Enter** after each one:

```
nodejs
cli
dotenv
environment-variables
devtools
typescript
npm-package
developer-tools
configuration
```

---

## 6. Configure npm Publishing Secret

You need an npm token so GitHub Actions can publish automatically.

1. Go to https://www.npmjs.com → Avatar → **Access Tokens**
2. Click **Generate New Token** → **Classic Token** → type: **Automation**
3. Set expiration to **90 days** (the maximum — default is only 7 days)
4. Copy the token
5. Go to GitHub repo → **Settings → Secrets and variables → Actions**
6. Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: (paste your npm token)
7. Click **Add secret**

> **Note:** npm does not support non-expiring tokens for security reasons. Set a calendar reminder to regenerate this token every 90 days and update the GitHub secret, otherwise your publish workflow will silently fail.

---

## 7. GitHub Actions Workflows

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test
```

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          registry-url: https://registry.npmjs.org
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 8. Add Open Source Community Files

These make your project look professional and encourage contributions.

### LICENSE (MIT)
```
MIT License

Copyright (c) 2026 YOUR_NAME

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### CONTRIBUTING.md
Create a file explaining:
- How to fork and clone
- How to run tests (`npm test`)
- How to submit a PR (branch off `main`, one feature per PR)
- Code style expectations

### .github/ISSUE_TEMPLATE/
Create two templates:
- `bug_report.md` — for bug reports
- `feature_request.md` — for feature ideas

### .github/PULL_REQUEST_TEMPLATE.md
A simple checklist contributors fill out when opening a PR.

---

## 9. First Commit & Push

```bash
git add .
git commit -m "chore: initial project setup"
git branch -M main
git push -u origin main
```

---

## 10. Publishing to npm

When ready to publish v1.0.0:

```bash
# Bump version in package.json to 1.0.0
npm version 1.0.0

# This creates a git tag v1.0.0 automatically
git push origin main --tags

# GitHub Actions will detect the tag and run publish.yml
```

Or publish manually:
```bash
npm run build
npm publish --access public
```

---

## 11. After Launch — Getting Users

- Post on **Dev.to**: "I built a free CLI to catch .env mistakes before production"
- Share in **r/node**, **r/javascript**, **r/webdev**
- Add to **awesome-nodejs** list (open a PR)
- Submit to **GitHub Action marketplace** (free listing)
- Tweet the terminal output screenshot

---

## Checklist Summary

- [ ] Repo created on GitHub (public, MIT license)
- [ ] Git initialized locally, remote added
- [ ] Branch protection on `main`
- [ ] Topics added to repo
- [ ] `NPM_TOKEN` secret added
- [ ] `ci.yml` and `publish.yml` workflows created
- [ ] `LICENSE`, `CONTRIBUTING.md`, issue templates added
- [ ] First commit pushed to main
- [ ] v1.0.0 published to npm
