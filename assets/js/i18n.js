// Internationalization (i18n) system

const translations = {
  en: {
    // Header
    'site.title': 'Bay Area Discounts',
    'nav.all_programs': 'All Programs',
    'nav.student_resources': 'Student Resources',
    'nav.saved': 'Saved',
    
    // Search & Filters
    'search.placeholder': 'Search programs...',
    'filter.eligibility': 'Eligibility',
    'filter.category': 'Category',
    'filter.area': 'Area/County',
    'filter.all': 'All',
    'results.showing': 'Showing',
    'results.programs': 'programs',
    'results.program': 'program',
    'results.none': 'No programs match your search. Try different filters or search terms.',
    
    // Eligibility
    'eligibility.snap': 'SNAP/EBT/Medi-Cal',
    'eligibility.seniors': 'Seniors',
    'eligibility.youth': 'Youth',
    'eligibility.students': 'College Students',
    'eligibility.veterans': 'Active Duty/Veterans',
    'eligibility.families': 'Families & Caregivers',
    'eligibility.disabilities': 'People with Disabilities',
    'eligibility.nonprofits': 'Nonprofits',
    'eligibility.everyone': 'Everyone',
    
    // Program card
    'program.timeframe': 'Timeframe',
    'program.learn_more': 'Learn More',
    'program.apply': 'Apply',
    'program.verified': 'Verified',
    'program.new': 'New',
    
    // Actions
    'action.share': 'Share Search',
    'action.print': 'Print',
    'action.back_to_top': 'Back to top',
    'action.clear_filters': 'Clear all filters',
    
    // Favorites
    'favorites.title': 'My Saved Programs',
    'favorites.save': 'Save to favorites',
    'favorites.clear_all': 'Clear All',
    'favorites.back': 'Back to All Programs',
    'favorites.empty': 'No saved programs yet',
    'favorites.empty_subtitle': 'Click the heart icon on any program to save it here',
    
    // Messages
    'message.link_copied': 'Link copied to clipboard!',
        'favorites.empty': 'No saved programs yet',
        'favorites.empty_hint': 'Click the heart icon on any program to save it here',
        'favorites.storage_error': 'Saving favorites is unavailable in this browser/session.',
  },
  
  es: {
    // Header
    'site.title': 'Descuentos del Área de la Bahía',
    'nav.all_programs': 'Todos los Programas',
    'nav.student_resources': 'Recursos para Estudiantes',
    'nav.saved': 'Guardados',
    
    // Search & Filters
    'search.placeholder': 'Buscar programas...',
    'filter.eligibility': 'Elegibilidad',
    'filter.category': 'Categoría',
    'filter.area': 'Área/Condado',
    'filter.all': 'Todos',
    'results.showing': 'Mostrando',
    'results.programs': 'programas',
    'results.program': 'programa',
    'results.none': 'Ningún programa coincide con su búsqueda. Pruebe diferentes filtros o términos de búsqueda.',
    
    // Eligibility
    'eligibility.snap': 'SNAP/EBT/Medi-Cal',
    'eligibility.seniors': 'Adultos Mayores',
    'eligibility.youth': 'Jóvenes',
    'eligibility.students': 'Estudiantes Universitarios',
    'eligibility.veterans': 'Servicio Activo/Veteranos',
    'eligibility.families': 'Familias y Cuidadores',
    'eligibility.disabilities': 'Personas con Discapacidades',
    'eligibility.nonprofits': 'Organizaciones sin Fines de Lucro',
    'eligibility.everyone': 'Todos',
    
    // Program card
    'program.timeframe': 'Período',
    'program.learn_more': 'Más Información',
    'program.apply': 'Aplicar',
    'program.verified': 'Verificado',
    'program.new': 'Nuevo',
    
    // Actions
    'action.share': 'Compartir Búsqueda',
    'action.print': 'Imprimir',
    'action.back_to_top': 'Volver arriba',
    'action.clear_filters': 'Borrar todos los filtros',
    
    // Favorites
    'favorites.title': 'Mis Programas Guardados',
    'favorites.save': 'Guardar en favoritos',
    'favorites.clear_all': 'Borrar Todo',
    'favorites.back': 'Volver a Todos los Programas',
    'favorites.empty': 'Aún no hay programas guardados',
    'favorites.empty_subtitle': 'Haga clic en el ícono del corazón en cualquier programa para guardarlo aquí',
    
    // Messages
    'message.link_copied': '¡Enlace copiado al portapapeles!',
    'message.copy_failed': 'Error al copiar el enlace'
  }
};

class I18n {
  constructor() {
    this.currentLang = this.detectLanguage();
    this.init();
  }
  
  detectLanguage() {
    // Check URL parameter
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && translations[urlLang]) {
      return urlLang;
    }
    
    // Check localStorage
    const storedLang = localStorage.getItem('bayarea_lang');
    if (storedLang && translations[storedLang]) {
      return storedLang;
    }
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
      return browserLang;
    }
    
    return 'en'; // Default to English
  }
  
  setLanguage(lang) {
    if (!translations[lang]) return;
    
    this.currentLang = lang;
    localStorage.setItem('bayarea_lang', lang);
    
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('lang', lang);
    window.history.replaceState({}, '', url);
    
    this.updateUI();
  }
  
  t(key) {
    return translations[this.currentLang][key] || translations['en'][key] || key;
  }
  
  updateUI() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translation = this.t(key);
      
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    });
    
    // Update all elements with data-i18n-aria attribute
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.dataset.i18nAria;
      el.setAttribute('aria-label', this.t(key));
    });
    
    // Update document title
    if (this.currentLang === 'es') {
      document.title = 'Descuentos del Área de la Bahía';
    } else {
      document.title = 'Bay Area Discounts';
    }
  }
  
  init() {
    this.updateUI();
    
    // Add language switcher if it doesn't exist
    this.addLanguageSwitcher();
  }
  
  addLanguageSwitcher() {
    // Reuse existing switcher if present (avoids duplicates when include renders it)
    let switchBtn = document.getElementById('lang-switch');
    if (switchBtn) {
      this.wireLanguageSwitch(switchBtn);
      this.updateLanguageLabel(switchBtn);
      return;
    }

    const header = document.querySelector('.site-nav .nav-menu');
    if (!header) return;
    
    const langSwitcher = document.createElement('li');
    langSwitcher.innerHTML = `
      <button class="lang-switch" id="lang-switch" type="button" aria-label="Switch language">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span></span>
      </button>
    `;
    
    header.appendChild(langSwitcher);
    switchBtn = langSwitcher.querySelector('#lang-switch');
    this.updateLanguageLabel(switchBtn);
    this.wireLanguageSwitch(switchBtn);
  }

  updateLanguageLabel(button) {
    const labelSpan = button.querySelector('span');
    if (labelSpan) {
      labelSpan.textContent = this.currentLang === 'en' ? 'ES' : 'EN';
    }
  }

  wireLanguageSwitch(button) {
    if (!button) return;
    button.addEventListener('click', () => {
      const newLang = this.currentLang === 'en' ? 'es' : 'en';
      this.setLanguage(newLang);
      this.updateLanguageLabel(button);
    });
  }
}

// Initialize i18n
window.i18n = new I18n();

// Helper function for translations
window.t = (key) => window.i18n.t(key);
