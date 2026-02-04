// Generate a Nostr keypair for testing
import { generateSecretKey, getPublicKey } from 'nostr-tools'
import { nip19 } from 'nostr-tools'

const sk = generateSecretKey()
const pk = getPublicKey(sk)

// Convert to hex strings
const skHex = Array.from(sk).map(b => b.toString(16).padStart(2, '0')).join('')
const pkHex = pk

// Encode to nsec/npub
const nsec = nip19.nsecEncode(sk)
const npub = nip19.npubEncode(pk)

console.log('\n=== Nostr Keypair Generated ===\n')
console.log('Private Key (nsec):', nsec)
console.log('Public Key (npub):', npub)
console.log('\n⚠️  SAVE YOUR PRIVATE KEY (nsec) - You\'ll need it in .env')
console.log('📱 Share your PUBLIC KEY (npub) - This is what people DM\n')
