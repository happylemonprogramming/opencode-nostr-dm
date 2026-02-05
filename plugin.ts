import type { Plugin } from "@opencode-ai/plugin"
import { SimplePool, type Event as NostrEvent, type Filter, finalizeEvent, nip04, nip19, getPublicKey } from 'nostr-tools'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Load .env file manually
function loadEnvFile(): Record<string, string> {
  const envVars: Record<string, string> = {}
  
  // Try multiple possible locations for the .env file
  const possiblePaths = [
    join(homedir(), '.config', 'opencode', '.env'),
    join(process.cwd(), '.env'),
  ]
  
  for (const envPath of possiblePaths) {
    if (existsSync(envPath)) {
      console.log('[NostrDM] Loading config from:', envPath)
      try {
        const content = readFileSync(envPath, 'utf-8')
        for (const line of content.split('\n')) {
          const trimmed = line.trim()
          // Skip comments and empty lines
          if (!trimmed || trimmed.startsWith('#')) continue
          
          const match = trimmed.match(/^([^=]+)=(.*)$/)
          if (match) {
            const key = match[1].trim()
            let value = match[2].trim()
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1)
            }
            envVars[key] = value
          }
        }
        break // Stop after first successful load
      } catch (err) {
        console.error('[NostrDM] Error reading .env file:', err)
      }
    }
  }
  
  return envVars
}

// Nostr DM Plugin for OpenCode
export const NostrDMPlugin: Plugin = async ({ client }) => {
  console.log('[NostrDM] Starting plugin initialization...')
  
  // Load configuration from .env file or environment variables
  const envVars = loadEnvFile()
  
  // Get config with fallback to process.env
  const getConfig = (key: string, defaultValue: string = ''): string => {
    return envVars[key] || process.env[key] || defaultValue
  }
  
  const privateKey = getConfig('NOSTR_PRIVATE_KEY')
  const relays = getConfig('NOSTR_RELAYS', 'wss://relay.primal.net,wss://nos.lol,wss://relay.damus.io')
    .split(',')
    .map(r => r.trim())
  const debug = getConfig('NOSTR_DEBUG') === 'true'

  // Validate configuration
  if (!privateKey) {
    console.error('[NostrDM] NOSTR_PRIVATE_KEY not found in .env file or environment')
    console.error('[NostrDM] Please create a .env file at ~/.config/opencode/.env with your private key')
    throw new Error('[NostrDM] NOSTR_PRIVATE_KEY is required')
  }

  // Helper to convert Uint8Array to hex string
  function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  // Helper to convert hex string to Uint8Array
  function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
    }
    return bytes
  }

  // Get private key bytes
  let privKeyBytes: Uint8Array
  let privKeyHex: string
  
  if (privateKey.startsWith('nsec1')) {
    // Decode bech32 nsec to get raw bytes
    const decoded = nip19.decode(privateKey)
    if (decoded.data instanceof Uint8Array) {
      privKeyBytes = decoded.data
      privKeyHex = bytesToHex(privKeyBytes)
    } else {
      // Fallback if it's somehow a string
      privKeyHex = decoded.data as string
      privKeyBytes = hexToBytes(privKeyHex)
    }
  } else {
    // Assume it's already a hex string
    privKeyHex = privateKey
    privKeyBytes = hexToBytes(privKeyHex)
  }
  
  const publicKey = getPublicKey(privKeyBytes)
  const npub = nip19.npubEncode(publicKey)

  console.log('[NostrDM] Plugin initialized')
  console.log('[NostrDM] npub:', npub)
  console.log('[NostrDM] Relays:', relays)

  // Initialize Nostr connection
  const pool = new SimplePool()
  const sessions = new Map<string, string>() // senderPubkey -> sessionId

  // Subscribe to incoming DMs
  const filter = {
    kinds: [4], // NIP-04 encrypted DMs
    '#p': [publicKey],
    since: Math.floor(Date.now() / 1000)
  }

  console.log('[NostrDM] Subscribing to relays...')
  console.log('[NostrDM] Filter:', JSON.stringify(filter))

  pool.subscribeMany(
    relays,
    filter,
    {
      onevent: async (event: NostrEvent) => {
        try {
          if (debug) {
            console.log('[NostrDM] Received event from:', event.pubkey.slice(0, 8))
          }

          // Decrypt the message
          const decrypted = await nip04.decrypt(privKeyHex, event.pubkey, event.content)
          
          console.log('[NostrDM] Decrypted message from:', nip19.npubEncode(event.pubkey).slice(0, 16))
          console.log('[NostrDM] Content:', decrypted)

          // Get or create session
          let sessionId = sessions.get(event.pubkey)
          if (!sessionId) {
            const result = await client.session.create({
              body: {
                title: `Nostr DM: ${nip19.npubEncode(event.pubkey).slice(0, 16)}...`
              }
            })

            if (result.error) {
              console.error('[NostrDM] Failed to create session:', result.error)
              return
            }

            sessionId = result.data.id
            sessions.set(event.pubkey, sessionId)
            console.log('[NostrDM] Created session:', sessionId)
          }

          // Send message to OpenCode
          const response = await client.session.prompt({
            path: { id: sessionId },
            body: {
              parts: [{ type: 'text', text: decrypted }]
            }
          })

          if (response.error) {
            console.error('[NostrDM] Failed to prompt:', response.error)
            return
          }

          // Extract response text
          const textParts = response.data.parts?.filter((p: any) => p.type === 'text') || []
          const responseText = textParts.map((p: any) => p.text).join('\n')
          // Fallback message (commented out - uncomment to send confirmation when AI fails)
          // const responseText = textParts.map((p: any) => p.text).join('\n') || 'I received your message.'

          // Only send if we have actual content from OpenCode
          if (!responseText) {
            console.log('[NostrDM] No response from OpenCode, skipping reply')
            return
          }

          console.log('[NostrDM] Sending response:', responseText.slice(0, 50) + '...')

          // Encrypt response
          const encrypted = await nip04.encrypt(privKeyHex, event.pubkey, responseText)

          // Send DM
          const dmEvent = finalizeEvent({
            kind: 4,
            created_at: Math.floor(Date.now() / 1000),
            tags: [['p', event.pubkey]],
            content: encrypted,
          }, privKeyBytes)

          await Promise.any(pool.publish(relays, dmEvent))
          
          console.log('[NostrDM] Response sent successfully!')

        } catch (error) {
          console.error('[NostrDM] Error processing DM:', error)
        }
      },
      oneose: () => {
        console.log('[NostrDM] Subscription established (EOSE received)')
      }
    }
  )

  // Return hooks (we don't need any specific hooks for this plugin)
  return {}
}

// Default export
export default NostrDMPlugin
