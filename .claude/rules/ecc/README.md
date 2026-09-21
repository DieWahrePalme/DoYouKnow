# ECC Rules (imported subset)

This directory is a curated import from [github.com/affaan-m/ecc](https://github.com/affaan-m/ecc)
(commit `bf70150`), following that project's own documented convention for
project-local rules (`rules/README.md` → "For project-local rules, use the
same namespace under the project root: `.claude/rules/ecc/`").

Only `common/`, `typescript/`, and `react-native/` were imported — the other
~20 language rulesets in upstream ECC (Python, Go, Swift, PHP, Ruby, Vue,
Angular, ArkTS, …) don't apply to this project and were left out on purpose.

## What these are

Rules are always-relevant standards and checklists ("what to enforce"), as
opposed to the paired Skills under `.claude/skills/` ("how to do it"). Nothing
here is auto-loaded into every turn — read the relevant file(s) when doing
non-trivial TypeScript/React Native work, a code review, or a security-
sensitive change, the same way you'd consult a style guide.

When `common/` and a language-specific file disagree, the language-specific
file wins (documented upstream as "specific overrides general").

## Project-specific deviations from the upstream text

The files below were copied close to verbatim (they're good, accurate
reference material), but a few things assumed by ECC don't hold for this
project. Read this before treating any of the below as a hard rule here:

1. **`common/agents.md` was deliberately NOT imported.** It documents ECC's
   full plugin (68 agents, invoked as `ecc:planner`, `ecc:code-reviewer`,
   etc.) — this project only imported four plain agents directly
   (`.claude/agents/planner.md`, `security-reviewer.md`, `react-reviewer.md`,
   `tdd-guide.md`), invoked by their own name with no `ecc:` prefix. Do not
   reference or expect any other agent from ECC's roster to exist here.

2. **Commit attribution.** `common/git-workflow.md` mentions ECC-managed
   installs disabling the `Co-Authored-By` trailer by default. **Ignore that
   for this project** — this session has a standing instruction to always
   append a `Co-Authored-By: Claude Sonnet 5 <...>` + `Claude-Session:` footer
   to commits it creates. That instruction wins.

3. **No custom backend.** This is Expo/React Native + Supabase with zero
   custom API server. Anywhere a rule says "rate limiting on all endpoints,"
   "CSRF protection," or similar server-middleware advice (`common/security.md`,
   `typescript/security.md`'s cross-references), read it as not applicable —
   the real gate is Postgres Row Level Security in `supabase/schema.sql`.

4. **No test suite yet.** `common/testing.md`, `common/code-review.md`, and
   the `react-native/testing.md`/`production-readiness.md` 80%-coverage and
   RED-GREEN-REFACTOR requirements are aspirational for this project today —
   there is no Jest/Vitest config or test file yet. Don't treat "tests exist
   for new functionality" as a blocking requirement unless the user has asked
   for tests. See `.claude/skills/tdd-workflow/SKILL.md`'s project note for
   the fuller version of this caveat, including why "auto-commit a checkpoint
   per TDD stage" must NOT be followed here (conflicts with this session's
   "never commit unless asked" rule).

5. **Web-only today, not yet native.** `react-native/production-readiness.md`
   assumes EAS Build/Update, Sentry crash reporting, and physical-device
   testing. This project currently ships only as a static web export to
   GitHub Pages (see `.github/workflows/deploy-pages.yml`) — no EAS project,
   no native builds, no Sentry configured. Treat that section as the target
   state for if/when this becomes a real native app, not current process.

6. **Tooling in `common/development-workflow.md`.** It recommends `gh search
   code`, Context7, and Exa for research. This session doesn't have `gh` CLI
   or Exa configured — use `mcp__github__search_code` and this session's
   `WebSearch`/`WebFetch` tools (via `ToolSearch`) instead where equivalent.

Everything else — coding style, immutability, Zod validation, RN
accessibility, performance, the New Architecture / SDK 55+ notes, the
Supabase-secrets guidance in `react-native/security.md` — applies as written
and is consistent with this project's existing `AGENTS.md` (Expo SDK 57,
versioned docs) and `CLAUDE.md`.
