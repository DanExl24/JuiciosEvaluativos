import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'

export interface UpdateInfo {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  releaseName: string
  releaseNotes: string
  publishedAt: string
  downloadUrl: string
  apkSizeMb?: number
}

const GITHUB_OWNER = 'DanExl24'
const GITHUB_REPO = 'JuiciosEvaluativos'
const FALLBACK_CURRENT_VERSION = '1.0.0'
const DEFAULT_DOWNLOAD_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest/download/app-debug.apk`

/**
 * Normaliza y compara dos versiones semánticas (ej: 'v1.0.1' vs '1.0.0').
 * Retorna:
 *  1 si v1 > v2
 * -1 si v1 < v2
 *  0 si son iguales
 */
export function compareSemVer(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim().split('-')[0]
  const clean2 = v2.replace(/^v/i, '').trim().split('-')[0]

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0)
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0)

  const maxLen = Math.max(parts1.length, parts2.length)
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0
    const num2 = parts2[i] ?? 0
    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }

  return 0
}

/**
 * Obtiene la versión actual de la aplicación.
 */
export async function getCurrentAppVersion(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await CapApp.getInfo()
      if (info.version && info.version !== '0.0.0') {
        return info.version
      }
    } catch (err) {
      console.warn('No fue posible leer la versión nativa con CapApp:', err)
    }
  }
  return FALLBACK_CURRENT_VERSION
}

/**
 * Consulta la API de GitHub Releases para verificar si existe una nueva versión.
 */
export async function checkForAppUpdates(): Promise<UpdateInfo> {
  const currentVersion = await getCurrentAppVersion()

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const tagName: string = data.tag_name || ''
    const latestVersion = tagName.replace(/^v/i, '') || currentVersion
    const releaseName: string = data.name || `Versión ${tagName}`
    const releaseNotes: string = data.body || 'Corrección de errores y mejoras de rendimiento.'
    const publishedAt: string = data.published_at || new Date().toISOString()

    // Buscar el activo APK en la release
    let downloadUrl = DEFAULT_DOWNLOAD_URL
    let apkSizeMb: number | undefined

    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const apkAsset = data.assets.find((asset: { name?: string; browser_download_url?: string; size?: number }) =>
        asset.name?.toLowerCase().endsWith('.apk'),
      )
      if (apkAsset?.browser_download_url) {
        downloadUrl = apkAsset.browser_download_url
        if (apkAsset.size) {
          apkSizeMb = parseFloat((apkAsset.size / (1024 * 1024)).toFixed(1))
        }
      }
    }

    const hasUpdate = compareSemVer(latestVersion, currentVersion) > 0

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseName,
      releaseNotes,
      publishedAt,
      downloadUrl,
      apkSizeMb,
    }
  } catch (err) {
    console.warn('Error al verificar actualizaciones en GitHub:', err)
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseName: `Juicios Evaluativos v${currentVersion}`,
      releaseNotes: 'No se pudo conectar con el servidor de actualizaciones.',
      publishedAt: new Date().toISOString(),
      downloadUrl: DEFAULT_DOWNLOAD_URL,
    }
  }
}

/**
 * Inicia la descarga del APK directamente a través del navegador del sistema o WebView.
 */
export async function downloadAndInstallApk(downloadUrl: string = DEFAULT_DOWNLOAD_URL): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url: downloadUrl })
      return
    } catch (err) {
      console.warn('Error con Browser plugin, intentando window.open:', err)
    }
  }

  // Fallback web o navegador estándar
  window.open(downloadUrl, '_system')
}
