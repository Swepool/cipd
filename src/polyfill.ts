import { announceProvider } from "./store.js"
import { REQUEST_EVENT, type CosmosProvider, type CosmosProviderDetail, type Rdns } from "./types.js"

// Wallet detection configurations
interface WalletConfig {
  rdns: Rdns
  name: string
  detect: () => CosmosProvider | undefined
  icon: `data:image/${string}`
}

// Wallet icons as base64 data URLs
const ICONS = {
  keplr: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDIiIGhlaWdodD0iNDIiIHZpZXdCb3g9IjAgMCA0MiA0MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzQyNV81MTA3KSI+CjxwYXRoIGQ9Ik0zMi40NTQ1IDBIOS41NDU0NUM0LjI3MzY1IDAgMCA0LjI3MzY1IDAgOS41NDU0NVYzMi40NTQ1QzAgMzcuNzI2NCA0LjI3MzY1IDQyIDkuNTQ1NDUgNDJIMzIuNDU0NUMzNy43MjY0IDQyIDQyIDM3LjcyNjQgNDIgMzIuNDU0NVY5LjU0NTQ1QzQyIDQuMjczNjUgMzcuNzI2NCAwIDMyLjQ1NDUgMFoiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl80MjVfNTEwNykiLz4KPHBhdGggZD0iTTMyLjQ1NDUgMEg5LjU0NTQ1QzQuMjczNjUgMCAwIDQuMjczNjUgMCA5LjU0NTQ1VjMyLjQ1NDVDMCAzNy43MjY0IDQuMjczNjUgNDIgOS41NDU0NSA0MkgzMi40NTQ1QzM3LjcyNjQgNDIgNDIgMzcuNzI2NCA0MiAzMi40NTQ1VjkuNTQ1NDVDNDIgNC4yNzM2NSAzNy43MjY0IDAgMzIuNDU0NSAwWiIgZmlsbD0idXJsKCNwYWludDFfcmFkaWFsXzQyNV81MTA3KSIvPgo8cGF0aCBkPSJNMzIuNDU0NSAwSDkuNTQ1NDVDNC4yNzM2NSAwIDAgNC4yNzM2NSAwIDkuNTQ1NDVWMzIuNDU0NUMwIDM3LjcyNjQgNC4yNzM2NSA0MiA5LjU0NTQ1IDQySDMyLjQ1NDVDMzcuNzI2NCA0MiA0MiAzNy43MjY0IDQyIDMyLjQ1NDVWOS41NDU0NUM0MiA0LjI3MzY1IDM3LjcyNjQgMCAzMi40NTQ1IDBaIiBmaWxsPSJ1cmwoI3BhaW50Ml9yYWRpYWxfNDI1XzUxMDcpIi8+CjxwYXRoIGQ9Ik0zMi40NTQ1IDBIOS41NDU0NUM0LjI3MzY1IDAgMCA0LjI3MzY1IDAgOS41NDU0NVYzMi40NTQ1QzAgMzcuNzI2NCA0LjI3MzY1IDQyIDkuNTQ1NDUgNDJIMzIuNDU0NUMzNy43MjY0IDQyIDQyIDM3LjcyNjQgNDIgMzIuNDU0NVY5LjU0NTQ1QzQyIDQuMjczNjUgMzcuNzI2NCAwIDMyLjQ1NDUgMFoiIGZpbGw9InVybCgjcGFpbnQzX3JhZGlhbF80MjVfNTEwNykiLz4KPHBhdGggZD0iTTE3LjI1MjYgMzIuMjYxNFYyMi41MTkyTDI2LjcxODUgMzIuMjYxNEgzMS45ODQ5VjMyLjAwNzlMMjEuMDk2NCAyMC45MTIyTDMxLjE0NjkgMTAuMzg1N1YxMC4yNjE0SDI1Ljg0NjRMMTcuMjUyNiAxOS41NjM1VjEwLjI2MTRIMTIuOTg0OVYzMi4yNjE0SDE3LjI1MjZaIiBmaWxsPSJ3aGl0ZSIvPgo8L2c+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfNDI1XzUxMDciIHgxPSIyMSIgeTE9IjAiIHgyPSIyMSIgeTI9IjQyIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiMxRkQxRkYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMUJCOEZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQxX3JhZGlhbF80MjVfNTEwNyIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSgyLjAwNjIzIDQwLjQwODYpIHJvdGF0ZSgtNDUuMTU1Nikgc2NhbGUoNjcuMzU0NyA2OC4zNjI0KSI+CjxzdG9wIHN0b3AtY29sb3I9IiMyMzJERTMiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMjMyREUzIiBzdG9wLW9wYWNpdHk9IjAiLz4KPC9yYWRpYWxHcmFkaWVudD4KPHJhZGlhbEdyYWRpZW50IGlkPSJwYWludDJfcmFkaWFsXzQyNV81MTA3IiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBncmFkaWVudFRyYW5zZm9ybT0idHJhbnNsYXRlKDM5LjczNzkgNDEuNzYwMikgcm90YXRlKC0xMzguNDUpIHNjYWxlKDQyLjExMzcgNjQuMjExNikiPgo8c3RvcCBzdG9wLWNvbG9yPSIjOEI0REZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzhCNERGRiIgc3RvcC1vcGFjaXR5PSIwIi8+CjwvcmFkaWFsR3JhZGllbnQ+CjxyYWRpYWxHcmFkaWVudCBpZD0icGFpbnQzX3JhZGlhbF80MjVfNTEwNyIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSgyMC42NTAxIDAuMzExNDk4KSByb3RhdGUoOTApIHNjYWxlKDMzLjExMzUgODAuMzQyMykiPgo8c3RvcCBzdG9wLWNvbG9yPSIjMjRENUZGIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFCQjhGRiIgc3RvcC1vcGFjaXR5PSIwIi8+CjwvcmFkaWFsR3JhZGllbnQ+CjxjbGlwUGF0aCBpZD0iY2xpcDBfNDI1XzUxMDciPgo8cmVjdCB3aWR0aD0iNDIiIGhlaWdodD0iNDIiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==",
  leap: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAxNjYgMTY2Ij4KICA8ZyBjbGlwLXBhdGg9InVybCgjYSkiPgogICAgPHBhdGggZmlsbD0iI0M1RkZDRSIgZD0iTTAgMGgxNjZ2MTY2SDB6IiAvPgogICAgPHBhdGggZmlsbD0iIzI0QTk1QSIKICAgICAgZD0iTTEzOC42MSAxMDAuNDRjMCAxOS43OC0yNC4xMyAyNy44MS01NC4wOSAyNy44MS0yOS45NiAwLTU0LjQ0LTguMDMtNTQuNDQtMjcuOCAwLTE5Ljc4IDI0LjMtMzUuNzggNTQuMjctMzUuNzggMjkuOTYgMCA1NC4yNiAxNi4wNCA1NC4yNiAzNS43N1oiIC8+CiAgICA8cGF0aCBmaWxsPSIjMzJEQTZEIgogICAgICBkPSJNMTMzLjEgNTcuMzVjMC0xMC40MS04LjUtMTguODctMTguOTYtMTguODdhMTguOTggMTguOTggMCAwIDAtMTMuODEgNS45NGMtLjU0LjU2LTEuMzIuODQtMi4wOC42OGE2OS44IDY5LjggMCAwIDAtMjcuNTkgMCAyLjI3IDIuMjcgMCAwIDEtMi4wOC0uNjggMTkuMDcgMTkuMDcgMCAwIDAtMTMuOC01Ljk0QTE4LjkzIDE4LjkzIDAgMCAwIDM1LjggNTcuMzVjMCAzLjAzLjcyIDUuODggMS45OCA4LjQuMy42MS4zMyAxLjMyLjA3IDEuOTVhMjMuNjcgMjMuNjcgMCAwIDAtMS44OCA5LjIxYzAgMTguMzQgMjEuNzEgMzMuMTkgNDguNDggMzMuMTkgMjYuNzYgMCA0OC40Ny0xNC44NSA0OC40Ny0zMy4xOSAwLTMuMi0uNjUtNi4yOS0xLjg4LTkuMjFhMi4zMyAyLjMzIDAgMCAxIC4wNy0xLjk0IDE4LjcyIDE4LjcyIDAgMCAwIDEuOTgtOC40MVoiIC8+CiAgICA8cGF0aCBmaWxsPSIjZmZmIgogICAgICBkPSJNNTMuMjMgNjcuODFjNi40IDAgMTEuNTktNS4xNiAxMS41OS0xMS41MyAwLTYuMzYtNS4yLTExLjUyLTExLjYtMTEuNTItNi40IDAtMTEuNTggNS4xNi0xMS41OCAxMS41MiAwIDYuMzcgNS4xOSAxMS41MyAxMS41OSAxMS41M1ptNjEuODMgMGM2LjQgMCAxMS42LTUuMTYgMTEuNi0xMS41MyAwLTYuMzYtNS4yLTExLjUyLTExLjYtMTEuNTItNi40IDAtMTEuNTkgNS4xNi0xMS41OSAxMS41MiAwIDYuMzcgNS4yIDExLjUzIDExLjYgMTEuNTNaIiAvPgogICAgPHBhdGggZmlsbD0iIzMyREE2RCIKICAgICAgZD0iTTQ3LjA4IDEyNi44M2E0LjE5IDQuMTkgMCAwIDAgNC4xOC00LjYxYy0xLjAyLTguNjctNS4zNC0yNy40Mi0yNC4zNS0zOC43LTIwLjgzLTEyLjM4LTEwLjkyIDIwLjUxLTYuNzcgMzIuNWE1LjM0IDUuMzQgMCAwIDEtMi4zNiA2LjRsLTEuMzcuNzhjLTEuNzUgMS0xLjAyIDMuNjMuOTkgMy42M2gyOS42OFptNzUuNDkgMGMtMi4yNSAwLTQtMi4xNy0zLjc2LTQuNjEuODgtOC42MyA0LjgxLTI3LjQyIDIxLjk1LTM4LjcgMTguOTgtMTIuNDggOS43NCAyMS4wMyA2LjA2IDMyLjc3YTUuMzMgNS4zMyAwIDAgMCAyLjIgNi4xbDEuMjYuOGMxLjU4IDEuMDIuOTEgMy42NC0uODggMy42NGgtMjYuODNaIiAvPgogICAgPHBhdGggZmlsbD0iIzA5MjUxMSIKICAgICAgZD0iTTUzLjI0IDYzLjE4YTYuOTEgNi45MSAwIDEgMCAwLTEzLjgzIDYuOTEgNi45MSAwIDAgMCAwIDEzLjgzWm02MS44NCAwYTYuOTEgNi45MSAwIDEgMCAwLTEzLjgzIDYuOTEgNi45MSAwIDAgMCAwIDEzLjgzWk05OS44IDgzLjAyYzEuNzEuMTUgMy4wMSAxLjY3IDIuNTggMy4zM0ExOC42IDE4LjYgMCAwIDEgODIuOCAxMDAuMmExOC41OCAxOC41OCAwIDAgMS0xNi45Ny0xOC4wMmMtLjAzLTEuMTUuOTgtMiAyLjEzLTEuOWwxNi40MyAxLjQxIDE1LjQgMS4zM1oiIC8+CiAgPC9nPgogIDxkZWZzPgogICAgPGNsaXBQYXRoIGlkPSJhIj4KICAgICAgPHBhdGggZmlsbD0iI2ZmZiIgZD0iTTAgMGgxNjZ2MTY2SDB6IiAvPgogICAgPC9jbGlwUGF0aD4KICA8L2RlZnM+Cjwvc3ZnPgo=",
  cosmostation: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjOTk0NUZGIi8+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMi41Ii8+PC9zdmc+",
  xdefi: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjMUQyQzRDIi8+PHBhdGggZD0iTTEyIDI4TDIwIDEyTDI4IDI4SDE4IiBzdHJva2U9IiMwMEQzOTUiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  falcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjMkIyQjJCIi8+PHBhdGggZD0iTTEyIDE1TDIwIDI1TDI4IDE1IiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=",
  coin98: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjRDlCNDMyIi8+PHRleHQgeD0iMjAiIHk9IjI2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Qzk4PC90ZXh0Pjwvc3ZnPg==",
  generic: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjNjY2Ii8+PHBhdGggZD0iTTIwIDEyVjI4TTEyIDIwSDI4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==",
} as const

