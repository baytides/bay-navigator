#!/usr/bin/env node
/**
 * Sync Bay Area Sports Data
 * Fetches standings, schedules, and scores for Giants, Warriors, and 49ers.
 * Output: public/data/sports-data.json
 *
 * APIs used:
 * - MLB: statsapi.mlb.com (official, free, no auth)
 * - NBA/NFL/NHL: site.api.espn.com + sports.core.api.espn.com (free, no auth)
 * - NBA live: cdn.nba.com (free, no auth)
 * - NHL stats: api-web.nhle.com (official, free, no auth)
 *
 * Usage: node scripts/sync-sports-data.cjs [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { uploadToBlob } = require('./lib/azure-blob-upload.cjs');

const VERBOSE = process.argv.includes('--verbose');
const LOCAL_FALLBACK = process.argv.includes('--local');
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
  sharks: {
    name: 'San Jose Sharks',
    sport: 'NHL',
    themeId: 'sharks',
    espnId: 18,
    nhlAbbrev: 'SJS',
  },
};

function toPacificTime(isoDate) {
  try {
    return new Date(isoDate).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  } catch {
    return null;
  }
}

function pickBestLink(links = []) {
  if (!Array.isArray(links) || links.length === 0) return null;
  const prioritized = links.find((l) =>
    /(watch|stream|gamecast|gamecenter|summary|matchup)/i.test(
      `${l?.rel || ''} ${l?.text || ''} ${l?.shortText || ''}`
    )
  );
  return prioritized?.href || links[0]?.href || null;
}

function getESPNWatchInfo(event, competition) {
  const eventLinks = event?.links || [];
  const compLinks = competition?.links || [];
  const links = [...eventLinks, ...compLinks];
  const gameUrl = pickBestLink(links);
  const watchLink = links.find((l) =>
    /(watch|stream|espn\+|live)/i.test(`${l?.rel || ''} ${l?.text || ''} ${l?.shortText || ''}`)
  );
  const watchUrl = watchLink?.href || null;

  const broadcast =
    competition?.broadcasts?.[0]?.names?.[0] ||
    competition?.geoBroadcasts?.[0]?.media?.shortName ||
    null;

  return {
    gameUrl,
    watchUrl,
    network: broadcast,
  };
}

function normalizeESPNInjuries(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map((i) => ({
      player: i?.athlete?.displayName || i?.fullName || 'Unknown',
      status: i?.status || i?.type?.description || i?.designation || 'Injury',
      detail: i?.shortComment || i?.details || i?.description || null,
      date: i?.date || null,
    }))
    .slice(0, 30);
}

function normalizeESPNLeaders(leaders = []) {
  if (!Array.isArray(leaders)) return [];
  const out = [];
  for (const block of leaders) {
    const category = block?.name || block?.displayName || block?.abbreviation || 'Leader';
    const athletes = Array.isArray(block?.leaders) ? block.leaders : [];
    for (const item of athletes.slice(0, 2)) {
      out.push({
        category,
        player: item?.athlete?.displayName || item?.displayName || 'Unknown',
        value: item?.displayValue || item?.value || null,
      });
    }
  }
  return out.slice(0, 12);
}

/**
 * Fetch per-team player leaders from ESPN's core API.
 * Returns categories with athlete IDs resolved to names via the roster.
 *
 * @param {string} sport - e.g. 'basketball', 'football', 'hockey'
 * @param {string} league - e.g. 'nba', 'nfl', 'nhl'
 * @param {number} espnId - ESPN team ID
 * @param {Array} roster - already-fetched roster with { id, name } objects
 * @returns {Promise<Array>} normalized player leaders
 */
