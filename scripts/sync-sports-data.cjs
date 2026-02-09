#!/usr/bin/env node
/**
 * Sync Bay Area Sports Data
 * Fetches standings, schedules, and scores for Giants, Warriors, and 49ers.
 * Output: public/data/sports-data.json
 *
 * APIs used:
 * - MLB: statsapi.mlb.com (official, free, no auth)
 * - NBA: site.api.espn.com + cdn.nba.com (free, no auth)
 * - NFL: site.api.espn.com (free, no auth)
 *
 * Usage: node scripts/sync-sports-data.cjs [--verbose]
 */

const fs = require('fs');
const path = require('path');

const VERBOSE = process.argv.includes('--verbose');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'sports-data.json');

function log(...args) {
  if (VERBOSE) console.log('[sports-sync]', ...args);
}

function warn(...args) {
  console.warn('[sports-sync]', ...args);
}

// Team configurations
const TEAMS = {
  giants: {
    name: 'San Francisco Giants',
    sport: 'MLB',
    themeId: 'giants',
    mlbId: 137,
    espnId: 26,
    leagueId: 104, // National League
  },
  warriors: {
    name: 'Golden State Warriors',
    sport: 'NBA',
    themeId: 'warriors',
    espnId: 9,
    nbaId: 1610612744,
  },
  '49ers': {
    name: 'San Francisco 49ers',
    sport: 'NFL',
    themeId: '49ers',
    espnId: 25,
  },
};

async function fetchJSON(url, label) {
  log(`Fetching ${label}: ${url}`);
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'BayNavigator/1.0 (sports-sync)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) {
      warn(`${label}: HTTP ${resp.status}`);
      return null;
    }
    return await resp.json();
  } catch (e) {
    warn(`${label}: ${e.message}`);
    return null;
  }
}

// ─── MLB (Giants) ────────────────────────────────────────────────────────────

async function fetchGiants() {
  const season = new Date().getFullYear();
  const team = TEAMS.giants;

  // Fetch standings, schedule, and team info in parallel
  const [standings, schedule] = await Promise.all([
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/standings?leagueId=${team.leagueId}&season=${season}&standingsTypes=regularSeason`,
      'MLB standings'
    ),
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/schedule?teamId=${team.mlbId}&season=${season}&sportId=1`,
      'MLB schedule'
    ),
  ]);

  const result = {
    name: team.name,
    sport: 'MLB',
    themeId: team.themeId,
    season,
    record: null,
    standings: null,
    streak: null,
    nextGame: null,
    lastGame: null,
    recentResults: [],
    isPlayoffs: false,
    excitement: null,
  };

  // Parse standings
  if (standings?.records) {
    for (const division of standings.records) {
      for (const tr of division.teamRecords || []) {
        if (tr.team?.id === team.mlbId) {
          result.record = { wins: tr.wins, losses: tr.losses };
          result.standings = {
            divisionRank: parseInt(tr.divisionRank) || null,
            gamesBack: tr.gamesBack || '-',
            wildCardRank: parseInt(tr.wildCardRank) || null,
            winningPercentage: tr.winningPercentage || null,
          };
          result.streak = tr.streak?.streakCode || null;
          result.isPlayoffs = !!(tr.clinchIndicator || tr.clinched);
          break;
        }
      }
    }
  }

  // Parse schedule for next/last game and recent results
  if (schedule?.dates) {
    const now = new Date();
    const allGames = [];

    for (const date of schedule.dates) {
      for (const game of date.games || []) {
        allGames.push(game);
      }
    }

    // Find completed games (sorted by date desc)
    const completed = allGames
      .filter((g) => g.status?.abstractGameState === 'Final')
      .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));

    if (completed.length > 0) {
      const last = completed[0];
      const isHome = last.teams?.home?.team?.id === team.mlbId;
      const teamData = isHome ? last.teams.home : last.teams.away;
      const opponentData = isHome ? last.teams.away : last.teams.home;
      const won = teamData.isWinner;

      result.lastGame = {
        date: last.officialDate || last.gameDate?.split('T')[0],
        opponent: opponentData.team?.name || 'Unknown',
        result: `${won ? 'W' : 'L'} ${teamData.score}-${opponentData.score}`,
        home: isHome,
      };

      // Recent results (last 10)
      result.recentResults = completed.slice(0, 10).map((g) => {
        const h = g.teams?.home?.team?.id === team.mlbId;
        return (h ? g.teams.home : g.teams.away).isWinner ? 'W' : 'L';
      });
    }

    // Find next scheduled game
    const upcoming = allGames
      .filter((g) => g.status?.abstractGameState !== 'Final' && new Date(g.gameDate) > now)
      .sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));

    if (upcoming.length > 0) {
      const next = upcoming[0];
      const isHome = next.teams?.home?.team?.id === team.mlbId;
      const opponentData = isHome ? next.teams.away : next.teams.home;

      result.nextGame = {
        date: next.officialDate || next.gameDate?.split('T')[0],
        opponent: opponentData.team?.name || 'Unknown',
        home: isHome,
        time: new Date(next.gameDate).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/Los_Angeles',
        }),
      };
    }
  }

  // Detect excitement
  result.excitement = detectExcitement(result);
  log(
    `Giants: ${result.record?.wins}-${result.record?.losses}, streak=${result.streak}, excitement=${result.excitement}`
  );
  return result;
}

