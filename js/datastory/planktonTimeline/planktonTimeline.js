(function() {
  'use strict';
  function initializeTimeline() {
    const container = document.querySelector('[data-visual="plankton-timeline"]');
    if (!container) return;

    const dataLoader = window.PlanktonTimelineData;
    const controls = window.PlanktonTimelineControls;
    const renderer = window.PlanktonTimelineRenderer;
    
    const callbacks = {
      onSpeciesChange: () => {
        if (renderer && renderer.updateTimeline) {
          renderer.updateTimeline();
        }
        if (callbacks.updateLegend) {
          callbacks.updateLegend();
        }
      },
      onTimelineUpdate: () => {
        if (renderer && renderer.updateTimeline) {
          renderer.updateTimeline();
        }
      },
      onLegendUpdate: () => {
        if (callbacks.updateLegend) {
          callbacks.updateLegend();
        }
      }
    };

    dataLoader.loadAvailableSpecies().then(() => {
      controls.create(container, callbacks);
      if (renderer && renderer.updateTimeline) {
        renderer.updateTimeline();
      }
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (renderer && renderer.updateTimeline) {
          renderer.updateTimeline();
        }
      }, 250);
    });
  }

  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeTimeline);
    } else {
      initializeTimeline();
    }
  }

  window.PlanktonTimeline = {
    initialize
  };

  initialize();

})();
