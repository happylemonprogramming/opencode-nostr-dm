import { SimplePool, finalizeEvent } from 'nostr-tools';
import { decryptDM, encryptDM, getPublicKeyFromPrivate, getPrivKeyBytes } from './crypto.js';
import { nip19 } from 'nostr-tools';
export class NostrDMClient {
    pool;
    config;
    publicKey;
    constructor(config) {
        this.config = config;
        this.pool = new SimplePool();
        this.publicKey = getPublicKeyFromPrivate(config.privateKey);
        if (config.debug) {
            console.log('[NostrDM] Initialized with pubkey:', this.publicKey);
            console.log('[NostrDM] npub:', nip19.npubEncode(this.publicKey));
            console.log('[NostrDM] Relays:', config.relays);
        }
    }
    /**
     * Subscribe to incoming DMs and call handler for each message
     */
    async subscribeToDMs(handler, since) {
        const filter = {
            kinds: [4], // NIP-04 encrypted DMs
            '#p': [this.publicKey], // Tagged to us
            since: since || Math.floor(Date.now() / 1000)
        };
        if (this.config.debug) {
            console.log('[NostrDM] Subscribing with filter:', filter);
        }
        console.log('[NostrDM] Subscribing to relays...');
        console.log('[NostrDM] Filter:', JSON.stringify(filter));
        const sub = this.pool.subscribeMany(this.config.relays, filter, {
            onevent: async (event) => {
                try {
                    // Check allowlist if configured
                    if (this.config.allowedSenders?.length) {
                        if (!this.config.allowedSenders.includes(event.pubkey)) {
                            if (this.config.debug) {
                                console.log('[NostrDM] Ignoring DM from non-allowed sender:', event.pubkey);
                            }
                            return;
                        }
                    }
                    // Decrypt the message
                    const decrypted = await decryptDM(this.config.privateKey, event.pubkey, event.content);
                    if (this.config.debug) {
                        console.log('[NostrDM] Received DM from:', event.pubkey.slice(0, 8));
                        console.log('[NostrDM] Content:', decrypted);
                    }
                    // Call handler
                    await handler({
                        event,
                        senderPubkey: event.pubkey,
                        decryptedContent: decrypted,
                        timestamp: event.created_at
                    });
                }
                catch (error) {
                    console.error('[NostrDM] Error processing DM:', error);
                }
            },
            oneose: () => {
                console.log('[NostrDM] Subscription established (EOSE received)');
            }
        });
        // Return cleanup function
        return () => {
            sub.close();
            if (this.config.debug) {
                console.log('[NostrDM] Subscription closed');
            }
        };
    }
    /**
     * Send a DM to a recipient
     */
    async sendDM(recipientPubkey, content) {
        try {
            // Encrypt the content
            const encrypted = await encryptDM(this.config.privateKey, recipientPubkey, content);
            // Get private key as Uint8Array (handles both nsec1 and hex formats)
            const privKeyBytes = getPrivKeyBytes(this.config.privateKey);
            // Create the event
            const event = finalizeEvent({
                kind: 4,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['p', recipientPubkey]],
                content: encrypted,
            }, privKeyBytes);
            // Publish to relays
            await Promise.any(this.pool.publish(this.config.relays, event));
            if (this.config.debug) {
                console.log('[NostrDM] Sent DM to:', recipientPubkey.slice(0, 8));
            }
        }
        catch (error) {
            console.error('[NostrDM] Error sending DM:', error);
            throw error;
        }
    }
    /**
     * Close all connections
     */
    close() {
        this.pool.close(this.config.relays);
    }
}
//# sourceMappingURL=nostr-client.js.map