import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/civic_data.dart';

/// Service for fetching civic data: city guides, news, representatives
class CivicService {
  static final CivicService _instance = CivicService._internal();
  factory CivicService() => _instance;
  CivicService._internal();

  /// Cache for representatives data loaded from JSON
  Map<String, dynamic>? _representativesData;
  bool _representativesLoaded = false;

  /// Cache for city guides
  final Map<String, CityGuide> _cityGuideCache = {};

  /// Cache for news
  final Map<String, List<CityNews>> _newsCache = {};
  final Map<String, DateTime> _newsCacheTime = {};
  static const _newsCacheDuration = Duration(minutes: 30);

  /// Get city guide for a given city
  CityGuide? getCityGuide(String cityName) {
    final key = cityName.toLowerCase();
    if (_cityGuideCache.containsKey(key)) {
      return _cityGuideCache[key];
    }

    // Check if we have data for this city
    final guide = _supportedCityGuides[key];
    if (guide != null) {
      _cityGuideCache[key] = guide;
    }
    return guide;
  }

  /// Check if a city has a guide available
  bool hasCityGuide(String? cityName) {
    if (cityName == null || cityName.isEmpty) return false;
    return _supportedCityGuides.containsKey(cityName.toLowerCase());
  }

  /// Get news for a city (fetches from RSS if available)
  Future<List<CityNews>> getCityNews(String cityName) async {
    final key = cityName.toLowerCase();

    // Check cache
    if (_newsCache.containsKey(key)) {
      final cacheTime = _newsCacheTime[key];
      if (cacheTime != null &&
          DateTime.now().difference(cacheTime) < _newsCacheDuration) {
        return _newsCache[key]!;
      }
    }

    // Try to fetch from API (placeholder - implement actual RSS/API fetching)
    final guide = getCityGuide(cityName);
    if (guide?.newsRssUrl != null) {
      try {
        final news = await _fetchCityNews(guide!.newsRssUrl!, cityName);
        _newsCache[key] = news;
        _newsCacheTime[key] = DateTime.now();
        return news;
      } catch (e) {
        // Return cached or empty on error
        return _newsCache[key] ?? [];
      }
    }

    return [];
  }

  /// Fetch news from RSS/API
  Future<List<CityNews>> _fetchCityNews(String url, String cityName) async {
    try {
      final response = await http.get(Uri.parse(url)).timeout(
            const Duration(seconds: 10),
          );

      if (response.statusCode == 200) {
        // Parse RSS or JSON depending on the source
        // This is a placeholder - actual implementation depends on city's API format
        return _parseNewsResponse(response.body, cityName);
      }
    } catch (e) {
      // Silently fail
    }
    return [];
  }

  List<CityNews> _parseNewsResponse(String body, String cityName) {
    // Placeholder - implement actual parsing based on city API format
    // Could be RSS XML, JSON, or other formats
    try {
      // Try JSON first
      final json = jsonDecode(body);
      if (json is List) {
        return json.map<CityNews>((item) {
          return CityNews(
            title: item['title'] ?? '',
            summary: item['summary'] ?? item['description'] ?? '',
            url: item['url'] ?? item['link'] ?? '',
            publishedAt: DateTime.tryParse(item['date'] ?? '') ?? DateTime.now(),
            imageUrl: item['image'],
            source: cityName,
          );
        }).toList();
      }
    } catch (e) {
      // Not JSON, could be RSS
    }
    return [];
  }

