import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../models/program.dart';

/// Client for the Ohana API (SMC-Connect)
/// HSDS-compliant API for San Mateo County services
/// https://api.smc-connect.org/
class OhanaClient {
  static const String baseUrl = 'https://api.smc-connect.org';

  final http.Client _client;

  OhanaClient({http.Client? client}) : _client = client ?? http.Client();

  /// Search for services by keyword
  Future<List<Program>> search(String keyword) async {
    final uri = Uri.parse('$baseUrl/search').replace(
      queryParameters: {
        'keyword': keyword,
        'per_page': '100',
      },
    );

    try {
      final response = await _client.get(uri, headers: _headers);

      if (response.statusCode != 200) {
        return [];
      }

      final List<dynamic> data = json.decode(response.body);
      return data.map((item) => _mapToProgram(item)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Fetch organizations (paginated)
  Future<List<Program>> fetchOrganizations({int page = 1, int perPage = 50}) async {
    final uri = Uri.parse('$baseUrl/organizations').replace(
      queryParameters: {
        'page': page.toString(),
        'per_page': perPage.toString(),
      },
    );

    try {
      final response = await _client.get(uri, headers: _headers);

      if (response.statusCode != 200) {
        return [];
      }

      final List<dynamic> data = json.decode(response.body);
      return data.map((item) => _mapOrganizationToProgram(item)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Fetch all available programs from Ohana API
  /// Uses multiple searches to cover common categories
  Future<List<Program>> fetchAll() async {
    final searchTerms = [
      'food',
      'housing',
      'shelter',
      'health',
      'employment',
      'legal',
      'education',
    ];

    final results = await Future.wait(
      searchTerms.map((term) => search(term)),
    );

    // Combine and deduplicate by external ID
    final uniquePrograms = <String, Program>{};
    for (final list in results) {
      for (final program in list) {
        final key = program.externalId ?? program.id;
        uniquePrograms[key] = program;
      }
    }

    return uniquePrograms.values.toList();
  }

  Map<String, String> get _headers => {
        'Accept': 'application/json',
        'User-Agent': 'BayNavigator/1.0',
      };

  /// Map Ohana search result to Program model
  Program _mapToProgram(Map<String, dynamic> item) {
    final organization = item['organization'] as Map<String, dynamic>?;
    final location = item['location'] as Map<String, dynamic>?;
    final services = item['services'] as List<dynamic>?;

    final orgName = organization?['name'] as String? ?? 'Unknown Organization';
    final serviceName = services?.isNotEmpty == true
        ? services!.first['name'] as String?
        : null;

    final name = serviceName != null ? '$orgName - $serviceName' : orgName;

    // Extract address
    final address = location?['address'] as Map<String, dynamic>?;
    final fullAddress = _buildAddress(address);

    // Extract phone
    final phones = location?['phones'] as List<dynamic>?;
    final phone = phones?.isNotEmpty == true
        ? phones!.first['number'] as String?
        : null;

    // Extract coordinates
    final lat = _parseDouble(location?['latitude']);
    final lng = _parseDouble(location?['longitude']);

    // Extract description from first service
    final description = services?.isNotEmpty == true
        ? services!.first['description'] as String? ?? 'Service provided by $orgName.'
        : 'Organization providing community services.';

    // Extract eligibility
    final eligibility = services?.isNotEmpty == true
        ? services!.first['eligibility'] as String?
        : null;
    final groups = _parseEligibility(eligibility);

    // Determine category
    final category = _determineCategory(item);

    return Program(
      id: 'ohana-${item['id'] ?? DateTime.now().millisecondsSinceEpoch}',
      name: name,
      category: category,
      description: description,
      groups: groups,
      areas: ['san-mateo'],
      city: address?['city'] as String?,
      website: organization?['website'] as String? ?? 'https://www.smc-connect.org',
      phone: phone,
      address: fullAddress,
      lastUpdated: DateTime.now().toIso8601String().split('T').first,
      latitude: lat,
      longitude: lng,
      dataSource: DataSource.ohana,
      externalId: item['id']?.toString(),
      sourceUrl: 'https://www.smc-connect.org/locations/${item['id']}',
    );
  }

  /// Map organization to Program model
  Program _mapOrganizationToProgram(Map<String, dynamic> item) {
    final name = item['name'] as String? ?? 'Unknown Organization';
    final description = item['description'] as String? ??
        'Organization providing community services in San Mateo County.';

    final locations = item['locations'] as List<dynamic>?;
    final firstLocation = locations?.isNotEmpty == true
        ? locations!.first as Map<String, dynamic>
        : null;

    final address = firstLocation?['address'] as Map<String, dynamic>?;
    final fullAddress = _buildAddress(address);

    final phones = firstLocation?['phones'] as List<dynamic>?;
    final phone = phones?.isNotEmpty == true
        ? phones!.first['number'] as String?
        : null;

    return Program(
      id: 'ohana-org-${item['id'] ?? DateTime.now().millisecondsSinceEpoch}',
      name: name,
      category: 'other',
      description: description,
      groups: [],
      areas: ['san-mateo'],
      city: address?['city'] as String?,
      website: item['website'] as String? ?? 'https://www.smc-connect.org',
      phone: phone,
      address: fullAddress,
      lastUpdated: DateTime.now().toIso8601String().split('T').first,
      dataSource: DataSource.ohana,
      externalId: item['id']?.toString(),
      sourceUrl: 'https://www.smc-connect.org/organizations/${item['id']}',
    );
  }

  String? _buildAddress(Map<String, dynamic>? address) {
    if (address == null) return null;

    final parts = <String>[];
    final street = address['address_1'] as String?;
    final city = address['city'] as String?;
    final state = address['state_province'] as String?;
    final zip = address['postal_code'] as String?;

    if (street != null && street.isNotEmpty) parts.add(street);
    if (city != null && city.isNotEmpty) {
      final cityLine = [city, state, zip].where((p) => p != null && p.isNotEmpty).join(' ');
      parts.add(cityLine);
    }

    return parts.isNotEmpty ? parts.join(', ') : null;
  }

  List<String> _parseEligibility(String? eligibility) {
    if (eligibility == null || eligibility.isEmpty) return [];

    final groups = <String>[];
    final lower = eligibility.toLowerCase();

    if (lower.contains('senior') || lower.contains('older adult') || lower.contains('65+')) {
      groups.add('seniors');
    }
    if (lower.contains('veteran')) {
      groups.add('veterans');
    }
    if (lower.contains('youth') || lower.contains('child') || lower.contains('teen')) {
      groups.add('youth');
    }
    if (lower.contains('disabled') || lower.contains('disability')) {
      groups.add('disabled');
    }
    if (lower.contains('immigrant') || lower.contains('refugee')) {
      groups.add('immigrants');
    }
    if (lower.contains('family') || lower.contains('families')) {
      groups.add('families');
    }
    if (lower.contains('homeless') || lower.contains('unhoused')) {
      groups.add('unhoused');
    }

    return groups;
  }

  String _determineCategory(Map<String, dynamic> item) {
    final services = item['services'] as List<dynamic>?;
    if (services == null || services.isEmpty) return 'other';

    final firstService = services.first as Map<String, dynamic>;
    final name = (firstService['name'] as String? ?? '').toLowerCase();
    final description = (firstService['description'] as String? ?? '').toLowerCase();
    final combined = '$name $description';

    if (combined.contains('food') || combined.contains('meal') || combined.contains('pantry')) {
      return 'food';
    }
    if (combined.contains('housing') || combined.contains('shelter') || combined.contains('rent')) {
      return 'housing';
    }
    if (combined.contains('health') || combined.contains('medical') || combined.contains('clinic')) {
      return 'healthcare';
    }
    if (combined.contains('job') || combined.contains('employment') || combined.contains('work')) {
      return 'employment';
    }
    if (combined.contains('legal') || combined.contains('attorney') || combined.contains('law')) {
      return 'legal';
    }
    if (combined.contains('education') || combined.contains('school') || combined.contains('training')) {
      return 'education';
    }
    if (combined.contains('money') || combined.contains('financial') || combined.contains('cash')) {
      return 'financial';
    }

    return 'other';
  }

  double? _parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  void dispose() {
    _client.close();
  }
}