// Known wallet configurations
const WALLETS: WalletConfig[] = [
  {
    rdns: "app.keplr" as Rdns,
    name: "Keplr",
    detect: () => window.keplr,
    icon: ICONS.keplr,
  },
  {
    rdns: "io.leapwallet" as Rdns,
    name: "Leap",
    detect: () => window.leap,
    icon: ICONS.leap,
  },
  {
    rdns: "io.cosmostation" as Rdns,
    name: "Cosmostation",
    detect: () => window.cosmostation?.providers?.keplr ?? window.cosmostation?.cosmos,
    icon: ICONS.cosmostation,
  },
  {
    rdns: "io.xdefi" as Rdns,
    name: "XDEFI",
    detect: () => window.xfi?.cosmos,
    icon: ICONS.xdefi,
  },
  {
    rdns: "io.falconwallet" as Rdns,
    name: "Falcon",
    detect: () => window.falcon,
    icon: ICONS.falcon,
  },
  {
    rdns: "io.coin98" as Rdns,
    name: "Coin98",
    detect: () => window.coin98?.cosmos,
    icon: ICONS.coin98,
  },
]

// Track which wallets we've already announced
const announcedWallets = new Set<string>()

/**
 * Detects and announces existing Cosmos wallet extensions.
 * This serves as a polyfill for wallets that don't natively support CIPD.
 */
