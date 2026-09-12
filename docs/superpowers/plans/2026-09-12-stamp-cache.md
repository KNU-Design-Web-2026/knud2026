# Stamp cache Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task in this session.

**Goal:** Reduce repeated draws of unchanged contiguous spray stamps without shortening their lifetime.

**Architecture:** Extract the existing draw loop as a reference renderer. Cache sealed, contiguous groups in device-pixel-aligned, bounded canvases only while all stamps remain in their hold phase and have no drips. Return to reference rendering when any member changes; preserve original order.

**Tech Stack:** Next.js, TypeScript, Canvas2D, existing ImageBitmap texture cache, Node tests and Chromium pixel QA.

**Spec:** User-approved design in this conversation (unchanged groups cached; dynamic drips/fades individually rendered; bounded memory; reference fallback).

## Global Constraints

- 5.4-second hold, 6.6-second total lifetime; preserve input, particles, density, draw order and DPR.
- No main merge or production promotion. Branch, commits, push and PR only.
- No dependency additions. Existing linked worktree reused, branch from b322f9b.
- Cached intermediate surfaces can introduce 8-bit rounding; compare against the reference and report differences honestly, never claim pixel equality without proof.

## Tasks

- [ ] Test sealed group selection: use 64 ordered stamps, expect two stable groups; mark a middle stamp with a drip and expect only its group to fall back; expire early stamps without reassigning later groups. First run must fail before implementation.
- [x] Implement `createStampGroups().select(stamps, isStatic)` in `spray-stamp-groups.ts`. Assign monotonic IDs with a WeakMap, group 32 consecutive IDs, require all 32 and all hold/no-drip. Renderer supplies the time predicate; `clear()` resets ownership.
- [ ] Extract `drawPaintStamp(context, stamp, now, textures)` into `spray-renderer.ts`, preserving stamp→drip order verbatim. Add `createSprayRenderer(context, textures, options).render(stamps, now, width, height, dpr)` and `.clear()`. Use 16 MiB total cache pixel budget, device-aligned clipped bounds, allocation failure fallback, release unused/invalid surfaces each frame.
- [ ] Browser test the reference and cache renderer using identical seeded stamps, multi-color overlaps, rotations, drips appearing after caching, hold/fade/expiry times, resize/clear and budget fallback. Assert draw reduction and budget without assuming speedup. Save actual PNG and JSON evidence; test a missing-cache baseline first.
- [ ] Integrate renderer in SprayCanvas; clear on resize, blur/hidden and Effect cleanup. Retain texture cache lifecycle.
- [ ] Run model/group tests, pixel QA, page functional QA, lint/type-check/build, diff review. If visual parity fails materially, stop rather than quietly change the effect.
- [ ] Commit implementation, tests, documentation separately with Korean bodies. Push and create PR against main with measured functional evidence and unmeasured performance clearly separated.

## Execution record

Implementation and targeted validation completed in this session. Group tests failed before implementation (3/3); renderer reuse test failed against the reference-only implementation before adding caching. Targeted Node tests 15/15 pass. Chromium reference comparison and actual page functional QA pass; report includes small intermediate-compositing differences rather than claiming identical pixels. Independent read-only review found no blocking production issue; two QA gaps (visible-drip fallback and implicit resize invalidation) were fixed. Full Node suite has 114/115 passing; the same unrelated mobile background assertion fails on clean baseline b322f9b. See the design record for exact limits and evidence. Integration choice was supplied by the user: push and PR only; no merge.
