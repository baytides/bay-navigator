#!/bin/sh
set -e

BACKEND_ORIGIN="${BACKEND_ORIGIN:-https://baynavigator.org}"
TOR_HOSTNAME="${TOR_HOSTNAME}"

# Configure Tor hidden service
mkdir -p /var/lib/tor/hidden_service
chmod 700 /var/lib/tor/hidden_service

if [ -n "$TOR_HOSTNAME" ]; then
  echo "$TOR_HOSTNAME" > /var/lib/tor/hidden_service/hostname
fi

cat > /etc/tor/torrc <<EOF
DataDirectory /var/lib/tor
HiddenServiceDir /var/lib/tor/hidden_service/
HiddenServicePort 80 127.0.0.1:8080
SocksPort 0
User debian-tor
EOF

chown -R debian-tor:debian-tor /var/lib/tor

# Configure nginx to proxy to backend
cat > /etc/nginx/sites-enabled/default <<EOF
server {
    listen 8080;
    listen 80;

    location / {
        proxy_pass ${BACKEND_ORIGIN};
        proxy_ssl_server_name on;
        proxy_ssl_name baynavigator.org;
        proxy_set_header Host baynavigator.org;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

# Start Tor in background
tor &

# Start nginx in foreground
nginx -g 'daemon off;'
