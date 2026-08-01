declare global {
  interface Window {
    MINDAR?: {
      IMAGE: {
        Compiler: new () => {
          compileImageTargets: (images: HTMLImageElement[], onProgress?: (progress: number) => void) => Promise<void>
          exportData: () => ArrayBuffer
        }
      }
    }
  }
}

function loadScript(src: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('MindAR can only be loaded in the browser.'))
  }

  if (window.MINDAR?.IMAGE?.Compiler) {
    return Promise.resolve()
  }

  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)

  if (existingScript) {
    if (existingScript.dataset.loaded === 'true') {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => {
        existingScript.dataset.loaded = 'true'
        resolve()
      }, { once: true })

      existingScript.addEventListener('error', () => {
        reject(new Error(`Unable to load ${src}`))
      }, { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.type = 'module'
    script.async = true

    // Safety net: a module whose sub-import stalls never fires onload OR onerror,
    // which would hang the spinner forever. Surface a retryable error instead.
    const timer = setTimeout(() => {
      reject(new Error('The AR engine took too long to load. Please check your connection and try again.'))
    }, 30000)

    script.onload = () => {
      clearTimeout(timer)
      script.dataset.loaded = 'true'
      resolve()
    }

    script.onerror = () => {
      clearTimeout(timer)
      reject(new Error(`Unable to load ${src}`))
    }

    document.head.appendChild(script)
  })
}

function fileToImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('The selected image could not be loaded.'))
    }

    image.src = objectUrl
  })
}

export async function compileImageTarget(photoFile: File): Promise<ArrayBuffer> {
  return compileImageTargets([photoFile])
}

/**
 * Compile one OR MANY photos into a single `.mind` target file. The order of
 * `photoFiles` is preserved and becomes the MindAR target index order — anchor `i`
 * in the viewer maps to `photoFiles[i]`. Used by album mode (one QR, many photos).
 */
export async function compileImageTargets(
  photoFiles: File[],
  onProgress?: (progress: number) => void,
): Promise<ArrayBuffer> {
  if (!photoFiles.length) throw new Error('At least one photo is required to compile a target.')

  // Self-hosted from /public so it loads from our own domain — no dependency on
  // a third-party CDN (jsDelivr 503s were hanging the compile on fresh origins).
  // The 266-byte loader pulls its sibling chunks relative to this path.
  await loadScript('/vendor/mind-ar/mindar-image.prod.js')

  if (!window.MINDAR?.IMAGE?.Compiler) {
    throw new Error('MindAR image compiler is not available in this browser.')
  }

  const images = await Promise.all(photoFiles.map(fileToImageElement))
  const compiler = new window.MINDAR.IMAGE.Compiler()

  // MindAR reports a PERCENT (0-100), not a 0-1 fraction — its compileTrack does
  // `progressCallback(basePercent + percent * basePercent / 100)`. Callers here
  // expect a 0-1 fraction, so scale it down; clamp because the two compile phases
  // can overshoot slightly on the last tick.
  await compiler.compileImageTargets(images, (percent) => {
    const fraction = Math.min(1, Math.max(0, percent / 100))
    onProgress?.(fraction)
  })

  return compiler.exportData()
}
