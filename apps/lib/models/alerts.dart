/// Data models for Bay Area alerts (earthquakes, weather, missing persons)

class EarthquakeData {
  final String generated;
  final String source;
  final String sourceUrl;
  final int count;
  final List<Earthquake> alerts;

  EarthquakeData({
    required this.generated,
    required this.source,
    required this.sourceUrl,
    required this.count,
    required this.alerts,
  });

  factory EarthquakeData.fromJson(Map<String, dynamic> json) {
    return EarthquakeData(
      generated: json['generated'] ?? '',
      source: json['source'] ?? '',
      sourceUrl: json['sourceUrl'] ?? '',
      count: json['count'] ?? 0,
      alerts: (json['alerts'] as List?)
              ?.map((e) => Earthquake.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class Earthquake {
  final String id;
  final double magnitude;
  final String place;
  final String time;
  final int timestamp;
  final String url;
  final double depth;
  final double lat;
  final double lng;
  final int felt;
  final bool tsunami;
  final String severity;
  final String title;
  final String status;
  final String magType;
  final int sig;

  Earthquake({
    required this.id,
    required this.magnitude,
    required this.place,
    required this.time,
    required this.timestamp,
    required this.url,
    required this.depth,
    required this.lat,
    required this.lng,
    required this.felt,
    required this.tsunami,
    required this.severity,
    required this.title,
    required this.status,
    required this.magType,
    required this.sig,
  });

  factory Earthquake.fromJson(Map<String, dynamic> json) {
    return Earthquake(
      id: json['id'] ?? '',
      magnitude: (json['magnitude'] ?? 0).toDouble(),
      place: json['place'] ?? '',
      time: json['time'] ?? '',
      timestamp: json['timestamp'] ?? 0,
      url: json['url'] ?? '',
      depth: (json['depth'] ?? 0).toDouble(),
      lat: (json['lat'] ?? 0).toDouble(),
      lng: (json['lng'] ?? 0).toDouble(),
      felt: json['felt'] ?? 0,
      tsunami: json['tsunami'] ?? false,
      severity: json['severity'] ?? 'micro',
      title: json['title'] ?? '',
      status: json['status'] ?? '',
      magType: json['magType'] ?? '',
      sig: json['sig'] ?? 0,
    );
  }
}

class WeatherData {
  final String generated;
  final String source;
  final String sourceUrl;
  final int count;
  final List<WeatherAlert> alerts;

  WeatherData({
    required this.generated,
    required this.source,
    required this.sourceUrl,
    required this.count,
    required this.alerts,
  });

  factory WeatherData.fromJson(Map<String, dynamic> json) {
    return WeatherData(
      generated: json['generated'] ?? '',
      source: json['source'] ?? '',
      sourceUrl: json['sourceUrl'] ?? '',
      count: json['count'] ?? 0,
      alerts: (json['alerts'] as List?)
              ?.map((e) => WeatherAlert.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class WeatherAlert {
  final String id;
  final String event;
  final String headline;
  final String description;
  final String instruction;
  final String severity;
  final String certainty;
  final String urgency;
  final String areaDesc;
  final String effective;
  final String onset;
  final String expires;
  final String ends;
  final String senderName;
  final String response;
  final List<String> categories;
  final List<String> zones;

  WeatherAlert({
    required this.id,
    required this.event,
    required this.headline,
    required this.description,
    required this.instruction,
    required this.severity,
    required this.certainty,
    required this.urgency,
    required this.areaDesc,
    required this.effective,
    required this.onset,
    required this.expires,
    required this.ends,
    required this.senderName,
    required this.response,
    required this.categories,
    required this.zones,
  });

  factory WeatherAlert.fromJson(Map<String, dynamic> json) {
    return WeatherAlert(
      id: json['id'] ?? '',
      event: json['event'] ?? '',
      headline: json['headline'] ?? '',
      description: json['description'] ?? '',
      instruction: json['instruction'] ?? '',
      severity: json['severity'] ?? '',
      certainty: json['certainty'] ?? '',
      urgency: json['urgency'] ?? '',
      areaDesc: json['areaDesc'] ?? '',
      effective: json['effective'] ?? '',
      onset: json['onset'] ?? '',
      expires: json['expires'] ?? '',
      ends: json['ends'] ?? '',
      senderName: json['senderName'] ?? '',
      response: json['response'] ?? '',
      categories: List<String>.from(json['categories'] ?? []),
      zones: List<String>.from(json['zones'] ?? []),
    );
  }
}

class MissingPersonsData {
  final List<MissingPerson> cases;

  MissingPersonsData({required this.cases});

  factory MissingPersonsData.fromJson(Map<String, dynamic> json) {
    return MissingPersonsData(
      cases: (json['cases'] as List?)
              ?.map((e) => MissingPerson.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class MissingPerson {
  final String id;
  final String sourceId;
  final String source;
  final String name;
  final int age;
  final String missingDate;
  final MissingLocation missingFrom;
  final String photoUrl;
  final String posterUrl;
  final ContactInfo contact;
  final String syncedAt;
  final PhysicalDescription physical;
  final String dateOfBirth;
  final String circumstances;
  final String summary;
  final String caseType;
  final String lastSeenWearing;
  final bool enrichedByLlm;

  MissingPerson({
    required this.id,
    required this.sourceId,
    required this.source,
    required this.name,
    required this.age,
    required this.missingDate,
    required this.missingFrom,
    required this.photoUrl,
    required this.posterUrl,
    required this.contact,
    required this.syncedAt,
    required this.physical,
    required this.dateOfBirth,
    required this.circumstances,
    required this.summary,
    required this.caseType,
    required this.lastSeenWearing,
    required this.enrichedByLlm,
  });

  factory MissingPerson.fromJson(Map<String, dynamic> json) {
    return MissingPerson(
      id: json['id'] ?? '',
      sourceId: json['sourceId'] ?? '',
      source: json['source'] ?? '',
      name: json['name'] ?? '',
      age: json['age'] ?? 0,
      missingDate: json['missingDate'] ?? '',
      missingFrom: MissingLocation.fromJson(json['missingFrom'] ?? {}),
      photoUrl: json['photoUrl'] ?? '',
      posterUrl: json['posterUrl'] ?? '',
      contact: ContactInfo.fromJson(json['contact'] ?? {}),
      syncedAt: json['syncedAt'] ?? '',
      physical: PhysicalDescription.fromJson(json['physical'] ?? {}),
      dateOfBirth: json['dateOfBirth'] ?? '',
      circumstances: json['circumstances'] ?? '',
      summary: json['summary'] ?? '',
      caseType: json['caseType'] ?? '',
      lastSeenWearing: json['lastSeenWearing'] ?? '',
      enrichedByLlm: json['enrichedByLlm'] ?? false,
    );
  }
}

class MissingLocation {
  final String city;
  final String county;
  final String state;

  MissingLocation({
    required this.city,
    required this.county,
    required this.state,
  });

  factory MissingLocation.fromJson(Map<String, dynamic> json) {
    return MissingLocation(
      city: json['city'] ?? '',
      county: json['county'] ?? '',
      state: json['state'] ?? '',
    );
  }

  String get displayName {
    final parts = <String>[];
    if (city.isNotEmpty) parts.add(city);
    if (county.isNotEmpty) parts.add(county);
    return parts.join(', ');
  }
}

class ContactInfo {
  final String agency;
  final String phone;

  ContactInfo({required this.agency, required this.phone});

  factory ContactInfo.fromJson(Map<String, dynamic> json) {
    return ContactInfo(
      agency: json['agency'] ?? '',
      phone: json['phone'] ?? '',
    );
  }
}

class PhysicalDescription {
  final String sex;
  final String race;
  final String height;
  final String weight;
  final String hairColor;
  final String eyeColor;

  PhysicalDescription({
    required this.sex,
    required this.race,
    required this.height,
    required this.weight,
    required this.hairColor,
    required this.eyeColor,
  });

  factory PhysicalDescription.fromJson(Map<String, dynamic> json) {
    return PhysicalDescription(
      sex: json['sex'] ?? '',
      race: json['race'] ?? '',
      height: json['height'] ?? '',
      weight: json['weight'] ?? '',
      hairColor: json['hairColor'] ?? '',
      eyeColor: json['eyeColor'] ?? '',
    );
  }

  bool get hasAnyData =>
      sex.isNotEmpty ||
      race.isNotEmpty ||
      height.isNotEmpty ||
      weight.isNotEmpty ||
      hairColor.isNotEmpty ||
      eyeColor.isNotEmpty;
}