// ─── ESPN Generic (Warriors & 49ers) ─────────────────────────────────────────

async function fetchESPNTeam(teamKey, sport, league) {
  const team = TEAMS[teamKey];

  const [teamInfo, schedule] = await Promise.all([
    fetchJSON(
      `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${team.espnId}`,
      `ESPN ${teamKey} team`
    ),
    fetchJSON(
      `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${team.espnId}/schedule`,
      `ESPN ${teamKey} schedule`
    ),
  ]);

  const result = {
    name: team.name,
    sport: team.sport,
    themeId: team.themeId,
    season: new Date().getFullYear(),
    record: null,
    standings: null,
    streak: null,
    nextGame: null,
    lastGame: null,
    recentResults: [],
    isPlayoffs: false,
    excitement: null,
  };

  // Parse team info for record
  if (teamInfo?.team) {
    const t = teamInfo.team;
    const recordItem = t.record?.items?.[0];
    if (recordItem) {
      const summary = recordItem.summary || '';
      const parts = summary.split('-').map(Number);
      if (parts.length >= 2) {
        result.record = { wins: parts[0], losses: parts[1] };
      }
      // Extract streak from stats
      for (const stat of recordItem.stats || []) {
        if (stat.name === 'streak') {
          result.streak = stat.displayValue || null;
        }
        if (stat.name === 'playoffSeed') {
          result.standings = result.standings || {};
          result.standings.seed = parseInt(stat.value) || null;
        }
        if (stat.name === 'divisionWinPercent' || stat.name === 'winPercent') {
          result.standings = result.standings || {};
          result.standings.winPct = stat.displayValue || null;
        }
      }
    }
    // Check if in playoffs
    const standingsSummary = t.standingSummary || '';
    result.isPlayoffs = /playoff|clinch/i.test(standingsSummary);

    // Conference/division standing
    if (standingsSummary) {
      result.standings = result.standings || {};
      result.standings.summary = standingsSummary;
    }
  }

  // Parse schedule
  if (schedule?.events) {
    const now = new Date();
    const events = schedule.events;

    // Find completed games (most recent first)
    const completed = events
      .filter((e) => {
        const status = e.competitions?.[0]?.status?.type?.name;
        return status === 'STATUS_FINAL';
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (completed.length > 0) {
      const last = completed[0];
      const comp = last.competitions[0];
      const ourTeam = comp.competitors?.find((c) => parseInt(c.team?.id) === team.espnId);
      const opponent = comp.competitors?.find((c) => parseInt(c.team?.id) !== team.espnId);
      const won = ourTeam?.winner;
      const ourScore = ourTeam?.score?.displayValue || ourTeam?.score?.value || ourTeam?.score;
      const oppScore = opponent?.score?.displayValue || opponent?.score?.value || opponent?.score;

      result.lastGame = {
        date: last.date?.split('T')[0],
        opponent: opponent?.team?.displayName || 'Unknown',
        result: `${won ? 'W' : 'L'} ${ourScore}-${oppScore}`,
        home: ourTeam?.homeAway === 'home',
      };

      // Recent results (last 10)
      result.recentResults = completed.slice(0, 10).map((e) => {
        const c = e.competitions[0];
        const us = c.competitors?.find((x) => parseInt(x.team?.id) === team.espnId);
        return us?.winner ? 'W' : 'L';
      });
    }

    // Find next scheduled game
    const upcoming = events
      .filter((e) => {
        const status = e.competitions?.[0]?.status?.type?.name;
        return status === 'STATUS_SCHEDULED' && new Date(e.date) > now;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcoming.length > 0) {
      const next = upcoming[0];
      const comp = next.competitions[0];
      const ourTeam = comp.competitors?.find((c) => parseInt(c.team?.id) === team.espnId);
      const opponent = comp.competitors?.find((c) => parseInt(c.team?.id) !== team.espnId);

      result.nextGame = {
        date: next.date?.split('T')[0],
        opponent: opponent?.team?.displayName || 'Unknown',
        home: ourTeam?.homeAway === 'home',
        time: new Date(next.date).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/Los_Angeles',
        }),
      };
    }
  }

  result.excitement = detectExcitement(result);
  log(
    `${teamKey}: ${result.record?.wins}-${result.record?.losses}, streak=${result.streak}, excitement=${result.excitement}`
  );
  return result;
}

// ─── Today's Games ───────────────────────────────────────────────────────────

async function fetchTodaysGames() {
  const games = [];
  const today = new Date().toISOString().split('T')[0];

  // Check NBA scoreboard
  const nbaScoreboard = await fetchJSON(
    'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json',
    'NBA scoreboard'
  );

  if (nbaScoreboard?.scoreboard?.games) {
    for (const game of nbaScoreboard.scoreboard.games) {
      const isWarriors =
        game.homeTeam?.teamId === TEAMS.warriors.nbaId ||
        game.awayTeam?.teamId === TEAMS.warriors.nbaId;
      if (isWarriors) {
        const isHome = game.homeTeam?.teamId === TEAMS.warriors.nbaId;
        const opponent = isHome ? game.awayTeam : game.homeTeam;
        games.push({
          team: 'warriors',
          opponent: `${opponent.teamCity} ${opponent.teamName}`,
          time: game.gameTimeUTC
            ? new Date(game.gameTimeUTC).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: 'America/Los_Angeles',
              })
            : null,
          status: game.gameStatus === 1 ? 'scheduled' : game.gameStatus === 2 ? 'live' : 'final',
          score:
            game.gameStatus >= 2
              ? {
                  team: isHome ? game.homeTeam.score : game.awayTeam.score,
                  opponent: isHome ? game.awayTeam.score : game.homeTeam.score,
                }
              : null,
          home: isHome,
        });
      }
    }
  }

  // Check MLB schedule for today
  const mlbSchedule = await fetchJSON(
    `https://statsapi.mlb.com/api/v1/schedule?teamId=${TEAMS.giants.mlbId}&date=${today}&sportId=1`,
    'MLB today'
  );

  if (mlbSchedule?.dates?.[0]?.games) {
    for (const game of mlbSchedule.dates[0].games) {
      const isHome = game.teams?.home?.team?.id === TEAMS.giants.mlbId;
      const opponentData = isHome ? game.teams.away : game.teams.home;
      const state = game.status?.abstractGameState;
      games.push({
        team: 'giants',
        opponent: opponentData.team?.name || 'Unknown',
        time: new Date(game.gameDate).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/Los_Angeles',
        }),
        status: state === 'Final' ? 'final' : state === 'Live' ? 'live' : 'scheduled',
        score:
          state === 'Final' || state === 'Live'
            ? {
                team: isHome ? game.teams.home.score : game.teams.away.score,
                opponent: isHome ? game.teams.away.score : game.teams.home.score,
              }
            : null,
        home: isHome,
      });
    }
  }

  // ESPN NFL scoreboard (check if NFL is in season)
  const nflScoreboard = await fetchJSON(
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    'NFL scoreboard'
  );

  if (nflScoreboard?.events) {
    for (const event of nflScoreboard.events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;
      const is49ers = comp.competitors?.some((c) => parseInt(c.team?.id) === TEAMS['49ers'].espnId);
      if (is49ers) {
        const ourTeam = comp.competitors.find(
          (c) => parseInt(c.team?.id) === TEAMS['49ers'].espnId
        );
        const opponent = comp.competitors.find(
          (c) => parseInt(c.team?.id) !== TEAMS['49ers'].espnId
        );
        const statusType = comp.status?.type?.name;
        games.push({
          team: '49ers',
          opponent: opponent?.team?.displayName || 'Unknown',
          time: new Date(event.date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'America/Los_Angeles',
          }),
          status:
            statusType === 'STATUS_FINAL'
              ? 'final'
              : statusType === 'STATUS_IN_PROGRESS'
                ? 'live'
                : 'scheduled',
          score:
            statusType !== 'STATUS_SCHEDULED'
              ? {
                  team: ourTeam?.score,
                  opponent: opponent?.score,
                }
              : null,
          home: ourTeam?.homeAway === 'home',
        });
      }
    }
  }

  return games;
}

