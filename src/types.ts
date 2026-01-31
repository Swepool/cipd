// CIPD - Cosmos Injected Provider Discovery
// Inspired by EIP-6963 for Ethereum wallets

// ============ Cosmos Wallet Interface ============

export interface Key {
  name: string
  algo: string
  pubKey: Uint8Array
  address: Uint8Array
  bech32Address: string
  isNanoLedger: boolean
  isKeystone?: boolean
}

export interface OfflineDirectSigner {
  getAccounts(): Promise<readonly AccountData[]>
  signDirect(signerAddress: string, signDoc: SignDoc): Promise<DirectSignResponse>
}

export interface OfflineAminoSigner {
  getAccounts(): Promise<readonly AccountData[]>
  signAmino(signerAddress: string, signDoc: StdSignDoc): Promise<AminoSignResponse>
}

export type OfflineSigner = OfflineDirectSigner | OfflineAminoSigner

export interface AccountData {
  address: string
  algo: string
  pubkey: Uint8Array
}

export interface SignDoc {
  bodyBytes: Uint8Array
  authInfoBytes: Uint8Array
  chainId: string
  accountNumber: bigint
}

export interface StdSignDoc {
  chain_id: string
  account_number: string
  sequence: string
  fee: StdFee
  msgs: readonly AminoMsg[]
  memo: string
}

export interface StdFee {
  amount: readonly Coin[]
  gas: string
}

export interface Coin {
  denom: string
  amount: string
}

export interface AminoMsg {
  type: string
  value: unknown
}

export interface DirectSignResponse {
  signed: SignDoc
  signature: StdSignature
}

export interface AminoSignResponse {
  signed: StdSignDoc
  signature: StdSignature
}

export interface StdSignature {
  pub_key: {
    type: string
    value: string
  }
  signature: string
}

export interface ChainInfo {
  chainId: string
  chainName: string
  rpc: string
  rest: string
  bip44: { coinType: number }
  bech32Config: {
    bech32PrefixAccAddr: string
    bech32PrefixAccPub: string
    bech32PrefixValAddr: string
    bech32PrefixValPub: string
    bech32PrefixConsAddr: string
    bech32PrefixConsPub: string
  }
  currencies: Currency[]
  feeCurrencies: Currency[]
  stakeCurrency: Currency
  features?: string[]
}

export interface Currency {
  coinDenom: string
  coinMinimalDenom: string
  coinDecimals: number
  coinGeckoId?: string
  coinImageUrl?: string
}

// ============ Cosmos Provider Interface ============

export interface CosmosProvider {
  /** Enable access to the wallet for a specific chain */
  enable(chainId: string): Promise<void>

  /** Get the key/account info for a chain */
  getKey(chainId: string): Promise<Key>

  /** Get an offline signer for signing transactions */
  getOfflineSigner(chainId: string): OfflineSigner

  /** Get an offline signer that uses Amino encoding */
  getOfflineSignerOnlyAmino(chainId: string): OfflineAminoSigner

  /** Get an offline signer that auto-selects Direct or Amino */
  getOfflineSignerAuto(chainId: string): Promise<OfflineSigner>

  /** Suggest a chain to the wallet */
  experimentalSuggestChain(chainInfo: ChainInfo): Promise<void>

  /** Sign arbitrary data (for authentication) */
  signArbitrary?(
    chainId: string,
    signer: string,
    data: string | Uint8Array
  ): Promise<StdSignature>

  /** Verify arbitrary signature */
  verifyArbitrary?(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    signature: StdSignature
  ): Promise<boolean>

  /** Disconnect from the wallet (if supported) */
  disconnect?(): Promise<void>
}

// ============ CIPD Types ============

export type Rdns = `${string}.${string}`

export interface CosmosProviderInfo<TRdns extends string = Rdns> {
  /** Unique identifier for this provider instance */
  uuid: string
  /** Human-readable wallet name */
  name: string
  /** Data URL of the wallet icon (RFC-2397) */
  icon: `data:image/${string}`
  /** Reverse domain name identifier (e.g., "app.keplr", "io.leapwallet") */
  rdns: TRdns
}

export interface CosmosProviderDetail<
  TProvider extends CosmosProvider = CosmosProvider,
  TRdns extends string = Rdns,
> {
  info: CosmosProviderInfo<TRdns>
  provider: TProvider
}

// ============ Events ============

export interface CosmosAnnounceProviderEvent<TProvider extends CosmosProvider = CosmosProvider>
  extends CustomEvent<CosmosProviderDetail<TProvider>> {
  type: "cosmos:announceProvider"
}

export interface CosmosRequestProviderEvent extends Event {
  type: "cosmos:requestProvider"
}

// Event type constants
export const ANNOUNCE_EVENT = "cosmos:announceProvider" as const
export const REQUEST_EVENT = "cosmos:requestProvider" as const

// ============ Store Types ============

export type ProviderListenerFn = (
  providers: readonly CosmosProviderDetail[],
  meta: {
    added?: CosmosProviderDetail[]
    removed?: CosmosProviderDetail[]
  }
) => void

export interface Store {
  /** Clears all providers from the store */
  clear(): void
  /** Destroys the store, removing all listeners */
  destroy(): void
  /** Find a provider by its RDNS identifier */
  findProvider<TRdns extends Rdns>(rdns: TRdns): CosmosProviderDetail | undefined
  /** Get all discovered providers */
  getProviders(): readonly CosmosProviderDetail[]
  /** Reset and re-request providers */
  reset(): void
  /** Subscribe to provider changes */
  subscribe(
    listener: ProviderListenerFn,
    options?: { emitImmediately?: boolean }
  ): () => void
}

// ============ Window Extensions ============

declare global {
  interface Window {
    keplr?: CosmosProvider
    leap?: CosmosProvider
    cosmostation?: {
      providers?: {
        keplr?: CosmosProvider
      }
      cosmos?: CosmosProvider
    }
    xfi?: {
      cosmos?: CosmosProvider
    }
    falcon?: CosmosProvider
    coin98?: {
      cosmos?: CosmosProvider
    }
  }

  interface WindowEventMap {
    "cosmos:announceProvider": CosmosAnnounceProviderEvent
    "cosmos:requestProvider": CosmosRequestProviderEvent
  }
}
