import type { DMSession } from './types.js';
export declare class SessionManager {
    private sessions;
    private sessionTimeout;
    constructor(sessionTimeoutMs?: number);
    /**
     * Get or create a session for a sender
     */
    getOrCreateSession(senderPubkey: string, createSessionFn: () => Promise<string>): Promise<string>;
    /**
     * Update session activity timestamp
     */
    touchSession(senderPubkey: string): void;
    /**
     * Get session info
     */
    getSession(senderPubkey: string): DMSession | undefined;
    /**
     * Clear expired sessions
     */
    cleanupExpiredSessions(): void;
    /**
     * Get all active sessions
     */
    getAllSessions(): DMSession[];
}
//# sourceMappingURL=session-manager.d.ts.map