import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/transit.dart';
import '../services/transit_service.dart';

/// Transit screen showing Bay Area transit agencies and live alerts
class TransitScreen extends StatefulWidget {
  const TransitScreen({super.key});

  @override
  State<TransitScreen> createState() => _TransitScreenState();
}

class _TransitScreenState extends State<TransitScreen> {
  final TransitService _transitService = TransitService();
  List<TransitAlert> _alerts = [];
  Map<String, int> _alertCounts = {};
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAlerts();
  }

  Future<void> _loadAlerts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _transitService.fetchAlerts();
      final counts = <String, int>{};

      // Count alerts per agency
      for (final alert in response.alerts) {
        for (final agencyId in alert.agencies) {
          counts[agencyId] = (counts[agencyId] ?? 0) + 1;
        }
      }

      setState(() {
        _alerts = response.alerts;
        _alertCounts = counts;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load alerts. Pull down to retry.';
        _isLoading = false;
      });
    }
  }

  /// Fallback used when an agency has no usable colour. Matches the grey the
  /// unknown-agency placeholder above already uses.
  static const Color _fallbackAgencyColor = Color(0xFF666666);

  Color _parseColor(String hexColor) {
    // Agency colours can come from `TransitAgency.fromJson`, so a malformed
    // value must not throw during build — `int.parse` on bad hex used to take
    // the whole screen down with a FormatException.
    final hex = hexColor.trim().replaceFirst('#', '');
    if (hex.length != 6 && hex.length != 8) return _fallbackAgencyColor;
    final value = int.tryParse(hex, radix: 16);
    if (value == null) return _fallbackAgencyColor;
    return Color(hex.length == 8 ? value : 0xFF000000 | value);
  }

  Widget _buildAgencyCard(TransitAgency agency) {
    final theme = Theme.of(context);
    final alertCount = _alertCounts[agency.id] ?? 0;
    final agencyColor = _parseColor(agency.color);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _launchUrl(agency.websiteUrl),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Color indicator
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: agencyColor,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              const SizedBox(width: 12),
              // Agency info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      agency.name,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '${_formatNumber(agency.stations)} ${agency.stationLabel}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ),
                  ],
                ),
              ),
              // Alert badge
              if (alertCount > 0)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.warning_amber_rounded,
                        size: 14,
                        color: Colors.amber.shade800,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$alertCount',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.amber.shade800,
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(width: 8),
              Icon(
                Icons.chevron_right,
                color: theme.colorScheme.onSurface.withValues(alpha: 0.4),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAlertCard(TransitAlert alert) {
    final theme = Theme.of(context);
    final agencies = _transitService.getAgencies();

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: alert.url != null ? () => _launchUrl(alert.url!) : null,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Agency badges
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: alert.agencies.map((agencyId) {
                  final agency = agencies.firstWhere(
                    (a) => a.id == agencyId,
                    orElse: () => TransitAgency(
                      id: agencyId,
                      name: agencyId,
                      type: 'bus',
                      color: '#666666',
                      stations: 0,
                    ),
                  );
                  return Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: _parseColor(agency.color).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      agency.name,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _parseColor(agency.color),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 8),
              // Alert title
              Text(
                alert.title,
                style: theme.textTheme.bodyMedium,
              ),
              if (alert.timeAgo.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  alert.timeAgo,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, Color dotColor) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: dotColor,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}k';
    }
    return number.toString();
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final railAgencies = _transitService.getAgenciesByType('rail');
    final ferryAgencies = _transitService.getAgenciesByType('ferry');
    final busAgencies = _transitService.getAgenciesByType('bus');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transit'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAlerts,
            tooltip: 'Refresh alerts',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadAlerts,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Header
            Text(
              'Bay Area Transit',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Live service alerts and information for ${_transitService.getAgencies().length} Bay Area transit agencies.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),

            // Live Alerts Section
            const SizedBox(height: 24),
            Row(
              children: [
                if (_isLoading)
                  SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.amber.shade600,
                    ),
                  )
                else
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color:
                          _alerts.isEmpty ? Colors.green : Colors.amber.shade600,
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                const SizedBox(width: 8),
                Text(
                  'Live Service Alerts',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                if (_alerts.isNotEmpty)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_alerts.length} active',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.amber.shade800,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Alerts list or status
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_error != null)
              Card(
                color: Colors.red.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: Colors.red.shade700),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _error!,
                          style: TextStyle(color: Colors.red.shade700),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else if (_alerts.isEmpty)
              Card(
                color: Colors.green.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green.shade700),
                      const SizedBox(width: 12),
                      Text(
                        'No active service alerts. All systems normal.',
                        style: TextStyle(color: Colors.green.shade700),
                      ),
                    ],
                  ),
                ),
              )
            else
              Column(
                children: _alerts.take(5).map(_buildAlertCard).toList(),
              ),

            // View all alerts link
            if (_alerts.length > 5)
              TextButton.icon(
                onPressed: () => _launchUrl('https://511.org/transit/alerts'),
                icon: const Icon(Icons.open_in_new, size: 16),
                label: Text('View all ${_alerts.length} alerts on 511.org'),
              ),

            const SizedBox(height: 8),
            Text(
              'Data from 511.org. Alerts refresh every 5 minutes.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),

            // Rail Services
            _buildSectionHeader('Rail Services', Icons.train, Colors.blue),
            ...railAgencies.map(_buildAgencyCard),

            // Ferry Services
            _buildSectionHeader('Ferry Services', Icons.directions_boat, Colors.teal),
            ...ferryAgencies.map(_buildAgencyCard),

            // Bus Services
            _buildSectionHeader('Bus Services', Icons.directions_bus, Colors.green),
            ...busAgencies.map(_buildAgencyCard),

            // Clipper Card Info
            const SizedBox(height: 24),
            Card(
              color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.credit_card,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Clipper Card',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Use one card for all Bay Area transit. Available at Walgreens, Whole Foods, and transit stations.',
                      style: theme.textTheme.bodySmall,
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () => _launchUrl('https://www.clippercard.com'),
                      icon: const Icon(Icons.open_in_new, size: 16),
                      label: const Text('Get Clipper Card'),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
