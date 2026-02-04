/**
 * Get private key as Uint8Array, handling both nsec1 and hex formats
 */
export declare function getPrivKeyBytes(privateKey: string): Uint8Array;
/**
 * Decrypt NIP-04 encrypted content
 */
export declare function decryptDM(privateKey: string, senderPubkey: string, encryptedContent: string): Promise<string>;
/**
 * Encrypt content for NIP-04 DM
 */
export declare function encryptDM(privateKey: string, recipientPubkey: string, content: string): Promise<string>;
/**
 * Get public key from private key
 */
export declare function getPublicKeyFromPrivate(privateKey: string): string;
//# sourceMappingURL=crypto.d.ts.map