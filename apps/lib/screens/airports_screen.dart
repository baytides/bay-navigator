import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

/// Model for Bay Area airport information
class Airport {
  final String code;
  final String name;
  final String description;
  final String transitInfo;
  final String address;
  final String websiteUrl;
  final String flightStatusUrl;
  final String parkingUrl;

  const Airport({
    required this.code,
    required this.name,
    required this.description,
    required this.transitInfo,
    required this.address,
    required this.websiteUrl,
    required this.flightStatusUrl,
    required this.parkingUrl,
  });
}

/// Airports screen showing Bay Area airports with transit and travel information
class AirportsScreen extends StatelessWidget {
  const AirportsScreen({super.key});

  static const List<Airport> _airports = [
    Airport(
      code: 'SFO',
      name: 'San Francisco International',
      description:
          'The largest Bay Area airport, serving as a major hub for international and domestic flights.',
      transitInfo: 'BART Yellow & Red lines direct to airport',
      address: 'San Francisco, CA 94128',
      websiteUrl: 'https://www.flysfo.com',
      flightStatusUrl: 'https://www.flysfo.com/flight-info',
      parkingUrl: 'https://www.flysfo.com/passengers/parking',
    ),
    Airport(
      code: 'OAK',
      name: 'Oakland International',
      description:
          'A convenient alternative with shorter security lines and easy BART access.',
      transitInfo: 'BART Orange line + free AirBART shuttle',
      address: 'Oakland, CA 94621',
      websiteUrl: 'https://www.oaklandairport.com',
      flightStatusUrl: 'https://www.oaklandairport.com/flights/',
      parkingUrl: 'https://www.oaklandairport.com/parking/',
    ),
    Airport(
      code: 'SJC',
      name: 'San José Mineta International',
      description:
          'South Bay\'s main airport with growing domestic and international service.',
      transitInfo: 'VTA Airport Flyer bus from Metro/Airport station',
      address: 'San José, CA 95110',
      websiteUrl: 'https://www.flysanjose.com',
      flightStatusUrl: 'https://www.flysanjose.com/flights',
      parkingUrl: 'https://www.flysanjose.com/parking',
    ),
  ];

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Widget _buildAirportCard(BuildContext context, Airport airport) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with code and name
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Airport code badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    airport.code,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Name and description
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        airport.name,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        airport.description,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color:
                              theme.colorScheme.onSurface.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Transit info
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.train,
                    size: 20,
                    color: Colors.blue.shade700,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      airport.transitInfo,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.blue.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Address
            Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 16,
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                ),
                const SizedBox(width: 6),
                Text(
                  airport.address,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 12),

            // Action buttons
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildLinkButton(
                  context,
                  icon: Icons.language,
                  label: 'Website',
                  onPressed: () => _launchUrl(airport.websiteUrl),
                ),
                _buildLinkButton(
                  context,
                  icon: Icons.flight_takeoff,
                  label: 'Flight Status',
                  onPressed: () => _launchUrl(airport.flightStatusUrl),
                ),
                _buildLinkButton(
                  context,
                  icon: Icons.local_parking,
                  label: 'Parking',
                  onPressed: () => _launchUrl(airport.parkingUrl),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLinkButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
  }) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 16),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        textStyle: const TextStyle(fontSize: 13),
      ),
    );
  }

  Widget _buildTravelTips(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.tips_and_updates,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Travel Tips',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildTipItem(context, 'Arrive 2 hours before domestic flights'),
            _buildTipItem(context, 'Arrive 3 hours before international flights'),
            _buildTipItem(context, 'Check flight status before leaving'),
            _buildTipItem(context, 'Consider public transit to avoid parking fees'),
            _buildTipItem(
                context, 'TSA PreCheck can reduce security wait times'),
          ],
        ),
      ),
    );
  }

  Widget _buildTipItem(BuildContext context, String tip) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '•',
            style: TextStyle(
              color: theme.colorScheme.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              tip,
              style: theme.textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Airports'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header
          Text(
            'Bay Area Airports',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Flight information and transit connections for the three major Bay Area airports.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
            ),
          ),

          const SizedBox(height: 24),

          // Airport cards
          ..._airports.map((airport) => _buildAirportCard(context, airport)),

          // Travel tips
          const SizedBox(height: 8),
          _buildTravelTips(context),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
