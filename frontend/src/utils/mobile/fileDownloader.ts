import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/**
 * Guarda y comparte un archivo en Android/iOS o lo descarga normalmente en la Web.
 * @param fileName Nombre del archivo con extensión (ej. 'reporte.pdf')
 * @param base64Data Cadena Base64 pura (sin prefijo data:...;base64,)
 * @param mimeType Tipo MIME (ej. 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
 * @param webFallback Callback para la descarga web tradicional si no es nativo
 */
export async function saveAndShareFile(
  fileName: string,
  base64Data: string,
  mimeType: string,
  webFallback?: () => void,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    if (webFallback) {
      webFallback()
      return
    }

    // Fallback web genérico usando Blob
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return
  }

  try {
    // Escribir archivo temporal en el almacenamiento local del dispositivo
    const writeResult = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    })

    // Disparar la hoja de compartir nativa del sistema
    await Share.share({
      title: fileName,
      text: `Reporte generado: ${fileName}`,
      url: writeResult.uri,
      dialogTitle: `Abrir o compartir ${fileName}`,
    })
  } catch (err) {
    console.error('Error al guardar o compartir archivo en plataforma nativa:', err)
  }
}
