---
name: Design subagent context limits
description: Large task briefs (full admin dashboards, 10+ pages) cause the design subagent to hit its context limit and block. Build directly instead.
---

## Rule
For admin dashboards or any task with 10+ pages, do NOT dispatch the design subagent. Write all files directly from the main agent.

**Why:** The design subagent has a context budget. A full brief (Clerk setup + 10 pages + all hook signatures) exceeds it, causing a "blocked" error mid-run that requires user intervention.

**How to apply:** If the task involves more than ~5 pages with complex auth setup, skip `subagent({ $kind: "design" })` and write all files yourself in parallel WriteFile batches.