export function announceExistingWallets(): CosmosProviderDetail[] {
  const discovered: CosmosProviderDetail[] = []

  for (const config of WALLETS) {
    // Skip if already announced
    if (announcedWallets.has(config.rdns)) continue

    try {
      const provider = config.detect()
      if (!provider) continue

      const detail: CosmosProviderDetail = {
        info: {
          uuid: crypto.randomUUID(),
          name: config.name,
          rdns: config.rdns,
          icon: config.icon,
        },
        provider,
      }

      announcedWallets.add(config.rdns)
      discovered.push(detail)
      announceProvider(detail)
    } catch {
      // Wallet detection failed, skip
    }
  }

  return discovered
}

/**
 * Sets up a listener for request events to re-announce wallets.
 * This allows the polyfill to respond to late store creation.
 */
export function setupPolyfillListener() {
  window.addEventListener(REQUEST_EVENT, () => {
    // Small delay to let the store set up its listener first
    setTimeout(() => {
      // Re-announce all detected wallets
      for (const config of WALLETS) {
        if (announcedWallets.has(config.rdns)) {
          try {
            const provider = config.detect()
            if (provider) {
              announceProvider({
                info: {
                  uuid: crypto.randomUUID(),
                  name: config.name,
                  rdns: config.rdns,
                  icon: config.icon,
                },
                provider,
              })
            }
          } catch {
            // Skip failed detections
          }
        }
      }
    }, 10)
  })
}

/**
 * Checks if a specific wallet is available.
 */
export function isWalletAvailable(rdns: string): boolean {
  const config = WALLETS.find((w) => w.rdns === rdns)
  if (!config) return false
  try {
    return !!config.detect()
  } catch {
    return false
  }
}

/**
 * Gets the list of known wallet RDNS identifiers.
 */
export function getKnownWallets(): readonly string[] {
  return WALLETS.map((w) => w.rdns)
}
