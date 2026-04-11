/**
 * Carl Context Builders - Builds LLM context strings from structured data
 * Formats library resources, community resources, transit alerts, traffic events,
 * and public services into context that can be injected into the system prompt.
 *
 * Requires init() to receive define:vars data (libraryData, publicServicesData).
 */

(function () {
  'use strict';

  // Injected via init()
  var libraryData = null;
  var publicServicesData = null;

  // Transit agency names for natural language
  var TRANSIT_AGENCIES = {
    BA: 'BART',
    CT: 'Caltrain',
    SF: 'Muni',
    AC: 'AC Transit',
    SC: 'VTA',
    SM: 'SamTrans',
    GG: 'Golden Gate Transit',
    SA: 'SMART',
    GF: 'Golden Gate Ferry',
    SB: 'SF Bay Ferry',
    CC: 'County Connection',
    WH: 'Wheels',
    MA: 'Marin Transit',
    '3D': 'Tri Delta Transit',
    WC: 'WestCAT',
    CE: 'ACE Rail',
    AM: 'Capitol Corridor',
  };

  /**
   * Initialize with data from define:vars.
   * @param {Object} config
   * @param {Object} config.libraryData - Library digital resources JSON
   * @param {Object} config.publicServicesData - Public services directory JSON
   */
  function init(config) {
    libraryData = config.libraryData || null;
    publicServicesData = config.publicServicesData || null;
  }

  // ============================================
  // LIBRARY DIGITAL RESOURCES
  // ============================================

  function getLibraryResourcesForContext(query, county) {
    county = county || null;
    if (!libraryData) return '';

    var lower = query.toLowerCase();
    var context = '\n\n[FREE LIBRARY DIGITAL RESOURCES]:\n';
    context += 'These are FREE with a library card (also free to get):\n\n';

    var categories = libraryData.resourcesByCategory || {};
    var matchedResources;

    if (lower.includes('movie') || lower.includes('film') || lower.includes('streaming')) {
      matchedResources = categories['Movie & TV Streaming'] || [];
      context += '**Free Movies & TV:**\n';
    } else if (lower.includes('music')) {
      matchedResources = categories['Music Streaming'] || [];
      context += '**Free Music:**\n';
    } else if (lower.includes('learn') || lower.includes('course') || lower.includes('class')) {
      matchedResources = categories['Online Learning'] || [];
      context += '**Free Online Learning:**\n';
    } else if (lower.includes('language')) {
      matchedResources = categories['Language Learning'] || [];
      context += '**Free Language Learning:**\n';
    } else if (lower.includes('tutor') || lower.includes('homework')) {
      matchedResources = categories['Tutoring & Homework Help'] || [];
      context += '**Free Tutoring:**\n';
    } else if (lower.includes('job') || lower.includes('career') || lower.includes('resume')) {
      matchedResources = categories['Career & Job Search'] || [];
      context += '**Free Career Help:**\n';
    } else if (lower.includes('kid') || lower.includes('child') || lower.includes('abcmouse')) {
      matchedResources = categories['Kids & Early Learning'] || [];
      context += '**Free Kids Learning:**\n';
    } else if (lower.includes('museum') || lower.includes('zoo') || lower.includes('pass')) {
      matchedResources = categories['Museum & Cultural Passes'] || [];
      context += '**Free Museum Passes:**\n';
    } else if (lower.includes('code') || lower.includes('programming') || lower.includes('tech')) {
      matchedResources = [
        "O'Reilly for Public Libraries",
        'Treehouse',
        'CodeCombat',
        'LinkedIn Learning',
      ];
      context += '**Free Coding & Tech Learning:**\n';
    } else {
      var common =
        libraryData.commonResources && libraryData.commonResources.resources
          ? libraryData.commonResources.resources
          : [];
      common.slice(0, 6).forEach(function (r) {
        context += '- **' + r.name + '**: ' + r.description + '\n';
      });
      context += '\nThese work at MOST Bay Area libraries. Just need a library card (free)!';
      context +=
        '\n\nTo get a library card: Visit any branch with ID showing your address, or apply online at your county library website.';
      return context;
    }

    if (matchedResources.length > 0) {
      matchedResources.slice(0, 5).forEach(function (r) {
        if (typeof r === 'string') {
          context += '- ' + r + '\n';
        } else {
          context += '- **' + r.name + '**: ' + (r.description || '') + '\n';
        }
      });
    }

    context +=
      '\n**How to access:** Get a FREE library card at any branch (just need ID with address) or apply online.';

    if (county) {
      var countyLibraries = {
        'san francisco': 'sfpl.org',
        alameda: 'aclibrary.org',
        'contra costa': 'ccclib.org',
        'san mateo': 'smcl.org',
        'santa clara': 'sccld.org or sjpl.org',
        marin: 'marinlibrary.org',
        sonoma: 'sonomalibrary.org',
        solano: 'solanolibrary.com',
        napa: 'countyofnapa.org/library',
      };
      var libSite = countyLibraries[county.toLowerCase()];
      if (libSite) {
        context += '\nYour library: **' + libSite + '**';
      }
    }

    return context;
  }

  // ============================================
  // COMMUNITY RESOURCES (211 Bay Area)
  // ============================================

  function getCommunityResourcesContext(query) {
    var lower = query.toLowerCase();
    var context = '\n\n[COMMUNITY RESOURCES - 211 BAY AREA]:\n';

    if (
      lower.includes('food') ||
      lower.includes('pantry') ||
      lower.includes('hungry') ||
      lower.includes('meal')
    ) {
      context += '**Food Resources (call 211 for nearest locations):**\n';
      context += '- **SF-Marin Food Bank**: Serves 140,000+ weekly. Call 415-282-1900\n';
      context +=
        '- **Second Harvest of Silicon Valley**: Free groceries, no ID needed. 1-800-984-3663\n';
      context += '- **Alameda County Community Food Bank**: 510-635-3663\n';
      context += '- **Project Open Hand**: Delivers meals to seniors/disabled. 415-447-2300\n';
      context += '- **Glide**: Free meals daily in SF Tenderloin. 330 Ellis St\n';
      context +=
        '\n**For nearest location:** Call **211** (free, 24/7) or visit **211bayarea.org**\n';
    } else if (lower.includes('shelter') || lower.includes('homeless') || lower.includes('sleep')) {
      context += '**Emergency Shelter Resources:**\n';
      context += '- **SF**: Call 311 for shelter availability or visit sf.gov/shelter\n';
      context += '- **Oakland/Alameda**: Call 211 for shelter referrals\n';
      context += '- **San Jose**: Call 408-510-7600 (Homelessness Prevention)\n';
      context += '- **BACS (Bay Area Community Services)**: 510-613-0330\n';
      context += '\n**For immediate help:** Call **211** (free, 24/7)\n';
    } else {
      context += '**211 Bay Area** connects people to essential services:\n';
      context += '- Food assistance and pantries\n';
      context += '- Emergency shelter and housing help\n';
      context += '- Utility assistance (PG&E, water)\n';
      context += '- Healthcare and mental health\n';
      context += '- Job training and childcare\n';
      context +=
        '\n**Call 211** (free, 24/7) or visit **211bayarea.org** to find resources near you.\n';
    }

    return context;
  }

  // ============================================
  // TRANSIT ALERTS
  // ============================================

  function formatTransitAlertsForContext(alerts, agencyFilter) {
    agencyFilter = agencyFilter || null;
    if (!alerts || alerts.length === 0) {
      if (agencyFilter) {
        var agencyName = TRANSIT_AGENCIES[agencyFilter] || agencyFilter;
        return (
          '\n\n[LIVE TRANSIT DATA]: Good news! ' +
          agencyName +
          ' has no active service alerts right now. Service is running normally.'
        );
      }
      return '\n\n[LIVE TRANSIT DATA]: All Bay Area transit systems are running normally. No active service alerts.';
    }

    var context = '\n\n[LIVE TRANSIT DATA - CURRENT ALERTS]:\n';
    context += 'Here are the active service alerts you should mention:\n\n';

    var byAgency = {};
    alerts.slice(0, 8).forEach(function (alert) {
      var agency = alert.agency || TRANSIT_AGENCIES[alert.agencyId] || 'Unknown';
      if (!byAgency[agency]) byAgency[agency] = [];
      byAgency[agency].push(alert);
    });

    for (var agency in byAgency) {
      context += '**' + agency + '**:\n';
      byAgency[agency].forEach(function (alert) {
        context += '  - ' + alert.title;
        if (alert.timeAgo) context += ' (' + alert.timeAgo + ')';
        context += '\n';
      });
      context += '\n';
    }

    context +=
      'IMPORTANT: Share this information naturally in your response. Direct users to baynavigator.org/transit for live updates.';
    return context;
  }

  // ============================================
  // TRAFFIC EVENTS
  // ============================================

  function formatTrafficForContext(events, query) {
    query = query || '';
    if (!events || events.length === 0) {
      return '\n\n[LIVE TRAFFIC DATA]: No major traffic incidents reported right now. Roads are generally clear.';
    }

    var activeEvents = events
      .filter(function (e) {
        return e.properties && e.properties.status === 'ACTIVE';
      })
      .slice(0, 6);

    if (activeEvents.length === 0) {
      return '\n\n[LIVE TRAFFIC DATA]: No major traffic incidents reported right now.';
    }

    var context = '\n\n[LIVE TRAFFIC DATA - CURRENT INCIDENTS]:\n';
    context += 'Here are current traffic conditions to mention:\n\n';

    activeEvents.forEach(function (event) {
      var props = event.properties;
      var type = props.type || 'INCIDENT';
      var headline = props.headline || 'Traffic incident reported';
      context += '- **' + type + '**: ' + headline.substring(0, 150) + '\n';
    });

    context +=
      '\nIMPORTANT: Summarize this naturally. For full details, direct users to 511.org or their navigation app.';
    return context;
  }

  // ============================================
  // PUBLIC SERVICES (Libraries, Police, Fire, Hospitals)
  // ============================================

  function getPublicServicesContext(query, county) {
    county = county || null;
    if (!publicServicesData || !publicServicesData.counties) return '';

    var lower = query.toLowerCase();
    var context = '\n\n[PUBLIC SERVICES DIRECTORY]:\n';

    var countyKeyMap = {
      'san francisco': 'sanFrancisco',
      alameda: 'alameda',
      'contra costa': 'contraCostaCounty',
      marin: 'marin',
      napa: 'napa',
      'san mateo': 'sanMateo',
      'santa clara': 'santaClara',
      solano: 'solano',
      sonoma: 'sonoma',
    };

    var countyKey = county ? countyKeyMap[county.toLowerCase()] : null;
    var countyData = countyKey ? publicServicesData.counties[countyKey] : null;

    if (
      lower.includes('hospital') ||
      lower.includes('emergency room') ||
      lower.includes('er') ||
      lower.includes('medical center')
    ) {
      context += '**Hospitals & Emergency Rooms:**\n';
      if (countyData && countyData.hospitals) {
        countyData.hospitals.slice(0, 5).forEach(function (h) {
          context += '- **' + h.name + '** - ' + h.address;
          if (h.type) context += ' (' + h.type + ')';
          context += '\n';
        });
      } else {
        context += '- **Zuckerberg SF General** - 1001 Potrero Ave, SF (Trauma Center)\n';
        context += '- **Highland Hospital** - 1411 E 31st St, Oakland (County Trauma)\n';
        context += '- **Valley Medical Center** - 751 S Bascom Ave, San Jose (Trauma)\n';
        context += '- **John Muir Walnut Creek** - 1601 Ygnacio Valley Rd (Trauma)\n';
      }
      context += '\n**Emergency?** Call **911**\n';
    } else if (
      lower.includes('police') ||
      lower.includes('sheriff') ||
      lower.includes('report') ||
      lower.includes('crime')
    ) {
      context += '**Police Stations:**\n';
      if (countyData && countyData.police) {
        if (countyData.police.sheriff) {
          context +=
            '- **' +
            countyData.police.sheriff.name +
            '** - ' +
            countyData.police.sheriff.headquarters +
            '\n';
        }
        if (countyData.police.stations) {
          countyData.police.stations.slice(0, 4).forEach(function (s) {
            context += '- **' + s.name + '** - ' + s.address + '\n';
          });
        } else if (countyData.police.majorCities) {
          countyData.police.majorCities.slice(0, 4).forEach(function (c) {
            context += '- **' + c.city + ' PD** - ' + c.address + '\n';
          });
        }
      }
      context += '\n**Emergency?** Call **911**. Non-emergency: call local station or 311 in SF.\n';
    } else if (lower.includes('fire station') || lower.includes('fire department')) {
      context += '**Fire Departments:**\n';
      if (countyData && countyData.fire) {
        context += '- **' + countyData.fire.department + '**';
        if (countyData.fire.headquarters) context += ' - HQ: ' + countyData.fire.headquarters;
        if (countyData.fire.stationCount)
          context += ' (' + countyData.fire.stationCount + ' stations)';
        context += '\n';
      }
      context += '\n**Fire Emergency?** Call **911**\n';
    } else if (lower.includes('library')) {
      context += '**Library Branches:**\n';
      if (countyData && countyData.libraries) {
        if (countyData.libraries.system) {
          context +=
            '**' +
            countyData.libraries.system +
            '** - ' +
            (countyData.libraries.website || '') +
            '\n';
        }
        if (countyData.libraries.branches) {
          countyData.libraries.branches.slice(0, 5).forEach(function (b) {
            context += '- ' + b.name + ' - ' + b.address + '\n';
          });
        } else if (countyData.libraries.systems) {
          countyData.libraries.systems.slice(0, 2).forEach(function (sys) {
            context += '**' + sys.name + '** - ' + (sys.website || '') + '\n';
            if (sys.branches) {
              sys.branches.slice(0, 3).forEach(function (b) {
                context += '  - ' + b.name + ' - ' + b.address + '\n';
              });
            }
          });
        }
      }
      context += '\nLibrary cards are FREE! Just bring ID with your address.\n';
    }

    return context;
  }

  // Expose globally
  window.CarlContext = {
    init: init,
    getLibraryResourcesForContext: getLibraryResourcesForContext,
    getCommunityResourcesContext: getCommunityResourcesContext,
    formatTransitAlertsForContext: formatTransitAlertsForContext,
    formatTrafficForContext: formatTrafficForContext,
    getPublicServicesContext: getPublicServicesContext,
  };
})();
