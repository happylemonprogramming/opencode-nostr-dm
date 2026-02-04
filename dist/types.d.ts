import type { Event as NostrEvent } from 'nostr-tools';
export interface NostrDMConfig {
    /** Server's Nostr private key (nsec1... format or hex) */
    privateKey: string;
    /** Relay URLs to connect to */
    relays: string[];
    /** Optional: Enable debug logging */
    debug?: boolean;
    /** Optional: Session timeout in milliseconds (default: 24 hours) */
    sessionTimeout?: number;
    /** Optional: Allowed sender pubkeys (empty = allow all) */
    allowedSenders?: string[];
}
export interface DMSession {
    /** OpenCode session ID */
    sessionId: string;
    /** Sender's pubkey (hex) */
    senderPubkey: string;
    /** Last activity timestamp */
    lastActivity: number;
    /** Created timestamp */
    created: number;
}
export interface IncomingDM {
    event: NostrEvent;
    senderPubkey: string;
    decryptedContent: string;
    timestamp: number;
}
//# sourceMappingURL=types.d.ts.map