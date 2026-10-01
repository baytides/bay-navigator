FROM debian:bookworm-slim

# Tor comes from the Tor Project's repository. Debian's own package lags behind
# the protocol versions the Tor network recommends.
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg nginx && \
    curl -fsSL https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc \
      | gpg --dearmor -o /usr/share/keyrings/tor-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] https://deb.torproject.org/torproject.org bookworm main" \
      > /etc/apt/sources.list.d/tor.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends tor deb.torproject.org-keyring && \
    apt-get purge -y curl gnupg && apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
