import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../models/program.dart';

/// Client for San Francisco's Socrata Open Data API (SODA)
/// https://data.sfgov.org/
class SodaClient {
  static const String baseUrl = 'https://data.sfgov.org/resource';

  /// HSH Shelter Waitlist dataset
  static const String shelterWaitlistId = 'w4sk-nq57';

  /// 311 Cases (service requests)
  static const String cases311Id = 'vw6y-z8j6';

  final http.Client _client;

  SodaClient({http.Client? client}) : _client = client ?? http.Client();

  /// Fetch all shelter-related data from SF DataSF
  Future<List<Program>> fetchShelterData({int limit = 500}) async {
    final uri = Uri.parse('$baseUrl/$shelterWaitlistId.json').replace(
      queryParameters: {
        r'$limit': limit.toString(),
        r'$order': 'data_as_of DESC',
      },
    );

    try {
      final response = await _client.get(uri, headers: _headers);

      if (response.statusCode != 200) {
        throw Exception('SODA API error: ${response.statusCode}');
      }

      final List<dynamic> data = json.decode(response.body);
      return data.map((item) => _mapShelterToProgram(item)).toList();
    } catch (e) {
      // Return empty list on failure (graceful degradation)
      return [];
    }
  }

  /// Fetch 311 service-related data (filtered to social services)
  Future<List<Program>> fetch311Services({int limit = 200}) async {
    final uri = Uri.parse('$baseUrl/$cases311Id.json').replace(
      queryParameters: {
        r'$limit': limit.toString(),
        r'$where': "service_name LIKE '%Social%' OR service_name LIKE '%Homeless%'",
        r'$order': 'opened DESC',
      },
    );

    try {
      final response = await _client.get(uri, headers: _headers);

      if (response.statusCode != 200) {
        return [];
      }

      final List<dynamic> data = json.decode(response.body);
      return data.map((item) => _map311ToProgram(item)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Fetch all available programs from SF DataSF
  Future<List<Program>> fetchAll() async {
    final results = await Future.wait([
      fetchShelterData(),
      // fetch311Services() - disabled for now as it returns cases, not services
    ]);

    return results.expand((list) => list).toList();
  }

  Map<String, String> get _headers => {
        'Accept': 'application/json',
        // Add app token if available for higher rate limits
        // 'X-App-Token': 'YOUR_APP_TOKEN',
      };

  /// Map SF shelter waitlist data to Program model
  Program _mapShelterToProgram(Map<String, dynamic> item) {
    final siteName = item['site_name'] as String? ?? 'Unknown Shelter';
    final address = item['site_address'] as String?;
    final date = item['data_as_of'] as String?;

    return Program(
      id: 'sf-shelter-${item['site_name']?.hashCode ?? DateTime.now().millisecondsSinceEpoch}',
      name: siteName,
      category: 'housing',
      description: _buildShelterDescription(item),
      groups: ['unhoused'],
      areas: ['san-francisco'],
      city: 'San Francisco',
      website: 'https://sf.gov/departments/homelessness-and-supportive-housing',
      address: address,
      lastUpdated: date?.split('T').first ?? DateTime.now().toIso8601String().split('T').first,
      dataSource: DataSource.dataSF,
      externalId: '${item['site_name']}',
      sourceUrl: 'https://data.sfgov.org/d/$shelterWaitlistId',
    );
  }

  String _buildShelterDescription(Map<String, dynamic> item) {
    final buffer = StringBuffer();
    buffer.writeln('San Francisco homeless shelter facility.');

    final adultOnly = item['adults_only_waitlist_count'];
    final youth = item['youth_waitlist_count'];
    final family = item['family_waitlist_count'];

    if (adultOnly != null || youth != null || family != null) {
      buffer.writeln();
      buffer.writeln('Waitlist information:');
      if (adultOnly != null) buffer.writeln('• Adults only: $adultOnly');
      if (youth != null) buffer.writeln('• Youth: $youth');
      if (family != null) buffer.writeln('• Families: $family');
    }

    return buffer.toString().trim();
  }

  /// Map 311 service request to Program model
  Program _map311ToProgram(Map<String, dynamic> item) {
    return Program(
      id: 'sf-311-${item['service_request_id'] ?? DateTime.now().millisecondsSinceEpoch}',
      name: item['service_name'] as String? ?? 'SF 311 Service',
      category: 'other',
      description: item['service_details'] as String? ?? 'San Francisco 311 service.',
      groups: [],
      areas: ['san-francisco'],
      city: 'San Francisco',
      website: 'https://sf311.org',
      address: item['address'] as String?,
      lastUpdated: (item['opened'] as String?)?.split('T').first ??
          DateTime.now().toIso8601String().split('T').first,
      latitude: _parseDouble(item['lat']),
      longitude: _parseDouble(item['long']),
      dataSource: DataSource.dataSF,
      externalId: item['service_request_id'] as String?,
      sourceUrl: 'https://data.sfgov.org/d/$cases311Id',
    );
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
