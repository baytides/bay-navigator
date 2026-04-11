/**
 * Carl UI Renderer - DOM rendering for chat messages and UI elements
 * Handles message bubbles, markdown parsing, citations, feedback buttons,
 * program cards, follow-up suggestions, crisis dialogs, and loading indicators.
 *
 * Requires init() to receive DOM references and callbacks from the main script.
 */

(function () {
  'use strict';

  // Injected via init()
  var messagesContainer = null;
  var callbacks = {};
  // callbacks.getProgramLink(program) -> url string
  // callbacks.setCarlState(state) -> void
  // callbacks.sendMessage() -> void
  // callbacks.getInput() -> input element
  // callbacks.getIsLoading() -> boolean
  // callbacks.addShownProgramId(id) -> void

  /**
   * Initialize with DOM references and callbacks.
   * @param {Object} config
   * @param {HTMLElement} config.messagesContainer
   * @param {Object} config.callbacks - Functions from the main script
   */
  function init(config) {
    messagesContainer = config.messagesContainer || null;
    callbacks = config.callbacks || {};
  }

  // ============================================
  // RESPONSE BUBBLES
  // ============================================

  function createResponseBubble() {
    var wrapper = document.createElement('div');
    wrapper.className = 'assistant-message';

    var bubble = document.createElement('div');
    bubble.className =
      'bg-neutral-100 dark:bg-neutral-700 rounded-2xl rounded-tl-sm p-3 max-w-[85%]';

    var text = document.createElement('p');
    text.className = 'text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap';

    bubble.appendChild(text);
    wrapper.appendChild(bubble);
    if (messagesContainer) messagesContainer.appendChild(wrapper);

    return text;
  }

  function updateResponseBubble(element, text) {
    if (element) {
      element.textContent = '';
      var parsed = parseMarkdownToDOM(text);
      element.appendChild(parsed);
      if (messagesContainer) {
        messagesContainer.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
        });
      }
    }
  }

  // ============================================
  // MARKDOWN PARSER (builds DOM safely)
  // ============================================

  function parseMarkdownToDOM(text) {
    var container = document.createDocumentFragment();
    var paragraphs = text.split(/\n\n+/);

    paragraphs.forEach(function (para) {
      var trimmedPara = para.trim();
      if (!trimmedPara) return;

      if (isListParagraph(trimmedPara)) {
        var list = parseList(trimmedPara);
        container.appendChild(list);
      } else {
        var p = document.createElement('span');
        p.className = 'block mb-2 last:mb-0';

        var lines = trimmedPara.split('\n');
        lines.forEach(function (line, lineIndex) {
          parseInlineElements(line, p);
          if (lineIndex < lines.length - 1) {
            p.appendChild(document.createElement('br'));
          }
        });

        container.appendChild(p);
      }
    });

    return container;
  }

  function isListParagraph(text) {
    var lines = text.split('\n').filter(function (l) {
      return l.trim();
    });
    if (lines.length === 0) return false;
    return lines.every(function (line) {
      var trimmed = line.trim();
      return /^[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);
    });
  }

  function parseList(text) {
    var lines = text.split('\n').filter(function (l) {
      return l.trim();
    });
    var isOrdered = /^\d+\./.test(lines[0].trim());
    var list = document.createElement(isOrdered ? 'ol' : 'ul');
    list.className = isOrdered
      ? 'list-decimal list-inside space-y-1 mb-2'
      : 'list-disc list-inside space-y-1 mb-2';

    lines.forEach(function (line) {
      var li = document.createElement('li');
      li.className = 'text-sm';
      var content = line
        .trim()
        .replace(/^[-*]\s*/, '')
        .replace(/^\d+\.\s*/, '');
      parseInlineElements(content, li);
      list.appendChild(li);
    });

    return list;
  }

  function parseInlineElements(text, container) {
    var patterns = [
      { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },
      { regex: /\*([^*]+)\*/g, type: 'italic' },
      { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link' },
      { regex: /(?<!\]\()https:\/\/[^\s)<>]+/g, type: 'bare_url' },
    ];

    var matches = [];
    patterns.forEach(function (pat) {
      var match;
      var r = new RegExp(pat.regex.source, 'g');
      while ((match = r.exec(text)) !== null) {
        matches.push({
          type: pat.type,
          start: match.index,
          end: match.index + match[0].length,
          text: pat.type === 'bare_url' ? match[0] : match[1],
          url: match[2] || null,
        });
      }
    });

    matches.sort(function (a, b) {
      return a.start - b.start;
    });

    var filteredMatches = [];
    var lastEnd = 0;
    matches.forEach(function (m) {
      if (m.start >= lastEnd) {
        filteredMatches.push(m);
        lastEnd = m.end;
      }
    });

    var pos = 0;
    filteredMatches.forEach(function (m) {
      if (m.start > pos) {
        container.appendChild(document.createTextNode(text.slice(pos, m.start)));
      }

      if (m.type === 'bold') {
        var strong = document.createElement('strong');
        strong.className = 'font-semibold';
        strong.textContent = m.text;
        container.appendChild(strong);
      } else if (m.type === 'italic') {
        var em = document.createElement('em');
        em.textContent = m.text;
        container.appendChild(em);
      } else if (m.type === 'link') {
        var link = document.createElement('a');
        if (m.url && (m.url.startsWith('/') || m.url.startsWith('https://'))) {
          link.href = m.url;
          link.className = 'text-primary-700 dark:text-primary-400 hover:underline';
          if (m.url.startsWith('https://')) {
            link.rel = 'noopener noreferrer';
            link.target = '_blank';
            // WCAG 3.0: Indicate new window to screen readers
            var srHint = document.createElement('span');
            srHint.className = 'sr-only';
            srHint.textContent = ' (opens in new tab)';
            link.appendChild(document.createTextNode(m.text));
            link.appendChild(srHint);
            pos = m.end;
            container.appendChild(link);
            return;
          }
        }
        link.textContent = m.text;
        container.appendChild(link);
      } else if (m.type === 'bare_url') {
        var aTag = document.createElement('a');
        aTag.href = m.text;
        aTag.className = 'text-primary-700 dark:text-primary-400 hover:underline';
        aTag.rel = 'noopener noreferrer';
        aTag.target = '_blank';
        try {
          var urlObj = new URL(m.text);
          aTag.appendChild(
            document.createTextNode(urlObj.hostname + urlObj.pathname.replace(/\/$/, ''))
          );
        } catch (e) {
          aTag.appendChild(document.createTextNode(m.text));
        }
        // WCAG 3.0: Indicate new window to screen readers
        var srNewTab = document.createElement('span');
        srNewTab.className = 'sr-only';
        srNewTab.textContent = ' (opens in new tab)';
        aTag.appendChild(srNewTab);
        container.appendChild(aTag);
      }

      pos = m.end;
    });

    if (pos < text.length) {
      container.appendChild(document.createTextNode(text.slice(pos)));
    }
  }

  // ============================================
  // UTILITY
  // ============================================

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // CITATIONS
  // ============================================

  function createCitationFooter(citations) {
    if (!citations || citations.length === 0) return null;

    var footer = document.createElement('div');
    footer.className = 'mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-600';

    var label = document.createElement('p');
    label.className = 'text-xs text-neutral-600 dark:text-neutral-300 mb-1';
    label.textContent = 'Sources:';
    footer.appendChild(label);

    var list = document.createElement('ul');
    list.className = 'text-xs space-y-0.5';

    citations.forEach(function (citation, index) {
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = citation.url;
      link.className = 'text-primary-700 dark:text-primary-400 hover:underline';
      link.textContent = '[' + (index + 1) + '] ' + citation.name;
      item.appendChild(link);
      list.appendChild(item);
    });

    footer.appendChild(list);
    return footer;
  }

  function findCitedPrograms(responseText, relevantPrograms) {
    if (!relevantPrograms || relevantPrograms.length === 0) return [];

    var citations = [];
    var responseLower = responseText.toLowerCase();

    var sortedPrograms = relevantPrograms.slice().sort(function (a, b) {
      return (b.name ? b.name.length : 0) - (a.name ? a.name.length : 0);
    });

    sortedPrograms.forEach(function (program) {
      if (!program.name) return;

      var nameLower = program.name.toLowerCase();
      if (
        responseLower.includes(nameLower) &&
        !citations.find(function (c) {
          return c.id === program.id;
        })
      ) {
        citations.push({
          id: program.id,
          name: program.name,
          url: callbacks.getProgramLink ? callbacks.getProgramLink(program) : '#',
        });
      }
    });

    return citations;
  }

  function addCitationsToResponse(responseBubble, responseText, relevantPrograms) {
    var citations = findCitedPrograms(responseText, relevantPrograms);
    if (citations.length === 0) return;

    var bubbleContainer = responseBubble.parentElement;
    if (bubbleContainer) {
      var citationFooter = createCitationFooter(citations);
      if (citationFooter) {
        bubbleContainer.appendChild(citationFooter);
      }
    }
  }

  // ============================================
  // FEEDBACK BUTTONS
  // ============================================

  function createThumbButton(sentiment, questionText) {
    var btn = document.createElement('button');
    btn.className =
      'p-1.5 rounded-lg transition-all hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300';
    btn.setAttribute('aria-label', sentiment === 'up' ? 'Helpful' : 'Not helpful');
    btn.dataset.sentiment = sentiment;

    if (sentiment === 'up') {
      btn.innerHTML =
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>';
    } else {
      btn.innerHTML =
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-6h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/></svg>';
    }

    return btn;
  }

  function createFeedbackButtons(questionText) {
    var wrapper = document.createElement('div');
    wrapper.className =
      'flex items-center gap-1 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600';

    var label = document.createElement('span');
    label.className = 'text-xs text-neutral-600 dark:text-neutral-300 mr-1';
    label.setAttribute('role', 'status');
    label.setAttribute('aria-live', 'polite');
    label.textContent = 'Helpful?';

    var thumbsUp = createThumbButton('up', questionText);
    var thumbsDown = createThumbButton('down', questionText);

    var handleFeedback = function (selectedBtn, otherBtn, sentiment) {
      if (window.analytics && window.analytics.trackCarlFeedback) {
        window.analytics.trackCarlFeedback(questionText, sentiment);
      }

      selectedBtn.classList.remove(
        'text-neutral-600',
        'hover:text-neutral-700',
        'dark:hover:text-neutral-300'
      );
      selectedBtn.classList.add(
        sentiment === 'up' ? 'text-green-500' : 'text-red-500',
        'cursor-default'
      );
      selectedBtn.querySelector('svg').setAttribute('fill', 'currentColor');

      selectedBtn.disabled = true;
      otherBtn.disabled = true;
      otherBtn.classList.add('opacity-30', 'cursor-default');
      otherBtn.classList.remove('hover:bg-neutral-200', 'dark:hover:bg-neutral-600');

      label.textContent = sentiment === 'up' ? 'Thanks!' : 'Thanks for feedback';

      if (sentiment === 'up' && callbacks.setCarlState) {
        callbacks.setCarlState('happy');
        setTimeout(function () {
          callbacks.setCarlState('idle');
        }, 600);
      }
    };

    thumbsUp.addEventListener('click', function () {
      handleFeedback(thumbsUp, thumbsDown, 'up');
    });
    thumbsDown.addEventListener('click', function () {
      handleFeedback(thumbsDown, thumbsUp, 'down');
    });

    wrapper.appendChild(label);
    wrapper.appendChild(thumbsUp);
    wrapper.appendChild(thumbsDown);

    return wrapper;
  }

  function addFeedbackToResponse(responseBubble, questionText) {
    var bubbleContainer = responseBubble.parentElement;
    if (bubbleContainer) {
      var feedbackButtons = createFeedbackButtons(questionText);
      bubbleContainer.appendChild(feedbackButtons);
    }
  }

  // ============================================
  // PROGRAM CARDS
  // ============================================

  function addProgramCards(programs) {
    var wrapper = document.createElement('div');
    wrapper.className = 'assistant-message mt-2';

    var cardsContainer = document.createElement('div');
    cardsContainer.className = 'space-y-2';

    var header = document.createElement('p');
    header.className = 'text-xs text-neutral-600 dark:text-neutral-300 mb-2';
    header.textContent = 'Related programs:';
    cardsContainer.appendChild(header);

    programs.forEach(function (program) {
      if (program.id && callbacks.addShownProgramId) {
        callbacks.addShownProgramId(program.id);
      }
      var card = document.createElement('a');
      card.href = callbacks.getProgramLink ? callbacks.getProgramLink(program) : '#';
      card.className =
        'block bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-xl p-3 hover:border-primary-500 hover:shadow-md transition-all group';

      var inner = document.createElement('div');
      inner.className = 'flex items-center justify-between gap-2';

      var content = document.createElement('div');
      content.className = 'flex-1 min-w-0';

      var name = document.createElement('h4');
      name.className =
        'font-medium text-sm text-neutral-900 dark:text-white truncate group-hover:text-primary-700';
      name.textContent = program.name;
      content.appendChild(name);

      if (program.category) {
        var cat = document.createElement('span');
        cat.className = 'text-xs text-primary-700 dark:text-primary-400';
        cat.textContent = program.category;
        content.appendChild(cat);
      }

      inner.appendChild(content);

      var arrow = document.createElement('div');
      arrow.className = 'text-neutral-600 group-hover:text-primary-700 transition-colors';
      arrow.setAttribute('aria-hidden', 'true');
      var arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrowSvg.setAttribute('class', 'w-4 h-4');
      arrowSvg.setAttribute('fill', 'none');
      arrowSvg.setAttribute('stroke', 'currentColor');
      arrowSvg.setAttribute('viewBox', '0 0 24 24');
      arrowSvg.setAttribute('aria-hidden', 'true');
      var arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arrowPath.setAttribute('stroke-linecap', 'round');
      arrowPath.setAttribute('stroke-linejoin', 'round');
      arrowPath.setAttribute('stroke-width', '2');
      arrowPath.setAttribute('d', 'M9 5l7 7-7 7');
      arrowSvg.appendChild(arrowPath);
      arrow.appendChild(arrowSvg);
      inner.appendChild(arrow);

      card.appendChild(inner);
      cardsContainer.appendChild(card);
    });

    wrapper.appendChild(cardsContainer);
    if (messagesContainer) {
      messagesContainer.appendChild(wrapper);
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }

  // ============================================
  // FOLLOW-UP SUGGESTIONS
  // ============================================

  function addFollowUpSuggestions(userMessage, aiResponse, location) {
    var lowerResp = aiResponse.toLowerCase();
    var suggestions = [];

    if (
      lowerResp.includes('what city') ||
      lowerResp.includes('what zip') ||
      lowerResp.includes('where are you') ||
      lowerResp.includes('which county') ||
      lowerResp.includes('can you tell me more') ||
      lowerResp.includes('could you clarify')
    ) {
      return;
    }

    var mentionedPrograms =
      lowerResp.includes('calfresh') ||
      lowerResp.includes('medi-cal') ||
      lowerResp.includes('section 8') ||
      lowerResp.includes('snap') ||
      lowerResp.includes('wic') ||
      lowerResp.includes('care program') ||
      lowerResp.includes('lifeline') ||
      lowerResp.includes('calworks');

    var mentionedFood =
      lowerResp.includes('food') || lowerResp.includes('calfresh') || lowerResp.includes('pantry');
    var mentionedHealth =
      lowerResp.includes('medi-cal') ||
      lowerResp.includes('healthcare') ||
      lowerResp.includes('clinic');
    var mentionedHousing =
      lowerResp.includes('section 8') ||
      lowerResp.includes('housing') ||
      lowerResp.includes('rent');
    var mentionedUtilities =
      lowerResp.includes('utility') ||
      lowerResp.includes('care program') ||
      lowerResp.includes('lifeline');

    if (mentionedPrograms) {
      if (mentionedFood) {
        suggestions.push('What are the income limits?');
        suggestions.push('Where can I apply?');
      } else if (mentionedHealth) {
        suggestions.push('What does Medi-Cal cover?');
        suggestions.push('I need dental care');
      } else if (mentionedHousing) {
        suggestions.push('How do I get on the waitlist?');
        suggestions.push("I'm facing eviction");
      } else if (mentionedUtilities) {
        suggestions.push('How do I sign up for CARE?');
        suggestions.push('Help with internet too');
      }
    }

    if (!location && suggestions.length === 0) {
      suggestions.push("I'm in San Francisco");
      suggestions.push("I'm in Oakland");
    }

    if (suggestions.length > 0 && suggestions.length < 3) {
      suggestions.push('What else is available?');
    }

    var finalSuggestions = suggestions.slice(0, 3);
    if (finalSuggestions.length === 0) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'flex flex-wrap gap-2 mt-3';
    wrapper.setAttribute('role', 'group');
    wrapper.setAttribute('aria-label', 'Follow-up suggestions');

    finalSuggestions.forEach(function (suggestion) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'text-xs px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-900 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors';
      btn.textContent = suggestion;
      btn.addEventListener('click', function () {
        var inputEl = callbacks.getInput ? callbacks.getInput() : null;
        var loading = callbacks.getIsLoading ? callbacks.getIsLoading() : false;
        if (inputEl && !loading) {
          inputEl.value = suggestion;
          if (callbacks.sendMessage) callbacks.sendMessage();
        }
      });
      wrapper.appendChild(btn);
    });

    if (messagesContainer) {
      messagesContainer.appendChild(wrapper);
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }

  // ============================================
  // CRISIS DIALOG
  // ============================================

  function showCrisisDialog(type) {
    var isEmergency = type === 'emergency';
    // Store trigger for focus restoration
    var triggerElement = document.activeElement;

    var dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'crisis-dialog-title');

    var content = document.createElement('div');
    content.className = 'bg-white dark:bg-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl';

    var iconBg = isEmergency ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30';
    var iconColor = isEmergency ? 'text-red-600' : 'text-blue-600';
    var titleColor = isEmergency
      ? 'text-red-700 dark:text-red-400'
      : 'text-blue-700 dark:text-blue-400';
    var titleText = isEmergency ? 'Emergency Resources' : 'Crisis Support Available';
    var descText = isEmergency
      ? 'If you or someone else is in immediate danger, please call 911.'
      : "If you're experiencing a mental health crisis, help is available 24/7.";

    var iconSvg = isEmergency
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>';

    var resourcesHtml = isEmergency
      ? '<a href="tel:911" class="flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors"><div class="flex-1"><div class="font-semibold text-neutral-900 dark:text-white">Emergency Services</div><div class="text-sm text-red-600 font-medium">Call 911</div></div></a>'
      : '<a href="tel:988" class="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"><div class="flex-1"><div class="font-semibold text-neutral-900 dark:text-white">988 Suicide &amp; Crisis Lifeline</div><div class="text-sm text-blue-600 font-medium">Call or text 988</div></div></a><a href="sms:741741&body=HOME" class="flex items-center gap-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"><div class="flex-1"><div class="font-semibold text-neutral-900 dark:text-white">Crisis Text Line</div><div class="text-sm text-blue-600 font-medium">Text HOME to 741741</div></div></a>';

    content.innerHTML =
      '<div class="flex items-center gap-3 mb-4">' +
      '<div class="w-12 h-12 rounded-full flex items-center justify-center ' +
      iconBg +
      '">' +
      '<svg class="w-6 h-6 ' +
      iconColor +
      '" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
      iconSvg +
      '</svg>' +
      '</div>' +
      '<h3 id="crisis-dialog-title" class="text-lg font-bold ' +
      titleColor +
      '">' +
      titleText +
      '</h3>' +
      '</div>' +
      '<p class="text-neutral-700 dark:text-neutral-300 mb-6">' +
      descText +
      '</p>' +
      '<div class="space-y-3">' +
      resourcesHtml +
      '</div>' +
      '<button type="button" class="w-full mt-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-800" id="crisis-dialog-close" aria-label="Close dialog and continue searching">Continue searching</button>';

    dialog.appendChild(content);
    document.body.appendChild(dialog);

    // WCAG: Focus the first interactive element (emergency link)
    var firstLink = content.querySelector('a');
    if (firstLink) firstLink.focus();

    // WCAG: Close on click outside or close button
    function closeDialog() {
      dialog.remove();
      // WCAG: Restore focus to trigger element
      if (triggerElement && triggerElement.focus) triggerElement.focus();
    }

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.id === 'crisis-dialog-close') {
        closeDialog();
      }
    });

    // WCAG: Close on Escape key
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeDialog();
        return;
      }
      // WCAG: Focus trap — keep Tab within dialog
      if (e.key === 'Tab') {
        var focusable = content.querySelectorAll(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  // ============================================
  // GENERIC MESSAGES & LOADING
  // ============================================

  function addMessage(text, role, isError) {
    isError = isError || false;
    var wrapper = document.createElement('div');
    wrapper.className = role === 'user' ? 'flex justify-end' : 'assistant-message';

    var bubble = document.createElement('div');
    if (role === 'user') {
      bubble.className = 'bg-primary-600 text-white rounded-2xl rounded-tr-sm p-3 max-w-[85%]';
    } else {
      bubble.className =
        (isError ? 'bg-red-100 dark:bg-red-900/30' : 'bg-neutral-100 dark:bg-neutral-700') +
        ' rounded-2xl rounded-tl-sm p-3 max-w-[85%]';
    }

    var textEl = document.createElement('p');
    textEl.className =
      'text-sm ' +
      (role === 'user' ? 'text-white' : 'text-neutral-800 dark:text-neutral-200') +
      ' whitespace-pre-wrap';
    textEl.textContent = text;

    bubble.appendChild(textEl);
    wrapper.appendChild(bubble);
    if (messagesContainer) {
      messagesContainer.appendChild(wrapper);
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }

  function addLoadingIndicator() {
    var wrapper = document.createElement('div');
    wrapper.className = 'assistant-message loading-indicator';

    var bubble = document.createElement('div');
    bubble.className =
      'bg-neutral-100 dark:bg-neutral-700 rounded-2xl rounded-tl-sm p-3 max-w-[85%]';

    // WCAG: Announce loading state to screen readers
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-label', 'Loading response');
    var srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = 'Loading response...';
    bubble.appendChild(srText);

    var dots = document.createElement('div');
    dots.className = 'flex gap-1';
    dots.setAttribute('aria-hidden', 'true');
    dots.innerHTML =
      '<span class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>' +
      '<span class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>' +
      '<span class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>';

    bubble.appendChild(dots);
    wrapper.appendChild(bubble);
    if (messagesContainer) {
      messagesContainer.appendChild(wrapper);
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
    return wrapper;
  }

  // Expose globally
  window.CarlUI = {
    init: init,
    createResponseBubble: createResponseBubble,
    updateResponseBubble: updateResponseBubble,
    parseMarkdownToDOM: parseMarkdownToDOM,
    isListParagraph: isListParagraph,
    parseList: parseList,
    parseInlineElements: parseInlineElements,
    escapeRegex: escapeRegex,
    escapeHtml: escapeHtml,
    createCitationFooter: createCitationFooter,
    findCitedPrograms: findCitedPrograms,
    addCitationsToResponse: addCitationsToResponse,
    createThumbButton: createThumbButton,
    createFeedbackButtons: createFeedbackButtons,
    addFeedbackToResponse: addFeedbackToResponse,
    addProgramCards: addProgramCards,
    addFollowUpSuggestions: addFollowUpSuggestions,
    showCrisisDialog: showCrisisDialog,
    addMessage: addMessage,
    addLoadingIndicator: addLoadingIndicator,
  };
})();
