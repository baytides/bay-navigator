#!/bin/sh
set -e

BACKEND_ORIGIN="${BACKEND_ORIGIN:-https://baynavigator.org}"

# Set up hidden service directory with pre-existing keys
mkdir -p /var/lib/tor/hidden_service/authorized_clients
chmod 700 /var/lib/tor/hidden_service

# Load keys from mounted volume or base64 environment variables
if [ -f /keys/hs_ed25519_secret_key ]; then
  cp /keys/hs_ed25519_secret_key /var/lib/tor/hidden_service/
  cp /keys/hs_ed25519_public_key /var/lib/tor/hidden_service/
  cp /keys/hostname /var/lib/tor/hidden_service/
elif [ -n "$HS_SECRET_KEY_B64" ]; then
  echo "$HS_SECRET_KEY_B64" | base64 -d > /var/lib/tor/hidden_service/hs_ed25519_secret_key
  echo "$HS_PUBLIC_KEY_B64" | base64 -d > /var/lib/tor/hidden_service/hs_ed25519_public_key
  echo "$HS_HOSTNAME" > /var/lib/tor/hidden_service/hostname
fi

chmod 600 /var/lib/tor/hidden_service/hs_ed25519_secret_key 2>/dev/null || true
chmod 600 /var/lib/tor/hidden_service/hs_ed25519_public_key 2>/dev/null || true

cat > /etc/tor/torrc <<EOF
DataDirectory /var/lib/tor
HiddenServiceDir /var/lib/tor/hidden_service/
HiddenServicePort 80 127.0.0.1:8080
SocksPort 0
User debian-tor
EOF

chown -R debian-tor:debian-tor /var/lib/tor

# Configure nginx to proxy to backend
cat > /etc/nginx/sites-enabled/default <<NGINXEOF
server {
    listen 8080;
    listen 80;

    location / {
        proxy_pass ${BACKEND_ORIGIN};
        proxy_ssl_server_name on;
        proxy_ssl_name baynavigator.org;
        proxy_set_header Host baynavigator.org;
        proxy_set_header X-Tor-Auth ${TOR_AUTH_SECRET};
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
NGINXEOF

# Start Tor in background
tor &

# Start nginx in foreground
nginx -g 'daemon off;'
