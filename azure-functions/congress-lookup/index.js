/**
 * Congress Lookup Azure Function
 * Proxies requests to Congress.gov API with server-side API key
 * Returns member info for a given state and congressional district
 */

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const CONGRESS_API_BASE = 'https://api.congress.gov/v3';

module.exports = async function (context, req) {
  // CORS headers
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours (reps don't change often)
    }
  };

  if (req.method === 'OPTIONS') {
    context.res.status = 204;
    return;
  }

  if (!CONGRESS_API_KEY) {
    context.res.status = 500;
    context.res.body = JSON.stringify({ error: 'Congress API key not configured' });
    return;
  }

  try {
    const state = req.query.state || 'CA';
    const district = req.query.district;
    const type = req.query.type || 'house'; // 'house' or 'senate'

    let members = [];

    if (type === 'senate') {
      // Get both CA senators
      members = await getSenatorsForState(state, context);
    } else if (district) {
      // Get House rep for specific district
      members = await getHouseRepForDistrict(state, district, context);
    } else {
      context.res.status = 400;
      context.res.body = JSON.stringify({ error: 'District required for House lookup' });
      return;
    }

    context.res.body = JSON.stringify({
      state,
      district: district || null,
      type,
      members
    });
  } catch (error) {
    context.log.error('Congress lookup error:', error);
    context.res.status = 500;
    context.res.body = JSON.stringify({ error: 'Failed to fetch Congress member data' });
  }
};

/**
 * Get current House representative for a district
 */
async function getHouseRepForDistrict(state, district, context) {
  // Get current members for this state/district
  const url = `${CONGRESS_API_BASE}/member/${state}/${district}?api_key=${CONGRESS_API_KEY}&currentMember=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Congress API error: ${response.status}`);
  }

  const data = await response.json();
  const members = data.members || [];

  // Filter to current House members only
  const currentHouseMembers = members.filter(m => {
    const terms = m.terms?.item || [];
    // Check if they have a current House term (no endYear means current)
    return terms.some(t => t.chamber === 'House of Representatives' && !t.endYear);
  });

  // Get detailed info for each member
  const detailedMembers = await Promise.all(
    currentHouseMembers.slice(0, 1).map(m => getMemberDetails(m.bioguideId, context))
  );

  return detailedMembers.filter(Boolean);
}

/**
 * Get both senators for a state
 */
async function getSenatorsForState(state, context) {
  const url = `${CONGRESS_API_BASE}/member/${state}?api_key=${CONGRESS_API_KEY}&currentMember=true&limit=100`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Congress API error: ${response.status}`);
  }

  const data = await response.json();
  const members = data.members || [];

  // Filter to current Senators only
  const currentSenators = members.filter(m => {
    const terms = m.terms?.item || [];
    return terms.some(t => t.chamber === 'Senate' && !t.endYear);
  });

  // Get detailed info for each senator
  const detailedMembers = await Promise.all(
    currentSenators.slice(0, 2).map(m => getMemberDetails(m.bioguideId, context))
  );

  return detailedMembers.filter(Boolean);
}

/**
 * Get detailed member info by bioguideId
 */
async function getMemberDetails(bioguideId, context) {
  try {
    const url = `${CONGRESS_API_BASE}/member/${bioguideId}?api_key=${CONGRESS_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      context.log.warn(`Failed to get details for ${bioguideId}`);
      return null;
    }

    const data = await response.json();
    const member = data.member;

    if (!member) return null;

    // Get current term info
    const terms = member.terms || [];
    const currentTerm = terms.find(t => !t.endYear) || terms[terms.length - 1];

    // Calculate next election year
    let nextElection = null;
    if (currentTerm) {
      if (currentTerm.chamber === 'Senate') {
        // Senators serve 6-year terms
        nextElection = currentTerm.startYear + 6;
      } else {
        // House members serve 2-year terms, next election is always next even year
        const currentYear = new Date().getFullYear();
        nextElection = currentYear % 2 === 0 ? currentYear : currentYear + 1;
      }
    }

    // Get party from party history
    const partyHistory = member.partyHistory || [];
    const currentParty = partyHistory.find(p => !p.endYear) || partyHistory[partyHistory.length - 1];

    return {
      bioguideId: member.bioguideId,
      name: member.directOrderName || member.invertedOrderName,
      firstName: member.firstName,
      lastName: member.lastName,
      party: currentParty?.partyName || 'Unknown',
      partyAbbrev: getPartyAbbrev(currentParty?.partyName),
      state: member.state,
      district: currentTerm?.district || null,
      chamber: currentTerm?.chamber || null,
      imageUrl: member.depiction?.imageUrl || null,
      officialWebsite: member.officialWebsiteUrl || null,
      startYear: currentTerm?.startYear || null,
      nextElection,
      // Additional contact info if available
      addressInformation: member.addressInformation || null
    };
  } catch (error) {
    context.log.error(`Error getting member details for ${bioguideId}:`, error);
    return null;
  }
}

function getPartyAbbrev(partyName) {
  if (!partyName) return '?';
  const lower = partyName.toLowerCase();
  if (lower.includes('democrat')) return 'D';
  if (lower.includes('republican')) return 'R';
  if (lower.includes('independent')) return 'I';
  return partyName.charAt(0);
}
