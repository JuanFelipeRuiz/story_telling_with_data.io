/**
 * Story Interactions - Handles interactive elements in the scroll story
 */
(function() {
  'use strict';

  let planktonData = [];

  // Load plankton meta data from JSON file
  async function loadPlanktonMetaData() {
    try {
      const response = await fetch('images/svg_planktons/planktons.json');
      const data = await response.json();
      planktonData = data.planktons;
      return planktonData;
    } catch (error) {
      console.error('Error loading plankton data:', error);
      return [];
    }
  }

  function initializePlanktonFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
    const gallery = document.getElementById('plankton-gallery');
    
    if (!gallery || filterButtons.length === 0) return;

    let bigItemElement = null;
    let smallItemsContainer = null;
    let currentPage = 0;
    let selectedSmallItemElement = null;
    const ITEMS_PER_PAGE = 9; // 3x3 grid

    // Filter plankton data
    function filterPlanktonData(filter) {
      if (filter === 'all') return planktonData;
      if (filter === 'blue-algae') {
        const keywords = ['cyanobacteria', 'blue-green', 'cyanobacterium', 'cyanobakteria', 'aphanziano'];
        return planktonData.filter(item => {
          const text = `${item.name} ${item.description} ${item.id}`.toLowerCase();
          return keywords.some(keyword => text.includes(keyword));
        });
      }
      return planktonData.filter(item => item.type === filter);
    }

    // Render the gallery with the given filter
    function renderGallery(filter = 'all') {
      gallery.innerHTML = '';
      currentPage = 0;
      selectedSmallItemElement = null;
      
      if (planktonData.length === 0) {
        gallery.innerHTML = '<p>No plankton data available.</p>';
        return;
      }
      
      const items = filterPlanktonData(filter);

      if (items.length === 0) {
        gallery.innerHTML = '<p>No planktons found for this filter.</p>';
        return;
      }

      // Use first item as the default big item
      const bigItem = items[0];
      bigItemElement = createPlanktonItem(bigItem, 'big', true);
      gallery.appendChild(bigItemElement);
      
      // Create container for small items with scroll
      const smallItemsWrapper = document.createElement('div');
      smallItemsWrapper.className = 'plankton-small-items-wrapper';
      
      smallItemsContainer = document.createElement('div');
      smallItemsContainer.className = 'plankton-small-items-container';
      
      // Create all small items (including the big item so it can be reselected)
      items.forEach((item, index) => {
        const itemEl = createPlanktonItem(item, 'small', false);
        if (item.id === bigItem.id) {
          itemEl.classList.add('plankton-item-selected');
          selectedSmallItemElement = itemEl;
        }
        if (index >= ITEMS_PER_PAGE) itemEl.style.display = 'none';
        smallItemsContainer.appendChild(itemEl);
      });
      
      smallItemsWrapper.appendChild(smallItemsContainer);
      
      // Add navigation arrows if there are more items than fit on one page
      const hasMultiplePages = items.length > ITEMS_PER_PAGE;
      if (hasMultiplePages) {
        const createNavButton = (direction, label, arrow) => {
          const btn = document.createElement('button');
          btn.className = `plankton-nav-btn plankton-nav-${direction}`;
          btn.innerHTML = arrow;
          btn.setAttribute('aria-label', label);
          btn.disabled = direction === 'left';
          btn.style.opacity = direction === 'left' ? '0.5' : '1';
          btn.addEventListener('click', () => scrollSmallItems(direction === 'left' ? -1 : 1, items.length));
          return btn;
        };
        
        smallItemsWrapper.appendChild(createNavButton('left', 'Previous page', '←'));
        smallItemsWrapper.appendChild(createNavButton('right', 'Next page', '→'));
        updateNavButtons(items.length);
      }
      
      gallery.appendChild(smallItemsWrapper);
    }
    
    function scrollSmallItems(direction, totalItems) {
      if (!smallItemsContainer) return;
      
      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
      currentPage = Math.max(0, Math.min(currentPage + direction, totalPages - 1));
      
      const startIndex = currentPage * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
      
      smallItemsContainer.querySelectorAll('.plankton-item-small').forEach((item, index) => {
        item.style.display = (index >= startIndex && index < endIndex) ? '' : 'none';
      });
      
      updateNavButtons(totalItems);
    }
    
    function updateNavButtons(totalItems) {
      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
      const navLeft = gallery.querySelector('.plankton-nav-left');
      const navRight = gallery.querySelector('.plankton-nav-right');
      
      const updateButton = (btn, isDisabled) => {
        if (btn) {
          btn.disabled = isDisabled;
          btn.style.opacity = isDisabled ? '0.5' : '1';
        }
      };
      
      updateButton(navLeft, currentPage === 0);
      updateButton(navRight, currentPage >= totalPages - 1);
    }
    
    function updateBigItem(item, smallItemEl) {
      if (!bigItemElement || !item) return;
      
      const factSheetContent = bigItemElement.querySelector('.plankton-fact-sheet-content');
      if (factSheetContent) factSheetContent.innerHTML = generateFactSheetHTML(item);
      
      if (selectedSmallItemElement) selectedSmallItemElement.classList.remove('plankton-item-selected');
      if (smallItemEl) {
        smallItemEl.classList.add('plankton-item-selected');
        selectedSmallItemElement = smallItemEl;
      }
    }
    
    function createPlanktonItem(item, size, isBig) {
      const itemEl = document.createElement('div');
      itemEl.className = `plankton-item plankton-item-${size}`;
      
      if (isBig) {
        itemEl.innerHTML = `<div class="plankton-fact-sheet-content">${generateFactSheetHTML(item)}</div>`;
      } else {
        const svgPath = `images/svg_planktons/${item.svgFile}`;
        // Small item: just the image
        itemEl.innerHTML = `
          <div class="plankton-image-container">
            <img src="${svgPath}" alt="${item.name}" class="plankton-svg" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="plankton-placeholder" style="display: none;">${item.name}</div>
            <h4 class="plankton-name">${item.name}</h4>
          </div>
        `;
        // Small item: update big item on click (no fact sheet)
        itemEl.addEventListener('click', () => {
          updateBigItem(item, itemEl);
        });
      }
      
      return itemEl;
    }
    
    function generateFactSheetHTML(plankton) {
      const type = plankton.type.charAt(0).toUpperCase() + plankton.type.slice(1);
      return `
        <div class="plankton-fact-header">
          <div class="plankton-fact-title">
            <h3>${plankton.name}</h3>
            <p class="plankton-fact-type">${type}</p>
          </div>
        </div>
        <div class="plankton-fact-body">
          <p class="plankton-fact-description">${plankton.description}</p>
          <p class="plankton-fact-organization"><strong>Organization:</strong> ${plankton.organization}</p>
          <p class="plankton-fact-size"><strong>Size:</strong> ${plankton.size}</p>
        </div>
      `;
    }

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        renderGallery(filter);
      });
    });

    loadPlanktonMetaData().then(() => {
      renderGallery('all');
    });
  }

  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializePlanktonFilter);
    } else {
      initializePlanktonFilter();
    }
  }

  window.StoryInteractions = {
    initialize
  };

  initialize();

})();

