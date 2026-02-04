# Getting Started with OpenCode Nostr DM Plugin

## Quick Start Guide

### 1. Install Dependencies (Already Done ✅)

```bash
cd opencode-nostr-dm
bun install
```

### 2. Build the Plugin

```bash
bun run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### 3. Generate Nostr Keypair

You need a Nostr keypair for your OpenCode server:

```bash
# Install nak if you don't have it
curl -sSL https://raw.githubusercontent.com/fiatjaf/nak/master/install.sh | sh

# Generate keypair
nak key generate > ~/.nostr-server-key

# Get the npub (public key to share)
cat ~/.nostr-server-key | nak key public | nak encode npub
```

**Save the npub** - this is what you'll DM from your Nostr client!

### 4. Test Locally

#### Option A: Use the plugin from local files

```bash
# Create OpenCode config directory
mkdir -p ~/.config/opencode

# Link plugin to OpenCode plugins directory
mkdir -p ~/.config/opencode/plugins
ln -s $(pwd) ~/.config/opencode/plugins/opencode-nostr-dm

# Create .env file
cat > ~/.config/opencode/.env << EOF
NOSTR_PRIVATE_KEY=$(cat ~/.nostr-server-key)
NOSTR_RELAYS=wss://relay.primal.net,wss://nos.lol
NOSTR_DEBUG=true
EOF

# Secure it
chmod 600 ~/.config/opencode/.env

# Start OpenCode
opencode serve
```

#### Option B: Use npm link for testing

```bash
# In the plugin directory
bun link

# In your OpenCode config directory
cd ~/.config/opencode
bun link @happylemonprogramming/opencode-nostr-dm

# Create opencode.json
cat > opencode.json << 'EOF'
{
  "plugin": ["@happylemonprogramming/opencode-nostr-dm"]
}
EOF

# Create .env (same as above)
# ...

# Start OpenCode
opencode serve
```

### 5. Test the Plugin

1. **Start OpenCode** in one terminal:
   ```bash
   opencode serve --print-logs
   ```

2. **Watch for initialization** - you should see:
   ```
   [NostrDM] Plugin initialized
   [NostrDM] npub: npub1...
   [NostrDM] Relays: [ ... ]
   [NostrDM] Subscribing with filter: ...
   [NostrDM] Subscription established (EOSE received)
   ```

3. **Send a DM from your Nostr client**:
   - Open Damus, Amethyst, Primal, or any Nostr client
   - Start a DM to the npub shown in the logs
   - Send: "Hello, what can you do?"

4. **Watch the logs** - you should see:
   ```
   [NostrDM] Received DM from: 12345678
   [NostrDM] Content: Hello, what can you do?
   [NostrDM] Created new session for sender: npub1...
   [NostrDM] Sent DM to: 12345678
   ```

5. **Check your Nostr client** - you should receive a response!

## Next Steps

### Publish to npm

Once testing is successful:

```bash
# Login to npm
npm login

# Publish
npm publish --access public
```

### Deploy to Hetzner Server

See the main README.md for complete server deployment instructions with systemd.

## Troubleshooting

### Plugin doesn't load

- Check `opencode.json` is valid JSON
- Verify plugin is in `~/.config/opencode/plugins/` or linked correctly
- Check OpenCode logs: `tail -f ~/.opencode/logs/opencode.log`

### No DMs received

- Verify `NOSTR_PRIVATE_KEY` is set correctly
- Check relays are reachable: `curl -I https://relay.primal.net`
- Enable debug mode: `NOSTR_DEBUG=true`
- Check you're DMing the correct npub

### Session creation fails

- Ensure OpenCode is running (`opencode serve` or `opencode`)
- Check OpenCode has permission to create sessions
- Look for errors in console output

### Build errors

- Run `bun install` to ensure dependencies are installed
- Check TypeScript version: `bun run typescript --version`
- Clear dist and rebuild: `rm -rf dist && bun run build`

## Development Workflow

### Make changes

1. Edit files in `src/`
2. Rebuild: `bun run build`
3. Restart OpenCode to load changes

### Watch mode (auto-rebuild)

```bash
bun run dev
```

This runs TypeScript in watch mode - it will rebuild on file changes.

### Test changes

After making changes, restart OpenCode:

```bash
# Stop OpenCode (Ctrl+C)
# Restart it
opencode serve --print-logs
```

## Project Structure

```
opencode-nostr-dm/
├── src/
│   ├── index.ts              # Main plugin entry point
│   ├── nostr-client.ts       # Nostr relay connection & DM handling
│   ├── session-manager.ts    # OpenCode session management
│   ├── crypto.ts             # NIP-04 encryption/decryption
│   └── types.ts              # TypeScript type definitions
├── dist/                     # Compiled JavaScript (generated)
├── package.json              # npm package configuration
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Full documentation
├── .env.example              # Environment variable template
└── LICENSE                   # MIT License
```

## Key Files

- **src/index.ts**: Plugin initialization, DM subscription setup
- **src/nostr-client.ts**: Handles Nostr relay connections, encrypts/decrypts DMs
- **src/session-manager.ts**: Maps Nostr senders to OpenCode sessions
- **src/crypto.ts**: NIP-04 encryption utilities

## Configuration

All configuration is via environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NOSTR_PRIVATE_KEY` | ✅ Yes | - | Server's private key (nsec1...) |
| `NOSTR_RELAYS` | No | 3 default relays | Comma-separated relay URLs |
| `NOSTR_DEBUG` | No | `false` | Enable debug logging |
| `NOSTR_SESSION_TIMEOUT_HOURS` | No | `24` | Session timeout |
| `NOSTR_ALLOWED_SENDERS` | No | - | Sender whitelist (optional) |
