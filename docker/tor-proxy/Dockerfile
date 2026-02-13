FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends tor nginx ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]
