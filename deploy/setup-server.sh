#!/usr/bin/env bash
# Initial Oracle Cloud VM setup (Ubuntu 24.04)
# Run once after SSH login: bash deploy/setup-server.sh

set -euo pipefail

echo "==> Updating packages..."
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git nginx certbot python3-certbot-nginx

echo "==> Enabling Docker..."
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER"

echo "==> Creating app directory..."
sudo mkdir -p /opt/studio
sudo chown "$USER:$USER" /opt/studio

echo ""
echo "Done. Log out and SSH back in so Docker group membership applies."
echo "Then clone the repo into /opt/studio and copy .env.production.example to .env"
