# OpenCode Nostr DM Plugin

Chat with [OpenCode AI](https://opencode.ai) via Nostr encrypted DMs (NIP-04).

## Quick Install (Ubuntu/Debian Server)

```bash
curl -fsSL https://raw.githubusercontent.com/happylemonprogramming/opencode-nostr-dm/main/install.sh | bash
```

This one command will:
1. Install Node.js (for nostr-tools dependency)
2. Install OpenCode
3. Install nak (key generator)
4. Generate a fresh Nostr keypair
5. Configure the plugin
6. Print your npub

Then start the server:
```bash
source ~/.bashrc
opencode serve --print-logs
```

Trigger the plugin (in another terminal):
```bash
curl http://127.0.0.1:4096/event
```

**Send a DM to the npub shown in the logs** from any Nostr client (Primal, Damus, Amethyst, etc.) and get AI responses!

## Manual Installation

### 1. Install OpenCode
```bash
curl -fsSL https://opencode.ai/install | bash
source ~/.bashrc
```

### 2. Install Node.js & nostr-tools
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
cd ~/.config/opencode
npm init -y
npm install nostr-tools
```

### 3. Install nak & Generate Keypair
```bash
curl -sSL https://raw.githubusercontent.com/fiatjaf/nak/master/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

NSEC=$(nak key generate)
HEX_PUB=$(nak key public $NSEC)
NPUB=$(echo $HEX_PUB | nak encode npub)
echo "Your npub: $NPUB"
```

### 4. Create Config Files
```bash
mkdir -p ~/.config/opencode/plugins

cat > ~/.config/opencode/opencode.json << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/big-pickle"
}
EOF

cat > ~/.config/opencode/.env << EOF
NOSTR_PRIVATE_KEY=$NSEC
NOSTR_RELAYS=wss://relay.primal.net,wss://nos.lol,wss://relay.damus.io
NOSTR_DEBUG=true
EOF
```

### 5. Download Plugin
```bash
curl -fsSL https://raw.githubusercontent.com/happylemonprogramming/opencode-nostr-dm/main/plugin.ts \
  -o ~/.config/opencode/plugins/nostr-dm.ts
```

### 6. Start & Test
```bash
opencode serve --print-logs
# In another terminal:
curl http://127.0.0.1:4096/event
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NOSTR_PRIVATE_KEY` | Yes | - | Private key (nsec1... or hex) |
| `NOSTR_RELAYS` | No | 3 default relays | Comma-separated relay URLs |
| `NOSTR_DEFAULT_MODEL` | No | `opencode/big-pickle` | Default AI model (free) |
| `NOSTR_DEBUG` | No | `false` | Enable debug logging |

Edit config: `nano ~/.config/opencode/.env`

## Keep Running 24/7 (systemd)

```bash
cat > /etc/systemd/system/opencode.service << 'EOF'
[Unit]
Description=OpenCode Nostr DM Server
After=network.target

[Service]
Type=simple
User=root
Environment="PATH=/root/.local/bin:/usr/local/bin:/usr/bin:/bin"
WorkingDirectory=/root
ExecStart=/root/.local/bin/opencode serve
ExecStartPost=/bin/bash -c 'sleep 3 && curl -s http://127.0.0.1:4096/event > /dev/null'
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable opencode
systemctl start opencode
```

Check status: `systemctl status opencode`
View logs: `journalctl -u opencode -f`

## How It Works

1. Plugin subscribes to NIP-04 DMs tagged to your server's pubkey
2. When a DM arrives, it decrypts the message and sends it to OpenCode AI
3. OpenCode AI generates a response
4. Plugin encrypts and sends the response back via Nostr DM

Each sender gets their own persistent session (until server restart).

## Features

- NIP-04 encrypted direct messages
- Automatic session management (one session per sender)
- `/new` command support - send `/new` to clear context and start fresh
- Automatic session recovery if session becomes invalid
- Multi-relay support
- Free AI models (no API keys needed)
- Debug logging

## Commands

| Command | Description |
|---------|-------------|
| `/new` | Clear current session and start a fresh conversation |
| `/models` | Change AI model - prompts for model name, reverts if invalid |

**Note:** The default model (`opencode/big-pickle`) is free. To use paid models (e.g., `anthropic/claude-sonnet-4-20250514`), add the appropriate API key to your `.env` file (see `.env.example`).

## Troubleshooting

**Plugin doesn't load:**
- Restart OpenCode and trigger with `curl http://127.0.0.1:4096/event`
- Check logs for `[NostrDM]` messages

**No DMs received:**
- Verify `NOSTR_PRIVATE_KEY` is set: `cat ~/.config/opencode/.env`
- Enable debug: `NOSTR_DEBUG=true`
- Check you're DMing the correct npub

## License

MIT

## Links

- [GitHub](https://github.com/happylemonprogramming/opencode-nostr-dm)
- [npm](https://www.npmjs.com/package/opencode-nostr-dm)
- [OpenCode](https://opencode.ai)
- [Nostr Protocol](https://nostr.com)
