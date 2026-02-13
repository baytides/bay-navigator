import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../models/alerts.dart';

class AlertsScreen extends StatefulWidget {
  final int initialTab;

  const AlertsScreen({super.key, this.initialTab = 0});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  List<MissingPerson> _missingPersons = [];
  EarthquakeData? _earthquakeData;
  WeatherData? _weatherData;

  bool _loadingMissing = true;
  bool _loadingEarthquakes = true;
  bool _loadingWeather = true;
  String? _errorMissing;
  String? _errorEarthquakes;
  String? _errorWeather;

  static const _missingUrl =
      'https://baytidesstorage.blob.core.windows.net/missing-persons/missing-persons.json';
  static const _earthquakeUrl =
      'https://baynavigator.org/api/earthquake-alerts.json';
  static const _weatherUrl =
      'https://baynavigator.org/api/weather-alerts.json';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 3,
      vsync: this,
      initialIndex: widget.initialTab,
    );
    _loadAll();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    await Future.wait([
      _loadMissingPersons(),
      _loadEarthquakes(),
      _loadWeather(),
    ]);
  }

  Future<void> _loadMissingPersons() async {
    setState(() {
      _loadingMissing = true;
      _errorMissing = null;
    });
    try {
      final response = await http.get(Uri.parse(_missingUrl));
      if (response.statusCode == 200) {
        final data = MissingPersonsData.fromJson(jsonDecode(response.body));
        setState(() {
          _missingPersons = data.cases;
          _loadingMissing = false;
        });
      } else {
        setState(() {
          _errorMissing = 'Failed to load data';
          _loadingMissing = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMissing = 'Connection error';
        _loadingMissing = false;
      });
    }
  }

  Future<void> _loadEarthquakes() async {
    setState(() {
      _loadingEarthquakes = true;
      _errorEarthquakes = null;
    });
    try {
      final response = await http.get(Uri.parse(_earthquakeUrl));
      if (response.statusCode == 200) {
        final data = EarthquakeData.fromJson(jsonDecode(response.body));
        setState(() {
          _earthquakeData = data;
          _loadingEarthquakes = false;
        });
      } else {
        setState(() {
          _errorEarthquakes = 'Failed to load data';
          _loadingEarthquakes = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorEarthquakes = 'Connection error';
        _loadingEarthquakes = false;
      });
    }
  }

  Future<void> _loadWeather() async {
    setState(() {
      _loadingWeather = true;
      _errorWeather = null;
    });
    try {
      final response = await http.get(Uri.parse(_weatherUrl));
      if (response.statusCode == 200) {
        final data = WeatherData.fromJson(jsonDecode(response.body));
        setState(() {
          _weatherData = data;
          _loadingWeather = false;
        });
      } else {
        setState(() {
          _errorWeather = 'Failed to load data';
          _loadingWeather = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorWeather = 'Connection error';
        _loadingWeather = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bay Area Alerts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: _loadAll,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Missing Persons'),
                  if (_missingPersons.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    _CountBadge(
                      count: _missingPersons.length,
                      color: Colors.red,
                    ),
                  ],
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Earthquakes'),
                  if ((_earthquakeData?.count ?? 0) > 0) ...[
                    const SizedBox(width: 6),
                    _CountBadge(
                      count: _earthquakeData!.count,
                      color: Colors.amber.shade700,
                    ),
                  ],
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Weather'),
                  if ((_weatherData?.count ?? 0) > 0) ...[
                    const SizedBox(width: 6),
                    _CountBadge(
                      count: _weatherData!.count,
                      color: Colors.blue,
                    ),
                  ],
                ],
              ),
            ),
          ],
          isScrollable: true,
          indicatorColor: theme.colorScheme.primary,
          labelColor: theme.colorScheme.primary,
          unselectedLabelColor: theme.colorScheme.onSurfaceVariant,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildMissingPersonsTab(),
          _buildEarthquakesTab(),
          _buildWeatherTab(),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════
  // MISSING PERSONS TAB
  // ═══════════════════════════════════════

  Widget _buildMissingPersonsTab() {
    if (_loadingMissing) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_errorMissing != null) {
      return _ErrorView(
        message: _errorMissing!,
        onRetry: _loadMissingPersons,
      );
    }
    if (_missingPersons.isEmpty) {
      return const _EmptyView(
        icon: Icons.check_circle_outline,
        title: 'No Active Cases',
        subtitle: 'No missing person cases currently reported in the Bay Area.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadMissingPersons,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _missingPersons.length + 1,
        itemBuilder: (context, index) {
          if (index == _missingPersons.length) {
            return _AttributionFooter(
              source: 'National Center for Missing & Exploited Children',
            );
          }
          return _MissingPersonCard(person: _missingPersons[index]);
        },
      ),
    );
  }

  // ═══════════════════════════════════════
  // EARTHQUAKES TAB
  // ═══════════════════════════════════════

  Widget _buildEarthquakesTab() {
    if (_loadingEarthquakes) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_errorEarthquakes != null) {
      return _ErrorView(
        message: _errorEarthquakes!,
        onRetry: _loadEarthquakes,
      );
    }
    final earthquakes = _earthquakeData?.alerts ?? [];
    if (earthquakes.isEmpty) {
      return const _EmptyView(
        icon: Icons.landscape_outlined,
        title: 'No Recent Earthquakes',
        subtitle: 'No earthquakes detected in the Bay Area this week.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadEarthquakes,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: earthquakes.length + 1,
        itemBuilder: (context, index) {
          if (index == earthquakes.length) {
            return _AttributionFooter(
              source: _earthquakeData?.source ?? 'USGS',
            );
          }
          return _EarthquakeCard(earthquake: earthquakes[index]);
        },
      ),
    );
  }

  // ═══════════════════════════════════════
  // WEATHER TAB
  // ═══════════════════════════════════════

  Widget _buildWeatherTab() {
    if (_loadingWeather) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_errorWeather != null) {
      return _ErrorView(
        message: _errorWeather!,
        onRetry: _loadWeather,
      );
    }
    final alerts = _weatherData?.alerts ?? [];
    if (alerts.isEmpty) {
      return const _EmptyView(
        icon: Icons.wb_sunny_outlined,
        title: 'No Active Weather Alerts',
        subtitle:
            'No severe weather alerts for the Bay Area at this time.',
      );
    }

    return RefreshIndicator(
      onRefresh: _loadWeather,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: alerts.length + 1,
        itemBuilder: (context, index) {
          if (index == alerts.length) {
            return _AttributionFooter(
              source: _weatherData?.source ?? 'NWS',
            );
          }
          return _WeatherAlertCard(alert: alerts[index]);
        },
      ),
    );
  }
}

