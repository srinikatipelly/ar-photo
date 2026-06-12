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

    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }

    script.onerror = () => {
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
  await loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image.prod.js')

  if (!window.MINDAR?.IMAGE?.Compiler) {
    throw new Error('MindAR image compiler is not available in this browser.')
  }

  const image = await fileToImageElement(photoFile)
  const compiler = new window.MINDAR.IMAGE.Compiler()

  await compiler.compileImageTargets([image], (progress) => {
    console.log(`Compiling: ${Math.round(progress * 100)}%`)
  })

  return compiler.exportData()
}
