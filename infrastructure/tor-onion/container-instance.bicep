// Tor Hidden Service - Azure Container Instance (Serverless)
// Replaces always-on VM with pay-per-use container
// Cost: ~$2-3/mo instead of $13/mo VM

@description('Location for resources')
param location string = 'eastus2'

@description('Container instance name')
param containerName string = 'baynavigator-tor'

@description('Tor hidden service hostname (onion address)')
param torHostname string = 'ul3gghpdow6o6rmtowpgdbx2c6fgqz3bogcwm44wg62r3vxq3eil43ad'

@description('Backend origin to proxy')
param backendOrigin string = 'https://baynavigator.org'

@description('Container restart policy')
@allowed([
  'Always'
  'OnFailure'
  'Never'
])
param restartPolicy string = 'Always'

// Container Instance
resource containerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: containerName
  location: location
  properties: {
    containers: [
      {
        name: 'tor-proxy'
        properties: {
          image: 'mcr.microsoft.com/cbl-mariner/base/core:2.0'
          resources: {
            requests: {
              cpu: 1
              memoryInGB: 1
            }
          }
          ports: [
            {
              protocol: 'TCP'
              port: 80
            }
            {
              protocol: 'TCP'
              port: 9050 // Tor SOCKS proxy
            }
          ]
          environmentVariables: [
            {
              name: 'BACKEND_ORIGIN'
              value: backendOrigin
            }
            {
              name: 'TOR_HOSTNAME'
              value: torHostname
            }
          ]
          command: [
            '/bin/sh'
            '-c'
            '''
            # Install Tor and nginx (tdnf is the package manager for CBL-Mariner)
            tdnf install -y tor nginx

            # Configure Tor hidden service
            mkdir -p /var/lib/tor/hidden_service
            echo "${TOR_HOSTNAME}" > /var/lib/tor/hidden_service/hostname

            cat > /etc/tor/torrc <<EOF
HiddenServiceDir /var/lib/tor/hidden_service/
HiddenServicePort 80 127.0.0.1:8080
SocksPort 0.0.0.0:9050
EOF

            # Configure nginx to proxy to backend
            cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen 8080;
    server_name ${TOR_HOSTNAME}.onion;

    location / {
        proxy_pass ${BACKEND_ORIGIN};
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
            '''
          ]
        }
      }
    ]
    osType: 'Linux'
    restartPolicy: restartPolicy
    ipAddress: {
      type: 'Public'
      ports: [
        {
          protocol: 'TCP'
          port: 80
        }
      ]
    }
  }
}

output containerGroupId string = containerGroup.id
output ipAddress string = containerGroup.properties.ipAddress.ip
