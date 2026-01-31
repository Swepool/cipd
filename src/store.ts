import {
  ANNOUNCE_EVENT,
  REQUEST_EVENT,
  type CosmosAnnounceProviderEvent,
  type CosmosProviderDetail,
  type ProviderListenerFn,
  type Rdns,
  type Store,
} from "./types.js"

export type CreateStoreOptions = {
  /** Whether to announce existing wallets via polyfill */
  polyfill?: boolean
}

/**
 * Creates a store for managing discovered Cosmos wallet providers.
 *
 * The store listens for `cosmos:announceProvider` events and maintains
 * a list of available wallet providers. It also dispatches a
 * `cosmos:requestProvider` event to trigger wallet announcements.
 *
 * @example
 * ```ts
 * import { createStore } from './wallet'
 *
 * const store = createStore()
 *
 * // Subscribe to provider changes
 * store.subscribe((providers) => {
 *   console.log('Available wallets:', providers.map(p => p.info.name))
 * })
 *
 * // Get all providers
 * const providers = store.getProviders()
 *
 * // Find a specific provider
 * const keplr = store.findProvider('app.keplr')
 * ```
 */
export function createStore(options: CreateStoreOptions = {}): Store {
  const { polyfill = true } = options

  const listeners = new Set<ProviderListenerFn>()
  let providerDetails: CosmosProviderDetail[] = []

  // Handler for provider announcements
  const onAnnounce = (event: CosmosAnnounceProviderEvent) => {
    const detail = event.detail
    if (!detail?.info?.uuid) return

    // Check for duplicate by UUID
    const exists = providerDetails.some(
      (p) => p.info.uuid === detail.info.uuid
    )
    if (exists) return

    // Add the new provider
    const added = [detail]
    providerDetails = [...providerDetails, detail]

    // Notify listeners
    listeners.forEach((fn) => {
      fn(providerDetails, { added })
    })
  }

  // Start listening for announcements
  window.addEventListener(ANNOUNCE_EVENT, onAnnounce as EventListener)

  // Request providers to announce themselves
  const requestProviders = () => {
    window.dispatchEvent(new Event(REQUEST_EVENT))
  }

  // Run polyfill if enabled
  if (polyfill) {
    // Import and run polyfill dynamically to avoid circular deps
    import("./polyfill.js").then(({ announceExistingWallets }) => {
      announceExistingWallets()
    })
  }

  // Initial request
  requestProviders()

  return {
    clear() {
      const removed = [...providerDetails]
      providerDetails = []
      listeners.forEach((fn) => {
        fn(providerDetails, { removed })
      })
    },

    destroy() {
      this.clear()
      listeners.clear()
      window.removeEventListener(ANNOUNCE_EVENT, onAnnounce as EventListener)
    },

    findProvider<TRdns extends Rdns>(rdns: TRdns) {
      return providerDetails.find((p) => p.info.rdns === rdns)
    },

    getProviders() {
      return providerDetails
    },

    reset() {
      this.clear()
      requestProviders()
      if (polyfill) {
        import("./polyfill.js").then(({ announceExistingWallets }) => {
          announceExistingWallets()
        })
      }
    },

    subscribe(
      listener: ProviderListenerFn,
      options?: { emitImmediately?: boolean }
    ) {
      listeners.add(listener)

      // Emit immediately if requested and there are providers
      if (options?.emitImmediately && providerDetails.length > 0) {
        listener(providerDetails, { added: providerDetails })
      }

      // Return unsubscribe function
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/**
 * Requests all wallet providers to announce themselves.
 * Wallets listening for the request event will respond with announcements.
 */
export function requestProviders() {
  window.dispatchEvent(new Event(REQUEST_EVENT))
}

/**
 * Announces a wallet provider manually.
 * This is useful for wallet extensions to announce themselves.
 */
export function announceProvider(detail: CosmosProviderDetail) {
  window.dispatchEvent(
    new CustomEvent(ANNOUNCE_EVENT, { detail })
  )
}
