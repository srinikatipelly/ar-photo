# Printing guidelines for best AR tracking

How a frame is printed and displayed directly affects how well the AR video tracks and how
steady it looks. Follow these when producing (or advising a customer on) an AR photo frame.

## Print finish — use MATTE

- **Best: matte.** A matte surface diffuses light evenly, so the phone camera sees the same
  detail from any angle. This gives the steadiest, most reliable tracking.
- **Acceptable: satin / luster / semi-gloss.** A little more colour "pop" than flat matte with
  much less glare than gloss — use only if a customer specifically wants richer colour.
- **Avoid: high gloss.** Glossy prints create glare/reflection hotspots under lights or sunlight.
  Those bright spots wash out the image detail the tracker relies on, causing shake, slow
  lock-on, or the video dropping out as the phone moves and the glare shifts.

## Glass / covering matters as much as the print

A matte photo behind **glossy glass** brings the glare problem back. So:

- Use **anti-glare / non-reflective glass**, **or**
- **No glass** over the photo, **or**
- **Matte acrylic** instead of glossy glass.

## Choosing the photo

- **Prefer detailed, high-contrast images.** Busy/textured photos track far better than plain or
  low-detail ones (e.g. a large area of clear sky, a plain wall, or a very dark image gives the
  tracker little to lock onto).
- **Print the same image that generated the AR target.** The `.mind` target is built from the
  uploaded photo — print that exact image at the same crop/aspect so the printed frame matches
  what the tracker expects.
- **Reasonable size.** A bigger printed target is easier to track than a very small one.

## When scanning

- Good, even lighting — avoid a single harsh light source or direct glare on the frame.
- Hold the phone reasonably steady; extreme oblique angles degrade tracking.

## If live AR is ever too jittery

Camera-based WebAR always carries a little residual movement — it's tuned to minimise it, but it
is never perfectly zero at every angle. The viewer's **"Play as video"** button plays the clip
screen-locked with no camera tracking — perfectly steady at any angle — as the guaranteed fallback.

## Summary

**Matte print + non-reflective glass (or no glass) + a detailed photo = the steadiest AR.**
