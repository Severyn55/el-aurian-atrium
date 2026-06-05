# Video Optimization Plan – Kleines Kameel

**Status:** 15+ MB total payload (mostly video)  
**Goal:** Bring video contribution down to a reasonable level for a high-craft restaurant site (target: < 3–4 MB total video payload on initial load where possible).

---

## 1. Current Situation (as of May 2026)

### Video Files (in `public/assets/originals/food/`)

| File                        | Current Size | Usage |
|----------------------------|--------------|-------|
| `food-motion-02.mp4`       | **4.22 MB**  | Dinner card (main page) + Dinner modal |
| `food-crudo-motion-01.mp4` | **2.80 MB**  | Lunch card (main page) + Lunch modal |

**Total video weight from these two files alone: ~7 MB** (before any caching or multiple loads).

### Where the Videos Are Actually Used

**Speisekarten.astro** (main page):
- Lunch card: `food-crudo-motion-01.mp4` → visible above the fold, `preload="auto"`
- Dinner card: `food-motion-02.mp4` → visible above the fold, `preload="auto"`

**Modals** (inside Speisekarten.astro):
- Lunch modal background: `food-crudo-motion-01.mp4` (opacity-15)
- Dinner modal background: `food-motion-02.mp4` (opacity-15)

**Hero.astro**:
- `hero-long-table-motion-01.mp4` (only loaded on desktop, lazy after load) → currently not the biggest problem.

---

## 2. Realistic Targets for Web

For a premium restaurant site in 2026, the following targets are reasonable:

| Context                        | Recommended Max Size per Video | Notes |
|--------------------------------|--------------------------------|-------|
| Background video on card (visible on load) | 1.0 – 1.6 MB | Critical for performance |
| Modal background video         | 0.8 – 1.4 MB | Less critical (only loads when modal opens) |
| Hero background video (desktop only) | 2.0 – 3.0 MB | Acceptable if truly lazy |

**Overall goal for this project:**
- Main page initial video payload: **max. 2.5 – 3.5 MB** total (currently ~7 MB from the two main videos alone).

---

## 3. Recommended Strategy (Phased)

### Phase 1: Quick Wins (Highest Impact / Lowest Effort)

**Goal:** Reduce the two main card videos significantly without changing the design language.

Actions:
1. Re-encode both videos with much more aggressive settings:
   - Resolution: Max 1280px wide (or even 960–1080px for mobile-first)
   - Bitrate: Target 1.2 – 1.8 Mbps for 1080p, lower for smaller resolutions
   - Codec: H.264 (for maximum compatibility) + create WebM version as primary
   - Length: Keep short (6–10 seconds loop is enough)
   - Frame rate: 24 or 25 fps is fine

2. Add `preload="metadata"` (or even `preload="none"`) on the main card videos instead of `preload="auto"`.
3. Rely more heavily on the `poster` image (you already have optimized stills).

**Expected result:** Each main video down to **1.2 – 1.8 MB** → total ~2.5–3.5 MB instead of 7 MB.

### Phase 2: Better Technical Architecture

- Serve **WebM as primary** + MP4 as fallback (WebM is usually 30-50% smaller at same quality).
- Lazy load the actual video source only when the card is near viewport or hovered (you already have hover logic — we can improve it).
- For modals: Only load the video source when the modal is opened (currently the `<source>` is in the DOM from the beginning).

### Phase 3: Strategic Decisions (Optional but Powerful)

Consider whether both cards really need video backgrounds at the same time on mobile.

Options:
- Keep video only on one card (e.g. only Dinner) and use a high-quality still on the other.
- Or make video play only on hover/visible state instead of autoplaying immediately.

This can easily bring the initial video payload under 2 MB.

---

## 4. Concrete Next Steps (Recommended Order)

1. **Audit current usage** (done in this document)
2. **Re-encode the two main videos** (food-crudo-motion-01.mp4 and food-motion-02.mp4)
   - Target: ≤ 1.6 MB each
   - Deliver both WebM + MP4
3. Update `Speisekarten.astro`:
   - Change `preload="auto"` → `preload="metadata"` on the card videos
   - Add proper `poster` (already done)
   - Consider adding `playsinline` + muted (already there)
4. For the modals:
   - Remove the `<source>` from the DOM on page load
   - Load the video source only when the modal opens (via JavaScript)
5. Measure again with `npm run preview` + Lighthouse (Mobile, Slow 4G)
6. Decide whether to go further (Phase 3 strategic changes)

---

## 5. Tools & Settings Recommendations

**Best free/accessible tools:**
- **HandBrake** (excellent for MP4)
- **Shutter Encoder** (great for WebM + batch)
- **FFmpeg** (most powerful, scriptable)

**Recommended HandBrake settings for background loops (2026):**
- Format: MP4 (or MKV → then convert)
- Preset: "Production" or "Web" (adjust from there)
- Resolution: 1080p or lower (use "Optimal" or manual 1280x720 / 960x540)
- Quality: RF 22–26 (higher = smaller file)
- Frame rate: 24 or 25
- Audio: None (these are silent loops anyway)

For WebM:
- Use VP9 or AV1 if you want maximum compression (AV1 is slower to encode but much smaller).

---

## 6. Quick Decision Framework

| Approach                        | Effort | Expected Size Reduction | Recommendation |
|--------------------------------|--------|--------------------------|----------------|
| Just re-compress current MP4s  | Low    | High (4.2 → ~1.5 MB)    | **Do this first** |
| Add WebM versions              | Medium | Very High               | Strongly recommended |
| Change loading strategy (lazy + hover) | Medium | High                    | Do in parallel |
| Reduce to one video on main page | High   | Very High               | Consider if still not enough |

---

## Next Action

Would you like me to:

**A.** Write a detailed compression guide with exact recommended settings for HandBrake / Shutter Encoder for these two videos?

**B.** Prepare the code changes in `Speisekarten.astro` for better video loading behavior (preload changes + dynamic loading in modals)?

**C.** Do both in parallel?

Just say A, B, or C (or describe what you prefer). I’ll execute immediately.