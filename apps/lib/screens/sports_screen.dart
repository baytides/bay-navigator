import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../models/sports.dart';

/// Sports screen showing Bay Area pro team scores, standings, and schedules
class SportsScreen extends StatefulWidget {
  const SportsScreen({super.key});

  @override
  State<SportsScreen> createState() => _SportsScreenState();
}

class _SportsScreenState extends State<SportsScreen> {
  static const String _dataUrl =
      'https://baynavigator.org/data/sports-data.json';

  SportsData? _data;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await http
          .get(Uri.parse(_dataUrl))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode != 200) {
        throw Exception('Failed to load sports data');
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;
      setState(() {
        _data = SportsData.fromJson(json);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Unable to load sports data. Pull down to retry.';
        _isLoading = false;
      });
    }
  }

  // Team display order and colors
  static const _teamOrder = ['warriors', 'giants', '49ers'];

  static const _teamColors = {
    'warriors': (primary: Color(0xFF1D428A), accent: Color(0xFFFFC72C)),
    'giants': (primary: Color(0xFFEA5B1F), accent: Color(0xFFFFFFFF)),
    '49ers': (primary: Color(0xFFAA0000), accent: Color(0xFFFFD700)),
  };

  static const _sportBadgeColors = {
    'NBA': Color(0xFF1D428A),
    'MLB': Color(0xFFEA5B1F),
    'NFL': Color(0xFFAA0000),
  };

  Widget _buildTodaysGamesBanner() {
    if (_data == null || _data!.todaysGames.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: Colors.green,
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                "Today's Games",
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.green.shade800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...(_data!.todaysGames.map((game) {
            final teamName = _teamOrder.contains(game.team)
                ? _data!.teams[game.team]?.name ?? game.team
                : game.team;
            final homeAway = game.home ? 'vs' : '@';
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Text(
                '$teamName $homeAway ${game.opponent} — ${game.time}',
                style: TextStyle(color: Colors.green.shade700),
              ),
            );
          })),
        ],
      ),
    );
  }

  Widget _buildTeamCard(String teamId, Team team) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final colors = _teamColors[teamId] ??
        (primary: theme.colorScheme.primary, accent: Colors.white);
    final badgeColor = _sportBadgeColors[team.sport] ?? colors.primary;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Team header with sport badge
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    team.name,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    team.sport,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                if (team.isPlayoffs) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'PLAYOFFS',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Stats grid
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                // Record
                _buildStatBox(
                  'Record',
                  '${team.record.wins}-${team.record.losses}',
                  colors.primary,
                  isDark,
                ),
                const SizedBox(width: 8),
                // Standings
                _buildStatBox(
                  'Standings',
                  team.seedOrRank,
                  colors.primary,
                  isDark,
                ),
                const SizedBox(width: 8),
                // Streak
                _buildStatBox(
                  'Streak',
                  team.streak ?? '—',
                  colors.primary,
                  isDark,
                ),
                const SizedBox(width: 8),
                // Last 10
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Last 10',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurface
                              .withValues(alpha: 0.6),
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: team.recentResults.take(10).map((r) {
                          return Container(
                            width: 10,
                            height: 10,
                            margin: const EdgeInsets.only(right: 2),
                            decoration: BoxDecoration(
                              color:
                                  r == 'W' ? Colors.green : Colors.red.shade400,
                              borderRadius: BorderRadius.circular(5),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Next game / Last game
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              children: [
                // Next game
                Expanded(
                  child: _buildGameInfo(
                    'Next Game',
                    Icons.calendar_today,
                    team.nextGame,
                    colors.primary,
                    isDark,
                  ),
                ),
                const SizedBox(width: 8),
                // Last game
                Expanded(
                  child: _buildGameInfo(
                    'Last Game',
                    Icons.access_time,
                    team.lastGame,
                    colors.primary,
                    isDark,
                    isResult: true,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatBox(
      String label, String value, Color accent, bool isDark) {
    final theme = Theme.of(context);
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: accent.withValues(alpha: isDark ? 0.15 : 0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                fontSize: 11,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value.isEmpty ? '—' : value,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: accent,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGameInfo(
    String title,
    IconData icon,
    GameInfo? game,
    Color accent,
    bool isDark, {
    bool isResult = false,
  }) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: accent),
              const SizedBox(width: 4),
              Text(
                title,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (game != null) ...[
            Text(
              game.date,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 2),
            if (isResult && game.result != null)
              Text(
                game.result!,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: game.result!.startsWith('W')
                      ? Colors.green
                      : Colors.red.shade400,
                ),
              )
            else if (game.time != null)
              Text(
                game.time!,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            const SizedBox(height: 2),
            Text(
              '${game.home ? 'vs' : '@'} ${game.opponent}',
              style: theme.textTheme.bodySmall,
              overflow: TextOverflow.ellipsis,
            ),
          ] else
            Text(
              'No scheduled games',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                fontStyle: FontStyle.italic,
              ),
            ),
        ],
      ),
    );
  }

  String _formatDate(String isoDate) {
    try {
      final dt = DateTime.parse(isoDate);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year} at ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sports'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
            tooltip: 'Refresh sports data',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Header
            Text(
              'Bay Area Sports',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Live scores, standings, and schedules for ${_data?.teams.length ?? 3} Bay Area pro teams. Data updates every 3 hours.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 16),

            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(48),
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
            else if (_data != null) ...[
              // Today's games banner
              _buildTodaysGamesBanner(),

              // Team cards in order: Warriors, Giants, 49ers
              ..._teamOrder
                  .where((id) => _data!.teams.containsKey(id))
                  .map((id) => _buildTeamCard(id, _data!.teams[id]!)),

              // Attribution
              const SizedBox(height: 8),
              Text(
                'Last updated: ${_formatDate(_data!.generated)}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Data from ESPN and MLB Stats API. Updated every 3 hours.',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                ),
              ),
            ],

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
