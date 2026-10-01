#!/bin/sh
set -e

# Requests go straight to the Azure Static Web App rather than through
# baynavigator.org. Cloudflare's Bot Fight Mode challenges traffic from cloud
# servers, and custom rules on the free plan cannot exempt it.
BACKEND_HOST="${BACKEND_HOST:-blue-pebble-00a40d41e.4.azurestaticapps.net}"
HS_DIR=/var/lib/tor/hidden_service

# The .onion address is derived from this key. Tor rebuilds the public key and
# hostname files from it on startup.
mkdir -p "$HS_DIR"
if [ -f /keys/hs_ed25519_secret_key ]; then
  cp /keys/hs_ed25519_secret_key "$HS_DIR/"
else
  echo "Missing /keys/hs_ed25519_secret_key" >&2
  exit 1
fi
chmod 700 "$HS_DIR"
chmod 600 "$HS_DIR/hs_ed25519_secret_key"

cat > /etc/tor/torrc <<TORRC
DataDirectory /var/lib/tor
HiddenServiceDir $HS_DIR/
HiddenServicePort 80 127.0.0.1:8080
SocksPort 0
User debian-tor
TORRC

chown -R debian-tor:debian-tor /var/lib/tor

cat > /etc/nginx/sites-enabled/default <<NGINX
server {
    listen 127.0.0.1:8080;

    location / {
        proxy_pass https://${BACKEND_HOST};
        proxy_ssl_server_name on;
        proxy_ssl_name ${BACKEND_HOST};
        proxy_set_header Host ${BACKEND_HOST};
        proxy_set_header X-Forwarded-Proto https;
    }
}
NGINX

tor &
nginx -g 'daemon off;'
