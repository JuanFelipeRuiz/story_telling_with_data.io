/**
 * UI Controls for Plankton Timeline
 */

(function() {
  'use strict';

  function createControls(container, callbacks) {
    const config = window.PlanktonTimelineConfig;
    const utils = window.PlanktonTimelineUtils;

    // ── Top controls ──────────────────────────────────────────────────────────

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'timeline-controls';
    controlsDiv.style.background = 'var(--gray-light)';
    controlsDiv.style.border = 'none';
    controlsDiv.style.padding = '4px 8px';
    controlsDiv.style.borderRadius = '6px';
    controlsDiv.style.marginBottom = '2px';

    // Title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'timeline-title';
    titleDiv.textContent = 'Blue-Green Algae (Cyanobacteria) in Greifensee, April 2025 to March 2026';
    titleDiv.style.fontSize = '1rem';
    titleDiv.style.fontWeight = '500';
    titleDiv.style.textAlign = 'center';
    titleDiv.style.marginTop = '2px';
    titleDiv.style.marginBottom = '2px';
    titleDiv.style.padding = '0';
    titleDiv.style.color = 'var(--text)';

    // Two rows of species boxes grouped by magnification
    const speciesRowsContainer = document.createElement('div');
    speciesRowsContainer.className = 'timeline-species-rows';

    function getDisplayName(species) {
      // Strip magnification suffix since the row label already indicates it
      return species.name.replace(/ [-–] \d+\.\d+[×x]$/, '');
    }

    function renderSpeciesBoxes() {
      const allSpecies = config.getAvailableSpecies();
      const selectedSpeciesIds = config.getSelectedSpeciesIds();

      // Build color map across all species for stable colors
      const allKeys = allSpecies.map(s => utils.mapSpeciesIdToDataKey(s.id));
      const colorOf = utils.createColorMapForSpecies(allKeys);

      speciesRowsContainer.innerHTML = '';

      const groups = [
        { label: '5.0× magnification', species: allSpecies.filter(s => s.magnification === '5.0x') },
        { label: '0.5× magnification', species: allSpecies.filter(s => s.magnification === '0.5x') }
      ];

      groups.forEach(group => {
        if (group.species.length === 0) return;

        const rowGroup = document.createElement('div');
        rowGroup.className = 'timeline-species-row-group';

        const rowLabel = document.createElement('span');
        rowLabel.className = 'timeline-species-row-label';
        rowLabel.textContent = group.label;

        const row = document.createElement('div');
        row.className = 'timeline-species-row';

        group.species.forEach(species => {
          const isSelected = selectedSpeciesIds.includes(species.id);
          const dataKey = utils.mapSpeciesIdToDataKey(species.id);
          const color = colorOf.get(dataKey) || utils.getSpeciesColor(dataKey, 0);

          const box = document.createElement('button');
          box.className = 'timeline-species-box' + (isSelected ? ' active' : '');
          box.dataset.speciesId = species.id;
          box.style.setProperty('--species-color', color);

          const swatch = document.createElement('span');
          swatch.className = 'timeline-species-swatch';

          const label = document.createElement('span');
          label.textContent = getDisplayName(species);

          box.appendChild(swatch);
          box.appendChild(label);

          box.addEventListener('click', () => {
            const current = config.getSelectedSpeciesIds();
            const newSelection = current.includes(species.id)
              ? current.filter(id => id !== species.id)
              : [...current, species.id];

            if (newSelection.length === 0) return;

            config.setSelectedSpeciesIds(newSelection);
            renderSpeciesBoxes();
            callbacks?.onSpeciesChange?.();
          });

          row.appendChild(box);
        });

        rowGroup.appendChild(rowLabel);
        rowGroup.appendChild(row);
        speciesRowsContainer.appendChild(rowGroup);
      });
    }

    // Expose for external callers (legend update)
    if (callbacks) {
      callbacks.updateLegend = renderSpeciesBoxes;
    }

    controlsDiv.appendChild(speciesRowsContainer);

    // ── Bottom controls (unit + timespan) — rendered below the SVG ───────────

    const bottomControlsDiv = document.createElement('div');
    bottomControlsDiv.className = 'timeline-bottom-controls';

    // Unit buttons
    const unitLabel = document.createElement('label');
    unitLabel.textContent = 'Unit: ';

    const unitButtons = document.createElement('div');
    unitButtons.className = 'timeline-unit-buttons';
    unitButtons.style.display = 'inline-flex';
    unitButtons.style.gap = '8px';

    ['roi_hour', 'roi_day'].forEach(unit => {
      const btn = document.createElement('button');
      btn.className = `timeline-unit-btn ${unit === config.getSelectedUnit() ? 'active' : ''}`;
      btn.textContent = unit.replace('_', '/');
      btn.dataset.unit = unit;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.timeline-unit-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        config.setSelectedUnit(unit);
        callbacks?.onTimelineUpdate?.();
      });
      unitButtons.appendChild(btn);
    });

    // Timespan buttons
    const timespanLabel = document.createElement('label');
    timespanLabel.textContent = 'Time Span: ';

    const timespanButtons = document.createElement('div');
    timespanButtons.className = 'timeline-timespan-buttons';
    timespanButtons.style.display = 'inline-flex';
    timespanButtons.style.gap = '8px';

    ['1W', '1M', '3M', 'All'].forEach(timespan => {
      const btn = document.createElement('button');
      btn.className = `timeline-timespan-btn ${timespan === config.getSelectedTimespan() ? 'active' : ''}`;
      btn.textContent = timespan;
      btn.dataset.timespan = timespan;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.timeline-timespan-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        config.setSelectedTimespan(timespan);
        utils.updateTimeRangeFromTimespan();
        callbacks?.onTimelineUpdate?.();
      });
      timespanButtons.appendChild(btn);
    });

    bottomControlsDiv.appendChild(unitLabel);
    bottomControlsDiv.appendChild(unitButtons);
    bottomControlsDiv.appendChild(timespanLabel);
    bottomControlsDiv.appendChild(timespanButtons);

    // ── Mount into svgContainer ───────────────────────────────────────────────
    // Order: titleDiv → controlsDiv → [SVG inserted by renderer] → bottomControlsDiv

    const svgContainer = container.querySelector('.timeline-svg-container');
    if (svgContainer) {
      svgContainer.appendChild(titleDiv);
      svgContainer.appendChild(controlsDiv);
      svgContainer.appendChild(bottomControlsDiv); // sentinel: renderer inserts SVG before this
    }

    // Initial render of species boxes
    renderSpeciesBoxes();
  }

  window.PlanktonTimelineControls = {
    create: createControls
  };

})();
