import { defineConfig } from '@trigger.dev/sdk/v3'
import { aptGet } from '@trigger.dev/build/extensions/core'

export default defineConfig({
  project: 'proj_nunpbdiuncccghtciqrz',
  dirs: ['./trigger'],
  build: {
    extensions: [aptGet({ packages: ['ffmpeg'] })],
  },
  maxDuration: 600,
})
