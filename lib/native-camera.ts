import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNativePlatform } from './platform'

export async function takePhoto(): Promise<string | null> {
  if (!isNativePlatform()) return null

  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      allowEditing: false,
    })
    return photo.webPath || null
  } catch {
    return null
  }
}

export async function pickFromGallery(): Promise<string | null> {
  if (!isNativePlatform()) return null

  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    })
    return photo.webPath || null
  } catch {
    return null
  }
}
