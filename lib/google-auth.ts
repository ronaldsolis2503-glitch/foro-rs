'use client'

// Google Identity Services (GIS) Helper

declare global {
  interface Window {
    google?: any
  }
}

export function loadGoogleScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.google?.accounts?.id) return resolve(true)

    const existingScript = document.getElementById('google-gsi-script')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true))
      return
    }

    const script = document.createElement('script')
    script.id = 'google-gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}

export function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (err) {
    console.error('Error parsing Google JWT:', err)
    return null
  }
}
