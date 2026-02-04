export class SessionManager {
    sessions = new Map();
    sessionTimeout;
    constructor(sessionTimeoutMs = 24 * 60 * 60 * 1000) {
        this.sessionTimeout = sessionTimeoutMs;
    }
    /**
     * Get or create a session for a sender
     */
    async getOrCreateSession(senderPubkey, createSessionFn) {
        // Check if session exists and is valid
        const existing = this.sessions.get(senderPubkey);
        const now = Date.now();
        if (existing && (now - existing.lastActivity) < this.sessionTimeout) {
            // Update last activity
            existing.lastActivity = now;
            return existing.sessionId;
        }
        // Create new session
        const sessionId = await createSessionFn();
        this.sessions.set(senderPubkey, {
            sessionId,
            senderPubkey,
            lastActivity: now,
            created: now
        });
        return sessionId;
    }
    /**
     * Update session activity timestamp
     */
    touchSession(senderPubkey) {
        const session = this.sessions.get(senderPubkey);
        if (session) {
            session.lastActivity = Date.now();
        }
    }
    /**
     * Get session info
     */
    getSession(senderPubkey) {
        return this.sessions.get(senderPubkey);
    }
    /**
     * Clear expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [pubkey, session] of this.sessions.entries()) {
            if ((now - session.lastActivity) >= this.sessionTimeout) {
                this.sessions.delete(pubkey);
            }
        }
    }
    /**
     * Get all active sessions
     */
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
}
//# sourceMappingURL=session-manager.js.map