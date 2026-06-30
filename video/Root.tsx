import { Composition } from 'remotion'
import { Hero, type HeroProps } from './Hero'

// 16:9 hero. ~10s loopable. Drop your AR screen-recording at
// public/videos/ar-recording.mp4 and set `arSrc` (the render script does this).
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Hero"
      component={Hero}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={
        {
          arSrc: null,
          headline: 'What if your memories could speak?',
          sub: 'Scan the frame. Watch it come alive.',
        } satisfies HeroProps
      }
    />
  )
}
