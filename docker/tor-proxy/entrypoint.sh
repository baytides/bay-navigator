#!/bin/sh
set -e

BACKEND_ORIGIN="${BACKEND_ORIGIN:-https://baynavigator.org}"
HS_DIR=/var/lib/tor/hidden_service

# Cloudflare challenges traffic from the VM's IP address. A custom WAF rule on
# baynavigator.org skips the challenge when this header carries the shared secret.
if [ -f /keys/tor_auth_secret ]; then
  TOR_AUTH_SECRET="$(cat /keys/tor_auth_secret)"
else
  echo "Missing /keys/tor_auth_secret" >&2
  exit 1
fi

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
        proxy_pass ${BACKEND_ORIGIN};
        proxy_ssl_server_name on;
        proxy_ssl_name baynavigator.org;
        proxy_set_header Host baynavigator.org;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Tor-Auth ${TOR_AUTH_SECRET};
    }
}
NGINX

tor &
nginx -g 'daemon off;'
