# Mobile UX Audit – Cash Rocket

## Scope and approach
This audit reviews the current single-page app structure and styling with a mobile-first lens, based on the existing `index.html`, `styles.css`, and `app.js` implementation.

## Top-priority issues (high impact)

1. **Bottom navigation likely has tap-target and safe-area risks**
   - The mobile UI depends on a bottom nav with multiple actions plus a floating add button.
   - Recommendation:
     - Ensure all tap targets are at least **44x44px**.
     - Add `padding-bottom: env(safe-area-inset-bottom)` support for iOS devices.
     - Reserve content space so lists/charts never hide behind the nav.

2. **`100vh` usage can cause layout jump on mobile browsers**
   - Auth and modal surfaces rely on viewport-height sizing.
   - Recommendation:
     - Replace key full-height sections with modern viewport units (`100dvh`, `100svh`) and fallback logic.
     - Validate behavior during scroll and keyboard-open states on iOS Safari + Chrome Android.

3. **Visual hierarchy is desktop-heavy in some sections**
   - Dashboard cards and dense sections can feel crowded on narrow screens.
   - Recommendation:
     - Increase vertical rhythm on mobile (more spacing, fewer side-by-side cards).
     - Prefer single-column composition by default and progressively enhance for tablet/desktop.

4. **Form ergonomics need explicit mobile hardening**
   - There are many modal/form interactions (auth, transactions, settings).
   - Recommendation:
     - Confirm all inputs use mobile-friendly attributes (`inputmode`, `autocomplete`, context-specific keyboard types).
     - Keep primary actions sticky or persistently visible when keyboard opens.
     - Add inline validation messaging close to fields.

5. **Heavy third-party script loading may hurt first paint on mobile networks**
   - The page loads multiple chart/date/UI libraries from CDNs up-front.
   - Recommendation:
     - Lazy-load non-critical libraries only when related views open (e.g., charts/settings/date pickers).
     - Preconnect to critical origins and remove unused bundles.
     - Track mobile Core Web Vitals (LCP/INP/CLS) before/after.

## Secondary issues (medium impact)

- **Hover-forward interaction patterns**
  - Several styles are hover-enhanced; mobile needs explicit active/focus-visible feedback.
- **Animation density and motion accessibility**
  - Reduce non-essential animation on small screens and support `prefers-reduced-motion`.
- **Icon-only discoverability**
  - Keep labels visible in primary mobile navigation and avoid hidden-destructive actions.

## Recommended execution plan

### Phase 1 – Quick wins (1–2 days)
- Implement safe-area-aware bottom navigation spacing.
- Migrate key `100vh` containers to `100dvh` with fallback.
- Enforce 44x44 minimum touch targets.
- Add stronger `:focus-visible` and pressed states for all tappable controls.

### Phase 2 – UX polish (2–4 days)
- Rework dashboard density for small screens (single-column-first, better spacing scale).
- Improve transaction add/edit flow with sticky primary action and mobile keyboard-safe layout.
- Add lightweight skeleton states for charts/cards while data loads.

### Phase 3 – Performance & quality (2–3 days)
- Split/lazy-load chart/date dependencies by route/section.
- Compress and serve responsive images/icons where applicable.
- Run Lighthouse mobile audits and fix top regressions.

## Mobile acceptance checklist
- No horizontal scroll on any primary screen.
- All primary actions reachable with one-thumb ergonomics.
- Tap targets meet 44x44 minimum.
- Bottom nav and floating action never overlap critical content.
- Keyboard open state keeps focused input and submit action visible.
- LCP under 2.5s on mid-tier mobile (throttled profile), INP under 200ms, CLS under 0.1.

## Suggested next step
If you want, I can convert this into an implementation sprint and directly ship **Phase 1** in code (safe-area handling, viewport units upgrade, touch target fixes, and mobile interaction state polish).
