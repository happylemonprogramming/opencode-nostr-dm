import { nip04, nip19, getPublicKey } from 'nostr-tools'

/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

/**
 * Get private key as hex string, handling both nsec1 and hex formats
 */
function getPrivKeyHex(privateKey: string): string {
  if (privateKey.startsWith('nsec1')) {
    const decoded = nip19.decode(privateKey)
    if (decoded.data instanceof Uint8Array) {
      return bytesToHex(decoded.data)
    }
    return decoded.data as string
  }
  return privateKey
}

/**
 * Get private key as Uint8Array, handling both nsec1 and hex formats
 */
export function getPrivKeyBytes(privateKey: string): Uint8Array {
  if (privateKey.startsWith('nsec1')) {
    const decoded = nip19.decode(privateKey)
    if (decoded.data instanceof Uint8Array) {
      return decoded.data
    }
    return hexToBytes(decoded.data as string)
  }
  return hexToBytes(privateKey)
}

/**
 * Decrypt NIP-04 encrypted content
 */
export async function decryptDM(
  privateKey: string,
  senderPubkey: string,
  encryptedContent: string
): Promise<string> {
  const privKeyHex = getPrivKeyHex(privateKey)
  return await nip04.decrypt(privKeyHex, senderPubkey, encryptedContent)
}

/**
 * Encrypt content for NIP-04 DM
 */
export async function encryptDM(
  privateKey: string,
  recipientPubkey: string,
  content: string
): Promise<string> {
  const privKeyHex = getPrivKeyHex(privateKey)
  return await nip04.encrypt(privKeyHex, recipientPubkey, content)
}

/**
 * Get public key from private key
 */
export function getPublicKeyFromPrivate(privateKey: string): string {
  const privKeyBytes = getPrivKeyBytes(privateKey)
  return getPublicKey(privKeyBytes)
}
