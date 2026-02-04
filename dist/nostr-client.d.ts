import type { NostrDMConfig, IncomingDM } from './types.js';
export declare class NostrDMClient {
    private pool;
    private config;
    private publicKey;
    constructor(config: NostrDMConfig);
    /**
     * Subscribe to incoming DMs and call handler for each message
     */
    subscribeToDMs(handler: (dm: IncomingDM) => Promise<void>, since?: number): Promise<() => void>;
    /**
     * Send a DM to a recipient
     */
    sendDM(recipientPubkey: string, content: string): Promise<void>;
    /**
     * Close all connections
     */
    close(): void;
}
//# sourceMappingURL=nostr-client.d.ts.map