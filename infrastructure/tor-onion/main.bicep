// Tor Hidden Service VM for Bay Navigator
// Deploys a minimal B1s VM running Tor to provide a .onion address

@description('Environment name')
@allowed(['prod'])
param environment string = 'prod'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Admin username for the VM')
param adminUsername string = 'azureuser'

@description('SSH public key for VM access')
@secure()
param sshPublicKey string

@description('The backend URL to proxy (Bay Navigator)')
param backendUrl string = 'https://baynavigator.org'

var prefix = 'baynavigator-tor'
var vmName = '${prefix}-vm'
var vmSize = 'Standard_B1s'

// Network Security Group - minimal attack surface
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${prefix}-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowSSH'
        properties: {
          priority: 1000
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '22'
        }
      }
      // Note: Tor hidden services don't need inbound ports open
      // All traffic is outbound through the Tor network
    ]
  }
}

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: '${prefix}-vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/24']
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: '10.0.0.0/24'
          networkSecurityGroup: {
            id: nsg.id
          }
        }
      }
    ]
  }
}

// Public IP for SSH access (can be removed after initial setup if desired)
resource publicIp 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: '${prefix}-pip'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    dnsSettings: {
      domainNameLabel: '${prefix}-${uniqueString(resourceGroup().id)}'
    }
  }
}

// Network Interface
resource nic 'Microsoft.Network/networkInterfaces@2023-09-01' = {
  name: '${prefix}-nic'
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          publicIPAddress: {
            id: publicIp.id
          }
          subnet: {
            id: vnet.properties.subnets[0].id
          }
        }
      }
    ]
  }
}

// Cloud-init configuration for Tor setup
// Note: __BACKEND_URL__ is a placeholder that gets replaced with the actual backendUrl parameter
var cloudInitScript = '''
#cloud-config
package_update: true
package_upgrade: true

packages:
  - tor
  - nginx
  - ufw

write_files:
  - path: /etc/tor/torrc.d/hidden-service.conf
    content: |
      # Bay Navigator Hidden Service Configuration
      HiddenServiceDir /var/lib/tor/baynavigator/
      HiddenServicePort 80 127.0.0.1:8080

      # Security hardening
      SocksPort 0
      ControlPort 0
    permissions: '0644'

  - path: /etc/nginx/sites-available/tor-proxy
    content: |
      server {
          listen 127.0.0.1:8080;
          server_name _;

          # Security headers
          add_header X-Frame-Options "SAMEORIGIN" always;
          add_header X-Content-Type-Options "nosniff" always;
          add_header Referrer-Policy "strict-origin-when-cross-origin" always;

          # Proxy to Bay Navigator
          location / {
              proxy_pass __BACKEND_URL__;
              proxy_http_version 1.1;
              proxy_set_header Host baynavigator.org;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto https;

              # Cache static assets locally
              proxy_cache_valid 200 1h;
              proxy_cache_valid 404 1m;

              # Timeouts
              proxy_connect_timeout 60s;
              proxy_read_timeout 60s;
          }

          # Health check endpoint
          location /health {
              return 200 'OK';
              add_header Content-Type text/plain;
          }
      }
    permissions: '0644'

  - path: /usr/local/bin/show-onion-address.sh
    content: |
      #!/bin/bash
      echo "=== Bay Navigator .onion Address ==="
      if [ -f /var/lib/tor/baynavigator/hostname ]; then
          cat /var/lib/tor/baynavigator/hostname
      else
          echo "Tor hidden service not yet initialized. Please wait..."
      fi
    permissions: '0755'

  - path: /etc/systemd/system/tor-monitor.service
    content: |
      [Unit]
      Description=Tor Hidden Service Monitor
      After=tor.service

      [Service]
      Type=oneshot
      ExecStart=/bin/bash -c 'sleep 30 && /usr/local/bin/show-onion-address.sh > /var/log/onion-address.log'

      [Install]
      WantedBy=multi-user.target
    permissions: '0644'

runcmd:
  # Enable nginx site
  - ln -sf /etc/nginx/sites-available/tor-proxy /etc/nginx/sites-enabled/
  - rm -f /etc/nginx/sites-enabled/default

  # Create Tor hidden service directory
  - mkdir -p /var/lib/tor/baynavigator
  - chown -R debian-tor:debian-tor /var/lib/tor/baynavigator
  - chmod 700 /var/lib/tor/baynavigator

  # Configure firewall
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow ssh
  - ufw --force enable

  # Start services
  - systemctl enable tor
  - systemctl enable nginx
  - systemctl restart tor
  - systemctl restart nginx

  # Enable monitor service
  - systemctl enable tor-monitor
  - systemctl start tor-monitor

  # Log the onion address once available
  - sleep 60 && /usr/local/bin/show-onion-address.sh >> /var/log/cloud-init-output.log
'''

// Virtual Machine
resource vm 'Microsoft.Compute/virtualMachines@2023-09-01' = {
  name: vmName
  location: location
  properties: {
    hardwareProfile: {
      vmSize: vmSize
    }
    osProfile: {
      computerName: 'tor-onion'
      adminUsername: adminUsername
      customData: base64(replace(cloudInitScript, '__BACKEND_URL__', backendUrl))
      linuxConfiguration: {
        disablePasswordAuthentication: true
        ssh: {
          publicKeys: [
            {
              path: '/home/${adminUsername}/.ssh/authorized_keys'
              keyData: sshPublicKey
            }
          ]
        }
      }
    }
    storageProfile: {
      imageReference: {
        publisher: 'Canonical'
        offer: '0001-com-ubuntu-server-jammy'
        sku: '22_04-lts-gen2'
        version: 'latest'
      }
      osDisk: {
        name: '${prefix}-osdisk'
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'Standard_LRS'
        }
        diskSizeGB: 30
      }
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: nic.id
        }
      ]
    }
  }
  tags: {
    environment: environment
    purpose: 'tor-hidden-service'
    project: 'baynavigator'
  }
}

// Outputs
output vmName string = vm.name
output publicIpAddress string = publicIp.properties.dnsSettings.fqdn
output sshCommand string = 'ssh ${adminUsername}@${publicIp.properties.dnsSettings.fqdn}'
output getOnionAddressCommand string = 'ssh ${adminUsername}@${publicIp.properties.dnsSettings.fqdn} "sudo cat /var/lib/tor/baynavigator/hostname"'
