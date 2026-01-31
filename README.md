# CIPD - Cosmos Injected Provider Discovery

A standardized way to discover Cosmos wallet extensions in the browser, inspired by [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963) for Ethereum.

## Why?

The Cosmos ecosystem lacks a standardized way to discover wallet extensions. Currently, dApps need to:

- Check for specific global variables (`window.keplr`, `window.leap`, etc.)
- Hardcode wallet detection logic for each wallet
- Deal with race conditions when wallets inject at different times
- Maintain a growing list of wallet-specific detection code

**CIPD solves this** by providing an event-based discovery protocol that:

- Works with any wallet that implements the protocol
- Handles race conditions automatically
- Provides a consistent API for wallet discovery
- Includes a polyfill for existing wallets that don't yet support CIPD natively

## What?

CIPD defines two custom events:

- **`cosmos:requestProvider`** - Dispatched by dApps to request wallet announcements
- **`cosmos:announceProvider`** - Dispatched by wallets to announce their presence

Each wallet announcement includes:

```typescript
interface CosmosProviderDetail {
  info: {
    uuid: string           // Unique identifier for this provider instance
    name: string           // Human-readable wallet name (e.g., "Keplr")
    icon: string           // Data URL of the wallet icon
    rdns: string           // Reverse domain name ID (e.g., "app.keplr")
  }
  provider: CosmosProvider // The wallet's Cosmos provider interface
}
```

## Installation

```bash
npm install @luknyb/cipd
# or
pnpm add @luknyb/cipd
# or
yarn add @luknyb/cipd
```

## Usage

### Basic Usage

```typescript
import { createStore } from '@luknyb/cipd'

// Create a store to manage discovered wallets
const store = createStore()

// Subscribe to wallet changes
store.subscribe((providers) => {
  console.log('Available wallets:', providers.map(p => p.info.name))
})

// Get all currently discovered wallets
const wallets = store.getProviders()

// Find a specific wallet by RDNS
const keplr = store.findProvider('app.keplr')
if (keplr) {
  await keplr.provider.enable('cosmoshub-4')
  const key = await keplr.provider.getKey('cosmoshub-4')
  console.log('Address:', key.bech32Address)
}
```

### With Svelte

```svelte
<script lang="ts">
import { onMount } from 'svelte'
import { createStore, type CosmosProviderDetail } from '@luknyb/cipd'

let wallets = $state<CosmosProviderDetail[]>([])

onMount(() => {
  const store = createStore()
  return store.subscribe((providers) => {
    wallets = [...providers]
  }, { emitImmediately: true })
})
</script>

{#each wallets as wallet}
  <button onclick={() => connect(wallet)}>
    <img src={wallet.info.icon} alt={wallet.info.name} />
    {wallet.info.name}
  </button>
{/each}
```

### With React

```tsx
import { useEffect, useState } from 'react'
import { createStore, type CosmosProviderDetail } from '@luknyb/cipd'

function WalletList() {
  const [wallets, setWallets] = useState<CosmosProviderDetail[]>([])

  useEffect(() => {
    const store = createStore()
    return store.subscribe((providers) => {
      setWallets([...providers])
    }, { emitImmediately: true })
  }, [])

  return (
    <div>
      {wallets.map((wallet) => (
        <button key={wallet.info.uuid} onClick={() => connect(wallet)}>
          <img src={wallet.info.icon} alt={wallet.info.name} />
          {wallet.info.name}
        </button>
      ))}
    </div>
  )
}
```

### With Vue

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createStore, type CosmosProviderDetail } from '@luknyb/cipd'

const wallets = ref<CosmosProviderDetail[]>([])
let unsubscribe: (() => void) | undefined

onMounted(() => {
  const store = createStore()
  unsubscribe = store.subscribe((providers) => {
    wallets.value = [...providers]
  }, { emitImmediately: true })
})

onUnmounted(() => unsubscribe?.())
</script>

<template>
  <button v-for="wallet in wallets" :key="wallet.info.uuid" @click="connect(wallet)">
    <img :src="wallet.info.icon" :alt="wallet.info.name" />
    {{ wallet.info.name }}
  </button>
</template>
```

## API Reference

### `createStore(options?)`

Creates a store for managing discovered wallet providers.

```typescript
interface CreateStoreOptions {
  polyfill?: boolean  // Whether to detect existing wallets (default: true)
}

const store = createStore({ polyfill: true })
```

### Store Methods

| Method | Description |
|--------|-------------|
| `subscribe(listener, options?)` | Subscribe to provider changes. Returns unsubscribe function. |
| `getProviders()` | Get all currently discovered providers. |
| `findProvider(rdns)` | Find a provider by its RDNS identifier. |
| `reset()` | Clear and re-request providers. |
| `clear()` | Clear all providers from the store. |
| `destroy()` | Destroy the store and remove all listeners. |

### `requestProviders()`

Manually request all wallets to announce themselves.

```typescript
import { requestProviders } from '@luknyb/cipd'

requestProviders()
```

### `announceProvider(detail)`

Manually announce a wallet provider (useful for wallet developers).

```typescript
import { announceProvider } from '@luknyb/cipd'

announceProvider({
  info: {
    uuid: crypto.randomUUID(),
    name: 'My Wallet',
    icon: 'data:image/svg+xml;base64,...',
    rdns: 'com.mywallet',
  },
  provider: myCosmosProvider,
})
```

## Supported Wallets

The polyfill automatically detects these wallets:

| Wallet | RDNS |
|--------|------|
| Keplr | `app.keplr` |
| Leap | `io.leapwallet` |
| Cosmostation | `io.cosmostation` |
| XDEFI | `io.xdefi` |
| Falcon | `io.falconwallet` |
| Coin98 | `io.coin98` |

## For Wallet Developers

To natively support CIPD in your wallet extension:

```typescript
// Listen for discovery requests
window.addEventListener('cosmos:requestProvider', () => {
  announceWallet()
})

// Announce on load
announceWallet()

function announceWallet() {
  window.dispatchEvent(
    new CustomEvent('cosmos:announceProvider', {
      detail: {
        info: {
          uuid: crypto.randomUUID(),
          name: 'My Wallet',
          icon: 'data:image/svg+xml;base64,...',
          rdns: 'com.mywallet',
        },
        provider: window.myWallet,
      },
    })
  )
}
```

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  CosmosProvider,
  CosmosProviderDetail,
  CosmosProviderInfo,
  Key,
  OfflineSigner,
  ChainInfo,
  Store,
} from '@luknyb/cipd'
```

## License

MIT
