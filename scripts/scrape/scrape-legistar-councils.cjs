#!/usr/bin/env node
/**
 * Scrape city council data from Legistar API for Bay Area cities
 * Legistar is used by Oakland, San Jose, SF, BART, and others
 *
 * Usage: node scripts/scrape-legistar-councils.cjs
 */

const fs = require('fs');
const path = require('path');

const LEGISTAR_API = 'https://webapi.legistar.com/v1';

// Bay Area cities/agencies using Legistar
const LEGISTAR_CLIENTS = {
  Oakland: {
    client: 'oakland',
    councilBodyId: null, // Will find by name
    councilBodyName: 'Meeting of the Oakland City Council',
  },
  'San Jose': {
    client: 'sanjose',
    councilBodyId: 138,
    councilBodyName: 'City Council',
  },
  'San Francisco': {
    client: 'sfgov',
    councilBodyId: 1,
    councilBodyName: 'Board of Supervisors',
  },
};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  return response.json();
}

async function getBodies(client) {
  const url = `${LEGISTAR_API}/${client}/Bodies`;
  return fetchJson(url);
}

async function getActiveOfficeRecords(client, bodyId) {
  // Get office records that haven't ended yet
  const today = new Date().toISOString().split('T')[0];
  const url = `${LEGISTAR_API}/${client}/OfficeRecords?$filter=OfficeRecordBodyId eq ${bodyId} and OfficeRecordEndDate ge datetime'${today}'`;
  return fetchJson(url);
}

async function getPersonById(client, personId) {
  const url = `${LEGISTAR_API}/${client}/Persons/${personId}`;
  try {
    return await fetchJson(url);
  } catch (err) {
    console.log(`  Warning: Could not fetch person ${personId}`);
    return null;
  }
}

function formatOfficial(person, officeRecord) {
  const title = officeRecord?.OfficeRecordTitle || 'Council Member';
  const memberType = officeRecord?.OfficeRecordMemberType || '';

  // Determine role from title or member type
  let role = 'Member';
  if (title.toLowerCase().includes('mayor') || memberType.toLowerCase().includes('mayor')) {
    role = 'Mayor';
  } else if (
    title.toLowerCase().includes('president') ||
    memberType.toLowerCase().includes('president')
  ) {
    role = 'President';
  } else if (title.toLowerCase().includes('chair') || memberType.toLowerCase().includes('chair')) {
    role = 'Chair';
  } else if (title.toLowerCase().includes('supervisor')) {
    role = 'Supervisor';
  }

  return {
    name: `${person.PersonFirstName || ''} ${person.PersonLastName || ''}`.trim(),
    title: title,
    role: role,
    email: person.PersonEmail || null,
    phone: person.PersonPhone || null,
    website: person.PersonWWW || null,
    photoUrl: null, // Legistar doesn't typically have photos in API
    startDate: officeRecord?.OfficeRecordStartDate || null,
    endDate: officeRecord?.OfficeRecordEndDate || null,
    source: 'legistar',
  };
}

async function scrapeCity(cityName, config) {
  console.log(`\n[${cityName}] Scraping from ${config.client}.legistar.com...`);

  try {
    // Find the council body
    let bodyId = config.councilBodyId;
    if (!bodyId) {
      const bodies = await getBodies(config.client);
      const councilBody = bodies.find(
        (b) =>
          b.BodyName === config.councilBodyName ||
          b.BodyName.includes('City Council') ||
          b.BodyName.includes('Board of Supervisors')
      );
      if (!councilBody) {
        console.log(`  Could not find council body for ${cityName}`);
        return { cityName, error: 'Body not found', officials: [] };
      }
      bodyId = councilBody.BodyId;
      console.log(`  Found body: ${councilBody.BodyName} (ID: ${bodyId})`);
    }

    // Get current office records
    const officeRecords = await getActiveOfficeRecords(config.client, bodyId);
    console.log(`  Found ${officeRecords.length} active office records`);

    if (officeRecords.length === 0) {
      // Try without date filter
      console.log(`  Trying without date filter...`);
      const allRecords = await fetchJson(
        `${LEGISTAR_API}/${config.client}/OfficeRecords?$filter=OfficeRecordBodyId eq ${bodyId}`
      );

      // Sort by end date and take most recent
      const recentRecords = allRecords
        .filter((r) => r.OfficeRecordEndDate)
        .sort((a, b) => new Date(b.OfficeRecordEndDate) - new Date(a.OfficeRecordEndDate))
        .slice(0, 15); // Take top 15 most recent

      console.log(`  Found ${recentRecords.length} recent records`);

      if (recentRecords.length === 0) {
        return { cityName, error: 'No office records', officials: [] };
      }
    }

    // Get person details for each office record
    const officials = [];
    const seenPersons = new Set();

    const recordsToProcess =
      officeRecords.length > 0
        ? officeRecords
        : await fetchJson(
            `${LEGISTAR_API}/${config.client}/OfficeRecords?$filter=OfficeRecordBodyId eq ${bodyId}&$top=20`
          );

    for (const record of recordsToProcess) {
      if (seenPersons.has(record.OfficeRecordPersonId)) continue;
      seenPersons.add(record.OfficeRecordPersonId);

      const person = await getPersonById(config.client, record.OfficeRecordPersonId);
      if (person && person.PersonActiveFlag === 1) {
        officials.push(formatOfficial(person, record));
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 100));
    }

    console.log(`  Processed ${officials.length} active officials`);

    return {
      cityName,
      client: config.client,
      bodyId,
      officials,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`  Error: ${err.message}`);
    return { cityName, error: err.message, officials: [] };
  }
}

async function main() {
  console.log('Scraping city council data from Legistar API...');
  console.log('Cities: ' + Object.keys(LEGISTAR_CLIENTS).join(', '));

  const results = {};

  for (const [cityName, config] of Object.entries(LEGISTAR_CLIENTS)) {
    results[cityName] = await scrapeCity(cityName, config);
    await new Promise((r) => setTimeout(r, 500)); // Rate limit between cities
  }

  // Save results
  const outputPath = path.join(
    __dirname,
    '..',
    'data-exports',
    'city-councils',
    'legistar-data.json'
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\nSaved results to ${outputPath}`);

  // Summary
  for (const [city, data] of Object.entries(results)) {
    console.log(`  ${city}: ${data.officials?.length || 0} officials`);
  }
}

main().catch(console.error);
