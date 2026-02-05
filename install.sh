#!/bin/bash
set -e

echo "=========================================="
echo "  OpenCode Nostr DM Plugin Installer"
echo "=========================================="

# Install Node.js (needed for nostr-tools dependency)
echo "[1/8] Installing Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# Install OpenCode
echo "[2/8] Installing OpenCode..."
curl -fsSL https://opencode.ai/install | bash
export PATH="$HOME/.local/bin:$PATH"

# Install nak (nostr army knife) for key generation
echo "[3/8] Installing nak (key generator)..."
curl -sSL https://raw.githubusercontent.com/fiatjaf/nak/master/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# Create config directories
echo "[4/8] Creating config directories..."
mkdir -p ~/.config/opencode/plugins

# Generate Nostr keypair
echo "[5/8] Generating Nostr keypair..."
NSEC=$(nak key generate)
HEX_PUBKEY=$(nak key public $NSEC)
NPUB=$(echo $HEX_PUBKEY | nak encode npub)

# Create opencode.json
echo "[6/8] Creating opencode.json..."
cat > ~/.config/opencode/opencode.json << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/big-pickle"
}
EOF

# Create .env
echo "[7/8] Creating .env..."
cat > ~/.config/opencode/.env << EOF
NOSTR_PRIVATE_KEY=$NSEC
NOSTR_RELAYS=wss://relay.primal.net,wss://nos.lol,wss://relay.damus.io
NOSTR_DEBUG=true
EOF

# Install nostr-tools and download plugin
echo "[8/8] Installing plugin..."
cd ~/.config/opencode
npm init -y > /dev/null 2>&1
npm install nostr-tools > /dev/null 2>&1
curl -fsSL https://raw.githubusercontent.com/happylemonprogramming/opencode-nostr-dm/main/plugin.ts -o plugins/nostr-dm.ts

echo ""
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
echo "Your Nostr public key (npub):"
echo "  $NPUB"
echo ""
echo "Send DMs to this npub to chat with OpenCode AI!"
echo ""
echo "To start the server, run:"
echo "  source ~/.bashrc"
echo "  opencode serve --print-logs"
echo ""
echo "Then in another terminal, trigger the plugin:"
echo "  curl http://127.0.0.1:4096/event"
echo ""