// ═══════════════════════════════════════════
// MISSING PERSON CARD
// ═══════════════════════════════════════════

class _MissingPersonCard extends StatelessWidget {
  final MissingPerson person;

  const _MissingPersonCard({required this.person});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: person.posterUrl.isNotEmpty
            ? () => _openUrl(person.posterUrl)
            : null,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Photo
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: person.photoUrl.isNotEmpty
                    ? Image.network(
                        person.photoUrl,
                        width: 80,
                        height: 100,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 80,
                          height: 100,
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.person, size: 40),
                        ),
                      )
                    : Container(
                        width: 80,
                        height: 100,
                        color: Colors.grey.shade200,
                        child: const Icon(Icons.person, size: 40),
                      ),
              ),
              const SizedBox(width: 16),
              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Case type badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.red.shade200),
                      ),
                      child: Text(
                        person.caseType.isNotEmpty
                            ? person.caseType
                            : 'Missing',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.red.shade700,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      person.name,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (person.age > 0)
                      Text(
                        'Age ${person.age}',
                        style: theme.textTheme.bodyMedium,
                      ),
                    if (person.missingFrom.displayName.isNotEmpty)
                      Text(
                        'Missing from ${person.missingFrom.displayName}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    if (person.missingDate.isNotEmpty)
                      Text(
                        'Since ${person.missingDate}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    if (person.contact.agency.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        person.contact.agency,
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (person.contact.phone.isNotEmpty)
                        InkWell(
                          onTap: () => _openUrl(
                              'tel:${person.contact.phone}'),
                          child: Text(
                            person.contact.phone,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════
// EARTHQUAKE CARD
// ═══════════════════════════════════════════

class _EarthquakeCard extends StatelessWidget {
  final Earthquake earthquake;

  const _EarthquakeCard({required this.earthquake});

  Color get _severityColor {
    if (earthquake.magnitude >= 4.0) return Colors.red;
    if (earthquake.magnitude >= 3.0) return Colors.orange;
    if (earthquake.magnitude >= 2.0) return Colors.amber.shade700;
    return Colors.grey;
  }

  String get _timeAgo {
    try {
      final dt = DateTime.parse(earthquake.time);
      final diff = DateTime.now().toUtc().difference(dt);
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: earthquake.url.isNotEmpty
            ? () => _openUrl(earthquake.url)
            : null,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Magnitude circle
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _severityColor.withValues(alpha: 0.15),
                  border: Border.all(
                    color: _severityColor.withValues(alpha: 0.4),
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  earthquake.magnitude.toStringAsFixed(1),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: _severityColor,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      earthquake.place,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          _timeAgo,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Depth: ${earthquake.depth.toStringAsFixed(1)} km',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    if (earthquake.felt > 0) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Felt by ${earthquake.felt} ${earthquake.felt == 1 ? 'person' : 'people'}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.orange.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════
// WEATHER ALERT CARD
// ═══════════════════════════════════════════

class _WeatherAlertCard extends StatelessWidget {
  final WeatherAlert alert;

  const _WeatherAlertCard({required this.alert});

  Color get _severityColor {
    switch (alert.severity.toLowerCase()) {
      case 'extreme':
        return Colors.red.shade800;
      case 'severe':
        return Colors.red;
      case 'moderate':
        return Colors.orange;
      case 'minor':
        return Colors.amber.shade700;
      default:
        return Colors.blue;
    }
  }

  IconData get _severityIcon {
    switch (alert.severity.toLowerCase()) {
      case 'extreme':
      case 'severe':
        return Icons.warning_amber_rounded;
      case 'moderate':
        return Icons.info_outline;
      default:
        return Icons.cloud_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: _severityColor.withValues(alpha: 0.1),
            child: Row(
              children: [
                Icon(_severityIcon, color: _severityColor, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        alert.event,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: _severityColor,
                        ),
                      ),
                      if (alert.senderName.isNotEmpty)
                        Text(
                          alert.senderName,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _severityColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    alert.severity,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: _severityColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Body
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (alert.areaDesc.isNotEmpty) ...[
                  Text(
                    'Areas: ${alert.areaDesc}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                if (alert.description.isNotEmpty)
                  Text(
                    alert.description,
                    style: theme.textTheme.bodyMedium,
                  ),
                if (alert.instruction.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.blue.shade100),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Instructions',
                          style: theme.textTheme.labelMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.blue.shade800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          alert.instruction,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: Colors.blue.shade900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                if (alert.ends.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Until: ${_formatDateTime(alert.ends)}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(String isoString) {
    try {
      final dt = DateTime.parse(isoString);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
      final ampm = dt.hour >= 12 ? 'PM' : 'AM';
      return '${months[dt.month - 1]} ${dt.day} at $hour:${dt.minute.toString().padLeft(2, '0')} $ampm';
    } catch (_) {
      return isoString;
    }
  }
}

// ═══════════════════════════════════════════
// SHARED WIDGETS
// ═══════════════════════════════════════════

class _CountBadge extends StatelessWidget {
  final int count;
  final Color color;

  const _CountBadge({required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        '$count',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(message, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _EmptyView({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: Colors.green.shade300),
            const SizedBox(height: 16),
            Text(
              title,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _AttributionFooter extends StatelessWidget {
  final String source;

  const _AttributionFooter({required this.source});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Text(
        'Data from $source',
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
        textAlign: TextAlign.center,
      ),
    );
  }
}

// ═══════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════

Future<void> _openUrl(String url) async {
  final uri = Uri.parse(url);
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