async function fetchCoreAPILeaders(sport, league, espnId, roster = []) {
  // NFL uses season year of the start (e.g. 2025-26 season = 2025)
  // NBA/NHL use the end year (e.g. 2025-26 = 2026)
  const now = new Date();
  const year =
    league === 'nfl' ? now.getFullYear() - (now.getMonth() < 3 ? 1 : 0) : now.getFullYear();
  const seasonType = 2; // regular season

  const url = `https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${league}/seasons/${year}/types/${seasonType}/teams/${espnId}/leaders?limit=20`;
  const data = await fetchJSON(url, `ESPN core ${league} team leaders`);
  if (!data?.categories || !Array.isArray(data.categories)) return [];

  // Build lookup from roster: athlete ID → name
  const idToName = {};
  for (const p of roster) {
    if (p.id) idToName[String(p.id)] = p.name;
  }

  const out = [];
  // Pick most interesting categories per sport
  const priorityCategories = {
    nba: [
      'pointsPerGame',
      'assistsPerGame',
      'reboundsPerGame',
      'stealsPerGame',
      'blocksPerGame',
      'fieldGoalPct',
    ],
    nfl: [
      'passingLeader',
      'rushingLeader',
      'receivingLeader',
      'passingYards',
      'rushingYards',
      'receivingYards',
    ],
    nhl: ['goals', 'assists', 'points', 'plusMinus', 'penaltyMinutes', 'powerPlayGoals'],
  };
  const preferred = priorityCategories[league] || [];

  // Sort: preferred categories first
  const sorted = [...data.categories].sort((a, b) => {
    const ai = preferred.indexOf(a.name);
    const bi = preferred.indexOf(b.name);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return 0;
  });

  for (const cat of sorted) {
    const category = cat.displayName || cat.shortDisplayName || cat.name || 'Leader';
    const leaders = cat.leaders || [];
    for (const l of leaders.slice(0, 1)) {
      // Resolve athlete ID from $ref URL
      const ref = l?.athlete?.['$ref'] || '';
      const match = ref.match(/athletes\/(\d+)/);
      const athleteId = match ? match[1] : null;
      const playerName = athleteId ? idToName[athleteId] || null : null;

      // If we can't resolve the name from roster, fetch the athlete
      let resolvedName = playerName;
      if (!resolvedName && athleteId) {
        const athleteData = await fetchJSON(
          `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/athletes/${athleteId}`,
          `ESPN athlete ${athleteId}`
        );
        resolvedName = athleteData?.athlete?.displayName || athleteData?.displayName || null;
      }

      if (resolvedName) {
        out.push({
          category,
          player: resolvedName,
          value: l.displayValue || String(l.value) || null,
        });
      }
    }
    if (out.length >= 8) break;
  }

  return out;
}

