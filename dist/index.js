import { NostrDMClient } from './nostr-client.js';
import { SessionManager } from './session-manager.js';
import { nip19 } from 'nostr-tools';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
/**
 * Load configuration from .env file
 */
function loadEnvFile() {
    const envVars = {};
    // Try multiple possible locations for the .env file
    const possiblePaths = [
        join(homedir(), '.config', 'opencode', '.env'),
        join(process.cwd(), '.env'),
    ];
    for (const envPath of possiblePaths) {
        if (existsSync(envPath)) {
            console.log('[NostrDM] Loading config from:', envPath);
            try {
                const content = readFileSync(envPath, 'utf-8');
                for (const line of content.split('\n')) {
                    const trimmed = line.trim();
                    // Skip comments and empty lines
                    if (!trimmed || trimmed.startsWith('#'))
                        continue;
                    const match = trimmed.match(/^([^=]+)=(.*)$/);
                    if (match) {
                        const key = match[1].trim();
                        let value = match[2].trim();
                        // Remove quotes if present
                        if ((value.startsWith('"') && value.endsWith('"')) ||
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.slice(1, -1);
                        }
                        envVars[key] = value;
                    }
                }
                break; // Stop after first successful load
            }
            catch (err) {
                console.error('[NostrDM] Error reading .env file:', err);
            }
        }
    }
    return envVars;
}
/**
 * Get configuration value with fallback to process.env
 */
function getConfig(envVars, key, defaultValue = '') {
    return envVars[key] || process.env[key] || defaultValue;
}
export const NostrDMPlugin = async ({ client }) => {
    console.log('[NostrDM] Starting plugin initialization...');
    // Load configuration from .env file or environment variables
    const envVars = loadEnvFile();
    const config = {
        privateKey: getConfig(envVars, 'NOSTR_PRIVATE_KEY'),
        relays: getConfig(envVars, 'NOSTR_RELAYS', 'wss://relay.primal.net,wss://nos.lol,wss://relay.damus.io').split(',').map(r => r.trim()),
        debug: getConfig(envVars, 'NOSTR_DEBUG') === 'true',
        sessionTimeout: parseInt(getConfig(envVars, 'NOSTR_SESSION_TIMEOUT_HOURS', '24')) * 60 * 60 * 1000,
        allowedSenders: getConfig(envVars, 'NOSTR_ALLOWED_SENDERS')
            ? getConfig(envVars, 'NOSTR_ALLOWED_SENDERS').split(',').map(s => s.trim())
            : undefined
    };
    // Validate configuration
    if (!config.privateKey) {
        console.error('[NostrDM] NOSTR_PRIVATE_KEY not found in .env file or environment');
        console.error('[NostrDM] Please create a .env file at ~/.config/opencode/.env with your private key');
        throw new Error('[NostrDM] NOSTR_PRIVATE_KEY is required');
    }
    // Initialize clients
    const nostrClient = new NostrDMClient(config);
    const sessionManager = new SessionManager(config.sessionTimeout || 24 * 60 * 60 * 1000);
    // Get public key for logging
    const publicKey = nostrClient['publicKey'];
    // Log initialization
    console.log('[NostrDM] Plugin initialized');
    console.log('[NostrDM] npub:', nip19.npubEncode(publicKey));
    console.log('[NostrDM] Relays:', config.relays);
    // Start subscription to incoming DMs
    await nostrClient.subscribeToDMs(async (dm) => {
        try {
            // Get or create OpenCode session for this sender
            const sessionId = await sessionManager.getOrCreateSession(dm.senderPubkey, async () => {
                const result = await client.session.create({
                    body: {
                        title: `Nostr DM: ${nip19.npubEncode(dm.senderPubkey).slice(0, 16)}...`
                    }
                });
                if (result.error) {
                    throw new Error(`Failed to create session: ${result.error}`);
                }
                console.log('[NostrDM] Created new session for sender:', nip19.npubEncode(dm.senderPubkey));
                return result.data.id;
            });
            // Send message to OpenCode session
            const response = await client.session.prompt({
                path: { id: sessionId },
                body: {
                    parts: [{ type: 'text', text: dm.decryptedContent }]
                }
            });
            if (response.error) {
                throw new Error(`Failed to prompt session: ${response.error}`);
            }
            // Extract response text from parts
            const textParts = response.data.parts?.filter((p) => p.type === 'text') || [];
            const responseText = textParts.map((p) => p.text).join('\n');
            // Fallback message (commented out - uncomment to send confirmation when AI fails)
            // const responseText = textParts.map((p: any) => p.text).join('\n') || 'I received your message.'
            // Only send if we have actual content from OpenCode
            if (!responseText) {
                console.log('[NostrDM] No response from OpenCode, skipping reply');
                return;
            }
            // Send response back via Nostr
            await nostrClient.sendDM(dm.senderPubkey, responseText);
            // Update session activity
            sessionManager.touchSession(dm.senderPubkey);
            if (config.debug) {
                console.log('[NostrDM] Processed DM and sent response');
            }
        }
        catch (error) {
            console.error('[NostrDM] Error processing DM:', error);
        }
    });
    // Cleanup expired sessions periodically (every hour)
    const cleanupInterval = setInterval(() => {
        sessionManager.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
    // Return empty hooks object (plugin runs in background via subscription)
    return {};
};
// Export for use in OpenCode
export default NostrDMPlugin;
//# sourceMappingURL=index.js.map