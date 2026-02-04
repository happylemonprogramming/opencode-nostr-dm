import { nip04, nip19, getPublicKey } from 'nostr-tools';
/**
 * Convert Uint8Array to hex string
 */
function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}
/**
 * Get private key as hex string, handling both nsec1 and hex formats
 */
function getPrivKeyHex(privateKey) {
    if (privateKey.startsWith('nsec1')) {
        const decoded = nip19.decode(privateKey);
        if (decoded.data instanceof Uint8Array) {
            return bytesToHex(decoded.data);
        }
        return decoded.data;
    }
    return privateKey;
}
/**
 * Get private key as Uint8Array, handling both nsec1 and hex formats
 */
export function getPrivKeyBytes(privateKey) {
    if (privateKey.startsWith('nsec1')) {
        const decoded = nip19.decode(privateKey);
        if (decoded.data instanceof Uint8Array) {
            return decoded.data;
        }
        return hexToBytes(decoded.data);
    }
    return hexToBytes(privateKey);
}
/**
 * Decrypt NIP-04 encrypted content
 */
export async function decryptDM(privateKey, senderPubkey, encryptedContent) {
    const privKeyHex = getPrivKeyHex(privateKey);
    return await nip04.decrypt(privKeyHex, senderPubkey, encryptedContent);
}
/**
 * Encrypt content for NIP-04 DM
 */
export async function encryptDM(privateKey, recipientPubkey, content) {
    const privKeyHex = getPrivKeyHex(privateKey);
    return await nip04.encrypt(privKeyHex, recipientPubkey, content);
}
/**
 * Get public key from private key
 */
export function getPublicKeyFromPrivate(privateKey) {
    const privKeyBytes = getPrivKeyBytes(privateKey);
    return getPublicKey(privKeyBytes);
}
//# sourceMappingURL=crypto.js.map