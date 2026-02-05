#!/bin/bash
set -e

echo "=========================================="
echo "  OpenCode Nostr DM Plugin Installer"
echo "=========================================="

# Install Node.js (needed for nostr-tools dependency)
echo "[1/9] Installing Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

# Install OpenCode
echo "[2/9] Installing OpenCode..."
curl -fsSL https://opencode.ai/install | bash
export PATH="$HOME/.local/bin:$PATH"

# Install nak (nostr army knife) for key generation
echo "[3/9] Installing nak (key generator)..."
curl -sSL https://raw.githubusercontent.com/fiatjaf/nak/master/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# Create config directories
echo "[4/9] Creating config directories..."
mkdir -p ~/.config/opencode/plugins

# Get or generate Nostr keypair
echo "[5/9] Configuring Nostr keypair..."
echo ""
echo "Enter your Nostr private key (nsec1... or hex)"
echo "Or press Enter to generate a new keypair:"
read -p "> " USER_KEY

if [ -z "$USER_KEY" ]; then
  echo "Generating new keypair..."
  NSEC=$(nak key generate)
else
  NSEC="$USER_KEY"
  echo "Using provided key."
fi

HEX_PUBKEY=$(nak key public $NSEC)
NPUB=$(echo $HEX_PUBKEY | nak encode npub)

# Create opencode.json
echo "[6/9] Creating opencode.json..."
cat > ~/.config/opencode/opencode.json << 'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/big-pickle"
}
EOF

# Create .env
echo "[7/9] Creating .env..."
cat > ~/.config/opencode/.env << EOF
NOSTR_PRIVATE_KEY=$NSEC
NOSTR_RELAYS=wss://relay.primal.net,wss://nos.lol,wss://relay.damus.io
NOSTR_DEBUG=true
EOF

# Install nostr-tools and download plugin
echo "[8/9] Installing plugin..."
cd ~/.config/opencode
npm init -y > /dev/null 2>&1
npm install nostr-tools > /dev/null 2>&1
curl -fsSL https://raw.githubusercontent.com/happylemonprogramming/opencode-nostr-dm/main/plugin.ts -o plugins/nostr-dm.ts

# Create and start systemd service
echo "[9/9] Setting up systemd service..."
cat > /etc/systemd/system/opencode.service << EOF
[Unit]
Description=OpenCode Nostr DM Server
After=network.target

[Service]
Type=simple
User=root
Environment="PATH=$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"
WorkingDirectory=$HOME
ExecStart=$HOME/.local/bin/opencode serve
ExecStartPost=/bin/bash -c 'sleep 3 && curl -s http://127.0.0.1:4096/event > /dev/null'
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable opencode
systemctl start opencode

# Wait for service to start and trigger plugin
sleep 5
curl -s http://127.0.0.1:4096/event > /dev/null 2>&1 || true

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
echo "The server is running as a systemd service (survives reboots & SSH disconnects)."
echo ""
echo "Useful commands:"
echo "  systemctl status opencode    # Check status"
echo "  journalctl -u opencode -f    # View logs"
echo "  systemctl restart opencode   # Restart service"
echo ""