  /// Load representatives data from bundled JSON
  Future<void> _loadRepresentativesData() async {
    if (_representativesLoaded) return;

    try {
      // Try loading from API first, fall back to bundled asset
      final response = await http.get(
        Uri.parse('https://baynavigator.org/api/civic/representatives.json'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        _representativesData = jsonDecode(response.body) as Map<String, dynamic>;
        _representativesLoaded = true;
        return;
      }
    } catch (e) {
      // API not available, continue to bundled data
    }

    // For now, we'll use hardcoded data based on the cicero-data.json structure
    // In production, this JSON would be bundled as an asset
    _representativesData = _bundledRepresentativesData;
    _representativesLoaded = true;
  }

  /// Get representatives for a location
  /// When a zipCode is provided, narrows down to representatives for that specific zip.
  /// Otherwise shows all representatives that may serve the area.
  Future<RepresentativeList> getRepresentatives(String? cityName, String? countyName, {String? zipCode}) async {
    if (cityName == null && countyName == null) {
      return const RepresentativeList();
    }

    await _loadRepresentativesData();

    final local = <Representative>[];
    final state = <Representative>[];
    final federal = <Representative>[];

    // California US Senators (statewide, always shown)
    federal.addAll(const [
      Representative(
        name: 'Alex Padilla',
        title: 'U.S. Senator',
        level: 'federal',
        party: 'Democrat',
        website: 'https://www.padilla.senate.gov/',
        phone: '(202) 224-3553',
        email: 'senator@padilla.senate.gov',
        photoUrl: 'assets/images/representatives/federal/us-senate/alex_padilla.jpg',
        district: 'California',
      ),
      Representative(
        name: 'Adam Schiff',
        title: 'U.S. Senator',
        level: 'federal',
        party: 'Democrat',
        website: 'https://www.schiff.senate.gov/',
        phone: '(202) 224-3841',
        email: 'senator@schiff.senate.gov',
        photoUrl: 'assets/images/representatives/federal/us-senate/adam_schiff.jpg',
        district: 'California',
      ),
    ]);

    // Add US House representatives by county, filtering by zip if available
    // Strip " county" suffix for lookups since maps use just the county name (e.g., "san mateo" not "san mateo county")
    var countyKey = countyName?.toLowerCase() ?? _getCountyForCity(cityName);
    if (countyKey != null && countyKey.endsWith(' county')) {
      countyKey = countyKey.substring(0, countyKey.length - 7);
    }
    final congressionalDistrict = zipCode != null ? getCongressionalDistrictForZip(zipCode) : null;
    final assemblyDistrict = zipCode != null ? getAssemblyDistrictForZip(zipCode) : null;
    final senateDistrict = zipCode != null ? getSenateDistrictForZip(zipCode) : null;

    if (countyKey != null) {
      final countyReps = _usHouseByCounty[countyKey];
      if (countyReps != null) {
        // If we have a specific congressional district from zip, filter to just that rep
        if (congressionalDistrict != null) {
          final districtNum = congressionalDistrict.replaceAll('CD-', '');
          final filtered = countyReps.where((rep) =>
            rep.district?.contains('District $districtNum') == true
          ).toList();
          if (filtered.isNotEmpty) {
            federal.addAll(filtered);
          } else {
            // Fallback to all county reps if no match found
            federal.addAll(countyReps);
          }
        } else {
          federal.addAll(countyReps);
        }
      }

      // Add State Legislature by county, filtering by zip if available
      final stateReps = _stateLegislatureByCounty[countyKey];
      if (stateReps != null) {
        if (assemblyDistrict != null || senateDistrict != null) {
          // Filter to matching districts
          final filtered = stateReps.where((rep) {
            if (rep.title == 'Assembly Member' && assemblyDistrict != null) {
              final districtNum = assemblyDistrict.replaceAll('AD-', '');
              return rep.district?.contains('District $districtNum') == true;
            }
            if (rep.title == 'State Senator' && senateDistrict != null) {
              final districtNum = senateDistrict.replaceAll('SD-', '');
              return rep.district?.contains('District $districtNum') == true;
            }
            return false;
          }).toList();
          if (filtered.isNotEmpty) {
            state.addAll(filtered);
          } else {
            // Fallback to all county reps if no match found
            state.addAll(stateReps);
          }
        } else {
          state.addAll(stateReps);
        }
      }
    }

    // Look up local officials by city name (case-insensitive)
    if (cityName != null && _representativesData != null) {
      final cityKey = _findCityKey(cityName);
      if (cityKey != null && _representativesData!.containsKey(cityKey)) {
        final cityData = _representativesData![cityKey] as Map<String, dynamic>;
        final officials = cityData['officials'] as List<dynamic>? ?? [];

        for (final official in officials) {
          final officialMap = official as Map<String, dynamic>;
          final notes = officialMap['notes'] as List<dynamic>?;
          String? bio;
          if (notes != null && notes.isNotEmpty && notes[0] != null) {
            final fullBio = notes[0].toString();
            bio = fullBio.length > 200 ? '${fullBio.substring(0, 200)}...' : fullBio;
          }

          local.add(Representative(
            name: officialMap['name'] as String? ?? 'Unknown',
            title: officialMap['title'] as String? ?? 'Official',
            level: 'local',
            party: officialMap['party'] as String?,
            phone: officialMap['phone'] as String?,
            email: officialMap['email'] as String?,
            website: officialMap['website'] as String?,
            photoUrl: officialMap['photoUrl'] as String?,
            district: officialMap['districtName'] as String?,
            bio: bio,
          ));
        }
      }
    }

    return RepresentativeList(
      federal: federal,
      state: state,
      local: local,
    );
  }

  /// Get county name for a city
  String? _getCountyForCity(String? cityName) {
    if (cityName == null) return null;
    final cityKey = _findCityKey(cityName);
    if (cityKey != null && _representativesData != null) {
      final cityData = _representativesData![cityKey] as Map<String, dynamic>?;
      return (cityData?['county'] as String?)?.toLowerCase();
    }
    // Fallback to bundled data
    final bundled = _bundledRepresentativesData[cityKey ?? cityName];
    return (bundled?['county'] as String?)?.toLowerCase();
  }

  /// US House Representatives by county (showing all districts that serve the county)
  static const Map<String, List<Representative>> _usHouseByCounty = {
    'san mateo': [
      Representative(
        name: 'Kevin Mullin',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://kevinmullin.house.gov/',
        phone: '(202) 225-3531',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-15/kevin_mullin.jpg',
        district: 'District 15',
      ),
    ],
    'santa clara': [
      Representative(
        name: 'Zoe Lofgren',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://lofgren.house.gov/',
        phone: '(202) 225-3072',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-18/zoe_lofgren.jpg',
        district: 'District 18',
      ),
      Representative(
        name: 'Anna Eshoo',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://eshoo.house.gov/',
        phone: '(202) 225-8104',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-16/anna_eshoo.jpg',
        district: 'District 16',
      ),
      Representative(
        name: 'Jimmy Panetta',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://panetta.house.gov/',
        phone: '(202) 225-2861',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-19/jimmy_panetta.jpg',
        district: 'District 19',
      ),
    ],
    'alameda': [
      Representative(
        name: 'Barbara Lee',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://lee.house.gov/',
        phone: '(202) 225-2661',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-12/barbara_lee.jpg',
        district: 'District 12',
      ),
      Representative(
        name: 'Eric Swalwell',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://swalwell.house.gov/',
        phone: '(202) 225-5065',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-14/eric_swalwell.jpg',
        district: 'District 14',
      ),
      Representative(
        name: 'Ro Khanna',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://khanna.house.gov/',
        phone: '(202) 225-2631',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-17/ro_khanna.jpg',
        district: 'District 17',
      ),
    ],
    'san francisco': [
      Representative(
        name: 'Nancy Pelosi',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://pelosi.house.gov/',
        phone: '(202) 225-4965',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-11/nancy_pelosi.jpg',
        district: 'District 11',
      ),
      Representative(
        name: 'Kevin Mullin',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://kevinmullin.house.gov/',
        phone: '(202) 225-3531',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-15/kevin_mullin.jpg',
        district: 'District 15',
      ),
    ],
    'contra costa': [
      Representative(
        name: 'Mark DeSaulnier',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://desaulnier.house.gov/',
        phone: '(202) 225-2095',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-10/mark_desaulnier.jpg',
        district: 'District 10',
      ),
      Representative(
        name: 'John Garamendi',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://garamendi.house.gov/',
        phone: '(202) 225-1880',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-08/john_garamendi.jpg',
        district: 'District 8',
      ),
    ],
    'marin': [
      Representative(
        name: 'Jared Huffman',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://huffman.house.gov/',
        phone: '(202) 225-5161',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-02/jared_huffman.jpg',
        district: 'District 2',
      ),
    ],
    'sonoma': [
      Representative(
        name: 'Jared Huffman',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://huffman.house.gov/',
        phone: '(202) 225-5161',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-02/jared_huffman.jpg',
        district: 'District 2',
      ),
    ],
    'napa': [
      Representative(
        name: 'Mike Thompson',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://mikethompson.house.gov/',
        phone: '(202) 225-3311',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-04/mike_thompson.jpg',
        district: 'District 4',
      ),
    ],
    'solano': [
      Representative(
        name: 'Mike Thompson',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://mikethompson.house.gov/',
        phone: '(202) 225-3311',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-04/mike_thompson.jpg',
        district: 'District 4',
      ),
      Representative(
        name: 'John Garamendi',
        title: 'U.S. Representative',
        level: 'federal',
        party: 'Democrat',
        website: 'https://garamendi.house.gov/',
        phone: '(202) 225-1880',
        photoUrl: 'assets/images/representatives/federal/us-house/ca-08/john_garamendi.jpg',
        district: 'District 8',
      ),
    ],
  };

  /// State Legislature by county
  static const Map<String, List<Representative>> _stateLegislatureByCounty = {
    'san mateo': [
      Representative(
        name: 'Josh Becker',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd13.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/becker_josh_photo.jpg',
        district: 'Senate District 13',
      ),
      Representative(
        name: 'Diane Papan',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a21.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad21_papan.jpg',
        district: 'Assembly District 21',
      ),
    ],
    'santa clara': [
      Representative(
        name: 'Dave Cortese',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd15.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/cortese_dave.jpg',
        district: 'Senate District 15',
      ),
      Representative(
        name: 'Josh Becker',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd13.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/becker_josh_photo.jpg',
        district: 'Senate District 13',
      ),
      Representative(
        name: 'Evan Low',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a26.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad26_low.jpg',
        district: 'Assembly District 26',
      ),
      Representative(
        name: 'Ash Kalra',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a25.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad25_kalra.jpg',
        district: 'Assembly District 25',
      ),
    ],
    'alameda': [
      Representative(
        name: 'Nancy Skinner',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd09.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/skinner_nancy.jpg',
        district: 'Senate District 9',
      ),
      Representative(
        name: 'Aisha Wahab',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd10.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/wahab_aisha.jpg',
        district: 'Senate District 10',
      ),
      Representative(
        name: 'Buffy Wicks',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a14.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad14_wicks.jpg',
        district: 'Assembly District 14',
      ),
      Representative(
        name: 'Mia Bonta',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a18.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad18_bonta.jpg',
        district: 'Assembly District 18',
      ),
      Representative(
        name: 'Liz Ortega',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a20.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad20_ortega.jpg',
        district: 'Assembly District 20',
      ),
    ],
    'san francisco': [
      Representative(
        name: 'Scott Wiener',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd11.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/wiener_scott.jpg',
        district: 'Senate District 11',
      ),
      Representative(
        name: 'Matt Haney',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a17.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad17_haney.jpg',
        district: 'Assembly District 17',
      ),
      Representative(
        name: 'Phil Ting',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a19.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad19_ting.jpg',
        district: 'Assembly District 19',
      ),
    ],
    'contra costa': [
      Representative(
        name: 'Steve Glazer',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd07.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/glazer_steve.jpg',
        district: 'Senate District 7',
      ),
      Representative(
        name: 'Tim Grayson',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a15.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad15_grayson.jpg',
        district: 'Assembly District 15',
      ),
      Representative(
        name: 'Rebecca Bauer-Kahan',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a16.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad16_bauer-kahan.jpg',
        district: 'Assembly District 16',
      ),
    ],
    'marin': [
      Representative(
        name: 'Mike McGuire',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd02.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/mcguire_mike.jpg',
        district: 'Senate District 2',
      ),
      Representative(
        name: 'Damon Connolly',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a12.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad12_connolly.jpg',
        district: 'Assembly District 12',
      ),
    ],
    'sonoma': [
      Representative(
        name: 'Mike McGuire',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd02.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/mcguire_mike.jpg',
        district: 'Senate District 2',
      ),
      Representative(
        name: 'Cecilia Aguiar-Curry',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a04.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad04_aguiar-curry.jpg',
        district: 'Assembly District 4',
      ),
    ],
    'napa': [
      Representative(
        name: 'Bill Dodd',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd03.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/dodd_bill.jpg',
        district: 'Senate District 3',
      ),
      Representative(
        name: 'Cecilia Aguiar-Curry',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a04.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad04_aguiar-curry.jpg',
        district: 'Assembly District 4',
      ),
    ],
    'solano': [
      Representative(
        name: 'Bill Dodd',
        title: 'State Senator',
        level: 'state',
        party: 'Democrat',
        website: 'https://sd03.senate.ca.gov/',
        photoUrl: 'https://www.senate.ca.gov/sites/senate.ca.gov/files/senator_photos/dodd_bill.jpg',
        district: 'Senate District 3',
      ),
      Representative(
        name: 'Lori Wilson',
        title: 'Assembly Member',
        level: 'state',
        party: 'Democrat',
        website: 'https://a11.asmdc.org/',
        photoUrl: 'https://www.assembly.ca.gov/sites/assembly.ca.gov/files/memberphotos/ad11_wilson.jpg',
        district: 'Assembly District 11',
      ),
    ],
  };

  /// ZIP code to Congressional District mapping
  /// For zip codes that are entirely within a single congressional district
  /// Format: zip -> 'CD-XX' where XX is the district number
  static const Map<String, String> _zipToCongressionalDistrict = {
    // San Mateo County - District 15 (Kevin Mullin)
    '94002': 'CD-15', '94005': 'CD-15', '94010': 'CD-15', '94014': 'CD-15',
    '94015': 'CD-15', '94019': 'CD-15', '94025': 'CD-15', '94027': 'CD-15',
    '94028': 'CD-15', '94030': 'CD-15', '94038': 'CD-15', '94044': 'CD-15',
    '94061': 'CD-15', '94062': 'CD-15', '94063': 'CD-15', '94065': 'CD-15',
    '94066': 'CD-15', '94070': 'CD-15', '94080': 'CD-15', '94128': 'CD-15',
    '94401': 'CD-15', '94402': 'CD-15', '94403': 'CD-15', '94404': 'CD-15',
    // San Francisco - District 11 (Nancy Pelosi)
    '94102': 'CD-11', '94103': 'CD-11', '94104': 'CD-11', '94105': 'CD-11',
    '94107': 'CD-11', '94108': 'CD-11', '94109': 'CD-11', '94110': 'CD-11',
    '94111': 'CD-11', '94112': 'CD-11', '94114': 'CD-11', '94115': 'CD-11',
    '94116': 'CD-11', '94117': 'CD-11', '94118': 'CD-11', '94121': 'CD-11',
    '94122': 'CD-11', '94123': 'CD-11', '94124': 'CD-11', '94127': 'CD-11',
    '94129': 'CD-11', '94130': 'CD-11', '94131': 'CD-11', '94132': 'CD-11',
    '94133': 'CD-11', '94134': 'CD-11', '94158': 'CD-11',
    // Alameda - District 12 (Barbara Lee)
    '94702': 'CD-12', '94703': 'CD-12', '94704': 'CD-12', '94705': 'CD-12',
    '94706': 'CD-12', '94707': 'CD-12', '94708': 'CD-12', '94709': 'CD-12',
    '94710': 'CD-12', '94601': 'CD-12', '94602': 'CD-12', '94603': 'CD-12',
    '94605': 'CD-12', '94606': 'CD-12', '94607': 'CD-12', '94608': 'CD-12',
    '94609': 'CD-12', '94610': 'CD-12', '94611': 'CD-12', '94612': 'CD-12',
    '94618': 'CD-12', '94619': 'CD-12', '94621': 'CD-12',
    // Alameda - District 14 (Eric Swalwell)
    '94536': 'CD-14', '94538': 'CD-14', '94539': 'CD-14', '94541': 'CD-14',
    '94544': 'CD-14', '94545': 'CD-14', '94546': 'CD-14', '94550': 'CD-14',
    '94551': 'CD-14', '94552': 'CD-14', '94555': 'CD-14', '94560': 'CD-14',
    '94566': 'CD-14', '94568': 'CD-14', '94577': 'CD-14', '94578': 'CD-14',
    '94579': 'CD-14', '94580': 'CD-14', '94587': 'CD-14', '94588': 'CD-14',
  };

  /// ZIP code to State Assembly District mapping
  static const Map<String, String> _zipToAssemblyDistrict = {
    // San Mateo County - Assembly District 21 (Diane Papan)
    '94002': 'AD-21', '94010': 'AD-21', '94025': 'AD-21', '94027': 'AD-21',
    '94028': 'AD-21', '94061': 'AD-21', '94062': 'AD-21', '94063': 'AD-21',
    '94065': 'AD-21', '94070': 'AD-21', '94401': 'AD-21', '94402': 'AD-21',
    '94403': 'AD-21', '94404': 'AD-21',
    // San Mateo County - coast is AD-16
    '94005': 'AD-16', '94014': 'AD-16', '94015': 'AD-16', '94019': 'AD-16',
    '94030': 'AD-16', '94038': 'AD-16', '94044': 'AD-16', '94066': 'AD-16',
    '94080': 'AD-16',
  };

  /// ZIP code to State Senate District mapping
  static const Map<String, String> _zipToSenateDistrict = {
    // San Mateo County - Senate District 13 (Josh Becker)
    '94002': 'SD-13', '94010': 'SD-13', '94025': 'SD-13', '94027': 'SD-13',
    '94028': 'SD-13', '94061': 'SD-13', '94062': 'SD-13', '94063': 'SD-13',
    '94065': 'SD-13', '94070': 'SD-13', '94401': 'SD-13', '94402': 'SD-13',
    '94403': 'SD-13', '94404': 'SD-13', '94005': 'SD-13', '94014': 'SD-13',
    '94015': 'SD-13', '94019': 'SD-13', '94030': 'SD-13', '94038': 'SD-13',
    '94044': 'SD-13', '94066': 'SD-13', '94080': 'SD-13',
  };

  /// Get congressional district for a zip code
  static String? getCongressionalDistrictForZip(String zipCode) {
    return _zipToCongressionalDistrict[zipCode];
  }

  /// Get state assembly district for a zip code
  static String? getAssemblyDistrictForZip(String zipCode) {
    return _zipToAssemblyDistrict[zipCode];
  }

  /// Get state senate district for a zip code
  static String? getSenateDistrictForZip(String zipCode) {
    return _zipToSenateDistrict[zipCode];
  }

  /// Find the correct key for a city name (handles case variations)
  String? _findCityKey(String cityName) {
    if (_representativesData == null) return null;

    // Try exact match
    if (_representativesData!.containsKey(cityName)) {
      return cityName;
    }

    // Try title case
    final titleCase = cityName.split(' ').map((word) {
      if (word.isEmpty) return word;
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    }).join(' ');
    if (_representativesData!.containsKey(titleCase)) {
      return titleCase;
    }

    // Try lowercase search
    final lowerCity = cityName.toLowerCase();
    for (final key in _representativesData!.keys) {
      if (key.toLowerCase() == lowerCity) {
        return key;
      }
    }

    return null;
  }

  /// Bundled representatives data (subset of cicero-data.json)
  /// This provides offline support and faster loading
  static final Map<String, dynamic> _bundledRepresentativesData = {
    'Oakland': {
      'city': 'Oakland',
      'county': 'Alameda',
      'officials': [
        {
          'name': 'Sheng Thao',
          'title': 'Mayor',
          'districtName': 'City of Oakland',
          'website': 'https://www.oaklandca.gov/officials/mayor-sheng-thao',
          'photoUrl': 'https://www.oaklandca.gov/resources/images/council/sheng-thao.jpg',
        },
        {
          'name': 'Lena Tam',
          'title': 'County Supervisor',
          'districtName': 'Alameda County Board of Supervisors District 3',
          'website': 'https://district3.acgov.org/',
          'photoUrl': 'https://district3.acgov.org/wp-content/uploads/sites/13/2023/01/Supervisor-Tam-FINAL-2000-Pixel1-300x300.jpg',
        },
      ],
    },
    'San Francisco': {
      'city': 'San Francisco',
      'county': 'San Francisco',
      'officials': [
        {
          'name': 'Daniel Lurie',
          'title': 'Mayor',
          'districtName': 'City and County of San Francisco',
          'website': 'https://sf.gov/departments/office-mayor',
          'phone': '(415) 554-6141',
        },
      ],
    },
    'San Jose': {
      'city': 'San Jose',
      'county': 'Santa Clara',
      'officials': [
        {
          'name': 'Matt Mahan',
          'title': 'Mayor',
          'districtName': 'City of San Jose',
          'website': 'https://www.sanjoseca.gov/your-government/departments-offices/mayor-and-city-council/mayor-matt-mahan',
          'photoUrl': 'https://www.sanjoseca.gov/home/showpublishedimage/75321/637831897583930000',
        },
      ],
    },
    'Berkeley': {
      'city': 'Berkeley',
      'county': 'Alameda',
      'officials': [
        {
          'name': 'Jesse Arreguín',
          'title': 'Mayor',
          'districtName': 'City of Berkeley',
          'website': 'https://berkeleyca.gov/your-government/mayor',
          'photoUrl': 'https://berkeleyca.gov/sites/default/files/styles/square_medium/public/2022-01/Jesse-Arreguin-2018.jpg',
        },
        {
          'name': 'Nikki Fortunato Bas',
          'title': 'County Supervisor',
          'districtName': 'Alameda County Board of Supervisors District 5',
          'website': 'https://district5.acgov.org',
          'photoUrl': 'https://district5.acgov.org/wp-content/uploads/sites/8/2025/01/Nikki-Fortunato-Bas-square.png',
        },
      ],
    },
    'Fremont': {
      'city': 'Fremont',
      'county': 'Alameda',
      'officials': [
        {
          'name': 'Raj Salwan',
          'title': 'Mayor',
          'districtName': 'City of Fremont',
          'website': 'https://www.fremont.gov/government/mayor-city-council',
          'photoUrl': 'https://www.fremont.gov/home/showpublishedimage/482/638791182509370000',
        },
        {
          'name': 'David Haubert',
          'title': 'County Supervisor',
          'districtName': 'Alameda County Board of Supervisors District 1',
          'website': 'https://district1.acgov.org/',
          'photoUrl': 'https://district1.acgov.org/wp-content/uploads/sites/16/2021/08/1-HAUBERT-2K-300x300.jpg',
        },
      ],
    },
    'Hayward': {
      'city': 'Hayward',
      'county': 'Alameda',
      'officials': [
        {
          'name': 'Mark Salinas',
          'title': 'Mayor',
          'districtName': 'City of Hayward',
          'website': 'https://www.hayward-ca.gov/your-government/city-council',
        },
        {
          'name': 'Elisa Marquez',
          'title': 'County Supervisor',
          'districtName': 'Alameda County Board of Supervisors District 2',
          'website': 'https://district2.acgov.org/',
          'photoUrl': 'https://district2.acgov.org/wp-content/uploads/sites/12/2023/01/Elisa-Marquez-300x300.jpg',
        },
      ],
    },
    'Richmond': {
      'city': 'Richmond',
      'county': 'Contra Costa',
      'officials': [
        {
          'name': 'Eduardo Martinez',
          'title': 'Mayor',
          'districtName': 'City of Richmond',
          'website': 'https://www.ci.richmond.ca.us/3661/Mayor-Eduardo-Martinez',
        },
      ],
    },
    'Concord': {
      'city': 'Concord',
      'county': 'Contra Costa',
      'officials': [
        {
          'name': 'Edi Birsan',
          'title': 'Mayor',
          'districtName': 'City of Concord',
          'website': 'https://www.cityofconcord.org/297/City-Council',
        },
      ],
    },
    'Santa Clara': {
      'city': 'Santa Clara',
      'county': 'Santa Clara',
      'officials': [
        {
          'name': 'Lisa Gillmor',
          'title': 'Mayor',
          'districtName': 'City of Santa Clara',
          'website': 'https://www.santaclaraca.gov/our-city/mayor-and-city-council',
        },
      ],
    },
    'Sunnyvale': {
      'city': 'Sunnyvale',
      'county': 'Santa Clara',
      'officials': [
        {
          'name': 'Larry Klein',
          'title': 'Mayor',
          'districtName': 'City of Sunnyvale',
          'website': 'https://sunnyvale.ca.gov/your-government/city-council',
        },
      ],
    },
    'Mountain View': {
      'city': 'Mountain View',
      'county': 'Santa Clara',
      'officials': [
        {
          'name': 'Pat Showalter',
          'title': 'Mayor',
          'districtName': 'City of Mountain View',
          'website': 'https://www.mountainview.gov/our-city/city-council',
        },
      ],
    },
    'Palo Alto': {
      'city': 'Palo Alto',
      'county': 'Santa Clara',
      'officials': [
        {
          'name': 'Greer Stone',
          'title': 'Mayor',
          'districtName': 'City of Palo Alto',
          'website': 'https://www.cityofpaloalto.org/Departments/City-Council',
        },
      ],
    },
    'Daly City': {
      'city': 'Daly City',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Glenn R. Sylvester', 'title': 'Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/daly-city/glenn_sylvester.jpg'},
        {'name': 'Teresa G. Proaño', 'title': 'Vice Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/daly-city/teresa_proano.jpg'},
        {'name': 'Juslyn C. Manalo', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/daly-city/juslyn_manalo.jpg'},
        {'name': 'Dr. Roderick Daus-Magbual', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/daly-city/roderick_daus-magbual.jpg'},
        {'name': 'Pamela DiGiovanni', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/daly-city/pamela_digiovanni.jpg'},
      ],
    },
    'Redwood City': {
      'city': 'Redwood City',
      'county': 'San Mateo',
      'officials': [
        {
          'name': 'Elmer Martínez Saballos',
          'title': 'Mayor',
          'districtName': 'District 4',
          'photoUrl': 'assets/images/representatives/local/san-mateo/redwood-city/elmer_martinez_saballos.jpg',
          'email': 'emartinezsaballos@redwoodcity.org',
          'phone': '(650) 701-4344',
        },
        {
          'name': 'Kaia Eakin',
          'title': 'Vice Mayor',
          'districtName': 'District 5',
          'photoUrl': 'assets/images/representatives/local/san-mateo/redwood-city/kaia_eakin.jpg',
          'email': 'keakin@redwoodcity.org',
          'phone': '(650) 368-3428',
        },
        {
          'name': 'Isabella Chu',
          'title': 'Council Member',
          'districtName': 'District 3',
          'photoUrl': 'assets/images/representatives/local/san-mateo/redwood-city/isabella_chu.jpg',
          'email': 'ichu@redwoodcity.org',
          'phone': '(650) 206-8261',
        },
        {
          'name': 'Jeff Gee',
          'title': 'Council Member',
          'districtName': 'District 1',
          'photoUrl': 'assets/images/representatives/local/san-mateo/redwood-city/jeff_gee.jpg',
          'email': 'jgee@redwoodcity.org',
          'phone': '(650) 483-7412',
        },
        {
          'name': 'Diane Howard',
          'title': 'Council Member',
          'districtName': 'District 6',
          'photoUrl': 'assets/images/representatives/local/san-mateo/redwood-city/diane_howard.jpg',
          'email': 'dhoward@redwoodcity.org',
          'phone': '(650) 208-4774',
        },
        {
          'name': 'Marcella Padilla',
          'title': 'Council Member',
          'districtName': 'District 7',
          'photoUrl': 'assets/images/representatives/local/san-mateo/redwood-city/marcella_padilla.jpg',
          'email': 'mpadilla@redwoodcity.org',
          'phone': '(650) 260-3309',
        },
        {
          'name': 'Chris Sturken',
          'title': 'Council Member',
          'districtName': 'District 2',
          'photoUrl': 'assets/images/representatives/local/san-mateo/redwood-city/chris_sturken.jpg',
          'email': 'csturken@redwoodcity.org',
          'phone': '(650) 454-7907',
        },
      ],
    },
    'San Mateo': {
      'city': 'San Mateo',
      'county': 'San Mateo',
      'officials': [
        {
          'name': 'Adam Loraine',
          'title': 'Mayor',
          'photoUrl': 'assets/images/representatives/local/san-mateo/san-mateo/adam_loraine.jpg',
        },
        {
          'name': 'Nicole Fernandez',
          'title': 'Deputy Mayor',
          'photoUrl': 'assets/images/representatives/local/san-mateo/san-mateo/nicole_fernandez.jpg',
        },
        {
          'name': 'Lisa Diaz Nash',
          'title': 'Council Member',
          'photoUrl': 'assets/images/representatives/local/san-mateo/san-mateo/lisa_diaz_nash.jpg',
        },
        {
          'name': 'Danielle Cwirko-Godycki',
          'title': 'Council Member',
          'photoUrl': 'assets/images/representatives/local/san-mateo/san-mateo/danielle_cwirko-godycki.jpg',
        },
        {
          'name': 'Rob Newsom',
          'title': 'Council Member',
          'photoUrl': 'assets/images/representatives/local/san-mateo/san-mateo/rob_newsom.jpg',
        },
      ],
    },
    'Atherton': {
      'city': 'Atherton',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Stacy Holland', 'title': 'Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/atherton/stacy_holland.jpg'},
        {'name': 'Rick DeGolia', 'title': 'Vice Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/atherton/rick_degolia.jpg'},
        {'name': 'Eric Lane', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/atherton/eric_lane.jpg'},
        {'name': 'Elizabeth Lewis', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/atherton/elizabeth_lewis.jpg'},
        {'name': 'Bill Widmer', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/atherton/bill_widmer.jpg'},
      ],
    },
    'Belmont': {
      'city': 'Belmont',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Julia Mates', 'title': 'Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/belmont/julia_mates.jpg', 'email': 'jmates@belmont.gov'},
        {'name': 'Cathy Jordan', 'title': 'Vice Mayor', 'districtName': 'District 2', 'photoUrl': 'assets/images/representatives/local/san-mateo/belmont/cathy_jordan.jpg', 'email': 'cjordan@belmont.gov'},
        {'name': 'Robin Pang-Maganaris', 'title': 'Council Member', 'districtName': 'District 3', 'photoUrl': 'assets/images/representatives/local/san-mateo/belmont/robin_pang-maganaris.jpg', 'email': 'rmaganaris@belmont.gov'},
        {'name': 'Tom McCune', 'title': 'Council Member', 'districtName': 'District 4', 'photoUrl': 'assets/images/representatives/local/san-mateo/belmont/tom_mccune.jpg', 'email': 'tmccune@belmont.gov'},
        {'name': 'Gina Latimerlo', 'title': 'Council Member', 'districtName': 'District 1', 'photoUrl': 'assets/images/representatives/local/san-mateo/belmont/gina_latimerlo.jpg', 'email': 'glatimerlo@belmont.gov'},
      ],
    },
    'Brisbane': {
      'city': 'Brisbane',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Coleen Mackin', 'title': 'Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/brisbane/coleen_mackin.webp', 'phone': '(415) 529-8114'},
        {'name': 'Madison Davis', 'title': 'Mayor Pro Tempore', 'photoUrl': 'assets/images/representatives/local/san-mateo/brisbane/madison_davis.webp', 'phone': '(415) 706-5276'},
        {'name': 'Frank Kern', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/brisbane/frank_kern.webp', 'phone': '(415) 215-0343'},
        {'name': 'Cliff Lentz', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/brisbane/cliff_lentz.webp', 'phone': '(650) 219-0293'},
        {'name': 'Terry O\'Connell', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/brisbane/terry_oconnell.webp', 'phone': '(415) 583-5518'},
      ],
    },
    'Burlingame': {
      'city': 'Burlingame',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Michael Brownrigg', 'title': 'Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/burlingame/michael_brownrigg.jpg'},
        {'name': 'Andrea Pappajohn', 'title': 'Vice Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/burlingame/andrea_pappajohn.jpg'},
        {'name': 'Donna Colson', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/burlingame/donna_colson.jpg'},
        {'name': 'Desiree Thayer', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/burlingame/desiree_thayer.jpg'},
        {'name': 'Peter Stevenson', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/burlingame/peter_stevenson.jpg'},
      ],
    },
    'East Palo Alto': {
      'city': 'East Palo Alto',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Webster Lincoln', 'title': 'Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/east-palo-alto/webster_lincoln.jpg'},
        {'name': 'Ruben Abrica', 'title': 'Vice Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/east-palo-alto/ruben_abrica.jpg'},
        {'name': 'Martha Barragan', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/east-palo-alto/martha_barragan.png'},
        {'name': 'Mark Dinan', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/east-palo-alto/mark_dinan.jpg'},
        {'name': 'Carlos Romero', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/east-palo-alto/carlos_romero.jpg'},
      ],
    },
    'Half Moon Bay': {
      'city': 'Half Moon Bay',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Debbie Ruddock', 'title': 'Mayor', 'districtName': 'District 4', 'email': 'druddock@halfmoonbay.gov', 'phone': '(650) 726-8250'},
        {'name': 'Deborah Penrose', 'title': 'Vice Mayor', 'districtName': 'District 5', 'email': 'dpenrose@halfmoonbay.gov', 'phone': '(650) 726-8250'},
        {'name': 'Robert Brownstone', 'title': 'Council Member', 'districtName': 'District 1', 'email': 'rbrownstone@halfmoonbay.gov', 'phone': '(650) 726-8250'},
        {'name': 'Patric Bo Jonsson', 'title': 'Council Member', 'districtName': 'District 2', 'email': 'pjonsson@halfmoonbay.gov', 'phone': '(650) 726-8250'},
        {'name': 'Paul Nagengast', 'title': 'Council Member', 'districtName': 'District 3', 'email': 'pnagengast@halfmoonbay.gov', 'phone': '(650) 726-8250'},
      ],
    },
    'Hillsborough': {
      'city': 'Hillsborough',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Sophie Cole', 'title': 'Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/hillsborough/sophie_cole.jpg'},
        {'name': 'Leslie Marden Ragsdale', 'title': 'Vice Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/hillsborough/leslie_marden_ragsdale.jpg'},
        {'name': 'Laurie Davies Adams', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/hillsborough/laurie_davies_adams.jpg'},
        {'name': 'Marie Chuang', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/hillsborough/marie_chuang.jpg'},
        {'name': 'Christine Krolik', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/hillsborough/christine_krolik.jpg'},
      ],
    },
    'Menlo Park': {
      'city': 'Menlo Park',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Betsy Nash', 'title': 'Mayor', 'districtName': 'District 4', 'photoUrl': 'assets/images/representatives/local/san-mateo/menlo-park/betsy_nash.jpg', 'email': 'bnash@menlopark.gov', 'phone': '(650) 380-3986'},
        {'name': 'Jennifer Wise', 'title': 'Vice Mayor', 'districtName': 'District 5', 'photoUrl': 'assets/images/representatives/local/san-mateo/menlo-park/jennifer_wise.jpg', 'email': 'jnwise@menlopark.gov', 'phone': '(650) 313-4848'},
        {'name': 'Drew Combs', 'title': 'Council Member', 'districtName': 'District 2', 'photoUrl': 'assets/images/representatives/local/san-mateo/menlo-park/drew_combs.jpg', 'email': 'dcombs@menlopark.gov', 'phone': '(650) 924-1890'},
        {'name': 'Jeff Schmidt', 'title': 'Council Member', 'districtName': 'District 3', 'photoUrl': 'assets/images/representatives/local/san-mateo/menlo-park/jeff_schmidt.jpg', 'email': 'jdschmidt@menlopark.gov'},
        {'name': 'Cecilia Taylor', 'title': 'Council Member', 'districtName': 'District 1', 'photoUrl': 'assets/images/representatives/local/san-mateo/menlo-park/cecilia_taylor.jpg', 'email': 'cttaylor@menlopark.gov', 'phone': '(650) 589-5073'},
      ],
    },
    'Millbrae': {
      'city': 'Millbrae',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Reuben D. Holober', 'title': 'Mayor', 'districtName': 'District 3', 'photoUrl': 'assets/images/representatives/local/san-mateo/millbrae/reuben_holober.jpg'},
        {'name': 'Stephen Rainaldi', 'title': 'Vice Mayor', 'districtName': 'District 1', 'photoUrl': 'assets/images/representatives/local/san-mateo/millbrae/stephen_rainaldi.jpg'},
        {'name': 'Sissy Riley', 'title': 'Council Member', 'districtName': 'District 2', 'photoUrl': 'assets/images/representatives/local/san-mateo/millbrae/sissy_riley.jpg'},
        {'name': 'Bob Nguyen', 'title': 'Council Member', 'districtName': 'District 4', 'photoUrl': 'assets/images/representatives/local/san-mateo/millbrae/bob_nguyen.jpg'},
        {'name': 'Anders Fung', 'title': 'Council Member', 'districtName': 'District 5', 'photoUrl': 'assets/images/representatives/local/san-mateo/millbrae/anders_fung.jpg'},
      ],
    },
    'Pacifica': {
      'city': 'Pacifica',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Christine Boles', 'title': 'Mayor', 'districtName': 'District 2', 'photoUrl': 'assets/images/representatives/local/san-mateo/pacifica/christine_boles.jpg', 'email': 'cboles@pacifica.gov'},
        {'name': 'Greg Wright', 'title': 'Vice Mayor', 'districtName': 'District 4', 'photoUrl': 'assets/images/representatives/local/san-mateo/pacifica/greg_wright.png', 'email': 'gwright@pacifica.gov'},
        {'name': 'Sue Beckmeyer', 'title': 'Council Member', 'districtName': 'District 5', 'photoUrl': 'assets/images/representatives/local/san-mateo/pacifica/sue_beckmeyer.jpg', 'email': 'sbeckmeyer@pacifica.gov'},
        {'name': 'Mary Bier', 'title': 'Council Member', 'districtName': 'District 3', 'photoUrl': 'assets/images/representatives/local/san-mateo/pacifica/mary_bier.jpg', 'email': 'mbier@pacifica.gov', 'phone': '(650) 516-6034'},
        {'name': 'Mayra Espinosa', 'title': 'Council Member', 'districtName': 'District 1', 'photoUrl': 'assets/images/representatives/local/san-mateo/pacifica/mayra_espinosa.jpg', 'email': 'mespinosa@pacifica.gov'},
      ],
    },
    'Portola Valley': {
      'city': 'Portola Valley',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Craig Taylor', 'title': 'Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/portola-valley/craig_taylor.jpg', 'email': 'ctaylor@portolavalley.net'},
        {'name': 'Mary Hufty', 'title': 'Vice Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/portola-valley/mary_hufty.jpg', 'email': 'mhufty@portolavalley.net'},
        {'name': 'Judith Hasko', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/portola-valley/judith_hasko.jpg', 'email': 'jhasko@portolavalley.net'},
        {'name': 'Rebecca Flynn', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/portola-valley/rebecca_flynn.png', 'email': 'rflynn@portolavalley.net'},
        {'name': 'Helen Wolter', 'title': 'Council Member', 'email': 'hwolter@portolavalley.net'},
      ],
    },
    'San Bruno': {
      'city': 'San Bruno',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Rico E. Medina', 'title': 'Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/san-bruno/rico_medina.jpg'},
        {'name': 'Sandy Alvarez', 'title': 'Vice Mayor', 'districtName': 'District 1', 'photoUrl': 'assets/images/representatives/local/san-mateo/san-bruno/sandy_alvarez.jpg'},
        {'name': 'Tom Hamilton', 'title': 'Council Member', 'districtName': 'District 2', 'photoUrl': 'assets/images/representatives/local/san-mateo/san-bruno/tom_hamilton.jpg'},
        {'name': 'Michael Salazar', 'title': 'Council Member', 'districtName': 'District 3', 'photoUrl': 'assets/images/representatives/local/san-mateo/san-bruno/michael_salazar.jpg'},
        {'name': 'Marty Medina', 'title': 'Council Member', 'districtName': 'District 4', 'photoUrl': 'assets/images/representatives/local/san-mateo/san-bruno/marty_medina.jpg'},
      ],
    },
    'San Carlos': {
      'city': 'San Carlos',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Pranita Venkatesh', 'title': 'Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/san-carlos/pranita_venkatesh.jpg'},
        {'name': 'Adam Rak', 'title': 'Vice Mayor', 'photoUrl': 'assets/images/representatives/local/san-mateo/san-carlos/adam_rak.jpg'},
        {'name': 'John Dugan', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/san-carlos/john_dugan.jpg'},
        {'name': 'Neil Layton', 'title': 'Council Member'},
        {'name': 'Sara McDowell', 'title': 'Council Member', 'photoUrl': 'assets/images/representatives/local/san-mateo/san-carlos/sara_mcdowell.jpg'},
      ],
    },
    'South San Francisco': {
      'city': 'South San Francisco',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Mark Addiego', 'title': 'Mayor', 'districtName': 'District 1', 'photoUrl': 'assets/images/representatives/local/san-mateo/south-san-francisco/mark_addiego.jpg'},
        {'name': 'Mark Nagales', 'title': 'Vice Mayor', 'districtName': 'District 2', 'photoUrl': 'assets/images/representatives/local/san-mateo/south-san-francisco/mark_nagales.jpg'},
        {'name': 'Buenaflor Nicolas', 'title': 'Council Member', 'districtName': 'District 3', 'photoUrl': 'assets/images/representatives/local/san-mateo/south-san-francisco/buenaflor_nicolas.jpg'},
        {'name': 'James Coleman', 'title': 'Council Member', 'districtName': 'District 4', 'photoUrl': 'assets/images/representatives/local/san-mateo/south-san-francisco/james_coleman.png'},
        {'name': 'Eddie Flores', 'title': 'Council Member', 'districtName': 'District 5', 'photoUrl': 'assets/images/representatives/local/san-mateo/south-san-francisco/eddie_flores.jpg'},
      ],
    },
    'Woodside': {
      'city': 'Woodside',
      'county': 'San Mateo',
      'officials': [
        {'name': 'Brian Dombkowski', 'title': 'Mayor', 'districtName': 'District 2', 'photoUrl': 'assets/images/representatives/local/san-mateo/woodside/brian_dombkowski.jpg'},
        {'name': 'Paul Goeld', 'title': 'Mayor Pro Tem', 'districtName': 'District 4', 'photoUrl': 'assets/images/representatives/local/san-mateo/woodside/paul_goeld.jpg'},
        {'name': 'Jenn Wall', 'title': 'Council Member', 'districtName': 'District 1', 'photoUrl': 'assets/images/representatives/local/san-mateo/woodside/jenn_wall.jpg'},
        {'name': 'Dick Brown', 'title': 'Council Member', 'districtName': 'District 3', 'photoUrl': 'assets/images/representatives/local/san-mateo/woodside/dick_brown.jpg'},
        {'name': 'Hassan Aburish', 'title': 'Council Member', 'districtName': 'District 5'},
      ],
    },
    'Vallejo': {
      'city': 'Vallejo',
      'county': 'Solano',
      'officials': [
        {
          'name': 'Robert McConnell',
          'title': 'Mayor',
          'districtName': 'City of Vallejo',
          'website': 'https://www.cityofvallejo.net/city_hall/departments___divisions/city_manager_s_office/city_council',
        },
      ],
    },
    'Fairfield': {
      'city': 'Fairfield',
      'county': 'Solano',
      'officials': [
        {
          'name': 'Catherine Moy',
          'title': 'Mayor',
          'districtName': 'City of Fairfield',
          'website': 'https://www.fairfield.ca.gov/gov/depts/citymgr/council/default.asp',
        },
      ],
    },
    'Napa': {
      'city': 'Napa',
      'county': 'Napa',
      'officials': [
        {
          'name': 'Scott Sedgley',
          'title': 'Mayor',
          'districtName': 'City of Napa',
          'website': 'https://www.cityofnapa.org/305/City-Council',
        },
      ],
    },
    'Santa Rosa': {
      'city': 'Santa Rosa',
      'county': 'Sonoma',
      'officials': [
        {
          'name': 'Natalie Rogers',
          'title': 'Mayor',
          'districtName': 'City of Santa Rosa',
          'website': 'https://srcity.org/149/City-Council',
        },
      ],
    },
    'Petaluma': {
      'city': 'Petaluma',
      'county': 'Sonoma',
      'officials': [
        {
          'name': 'Kevin McDonnell',
          'title': 'Mayor',
          'districtName': 'City of Petaluma',
          'website': 'https://cityofpetaluma.org/city-council/',
        },
      ],
    },
  };

  /// Supported city guides with local government info
  static final Map<String, CityGuide> _supportedCityGuides = {
    'oakland': CityGuide(
      cityName: 'Oakland',
      countyName: 'Alameda County',
      cityWebsite: 'https://www.oaklandca.gov/',
      newsRssUrl: 'https://www.oaklandca.gov/api/news.json',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(510) 238-3141',
          website: 'https://www.oaklandca.gov/',
          address: '1 Frank H. Ogawa Plaza, Oakland, CA 94612',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
        CityAgency(
          id: 'public-works',
          name: 'Public Works',
          description: 'Streets, sewers, streetlights, and graffiti removal',
          phone: '(510) 615-5566',
          website: 'https://www.oaklandca.gov/departments/public-works',
          icon: Icons.construction,
          color: const Color(0xFFFF6F00),
        ),
        CityAgency(
          id: 'housing',
          name: 'Housing & Community Development',
          description: 'Affordable housing, tenant services, rent assistance',
          phone: '(510) 238-3502',
          website: 'https://www.oaklandca.gov/departments/housing-and-community-development',
          icon: Icons.home,
          color: const Color(0xFF1976D2),
        ),
        CityAgency(
          id: 'human-services',
          name: 'Human Services',
          description: 'Social services, youth programs, senior services',
          phone: '(510) 238-3088',
          website: 'https://www.oaklandca.gov/departments/human-services',
          icon: Icons.people,
          color: const Color(0xFF7B1FA2),
        ),
        CityAgency(
          id: 'parks-rec',
          name: 'Parks & Recreation',
          description: 'Parks, community centers, and recreation programs',
          phone: '(510) 238-7275',
          website: 'https://www.oaklandca.gov/departments/parks-recreation-and-youth-development',
          icon: Icons.park,
          color: const Color(0xFF388E3C),
        ),
        CityAgency(
          id: 'library',
          name: 'Oakland Public Library',
          description: 'Libraries, free programs, and resources',
          phone: '(510) 238-3134',
          website: 'https://oaklandlibrary.org/',
          icon: Icons.local_library,
          color: const Color(0xFF5D4037),
        ),
      ],
    ),
    'san francisco': CityGuide(
      cityName: 'San Francisco',
      countyName: 'San Francisco',
      cityWebsite: 'https://sf.gov/',
      newsRssUrl: 'https://sf.gov/api/news.json',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city and county government offices',
          phone: '311',
          website: 'https://sf.gov/',
          address: '1 Dr Carlton B Goodlett Pl, San Francisco, CA 94102',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
        CityAgency(
          id: 'hsa',
          name: 'Human Services Agency',
          description: 'CalFresh, Medi-Cal, CalWORKs, and social services',
          phone: '(415) 557-5000',
          website: 'https://www.sfhsa.org/',
          icon: Icons.people,
          color: const Color(0xFF7B1FA2),
        ),
        CityAgency(
          id: 'mohcd',
          name: 'Housing & Community Development',
          description: 'Affordable housing, rent assistance, first-time homebuyers',
          phone: '(415) 701-5500',
          website: 'https://sfmohcd.org/',
          icon: Icons.home,
          color: const Color(0xFF1976D2),
        ),
        CityAgency(
          id: 'dpw',
          name: 'Public Works',
          description: 'Streets, sidewalks, graffiti, and city maintenance',
          phone: '311',
          website: 'https://www.sfpublicworks.org/',
          icon: Icons.construction,
          color: const Color(0xFFFF6F00),
        ),
        CityAgency(
          id: 'sfpl',
          name: 'SF Public Library',
          description: 'Libraries, free programs, and community resources',
          phone: '(415) 557-4400',
          website: 'https://sfpl.org/',
          icon: Icons.local_library,
          color: const Color(0xFF5D4037),
        ),
        CityAgency(
          id: 'rec-park',
          name: 'Recreation & Parks',
          description: 'Parks, recreation centers, and programs',
          phone: '(415) 831-2700',
          website: 'https://sfrecpark.org/',
          icon: Icons.park,
          color: const Color(0xFF388E3C),
        ),
      ],
    ),
    'san jose': CityGuide(
      cityName: 'San Jose',
      countyName: 'Santa Clara County',
      cityWebsite: 'https://www.sanjoseca.gov/',
      newsRssUrl: 'https://www.sanjoseca.gov/api/news.json',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(408) 535-3500',
          website: 'https://www.sanjoseca.gov/',
          address: '200 E Santa Clara St, San Jose, CA 95113',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
        CityAgency(
          id: 'housing',
          name: 'Housing Department',
          description: 'Affordable housing, rent assistance, homelessness services',
          phone: '(408) 535-3860',
          website: 'https://www.sanjoseca.gov/your-government/departments/housing',
          icon: Icons.home,
          color: const Color(0xFF1976D2),
        ),
        CityAgency(
          id: 'prns',
          name: 'Parks, Recreation & Neighborhood Services',
          description: 'Parks, community centers, and recreation programs',
          phone: '(408) 535-3500',
          website: 'https://www.sanjoseca.gov/your-government/departments/parks-recreation-neighborhood-services',
          icon: Icons.park,
          color: const Color(0xFF388E3C),
        ),
        CityAgency(
          id: 'library',
          name: 'San Jose Public Library',
          description: 'Libraries and free community programs',
          phone: '(408) 808-2000',
          website: 'https://www.sjpl.org/',
          icon: Icons.local_library,
          color: const Color(0xFF5D4037),
        ),
        CityAgency(
          id: 'public-works',
          name: 'Public Works',
          description: 'Streets, sidewalks, and city maintenance',
          phone: '(408) 535-3850',
          website: 'https://www.sanjoseca.gov/your-government/departments/public-works',
          icon: Icons.construction,
          color: const Color(0xFFFF6F00),
        ),
      ],
    ),
    'berkeley': CityGuide(
      cityName: 'Berkeley',
      countyName: 'Alameda County',
      cityWebsite: 'https://berkeleyca.gov/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(510) 981-2489',
          website: 'https://berkeleyca.gov/',
          address: '2180 Milvia St, Berkeley, CA 94704',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
        CityAgency(
          id: 'hhcs',
          name: 'Health, Housing & Community Services',
          description: 'Social services, housing assistance, and health programs',
          phone: '(510) 981-5400',
          website: 'https://berkeleyca.gov/your-government/our-work/health-housing-community-services',
          icon: Icons.home,
          color: const Color(0xFF1976D2),
        ),
        CityAgency(
          id: 'library',
          name: 'Berkeley Public Library',
          description: 'Libraries and community programs',
          phone: '(510) 981-6100',
          website: 'https://www.berkeleypubliclibrary.org/',
          icon: Icons.local_library,
          color: const Color(0xFF5D4037),
        ),
        CityAgency(
          id: 'parks-rec',
          name: 'Parks, Recreation & Waterfront',
          description: 'Parks, pools, and recreation programs',
          phone: '(510) 981-6700',
          website: 'https://berkeleyca.gov/your-government/our-work/parks-recreation-waterfront',
          icon: Icons.park,
          color: const Color(0xFF388E3C),
        ),
      ],
    ),
    'fremont': CityGuide(
      cityName: 'Fremont',
      countyName: 'Alameda County',
      cityWebsite: 'https://www.fremont.gov/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(510) 284-4000',
          website: 'https://www.fremont.gov/',
          address: '3300 Capitol Ave, Fremont, CA 94538',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
        CityAgency(
          id: 'human-services',
          name: 'Human Services',
          description: 'Family Resource Center, senior services, youth programs',
          phone: '(510) 574-2000',
          website: 'https://www.fremont.gov/government/departments/human-services',
          icon: Icons.people,
          color: const Color(0xFF7B1FA2),
        ),
        CityAgency(
          id: 'community-services',
          name: 'Community Services',
          description: 'Recreation, parks, and community centers',
          phone: '(510) 494-4300',
          website: 'https://www.fremont.gov/government/departments/community-services',
          icon: Icons.park,
          color: const Color(0xFF388E3C),
        ),
      ],
    ),
    'redwood city': CityGuide(
      cityName: 'Redwood City',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.redwoodcity.org/',
      // No RSS feed available - news page is at /departments/city-manager/news-room/news-releases
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/redwood-city/redwood-city/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 780-7000',
          website: 'https://www.redwoodcity.org/',
          address: '1017 Middlefield Road, Redwood City, CA 94063',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
        CityAgency(
          id: 'community-services',
          name: 'Community Services',
          description: 'Recreation, parks, senior services, and community programs',
          phone: '(650) 780-7250',
          website: 'https://www.redwoodcity.org/departments/community-services-department',
          icon: Icons.people,
          color: const Color(0xFF7B1FA2),
        ),
        CityAgency(
          id: 'planning',
          name: 'Planning & Housing',
          description: 'Development services, affordable housing, and rent stabilization',
          phone: '(650) 780-7234',
          website: 'https://www.redwoodcity.org/departments/community-development-department/planning-housing',
          icon: Icons.home,
          color: const Color(0xFF1976D2),
        ),
        CityAgency(
          id: 'public-works',
          name: 'Public Works',
          description: 'Streets, sidewalks, and city maintenance',
          phone: '(650) 780-7460',
          website: 'https://www.redwoodcity.org/departments/public-works-department',
          icon: Icons.construction,
          color: const Color(0xFFFF6F00),
        ),
        CityAgency(
          id: 'library',
          name: 'Redwood City Public Library',
          description: 'Libraries, free programs, and community resources',
          phone: '(650) 780-7018',
          website: 'https://www.redwoodcity.org/departments/library',
          icon: Icons.local_library,
          color: const Color(0xFF5D4037),
        ),
        CityAgency(
          id: 'parks-rec',
          name: 'Parks & Recreation',
          description: 'Parks, community centers, and recreation programs',
          phone: '(650) 780-7250',
          website: 'https://www.redwoodcity.org/departments/community-services-department/parks-recreation-and-community-services',
          icon: Icons.park,
          color: const Color(0xFF388E3C),
        ),
      ],
    ),
    'millbrae': CityGuide(
      cityName: 'Millbrae',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.ci.millbrae.ca.us/',
      newsRssUrl: 'https://www.ci.millbrae.ca.us/RSSFeed.aspx?ModID=1&CID=City-News-Flash-9',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/millbrae/city-of-millbrae/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 259-2334',
          website: 'https://www.ci.millbrae.ca.us/',
          address: '621 Magnolia Avenue, Millbrae, CA 94030',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
        CityAgency(
          id: 'recreation',
          name: 'Recreation Department',
          description: 'Parks, recreation programs, and community events',
          phone: '(650) 259-2360',
          website: 'https://www.ci.millbrae.ca.us/our-city/departments-divisions/recreation',
          icon: Icons.park,
          color: const Color(0xFF388E3C),
        ),
      ],
    ),
    'atherton': CityGuide(
      cityName: 'Atherton',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.athertonca.gov/',
      newsRssUrl: 'https://www.athertonca.gov/RSSFeed.aspx?ModID=1&CID=All-newsflash.xml',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/atherton/town-of-atherton/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'Town Hall',
          description: 'Main town government offices',
          phone: '(650) 752-0500',
          website: 'https://www.athertonca.gov/',
          address: '80 Fair Oaks Lane, Atherton, CA 94027',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'burlingame': CityGuide(
      cityName: 'Burlingame',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.burlingame.org/',
      newsRssUrl: 'https://www.burlingame.org/RSSFeed.aspx?ModID=1&CID=Home-1',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/burlingame/city-of-burlingame/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 558-7200',
          website: 'https://www.burlingame.org/',
          address: '501 Primrose Road, Burlingame, CA 94010',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'daly city': CityGuide(
      cityName: 'Daly City',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.dalycity.org/',
      newsRssUrl: 'https://www.dalycity.org/RSSFeed.aspx?ModID=1&CID=All-newsflash.xml',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/daly-city/city-of-daly-city/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 991-8000',
          website: 'https://www.dalycity.org/',
          address: '333 90th Street, Daly City, CA 94015',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'san mateo': CityGuide(
      cityName: 'San Mateo',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.cityofsanmateo.org/',
      newsRssUrl: 'https://www.cityofsanmateo.org/RSSFeed.aspx?ModID=1&CID=Latest-News-Announcements-1',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/san-mateo/city-of-san-mateo/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 522-7000',
          website: 'https://www.cityofsanmateo.org/',
          address: '330 West 20th Avenue, San Mateo, CA 94403',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'woodside': CityGuide(
      cityName: 'Woodside',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.woodsideca.gov/',
      newsRssUrl: 'https://www.woodsideca.gov/RSSFeed.aspx?ModID=1&CID=Town-Announcements-1',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/woodside/town-of-woodside/',
      agencies: [
        CityAgency(
          id: 'town-hall',
          name: 'Town Hall',
          description: 'Main town government offices',
          phone: '(650) 851-6790',
          website: 'https://www.woodsideca.gov/',
          address: '2955 Woodside Road, Woodside, CA 94062',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'belmont': CityGuide(
      cityName: 'Belmont',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.belmont.gov/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/belmont/city-of-belmont/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 595-7400',
          website: 'https://www.belmont.gov/',
          address: '1 Twin Pines Lane, Belmont, CA 94002',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'pacifica': CityGuide(
      cityName: 'Pacifica',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.cityofpacifica.org/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/pacifica/city-of-pacifica/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 738-7300',
          website: 'https://www.cityofpacifica.org/',
          address: '170 Santa Maria Avenue, Pacifica, CA 94044',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'half moon bay': CityGuide(
      cityName: 'Half Moon Bay',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.half-moon-bay.ca.us/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/half-moon-bay/city-of-half-moon-bay/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 726-8270',
          website: 'https://www.half-moon-bay.ca.us/',
          address: '501 Main Street, Half Moon Bay, CA 94019',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'brisbane': CityGuide(
      cityName: 'Brisbane',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.brisbaneca.org/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/brisbane/city-of-brisbane/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(415) 508-2100',
          website: 'https://www.brisbaneca.org/',
          address: '50 Park Place, Brisbane, CA 94005',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'san carlos': CityGuide(
      cityName: 'San Carlos',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.cityofsancarlos.org/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/san-carlos/city-of-san-carlos/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 802-4100',
          website: 'https://www.cityofsancarlos.org/',
          address: '600 Elm Street, San Carlos, CA 94070',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'menlo park': CityGuide(
      cityName: 'Menlo Park',
      countyName: 'San Mateo County',
      cityWebsite: 'https://menlopark.gov/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/menlo-park/city-of-menlo-park/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 330-6600',
          website: 'https://menlopark.gov/',
          address: '701 Laurel Street, Menlo Park, CA 94025',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'san bruno': CityGuide(
      cityName: 'San Bruno',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.sanbruno.ca.gov/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/san-bruno/city-of-san-bruno/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 616-7000',
          website: 'https://www.sanbruno.ca.gov/',
          address: '567 El Camino Real, San Bruno, CA 94066',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'south san francisco': CityGuide(
      cityName: 'South San Francisco',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.ssf.net/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/south-san-francisco/city-of-south-san-francisco/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 877-8500',
          website: 'https://www.ssf.net/',
          address: '400 Grand Avenue, South San Francisco, CA 94080',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'foster city': CityGuide(
      cityName: 'Foster City',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.fostercity.org/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/foster-city/city-of-foster-city/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 286-3200',
          website: 'https://www.fostercity.org/',
          address: '610 Foster City Blvd, Foster City, CA 94404',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'east palo alto': CityGuide(
      cityName: 'East Palo Alto',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.cityofepa.org/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/east-palo-alto/city-of-east-palo-alto/',
      agencies: [
        CityAgency(
          id: 'city-hall',
          name: 'City Hall',
          description: 'Main city government offices',
          phone: '(650) 853-3100',
          website: 'https://www.cityofepa.org/',
          address: '2415 University Avenue, East Palo Alto, CA 94303',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'colma': CityGuide(
      cityName: 'Colma',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.colma.ca.gov/',
      nextdoorUrl: 'https://nextdoor.com/agency-detail/ca/colma/town-of-colma/',
      agencies: [
        CityAgency(
          id: 'town-hall',
          name: 'Town Hall',
          description: 'Main town government offices',
          phone: '(650) 997-8300',
          website: 'https://www.colma.ca.gov/',
          address: '1198 El Camino Real, Colma, CA 94014',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'hillsborough': CityGuide(
      cityName: 'Hillsborough',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.hillsborough.net/',
      // No active Nextdoor page
      agencies: [
        CityAgency(
          id: 'town-hall',
          name: 'Town Hall',
          description: 'Main town government offices',
          phone: '(650) 375-7400',
          website: 'https://www.hillsborough.net/',
          address: '1600 Floribunda Avenue, Hillsborough, CA 94010',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
    'portola valley': CityGuide(
      cityName: 'Portola Valley',
      countyName: 'San Mateo County',
      cityWebsite: 'https://www.portolavalley.net/',
      // No public Nextdoor page
      agencies: [
        CityAgency(
          id: 'town-hall',
          name: 'Town Hall',
          description: 'Main town government offices',
          phone: '(650) 851-1700',
          website: 'https://www.portolavalley.net/',
          address: '765 Portola Road, Portola Valley, CA 94028',
          icon: Icons.account_balance,
          color: const Color(0xFF2E7D32),
        ),
      ],
    ),
  };

  /// Get list of supported cities
  List<String> get supportedCities => _supportedCityGuides.keys.toList();
}