function getMLBNetwork(game, isHome) {
  const broadcasts = Array.isArray(game?.broadcasts) ? game.broadcasts : [];
  if (broadcasts.length === 0) return null;

  const tvBroadcasts = broadcasts.filter((b) => (b?.type || '').toUpperCase() === 'TV');
  const pool = tvBroadcasts.length > 0 ? tvBroadcasts : broadcasts;
  const preferred = pool.find((b) => b?.homeAway === (isHome ? 'home' : 'away')) || pool[0];
  return preferred?.name || preferred?.callSign || null;
}

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
  const [standings, schedule, roster, transactions, leaders] = await Promise.all([
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/standings?leagueId=${team.leagueId}&season=${season}&standingsTypes=regularSeason`,
      'MLB standings'
    ),
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/schedule?teamId=${team.mlbId}&season=${season}&sportId=1&hydrate=broadcasts`,
      'MLB schedule'
    ),
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/teams/${team.mlbId}/roster?rosterType=active`,
      'MLB roster'
    ),
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/transactions?teamId=${team.mlbId}&startDate=${season}-01-01&endDate=${season}-12-31`,
      'MLB transactions'
    ),
    fetchJSON(
      `https://statsapi.mlb.com/api/v1/teams/${team.mlbId}/leaders?leaderCategories=homeRuns,runsBattedIn,battingAverage,wins,era,strikeouts`,
      'MLB leaders'
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
    roster: [],
    injuries: [],
    transactions: [],
    playerLeaders: [],
    springTraining: {
      record: null,
      nextGame: null,
      lastGame: null,
      recentResults: [],
    },
    isPlayoffs: false,
    excitement: null,
  };

  if (roster?.roster && Array.isArray(roster.roster)) {
    result.roster = roster.roster.map((p) => ({
      id: p?.person?.id || null,
      name: p?.person?.fullName || p?.person?.fullFMLName || 'Unknown',
      jersey: p?.jerseyNumber || null,
      position: p?.position?.abbreviation || p?.position?.name || null,
      status: p?.status?.description || null,
    }));
  }

  if (transactions?.transactions && Array.isArray(transactions.transactions)) {
    result.transactions = transactions.transactions
      .map((t) => ({
        date: t?.date || null,
        type: t?.typeDesc || t?.typeCode || 'Transaction',
        detail: t?.description || null,
      }))
      .slice(0, 30);
  }

  const mlbLeadersList = leaders?.teamLeaders || leaders?.leagueLeaders || [];
  if (Array.isArray(mlbLeadersList) && mlbLeadersList.length > 0) {
    result.playerLeaders = [];
    for (const block of mlbLeadersList) {
      const category = block?.leaderCategory || 'Leader';
      const leadersList = Array.isArray(block?.leaders) ? block.leaders : [];
      for (const item of leadersList.slice(0, 2)) {
        result.playerLeaders.push({
          category,
          player: item?.person?.fullName || 'Unknown',
          value: item?.value ?? null,
        });
      }
    }
    result.playerLeaders = result.playerLeaders.slice(0, 12);
  }

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

    const isSpringGame = (g) => {
      const gameType = (g?.gameType || '').toUpperCase();
      const seriesDesc = (g?.seriesDescription || '').toLowerCase();
      return gameType === 'S' || seriesDesc.includes('spring');
    };
    const springGames = allGames.filter(isSpringGame);
    const regularGames = allGames.filter((g) => !isSpringGame(g));

    // Find completed games (sorted by date desc)
    const completed = regularGames
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
    const upcoming = regularGames
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
        time: toPacificTime(next.gameDate),
        gameUrl: next.gamePk ? `https://www.mlb.com/gameday/${next.gamePk}` : null,
        network: getMLBNetwork(next, isHome),
      };
    }

    // Spring training stats (separate from regular season)
    const springCompleted = springGames
      .filter((g) => g.status?.abstractGameState === 'Final')
      .sort((a, b) => new Date(b.gameDate) - new Date(a.gameDate));

    if (springCompleted.length > 0) {
      const springLast = springCompleted[0];
      const isHome = springLast.teams?.home?.team?.id === team.mlbId;
      const teamData = isHome ? springLast.teams.home : springLast.teams.away;
      const opponentData = isHome ? springLast.teams.away : springLast.teams.home;
      const won = teamData.isWinner;

      result.springTraining.lastGame = {
        date: springLast.officialDate || springLast.gameDate?.split('T')[0],
        opponent: opponentData.team?.name || 'Unknown',
        result: `${won ? 'W' : 'L'} ${teamData.score}-${opponentData.score}`,
        home: isHome,
      };

      result.springTraining.recentResults = springCompleted.slice(0, 10).map((g) => {
        const h = g.teams?.home?.team?.id === team.mlbId;
        return (h ? g.teams.home : g.teams.away).isWinner ? 'W' : 'L';
      });

      const springWins = result.springTraining.recentResults.filter((r) => r === 'W').length;
      const springLosses = result.springTraining.recentResults.filter((r) => r === 'L').length;
      result.springTraining.record = { wins: springWins, losses: springLosses };
    }

    const springUpcoming = springGames
      .filter((g) => g.status?.abstractGameState !== 'Final' && new Date(g.gameDate) > now)
      .sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));

    if (springUpcoming.length > 0) {
      const springNext = springUpcoming[0];
      const isHome = springNext.teams?.home?.team?.id === team.mlbId;
      const opponentData = isHome ? springNext.teams.away : springNext.teams.home;

      result.springTraining.nextGame = {
        date: springNext.officialDate || springNext.gameDate?.split('T')[0],
        opponent: opponentData.team?.name || 'Unknown',
        home: isHome,
        time: toPacificTime(springNext.gameDate),
        gameUrl: springNext.gamePk ? `https://www.mlb.com/gameday/${springNext.gamePk}` : null,
        network: getMLBNetwork(springNext, isHome),
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
  const base = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${team.espnId}`;

  const [teamInfo, schedule, rosterData, teamNews, teamStats] = await Promise.all([
    fetchJSON(base, `ESPN ${teamKey} team`),
    fetchJSON(`${base}/schedule`, `ESPN ${teamKey} schedule`),
    fetchJSON(`${base}/roster`, `ESPN ${teamKey} roster`),
    fetchJSON(`${base}/news`, `ESPN ${teamKey} news`),
    fetchJSON(`${base}/statistics`, `ESPN ${teamKey} stats`),
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
    roster: [],
    injuries: [],
    transactions: [],
    playerLeaders: [],
    isPlayoffs: false,
    excitement: null,
  };

  if (teamNews?.articles && Array.isArray(teamNews.articles)) {
    result.transactions = teamNews.articles
      .filter((a) =>
        /(trade|traded|waive|waived|sign|signed|release|released|acquire|acquired|claim|draft|option|DFA)/i.test(
          `${a?.headline || ''} ${a?.description || ''}`
        )
      )
      .map((a) => ({
        date: a?.published || null,
        type: 'News',
        detail: a?.headline || a?.description || null,
        url: a?.links?.web?.href || a?.links?.[0]?.href || null,
      }))
      .slice(0, 20);
  }

  // Parse roster — ESPN returns athletes in two formats:
  // 1) Grouped: athletes = [{ position, items: [...] }]
  // 2) Direct: athletes = [{ id, fullName, position, ... }]
  if (rosterData?.athletes && Array.isArray(rosterData.athletes)) {
    const players = [];
    const allInjuries = [];

    for (const entry of rosterData.athletes) {
      // Format 1: Grouped by position
      if (Array.isArray(entry?.items)) {
        for (const p of entry.items) {
          players.push({
            id: p?.id || null,
            name: p?.fullName || p?.displayName || 'Unknown',
            jersey: p?.jersey || null,
            position: p?.position?.abbreviation || p?.position?.name || entry?.position || null,
            status: p?.status?.type?.description || p?.status?.displayValue || null,
            age: Number.isFinite(Number(p?.age)) ? Number(p.age) : null,
          });
          // Extract per-player injuries
          if (Array.isArray(p?.injuries)) {
            for (const inj of p.injuries) {
              allInjuries.push({
                player: p?.fullName || p?.displayName || 'Unknown',
                status: inj?.status || inj?.type?.description || 'Injury',
                detail: inj?.shortComment || inj?.details || inj?.description || null,
                date: inj?.date || null,
              });
            }
          }
        }
      }
      // Format 2: Direct athlete object
      else if (entry?.id || entry?.fullName || entry?.displayName) {
        players.push({
          id: entry?.id || null,
          name: entry?.fullName || entry?.displayName || 'Unknown',
          jersey: entry?.jersey || null,
          position: entry?.position?.abbreviation || entry?.position?.name || null,
          status: entry?.status?.type?.description || entry?.status?.displayValue || null,
          age: Number.isFinite(Number(entry?.age)) ? Number(entry.age) : null,
        });
        // Extract per-player injuries
        if (Array.isArray(entry?.injuries)) {
          for (const inj of entry.injuries) {
            allInjuries.push({
              player: entry?.fullName || entry?.displayName || 'Unknown',
              status: inj?.status || inj?.type?.description || 'Injury',
              detail: inj?.shortComment || inj?.details || inj?.description || null,
              date: inj?.date || null,
            });
          }
        }
      }
    }
    result.roster = players;
    // Use roster-derived injuries (per-player) if team-level injuries not available
    if (allInjuries.length > 0) {
      result.injuries = allInjuries.slice(0, 30);
    }
  }

  // Fallback: team-level injuries from team info endpoint
  if (result.injuries.length === 0) {
    result.injuries = normalizeESPNInjuries(teamInfo?.team?.injuries || []);
  }

  // Player leaders: ESPN core API provides per-team leaders (roster needed for name resolution)
  result.playerLeaders = await fetchCoreAPILeaders(sport, league, team.espnId, result.roster);
  if (result.playerLeaders.length === 0) {
    result.playerLeaders = normalizeESPNLeaders(
      teamStats?.team?.leaders || teamInfo?.team?.leaders || []
    );
  }

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
          // ESPN returns streak as numeric: positive=winning, negative=losing
          if (stat.displayValue) {
            result.streak = stat.displayValue;
          } else if (Number.isFinite(stat.value)) {
            const v = Number(stat.value);
            result.streak = v > 0 ? `W${v}` : v < 0 ? `L${Math.abs(v)}` : null;
          }
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
        time: toPacificTime(next.date),
        ...getESPNWatchInfo(next, comp),
      };
    }
  }

  result.excitement = detectExcitement(result);
  log(
    `${teamKey}: ${result.record?.wins}-${result.record?.losses}, streak=${result.streak}, excitement=${result.excitement}`
  );
  return result;
}

// ─── NHL Official API Enhancement ─────────────────────────────────────────────

/**
 * Fetch per-player stats from the NHL official API (api-web.nhle.com).
 * Derives stat leaders from the full club stats response.
 * Returns { leaders, skaterStats } where leaders is the normalized array
 * and skaterStats is the raw per-player data for potential future use.
 */
async function fetchNHLOfficialStats(nhlAbbrev) {
  const data = await fetchJSON(
    `https://api-web.nhle.com/v1/club-stats/${nhlAbbrev}/now`,
    `NHL official ${nhlAbbrev} stats`
  );
  if (!data?.skaters || !Array.isArray(data.skaters)) return { leaders: [], skaterStats: [] };

  const skaters = data.skaters;

  // Derive leaders by sorting on key categories
  const categories = [
    { name: 'Goals', key: 'goals' },
    { name: 'Assists', key: 'assists' },
    { name: 'Points', key: 'points' },
    { name: 'Plus/Minus', key: 'plusMinus' },
    { name: 'Power Play Goals', key: 'powerPlayGoals' },
    { name: 'Games Played', key: 'gamesPlayed' },
  ];

  const leaders = [];
  for (const cat of categories) {
    const sorted = [...skaters]
      .filter((s) => (s[cat.key] || 0) > 0 || cat.key === 'plusMinus')
      .sort((a, b) => (b[cat.key] || 0) - (a[cat.key] || 0));
    if (sorted.length > 0) {
      const top = sorted[0];
      const name = `${top.firstName?.default || ''} ${top.lastName?.default || ''}`.trim();
      leaders.push({
        category: cat.name,
        player: name || 'Unknown',
        value: String(top[cat.key] ?? 0),
      });
    }
    if (leaders.length >= 6) break;
  }

  return { leaders, skaterStats: skaters };
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
          time: game.gameTimeUTC ? toPacificTime(game.gameTimeUTC) : null,
          status: game.gameStatus === 1 ? 'scheduled' : game.gameStatus === 2 ? 'live' : 'final',
          score:
            game.gameStatus >= 2
              ? {
                  team: isHome ? game.homeTeam.score : game.awayTeam.score,
                  opponent: isHome ? game.awayTeam.score : game.homeTeam.score,
                }
              : null,
          home: isHome,
          gameUrl: game.gameId ? `https://www.nba.com/game/${game.gameId}` : null,
        });
      }
    }
  }

  // Check MLB schedule for today
  const mlbSchedule = await fetchJSON(
    `https://statsapi.mlb.com/api/v1/schedule?teamId=${TEAMS.giants.mlbId}&date=${today}&sportId=1&hydrate=broadcasts`,
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
        time: toPacificTime(game.gameDate),
        status: state === 'Final' ? 'final' : state === 'Live' ? 'live' : 'scheduled',
        score:
          state === 'Final' || state === 'Live'
            ? {
                team: isHome ? game.teams.home.score : game.teams.away.score,
                opponent: isHome ? game.teams.away.score : game.teams.home.score,
              }
            : null,
        home: isHome,
        gameUrl: game.gamePk ? `https://www.mlb.com/gameday/${game.gamePk}` : null,
        network: getMLBNetwork(game, isHome),
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
          time: toPacificTime(event.date),
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
          ...getESPNWatchInfo(event, comp),
        });
      }
    }
  }

  // ESPN NHL scoreboard
  const nhlScoreboard = await fetchJSON(
    'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    'NHL scoreboard'
  );

  if (nhlScoreboard?.events) {
    for (const event of nhlScoreboard.events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;
      const isSharks = comp.competitors?.some((c) => parseInt(c.team?.id) === TEAMS.sharks.espnId);
      if (!isSharks) continue;

      const ourTeam = comp.competitors.find((c) => parseInt(c.team?.id) === TEAMS.sharks.espnId);
      const opponent = comp.competitors.find((c) => parseInt(c.team?.id) !== TEAMS.sharks.espnId);
      const statusType = comp.status?.type?.name;

      games.push({
        team: 'sharks',
        opponent: opponent?.team?.displayName || 'Unknown',
        time: toPacificTime(event.date),
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
        ...getESPNWatchInfo(event, comp),
      });
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
  const [giants, warriors, niners, sharks] = await Promise.all([
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
    fetchESPNTeam('sharks', 'hockey', 'nhl').catch((e) => {
      warn('Sharks fetch failed:', e.message);
      errors++;
      return null;
    }),
  ]);

  if (giants) results.giants = giants;
  if (warriors) results.warriors = warriors;
  if (niners) results['49ers'] = niners;
  if (sharks) results.sharks = sharks;

  // Enhance Sharks data with NHL official API (richer per-player stats)
  if (sharks && TEAMS.sharks.nhlAbbrev) {
    try {
      const nhlData = await fetchNHLOfficialStats(TEAMS.sharks.nhlAbbrev);
      if (nhlData.leaders.length > 0 && sharks.playerLeaders.length === 0) {
        sharks.playerLeaders = nhlData.leaders;
        log(`Sharks: enriched with ${nhlData.leaders.length} NHL API leaders`);
      }
    } catch (e) {
      warn('NHL official API enhancement failed:', e.message);
    }
  }

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

  const teamCount = Object.keys(results).length;

  // Only fail if all teams failed
  if (teamCount === 0) {
    console.error('[sports-sync] All team fetches failed!');
    process.exit(1);
  }

  const jsonString = JSON.stringify(output, null, 2);

  // Upload to Azure Blob Storage (primary)
  const uploaded = await uploadToBlob({
    container: 'api-data',
    blob: 'sports-data.json',
    data: jsonString,
    label: 'sports',
  });

  if (!uploaded && !LOCAL_FALLBACK) {
    console.log('[sports-sync] No AZURE_STORAGE_KEY set, writing local file instead');
  }

  // Write local file if --local flag or blob upload unavailable
  if (LOCAL_FALLBACK || !uploaded) {
    const outDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_PATH, jsonString);
    console.log(`[sports-sync] Wrote ${OUTPUT_PATH}`);
  }

  console.log(
    `[sports-sync] Done: ${teamCount}/4 teams, ${todaysGames.length} games today, ${errors} errors`
  );
}

main().catch((e) => {
  console.error('[sports-sync] Fatal error:', e);
  process.exit(1);
});
