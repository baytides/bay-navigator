// Data models for Bay Navigator carbon/sustainability stats

class CarbonStats {
  final String generated;
  final String period;
  final DataFreshness dataFreshness;
  final CarbonSummary summary;
  final UsageStats usage;
  final Map<String, EmissionSource> emissionsBySource;
  final CarbonComparison comparison;
  final List<String> notes;

  CarbonStats({
    required this.generated,
    required this.period,
    required this.dataFreshness,
    required this.summary,
    required this.usage,
    required this.emissionsBySource,
    required this.comparison,
    required this.notes,
  });

  factory CarbonStats.fromJson(Map<String, dynamic> json) {
    final emissionsMap = <String, EmissionSource>{};
    final emissionsJson = json['emissionsBySource'] as Map<String, dynamic>? ?? {};
    emissionsJson.forEach((key, value) {
      emissionsMap[key] = EmissionSource.fromJson(value);
    });

    return CarbonStats(
      generated: json['generated'] ?? '',
      period: json['period'] ?? '',
      dataFreshness: DataFreshness.fromJson(json['dataFreshness'] ?? {}),
      summary: CarbonSummary.fromJson(json['summary'] ?? {}),
      usage: UsageStats.fromJson(json['usage'] ?? {}),
      emissionsBySource: emissionsMap,
      comparison: CarbonComparison.fromJson(json['comparison'] ?? {}),
      notes: List<String>.from(json['notes'] ?? []),
    );
  }
}

class DataFreshness {
  final String cloudflare;
  final String github;
  final String azure;
  final String ollama;

  DataFreshness({
    required this.cloudflare,
    required this.github,
    required this.azure,
    required this.ollama,
  });

  factory DataFreshness.fromJson(Map<String, dynamic> json) {
    return DataFreshness(
      cloudflare: json['cloudflare'] ?? 'unavailable',
      github: json['github'] ?? 'unavailable',
      azure: json['azure'] ?? 'unavailable',
      ollama: json['ollama'] ?? 'unavailable',
    );
  }
}

class CarbonSummary {
  final String totalGrossEmissionsKg;
  final int renewableEnergyPercent;
  final String netEmissionsKg;
  final String greenRating;
  final bool carbonNeutral;

  CarbonSummary({
    required this.totalGrossEmissionsKg,
    required this.renewableEnergyPercent,
    required this.netEmissionsKg,
    required this.greenRating,
    required this.carbonNeutral,
  });

  factory CarbonSummary.fromJson(Map<String, dynamic> json) {
    return CarbonSummary(
      totalGrossEmissionsKg: json['totalGrossEmissionsKg'] ?? '0',
      renewableEnergyPercent: json['renewableEnergyPercent'] ?? 0,
      netEmissionsKg: json['netEmissionsKg'] ?? '0',
      greenRating: json['greenRating'] ?? '',
      carbonNeutral: json['carbonNeutral'] ?? false,
    );
  }
}

class UsageStats {
  final int? cdnRequests;
  final int? cdnBytesTransferred;
  final String? cdnCacheHitRate;
  final int? aiQueries;
  final int? aiChatQueries;
  final int? functionExecutions;
  final int? ciRuns;
  final int? ciMinutes;

  UsageStats({
    this.cdnRequests,
    this.cdnBytesTransferred,
    this.cdnCacheHitRate,
    this.aiQueries,
    this.aiChatQueries,
    this.functionExecutions,
    this.ciRuns,
    this.ciMinutes,
  });

  factory UsageStats.fromJson(Map<String, dynamic> json) {
    return UsageStats(
      cdnRequests: json['cdnRequests'] as int?,
      cdnBytesTransferred: json['cdnBytesTransferred'] as int?,
      cdnCacheHitRate: json['cdnCacheHitRate'] as String?,
      aiQueries: json['aiQueries'] as int?,
      aiChatQueries: json['aiChatQueries'] as int?,
      functionExecutions: json['functionExecutions'] as int?,
      ciRuns: json['ciRuns'] as int?,
      ciMinutes: json['ciMinutes'] as int?,
    );
  }
}

class EmissionSource {
  final String grams;
  final String percent;
  final String? note;

  EmissionSource({
    required this.grams,
    required this.percent,
    this.note,
  });

  factory EmissionSource.fromJson(Map<String, dynamic> json) {
    return EmissionSource(
      grams: json['grams'] ?? '0',
      percent: json['percent'] ?? '0',
      note: json['note'] as String?,
    );
  }
}

class CarbonComparison {
  final String equivalentMilesDriven;
  final int equivalentPaperPages;

  CarbonComparison({
    required this.equivalentMilesDriven,
    required this.equivalentPaperPages,
  });

  factory CarbonComparison.fromJson(Map<String, dynamic> json) {
    return CarbonComparison(
      equivalentMilesDriven: json['equivalentMilesDriven'] ?? '0',
      equivalentPaperPages: json['equivalentPaperPages'] ?? 0,
    );
  }
}
