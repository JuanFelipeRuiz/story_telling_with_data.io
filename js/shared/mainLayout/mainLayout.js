/**
 * Main Layout Component - Handles header and footer for all pages
 */
(function() {
  'use strict';

  /**
   * Creates the header element
   * @param {Object} options - Header configuration
   * @param {string} options.title - Header title
   * @param {string} options.backLink - Optional back link URL
   * @param {string} options.backLinkText - Text for back link
   */
  function createHeader(options = {}) {
    const {
      title = 'Aquascope',
      backLink = null,
      backLinkText = '← Back to Scroll Story'
    } = options;

    const headerContainer = document.querySelector('body');
    if (!headerContainer) return null;

    // Check if header already exists
    const existingHeader = document.querySelector('.header');
    if (existingHeader) {
      return existingHeader;
    }

    // Create header element
    const header = document.createElement('div');
    header.className = 'header';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'title';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    if (backLink) {
      const linkEl = document.createElement('a');
      linkEl.className = 'header-link';
      linkEl.href = backLink;
      linkEl.textContent = backLinkText;
      header.appendChild(linkEl);
    }
    
    // Insert at the beginning of body
    headerContainer.insertBefore(header, headerContainer.firstChild);
    
    return header;
  }

  /**
   * Loads and injects the footer into the page
   */
  function loadFooter() {
    const footerContainer = document.querySelector('body');
    if (!footerContainer) return;

    // Check if footer already exists
    if (document.querySelector('.footer')) {
      return;
    }

    // Create footer element
    const footer = document.createElement('div');
    footer.className = 'footer';
    footer.innerHTML = 'Based on Data from Aquascope via <a href="https://www.datalakes-eawag.ch/data" target="_blank">Datalake</a>. Built with D3 v7.';
    
    footerContainer.appendChild(footer);

    // Show footer only after user scrolls past the landing section
    function onScroll() {
      const landing = document.getElementById('landing');
      const threshold = landing ? landing.offsetHeight : window.innerHeight;
      if (window.scrollY > threshold) {
        footer.classList.add('footer--visible');
        window.removeEventListener('scroll', onScroll);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /**
   * Initialize main layout (header and footer)
   * @param {Object} headerOptions - Options for header creation
   */
  function init(headerOptions = null) {
    // Create header if options provided
    if (headerOptions) {
      createHeader(headerOptions);
    }

    // Always load footer
    loadFooter();
  }

  // Auto-load footer on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFooter);
  } else {
    loadFooter();
  }

  // Export API
  window.MainLayout = {
    init,
    createHeader,
    loadFooter
  };
})();

