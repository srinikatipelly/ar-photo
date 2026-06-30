# Hero video (Remotion)

Programmatic 16:9 hero video for the landing page — an animated phone mockup (brand
green/gold, Cormorant + Montserrat) that plays your **AR screen recording** inside the screen.
No filming required.

## One-time
Already installed (`remotion`, `@remotion/cli`, `@remotion/google-fonts` as devDeps).

## 1. Record the AR on your phone
Open an AR frame on your phone, start the **built-in screen recorder** (iOS Control Centre /
Android quick settings), and capture ~**10 seconds** of the photo coming alive. Trim it to ~10s
(the composition is 10s; longer footage is cut, shorter freezes on its last frame).

Save it to: **`public/videos/ar-recording.mp4`** (portrait 9:16 is perfect — it fills the phone).

## 2. Preview live (Remotion Studio)
```bash
npm run video:studio
```
Opens a browser studio. To see your recording in the preview, set `arSrc` to
`videos/ar-recording.mp4` in the right-hand **Props** panel (the default is `null`, which shows
the "drop your recording here" placeholder). Tweak headline/sub there too.

## 3. Render the final MP4
```bash
npm run render:hero
```
Renders to **`public/videos/hero.mp4`** using `video/hero.props.json` (which already sets
`arSrc`). The landing page's `VideoFrame` picks it up automatically. First render downloads a
headless Chromium (one-time).

## Customise
- Copy/headline: edit `video/hero.props.json` (or the props panel in studio).
- Length: `durationInFrames` in `video/Root.tsx` (300 = 10s @ 30fps).
- Look: colours/layout/animation in `video/Hero.tsx`.

## Category clips
Duplicate the `<Composition>` in `video/Root.tsx` (e.g. id `Weddings`) and add a script like
`remotion render video/index.ts Weddings public/videos/weddings.mp4 --props=…` to produce the
per-service videos.

## Notes
- This is a **dev/build tool only** — the `video/` folder is not imported by the Next app and is
  not part of the deployed site (only the rendered `.mp4` outputs are).
- Keep `public/videos/ar-recording.mp4` out of git if it's large (it's raw input); commit the
  rendered `hero.mp4`.
