/**
 * Search Crisis Detection — detects crisis/emergency keywords and shows help banners
 * Extracted from SearchBar.astro for modularity.
 *
 * Exposes: window.SearchCrisis = { init, checkForCrisis, showCrisisBanner }
 */

(function () {
  'use strict';

  /** @type {((msg: string, urgent?: boolean) => void) | null} */
  var _announceToScreenReader = null;

  // Context words that indicate academic/professional queries
  var academicProfessionalContext = [
    'statistics',
    'stats',
    'data about',
    'research on',
    'study on',
    'legislation',
    'policy',
    'policies',
    'donate to',
    'donation to',
    'volunteer at',
    'volunteering at',
    'definition of',
    'define ',
    'meaning of',
    'history of',
    'causes of',
    'write about',
    'essay on',
    'paper on',
    'jobs in',
    'career in',
    'work in',
    'degree in',
    'major in',
  ];

  // Emergency keywords (911) - active danger situations
  var emergencyKeywords = [
    'need immediate help',
    'urgent help',
    'emergency help',
    'call 911',
    'call the police',
    'call an ambulance',
    'life threatening',
    'life-threatening',
    'in danger',
    'help me now',
    'need help now',
    'please help',
    'being attacked',
    'attacking me',
    'someone is attacking',
    'being stabbed',
    'stabbing me',
    'knife attack',
    'with a knife',
    'being shot',
    'shooting at',
    'has a gun',
    'with a gun',
    'being beaten',
    'beating me',
    'hitting me',
    'hurting me',
    'someone is hurting',
    'abusing me',
    'being abused',
    'domestic violence',
    'partner is hitting',
    'spouse is hitting',
    'husband is hitting',
    'wife is hitting',
    'boyfriend is hitting',
    'being raped',
    'sexual assault',
    'being assaulted',
    'child is hurt',
    'baby not breathing',
    'child not breathing',
    'child abuse',
    'elder abuse',
    'abusing my child',
    'hurting my child',
    'cant breathe',
    "can't breathe",
    'not breathing',
    'stopped breathing',
    'choking',
    'having a heart attack',
    'having a stroke',
    'having a seizure',
    'severe bleeding',
    'wont stop bleeding',
    "won't stop bleeding",
    'unconscious',
    'passed out',
    'not waking up',
    'unresponsive',
    'allergic reaction',
    'anaphylaxis',
    'swelling up',
    'overdosing',
    'took too many pills',
    'drug overdose',
    'house on fire',
    'building on fire',
    'theres a fire',
    "there's a fire",
    'apartment on fire',
    'smoke everywhere',
    'car accident',
    'bad accident',
    'someone is drowning',
    'fell in water',
    'trapped',
    'being kidnapped',
    'being held hostage',
    'taken hostage',
    'someone broke in',
    'intruder',
    'break in',
    'burglar',
    'robber',
    'being robbed',
    'mugged',
    'being mugged',
    'threatening to kill',
    'going to kill',
    'wants to kill',
    'has a weapon',
    'threatening me',
    'stalking me',
    'following me',
    'i think i see',
    'i see someone',
    'someone is being',
    'witness domestic',
    'witnessing abuse',
    'witnessing violence',
    'neighbor is being',
    'hear screaming',
    'hearing screams',
    'sounds like fighting',
    'sounds like abuse',
    'suspicious person',
    'someone suspicious',
    'man with a gun',
    'woman with a gun',
    'person with a gun',
    'man with a knife',
    'woman with a knife',
    'person with a knife',
    'saw someone get',
    'just saw someone',
    'think someone is hurt',
    'someone might be hurt',
    'child left alone',
    'child in car',
    'baby in car',
    'report abuse',
    'report violence',
    'how to report',
  ];

  // Mental health crisis keywords (988)
  var mentalHealthKeywords = [
    'suicide',
    'suicidal',
    'kill myself',
    'end my life',
    'want to die',
    'dont want to live',
    "don't want to live",
    'no reason to live',
    'better off dead',
    'wish i was dead',
    'wish i were dead',
    'thinking about suicide',
    'considering suicide',
    'planning suicide',
    'suicidal thoughts',
    'thoughts of suicide',
    'ending it all',
    'take my own life',
    'taking my own life',
    'self harm',
    'self-harm',
    'cutting myself',
    'hurt myself',
    'harming myself',
    'hurting myself',
    'want to cut',
    'started cutting',
    'burning myself',
    'hitting myself',
    'severely depressed',
    'deep depression',
    'hopeless',
    'no hope',
    'feel empty',
    'feeling empty',
    'worthless',
    'feel worthless',
    'nobody cares',
    'no one cares',
    'nobody loves me',
    'no one loves me',
    'world without me',
    'everyone hates me',
    'mental health crisis',
    'mental breakdown',
    'breaking down',
    'emotional crisis',
    'in crisis',
    'having a crisis',
    'cant go on',
    "can't go on",
    'give up',
    'giving up',
    'cant take it',
    "can't take it",
    'cant handle',
    "can't handle",
    'falling apart',
    'losing my mind',
    'going crazy',
    'overdose myself',
    'take all my pills',
    'take too many pills',
    'swallow all my',
    'drink myself to death',
    'panic attack',
    'having a panic attack',
    'severe anxiety',
    'cant stop crying',
    "can't stop crying",
    'crying for hours',
    'friend is suicidal',
    'worried about friend',
    'think my friend',
    'someone i know',
    'family member suicidal',
    'child is suicidal',
    'teen is suicidal',
    'worried someone will',
    'talking about suicide',
    'said they want to die',
    'threatening suicide',
    'lost someone to suicide',
    'someone died by suicide',
    'survivor of suicide',
    'grief overwhelmed',
    'veteran crisis',
    'veteran suicide',
    'military suicide',
    'ptsd crisis',
    'combat trauma',
    'lgbtq crisis',
    'coming out crisis',
    'rejected by family',
    'gender identity crisis',
    'trans crisis',
  ];

  /**
   * Check a query for crisis keywords.
   * @param {string} query
   * @returns {'emergency' | 'mental-health' | null}
   */
  function checkForCrisis(query) {
    var lowerQuery = query.toLowerCase();

    // Skip academic/professional queries
    for (var i = 0; i < academicProfessionalContext.length; i++) {
      if (lowerQuery.includes(academicProfessionalContext[i])) {
        return null;
      }
    }

    for (var j = 0; j < emergencyKeywords.length; j++) {
      if (lowerQuery.includes(emergencyKeywords[j])) {
        return 'emergency';
      }
    }

    for (var k = 0; k < mentalHealthKeywords.length; k++) {
      if (lowerQuery.includes(mentalHealthKeywords[k])) {
        return 'mental-health';
      }
    }

    return null;
  }

  /**
   * Build crisis banner DOM using safe DOM methods (no innerHTML).
   * @param {'emergency' | 'mental-health'} type
   */
  function showCrisisBanner(type) {
    // Remove existing banner if any
    var existingBanner = document.getElementById('crisis-banner');
    if (existingBanner) existingBanner.remove();

    var isEmergency = type === 'emergency';

    var banner = document.createElement('div');
    banner.id = 'crisis-banner';
    banner.className = 'crisis-banner ' + (isEmergency ? 'emergency' : 'mental-health');
    // WCAG 2.2: Announce crisis banner immediately to screen readers
    banner.setAttribute('role', 'alert');

    var content = document.createElement('div');
    content.className = 'crisis-banner-content';

    // --- Banner box (icon + text) ---
    var box = document.createElement('div');
    box.className = 'crisis-banner-box';

    var iconWrap = document.createElement('div');
    iconWrap.className = 'crisis-banner-icon';
    var iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('class', 'w-6 h-6');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('stroke', 'currentColor');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('aria-hidden', 'true');
    var iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('stroke-linecap', 'round');
    iconPath.setAttribute('stroke-linejoin', 'round');
    iconPath.setAttribute('stroke-width', '2');
    iconPath.setAttribute(
      'd',
      isEmergency
        ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
        : 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
    );
    iconSvg.appendChild(iconPath);
    iconWrap.appendChild(iconSvg);

    var textWrap = document.createElement('div');
    textWrap.className = 'crisis-banner-text';
    var strong = document.createElement('strong');
    strong.textContent = isEmergency ? 'Need immediate help?' : "You're not alone.";
    var span = document.createElement('span');
    span.textContent = isEmergency
      ? 'If you or someone is in danger, call emergency services.'
      : 'Free, confidential 24/7 support. Veterans press 1, Spanish press 2.';
    textWrap.appendChild(strong);
    textWrap.appendChild(span);

    box.appendChild(iconWrap);
    box.appendChild(textWrap);
    content.appendChild(box);

    // --- Phone SVG path (reused) ---
    var phonePath =
      'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';

    function makePhoneSvg(cls) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', cls);
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      p.setAttribute('stroke-width', '2');
      p.setAttribute('d', phonePath);
      svg.appendChild(p);
      return svg;
    }

    if (isEmergency) {
      var callLink = document.createElement('a');
      callLink.href = 'tel:911';
      callLink.className = 'crisis-banner-btn emergency';
      callLink.appendChild(makePhoneSvg('w-5 h-5'));
      callLink.appendChild(document.createTextNode('Call 911'));
      content.appendChild(callLink);
    } else {
      var actions = document.createElement('div');
      actions.className = 'crisis-banner-actions';

      var call988 = document.createElement('a');
      call988.href = 'tel:988';
      call988.className = 'crisis-banner-btn mental-health';
      call988.appendChild(makePhoneSvg('w-5 h-5'));
      call988.appendChild(document.createTextNode('Call/Text 988'));
      actions.appendChild(call988);

      var chatLink = document.createElement('a');
      chatLink.href = 'https://988lifeline.org/chat/';
      chatLink.target = '_blank';
      chatLink.rel = 'noopener';
      chatLink.className = 'crisis-banner-btn-secondary';
      chatLink.textContent = 'Chat Online';
      actions.appendChild(chatLink);

      content.appendChild(actions);
    }

    // --- Close button ---
    var closeBtn = document.createElement('button');
    closeBtn.className = 'crisis-banner-close';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.textContent = '\u00D7';
    content.appendChild(closeBtn);

    banner.appendChild(content);

    // Insert inside the search container
    var searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
      searchContainer.appendChild(banner);
    } else {
      var searchInput = document.getElementById('search-input');
      if (searchInput && searchInput.parentElement) {
        searchInput.parentElement.appendChild(banner);
      }
    }

    // Announce crisis resources to screen readers (urgent)
    var urgentMessage = isEmergency
      ? 'If you are in danger, call 911 for emergency services.'
      : 'Crisis support is available. Call or text 988 for the Suicide and Crisis Lifeline, available 24/7.';
    if (_announceToScreenReader) {
      _announceToScreenReader(urgentMessage, true);
    }

    // Close handler
    closeBtn.addEventListener('click', function () {
      banner.remove();
    });
  }

  /**
   * Initialize crisis detection.
   * @param {{ announceToScreenReader: (msg: string, urgent?: boolean) => void }} deps
   */
  function init(deps) {
    _announceToScreenReader = deps.announceToScreenReader || null;
  }

  window.SearchCrisis = {
    init: init,
    checkForCrisis: checkForCrisis,
    showCrisisBanner: showCrisisBanner,
  };
})();
