/// Sports data models matching the website's sports-data.json format
class SportsData {
  final String generated;
  final Map<String, Team> teams;
  final List<TodaysGame> todaysGames;

  SportsData({
    required this.generated,
    required this.teams,
    required this.todaysGames,
  });

  factory SportsData.fromJson(Map<String, dynamic> json) {
    final teamsMap = <String, Team>{};
    final teamsJson = json['teams'] as Map<String, dynamic>? ?? {};
    for (final entry in teamsJson.entries) {
      teamsMap[entry.key] = Team.fromJson(entry.value as Map<String, dynamic>);
    }

    final gamesJson = json['todaysGames'] as List? ?? [];
    final games = gamesJson
        .map((g) => TodaysGame.fromJson(g as Map<String, dynamic>))
        .toList();

    return SportsData(
      generated: json['generated'] as String? ?? '',
      teams: teamsMap,
      todaysGames: games,
    );
  }
}

class Team {
  final String name;
  final String sport;
  final String themeId;
  final int season;
  final TeamRecord record;
  final Map<String, dynamic> standings;
  final String? streak;
  final GameInfo? nextGame;
  final GameInfo? lastGame;
  final List<String> recentResults;
  final bool isPlayoffs;
  final String? excitement;

  Team({
    required this.name,
    required this.sport,
    required this.themeId,
    required this.season,
    required this.record,
    required this.standings,
    this.streak,
    this.nextGame,
    this.lastGame,
    required this.recentResults,
    required this.isPlayoffs,
    this.excitement,
  });

  factory Team.fromJson(Map<String, dynamic> json) {
    final recordJson = json['record'] as Map<String, dynamic>? ?? {};
    final standingsJson = json['standings'] as Map<String, dynamic>? ?? {};

    return Team(
      name: json['name'] as String? ?? '',
      sport: json['sport'] as String? ?? '',
      themeId: json['themeId'] as String? ?? '',
      season: json['season'] as int? ?? 0,
      record: TeamRecord(
        wins: recordJson['wins'] as int? ?? 0,
        losses: recordJson['losses'] as int? ?? 0,
      ),
      standings: standingsJson,
      streak: json['streak'] as String?,
      nextGame: json['nextGame'] != null
          ? GameInfo.fromJson(json['nextGame'] as Map<String, dynamic>)
          : null,
      lastGame: json['lastGame'] != null
          ? GameInfo.fromJson(json['lastGame'] as Map<String, dynamic>)
          : null,
      recentResults: (json['recentResults'] as List?)
              ?.map((r) => r as String)
              .toList() ??
          [],
      isPlayoffs: json['isPlayoffs'] as bool? ?? false,
      excitement: json['excitement'] as String?,
    );
  }

  String get standingSummary {
    if (standings.containsKey('summary')) {
      return standings['summary'] as String? ?? '';
    }
    final rank = standings['divisionRank'];
    if (rank != null) return 'Division Rank: $rank';
    return '';
  }

  String get seedOrRank {
    if (standings.containsKey('seed')) {
      final seed = standings['seed'];
      return seed != null ? '#$seed Seed' : '';
    }
    final rank = standings['divisionRank'];
    return rank != null ? '#$rank in Division' : '';
  }
}

class TeamRecord {
  final int wins;
  final int losses;

  TeamRecord({required this.wins, required this.losses});
}

class GameInfo {
  final String date;
  final String opponent;
  final bool home;
  final String? time;
  final String? result;

  GameInfo({
    required this.date,
    required this.opponent,
    required this.home,
    this.time,
    this.result,
  });

  factory GameInfo.fromJson(Map<String, dynamic> json) {
    return GameInfo(
      date: json['date'] as String? ?? '',
      opponent: json['opponent'] as String? ?? '',
      home: json['home'] as bool? ?? true,
      time: json['time'] as String?,
      result: json['result'] as String?,
    );
  }
}

class TodaysGame {
  final String team;
  final String opponent;
  final String time;
  final String status;
  final Map<String, dynamic>? score;
  final bool home;

  TodaysGame({
    required this.team,
    required this.opponent,
    required this.time,
    required this.status,
    this.score,
    required this.home,
  });

  factory TodaysGame.fromJson(Map<String, dynamic> json) {
    return TodaysGame(
      team: json['team'] as String? ?? '',
      opponent: json['opponent'] as String? ?? '',
      time: json['time'] as String? ?? '',
      status: json['status'] as String? ?? 'scheduled',
      score: json['score'] as Map<String, dynamic>?,
      home: json['home'] as bool? ?? true,
    );
  }
}
