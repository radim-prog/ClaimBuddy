import { isNativePlatform } from './platform'

/**
 * Unified camera/file capture service.
 * Native: uses Capacitor Camera plugin
 * Web: uses HTML file input fallback
 */

export async function captureDocument(options?: {
  source?: 'camera' | 'gallery' | 'file'
}): Promise<File | null> {
  const source = options?.source || 'camera'

  if (isNativePlatform() && source !== 'file') {
    return captureNative(source)
  }

  return captureWeb(source === 'camera' ? 'image/*' : 'image/*,.pdf')
}

async function captureNative(source: 'camera' | 'gallery'): Promise<File | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')

    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      allowEditing: false,
    })

    const webPath = photo.webPath
    if (!webPath) return null

    const response = await fetch(webPath)
    const blob = await response.blob()
    const ext = photo.format || 'jpg'
    return new File([blob], `doklad-${Date.now()}.${ext}`, {
      type: blob.type || `image/${ext}`,
    })
  } catch {
    return null
  }
}

function captureWeb(accept: string): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'

    const cleanup = () => {
      document.body.removeChild(input)
    }

    input.onchange = () => {
      const file = input.files?.[0] || null
      cleanup()
      resolve(file)
    }

    // Handle cancel (no file selected)
    input.addEventListener('cancel', () => {
      cleanup()
      resolve(null)
    })

    // Fallback: if focus returns to window without change event
    const focusHandler = () => {
      setTimeout(() => {
        if (!input.files?.length) {
          cleanup()
          resolve(null)
        }
        window.removeEventListener('focus', focusHandler)
      }, 500)
    }
    window.addEventListener('focus', focusHandler)

    document.body.appendChild(input)
    input.click()
  })
}

/**
 * Quick capture: take photo and return File (native camera only)
 * Falls back to file picker on web
 */
export async function quickCapture(): Promise<File | null> {
  return captureDocument({ source: 'camera' })
}

/**
 * Pick from gallery/files
 */
export async function pickDocument(): Promise<File | null> {
  if (isNativePlatform()) {
    return captureDocument({ source: 'gallery' })
  }
  return captureDocument({ source: 'file' })
}
