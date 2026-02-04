#!/bin/bash
set -e

echo "=========================================="
echo "  OpenCode Nostr DM Plugin Installer"
echo "=========================================="

# Install OpenCode
echo "[1/6] Installing OpenCode..."
curl -fsSL https://opencode.ai/install | bash
export PATH="$HOME/.local/bin:$PATH"

# Install nak (nostr army knife) for key generation
echo "[2/6] Installing nak (key generator)..."
curl -fsSL https://github.com/fiatjaf/nak/releases/latest/download/nak-linux-amd64 -o /usr/local/bin/nak
chmod +x /usr/local/bin/nak

# Create config directory
echo "[3/6] Creating config directory..."
mkdir -p ~/.config/opencode

# Generate Nostr keypair
echo "[4/6] Generating Nostr keypair..."
NSEC=$(nak key generate)
NPUB=$(echo "$NSEC" | nak key public --npub)
HEX_PUBKEY=$(echo "$NSEC" | nak key public)

# Create opencode.json
echo "[5/6] Creating opencode.json..."
cat > ~/.config/opencode/opencode.json << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/big-pickle",
  "plugins": ["opencode-nostr-dm"]
}
EOF

# Create .env
echo "[6/6] Creating .env..."
cat > ~/.config/opencode/.env << EOF
NOSTR_PRIVATE_KEY=$NSEC
NOSTR_RELAYS=wss://relay.primal.net,wss://nos.lol,wss://relay.damus.io
NOSTR_DEBUG=true
NOSTR_SESSION_TIMEOUT_HOURS=24
EOF

echo ""
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
echo "Your Nostr public key (npub):"
echo "  $NPUB"
echo ""
echo "Hex pubkey: $HEX_PUBKEY"
echo ""
echo "Send DMs to this npub to chat with OpenCode AI!"
echo ""
echo "Starting OpenCode server..."
echo ""

# Start OpenCode in background, trigger plugin, then foreground logs
opencode serve --print-logs &
OPENCODE_PID=$!
sleep 3

# Trigger plugin loading
curl -s http://127.0.0.1:4096/event > /dev/null 2>&1 || true

# Bring back to foreground
wait $OPENCODE_PID
