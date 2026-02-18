# WeCom Weekly Update Composer

A lightweight Next.js MVP for teachers to turn rough English notes into structured weekly updates for WeCom.

## Current MVP Status

- [x] Single-page composer UI at `/`
- [x] Template + tone controls
- [x] Notes input with validation and character count
- [x] Generate flow with loading + error states
- [x] Tabbed outputs: Bilingual / Chinese / English / Captions
- [x] Copy per-tab output
- [x] Structured API generation endpoint at `app/api/generate/route.ts`
- [x] Local CI command (`npm run ci`) and GitHub Actions CI on push/PR

## MVP Roadmap

### Phase 1: Core Composer (Complete)
- Build responsive input/output UI
- Add `/api/generate` API route
- Return placeholder content fields and wire to tabs
- Add copy workflow and generation error handling

### Phase 2: Output Quality (Complete)
- Add realistic weekly-update section structure:
  - Greeting
  - Learning Highlights
  - Activities and Projects
  - Homework
  - Reminders
  - Next Week Preview
  - Closing
- Add tone behavior (warm/professional/short)
- Add template behavior for 6 teacher scenarios
- Add concise parent-facing Chinese output

### Phase 3: MVP Hardening (Complete)
- Add CI workflow at `.github/workflows/ci.yml`
- Keep code dependency-light and type-safe
- Ensure `npm run ci` passes locally and in GitHub Actions

## Next Phase (Post-MVP)

- Integrate real LLM generation behind `/api/generate`
- Add result editing before copy
- Add downloadable/exportable output formats
- Add prompt/version logging for quality tuning
- Add auth/workspace support if moving beyond single-user prototype

## Local Development

```bash
npm ci
npm run dev
```

Open: `http://localhost:3000`

## Validation

```bash
npm run ci
```
