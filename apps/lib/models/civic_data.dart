import 'package:flutter/material.dart';

/// Local government agency/department
class CityAgency {
  final String id;
  final String name;
  final String description;
  final String? phone;
  final String? website;
  final String? address;
  final IconData icon;
  final Color color;

  const CityAgency({
    required this.id,
    required this.name,
    required this.description,
    this.phone,
    this.website,
    this.address,
    required this.icon,
    required this.color,
  });
}

/// City guide with local government info
class CityGuide {
  final String cityName;
  final String countyName;
  final List<CityAgency> agencies;
  final String? cityWebsite;
  final String? newsRssUrl;
  final String? nextdoorUrl;

  const CityGuide({
    required this.cityName,
    required this.countyName,
    required this.agencies,
    this.cityWebsite,
    this.newsRssUrl,
    this.nextdoorUrl,
  });
}

/// News article from city website
class CityNews {
  final String title;
  final String summary;
  final String url;
  final DateTime publishedAt;
  final String? imageUrl;
  final String source;

  const CityNews({
    required this.title,
    required this.summary,
    required this.url,
    required this.publishedAt,
    this.imageUrl,
    required this.source,
  });
}

/// Elected representative
class Representative {
  final String name;
  final String title;
  final String level; // 'federal', 'state', 'local'
  final String? party;
  final String? phone;
  final String? email;
  final String? website;
  final String? photoUrl;
  final String? district;
  final String? bio;

  const Representative({
    required this.name,
    required this.title,
    required this.level,
    this.party,
    this.phone,
    this.email,
    this.website,
    this.photoUrl,
    this.district,
    this.bio,
  });
}

/// Representatives for a location
class RepresentativeList {
  final List<Representative> federal; // US Senators, US Rep
  final List<Representative> state; // State Senator, Assembly Member
  final List<Representative> local; // Mayor, City Council, etc.

  const RepresentativeList({
    this.federal = const [],
    this.state = const [],
    this.local = const [],
  });

  List<Representative> get all => [...federal, ...state, ...local];

  bool get isEmpty => federal.isEmpty && state.isEmpty && local.isEmpty;
}