// ─── Excitement Detection ────────────────────────────────────────────────────

function detectExcitement(teamData) {
  if (!teamData.record) return null;

  // Check for playoffs
  if (teamData.isPlayoffs) return 'playoffs';

  // Check winning streak (from streak string like "W5" or "5W")
  const streakMatch = teamData.streak?.match(/W(\d+)|(\d+)W/i);
  const streakCount = streakMatch ? parseInt(streakMatch[1] || streakMatch[2]) : 0;
  if (streakCount >= 5) return 'streak';

  // Check if hot (7+ wins in last 10)
  const last10 = teamData.recentResults.slice(0, 10);
  const wins = last10.filter((r) => r === 'W').length;
  if (last10.length >= 5 && wins >= 7) return 'hot';

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[sports-sync] Starting Bay Area sports data sync...');

  let errors = 0;
  const results = {};

  // Fetch all teams in parallel
  const [giants, warriors, niners] = await Promise.all([
    fetchGiants().catch((e) => {
      warn('Giants fetch failed:', e.message);
      errors++;
      return null;
    }),
    fetchESPNTeam('warriors', 'basketball', 'nba').catch((e) => {
      warn('Warriors fetch failed:', e.message);
      errors++;
      return null;
    }),
    fetchESPNTeam('49ers', 'football', 'nfl').catch((e) => {
      warn('49ers fetch failed:', e.message);
      errors++;
      return null;
    }),
  ]);

  if (giants) results.giants = giants;
  if (warriors) results.warriors = warriors;
  if (niners) results['49ers'] = niners;

  // Fetch today's games
  const todaysGames = await fetchTodaysGames().catch((e) => {
    warn("Today's games fetch failed:", e.message);
    return [];
  });

  const output = {
    generated: new Date().toISOString(),
    teams: results,
    todaysGames,
  };

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`[sports-sync] Wrote ${OUTPUT_PATH}`);

  const teamCount = Object.keys(results).length;
  console.log(
    `[sports-sync] Done: ${teamCount}/3 teams, ${todaysGames.length} games today, ${errors} errors`
  );

  // Only fail if all teams failed
  if (teamCount === 0) {
    console.error('[sports-sync] All team fetches failed!');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('[sports-sync] Fatal error:', e);
  process.exit(1);
});
