# OpenCode Nostr DM Plugin

Send messages to your OpenCode instance via Nostr encrypted DMs (NIP-04).

[![npm version](https://img.shields.io/npm/v/@happylemonprogramming/opencode-nostr-dm.svg)](https://www.npmjs.com/package/@happylemonprogramming/opencode-nostr-dm)

## Features

- ✅ NIP-04 encrypted direct messages
- ✅ Automatic session management (one session per sender)
- ✅ Session persistence with configurable timeout
- ✅ Multi-relay support
- ✅ Optional sender whitelist
- ✅ Debug logging

## Installation

### From npm

Add to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@happylemonprogramming/opencode-nostr-dm"]
}
```

OpenCode will automatically install the plugin on startup.

### Local Development

```bash
git clone https://github.com/happylemonprogramming/opencode-nostr-dm
cd opencode-nostr-dm
bun install
bun run build
```

## Configuration

### 1. Generate Nostr Keypair

First, generate a keypair for your OpenCode server:

```bash
# Install nak if you don't have it
curl -sSL https://raw.githubusercontent.com/fiatjaf/nak/master/install.sh | sh

# Generate keypair
nak key generate > ~/.nostr-server-key

# Get the public key (npub) to share
cat ~/.nostr-server-key | nak key public | nak encode npub
```

**Save the npub** - this is what you'll DM from your phone/client.

### 2. Set Environment Variables

Create `.env` file in your OpenCode config directory:

```bash
# ~/.config/opencode/.env (or project .env)
NOSTR_PRIVATE_KEY=$(cat ~/.nostr-server-key)
NOSTR_RELAYS=wss://relay.primal.net,wss://nos.lol,wss://relay.damus.io
NOSTR_DEBUG=true
NOSTR_SESSION_TIMEOUT_HOURS=24
```

**Or set in your shell:**

```bash
export NOSTR_PRIVATE_KEY=nsec1...
export NOSTR_RELAYS=wss://relay.primal.net,wss://nos.lol
```

### 3. Start OpenCode

```bash
# Start in headless mode (for servers)
opencode serve

# Or with TUI
opencode
```

### 4. Send a DM

1. Open your Nostr client (Damus, Amethyst, Primal, etc.)
2. Start a DM to your server's npub
3. Send: "Hello, what can you do?"
4. OpenCode will respond!

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NOSTR_PRIVATE_KEY` | ✅ Yes | - | Your server's private key (nsec1... or hex) |
| `NOSTR_RELAYS` | No | `wss://relay.primal.net,wss://nos.lol,wss://relay.damus.io` | Comma-separated relay URLs |
| `NOSTR_DEBUG` | No | `false` | Enable debug logging |
| `NOSTR_SESSION_TIMEOUT_HOURS` | No | `24` | Session timeout in hours |
| `NOSTR_ALLOWED_SENDERS` | No | - | Comma-separated sender pubkeys (whitelist) |

## How It Works

1. Plugin subscribes to NIP-04 DMs tagged to your server's pubkey
2. When a DM arrives:
   - Decrypts the message (NIP-04)
   - Creates/retrieves an OpenCode session for the sender
   - Sends the message to OpenCode
   - Encrypts and sends the response back via Nostr

Each sender gets their own persistent session that lasts 24 hours (configurable).

## Server Deployment (Ubuntu/Debian)

### Quick Setup

```bash
# SSH to your server
ssh root@your-server

# Install OpenCode
curl -fsSL https://opencode.ai/install | bash

# Create config directory
mkdir -p ~/.config/opencode

# Add plugin to config
cat > ~/.config/opencode/opencode.json << 'EOF'
{
  "plugin": ["@happylemonprogramming/opencode-nostr-dm"]
}
EOF

# Generate Nostr keypair
nak key generate > ~/.nostr-server-key
cat ~/.nostr-server-key | nak key public | nak encode npub

# Create .env file
cat > ~/.config/opencode/.env << 'EOF'
NOSTR_PRIVATE_KEY=$(cat ~/.nostr-server-key)
NOSTR_RELAYS=wss://relay.primal.net,wss://nos.lol
NOSTR_DEBUG=false
EOF

# Secure the .env
chmod 600 ~/.config/opencode/.env

# Start OpenCode
opencode serve
```

### Production Setup (systemd)

Create systemd service:

```bash
sudo nano /etc/systemd/system/opencode-nostr.service
```

**Content:**

```ini
[Unit]
Description=OpenCode with Nostr DM Plugin
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/root
EnvironmentFile=/root/.config/opencode/.env
ExecStart=/root/.opencode/bin/opencode serve
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=opencode-nostr

NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**Enable and start:**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable opencode-nostr

# Start service
sudo systemctl start opencode-nostr

# Check status
sudo systemctl status opencode-nostr

# View logs
sudo journalctl -u opencode-nostr -f
```

## Security

- Messages are encrypted with NIP-04 (Nostr's DM encryption)
- Your private key never leaves the server
- Optional sender whitelist for access control
- Sessions are isolated per sender

**Note:** NIP-04 has known security limitations (metadata leakage). For production use, consider implementing NIP-17 support (gift-wrapped messages with better metadata privacy).

## Debugging

Enable debug logs:

```bash
NOSTR_DEBUG=true opencode serve
```

Check OpenCode logs:

```bash
# If using systemd
sudo journalctl -u opencode-nostr -f

# Or OpenCode log file
tail -f ~/.opencode/logs/opencode.log
```

## Use Cases

### Dedicated Server

Run OpenCode on a remote server and DM it from anywhere:

- Server has full filesystem/tool access
- You control it from your phone via Nostr DMs
- Sessions persist across conversations
- No need for SSH, VPN, or port forwarding

### Shared OpenCode Instance

Add to existing OpenCode setup:

- Multiple users can DM the same OpenCode instance
- Each user gets their own isolated session
- Optional whitelist for access control

## Roadmap

- [ ] NIP-17 support (modern private messages with metadata privacy)
- [ ] Session persistence across restarts (SQLite)
- [ ] Custom commands (`/new`, `/reset`, `/status`)
- [ ] File attachment support (via Nostr blossom/nip96)
- [ ] Multi-user session sharing
- [ ] Typing indicators

## Contributing

PRs welcome! Please open an issue first to discuss major changes.

## License

MIT

## Links

- [GitHub](https://github.com/happylemonprogramming/opencode-nostr-dm)
- [npm](https://www.npmjs.com/package/@happylemonprogramming/opencode-nostr-dm)
- [OpenCode Docs](https://opencode.ai/docs)
- [Nostr Protocol](https://nostr.com)
