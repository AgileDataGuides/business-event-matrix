# Business Event Matrix Ships a Security Hardening Pass

**29 April 2026**

AgileDataGuides today released a security hardening pass for the Business Event Matrix covering dependency CVE patches, the removal of an abandoned package, server-side request validation, branch protection, and a published security policy. The threat model — local-only dev tool — hasn't changed; this release closes the gaps that existed even within that model.

## The Problem

A security review identified seventeen open vulnerabilities in the BEM's dependency tree, including two unfixed high-severity CVEs in the abandoned `xlsx` package (prototype pollution + ReDoS). The API endpoints accepted an unbounded request body. The body-size check trusted the client-supplied `Content-Length` header, which chunked requests could trivially bypass. The `main` branch had no protection against accidental force-push or deletion. There was no public security policy, so vulnerability reporters had no clear way to reach us privately.

## The Solution

A focused hardening pass landed nine commits across two days, closing every issue in the review:

- **Dependency CVE patches** — `@sveltejs/kit` bumped to 2.58.0, `vite` to 7.3.2, plus monorepo-wide pnpm overrides forcing `dompurify` ≥3.4.0, `cookie` ≥0.7.0, `postcss` ≥8.5.10, and `uuid` ≥14.0.0 for transitive vulnerabilities.
- **`xlsx` replaced with `exceljs`** — the abandoned `xlsx` package is gone; `exceljs` handles XLSX export. A CI guardrail script blocks any reintroduction by failing `pnpm check` if a future contributor tries to import `xlsx` or call its read APIs.
- **Server-side body size cap** — the inline `Content-Length` check is replaced with a shared `readJsonBody()` helper that reads the body as text, caps it at 5 MB server-side, and returns a 413 if exceeded. Both POST and PUT use it.
- **PUT id reconciliation** — saving a model now forces `model.id = params.id` to prevent on-disk drift between filename and internal id.
- **Stricter request validation** — `isValidModel` now structurally validates that `domains`, `events`, and `concepts` arrays are actually arrays before writing to disk.
- **Local-only commitment reinforced** — comments in `vite.config.ts` and a banner in the start scripts explicitly call out that the dev server binds to loopback and must not be exposed to a LAN.
- **`SECURITY.md`** — a public security policy stating the threat model, supported versions, the private vulnerability reporting address (`shane.gibson@agiledata.io`), and what's intentionally out of scope vs. in.
- **Dependabot** — a config that watches `package.json` and the GitHub Actions workflow weekly for vulnerable updates.
- **Branch protection** — a ruleset on `main` blocks force-push, deletion, and merge commits (linear history required), applying to admins as well.

## How It Works

`pnpm audit` reports 0 vulnerabilities for the BEM after this pass. Dependabot runs every Monday at 09:00 NZ time and opens grouped PRs for patch + minor updates so the dependency tree stays current. The CI guardrail (`scripts/check-no-xlsx-read.sh`) is wired into `pnpm check` and fails CI if `xlsx` is reintroduced.

## Key Benefits

- **Zero open CVEs** — `pnpm audit` clean as of this release
- **Abandoned package removed** — no more `xlsx` in the tree, with a guardrail to keep it that way
- **Reliable body size cap** — server-side check, can't be bypassed by chunked requests
- **Stricter validation** — malformed POSTs can't write garbage that crashes future GETs
- **Public security policy** — `SECURITY.md` documents the threat model and the private reporting path
- **Branch protection** — accidental force-push or deletion of `main` is now impossible
- **Dependabot active** — the dependency tree stays current automatically
- **Threat model unchanged** — still local-only, still no auth needed; this pass closes gaps within the existing model rather than expanding it

The security hardening pass is available now in the latest release.
