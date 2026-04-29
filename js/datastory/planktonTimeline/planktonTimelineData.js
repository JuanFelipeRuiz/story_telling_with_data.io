/**
 * Data loading functions for Plankton Timeline
 */

(function() {
  'use strict';

  /**
   * Load available species from planktons.json
   */
  async function loadAvailableSpecies() {
    try {
      const response = await fetch('images/svg_planktons/planktons.json');
      const data = await response.json();
      
      const config = window.PlanktonTimelineConfig;
      const SPECIES_TO_DATA_KEYS = config.SPECIES_TO_DATA_KEYS;
      
      // Create species list with magnification info
      // For cyanobacteria, create separate entries for each magnification
      const availableSpecies = [];
      
      // Only load cyanobacteria (Blaualgen) species
      data.planktons.forEach(plankton => {
        if (plankton.id === 'cyanobakteria') {
          availableSpecies.push({
            id: 'cyanobakteria_5p0x',
            name: 'Cyanobacteria (Filamentous) - 5.0×',
            type: plankton.type,
            svgFile: plankton.svgFile,
            description: plankton.description,
            size: plankton.size,
            organization: plankton.organization,
            magnification: '5.0x'
          });
          availableSpecies.push({
            id: 'cyanobakteria_0p5x',
            name: 'Cyanobacteria (Filamentous) - 0.5×',
            type: plankton.type,
            svgFile: plankton.svgFile,
            description: plankton.description,
            size: plankton.size,
            organization: plankton.organization,
            magnification: '0.5x'
          });
        } else if (
          (plankton.id === 'cyanobakteria_colonial_clathrate' || plankton.id === 'aphanziano') &&
          SPECIES_TO_DATA_KEYS[plankton.id]
        ) {
          availableSpecies.push({
            ...plankton,
            magnification: SPECIES_TO_DATA_KEYS[plankton.id].magnification
          });
        }
      });
      
      config.setAvailableSpecies(availableSpecies);
      
      // Filter by magnification
      if (window.PlanktonTimelineUtils) {
        window.PlanktonTimelineUtils.filterSpeciesByMagnification();
      }
      
      return availableSpecies;
    } catch (error) {
      console.error('Error loading species:', error);
      return [];
    }
  }

  /**
   * Build file list for date range
   */
  function buildAquascopeFileList(basePath, lake, start, end) {
    const files = [];
    const d = new Date(start);

    while (d <= end) {
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();

      const now = new Date();
      if (year === now.getUTCFullYear() && month === now.getUTCMonth()) {
        break;
      }

      const monthStr = String(month + 1).padStart(2, "0");
      
      let startTime = "00_00_00.000Z";
      if (year > 2025 || (year === 2025 && month >= 7)) {
        startTime = "01_00_00.000Z";
      }
      
      const startStr = `${year}-${monthStr}-01T${startTime}`;

      let endStr;
      if (year > 2025 || (year === 2025 && month >= 6)) {
        const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        endStr = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}T23_00_00.000Z`;
      } else {  
        const nextMonth = new Date(Date.UTC(year, month + 1, 1));
        endStr = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}-01T00_00_00.000Z`;
      }

      const filename = `${basePath}${lake} Aquascope_${startStr}_${endStr}.json`;
      files.push([filename]);

      d.setUTCMonth(d.getUTCMonth() + 1);
    }

    return files;
  }

  /**
   * Load timeline data for selected species
   */
  async function loadTimelineData(speciesId) {
    try {
      const config = window.PlanktonTimelineConfig;
      const SPECIES_TO_DATA_KEYS = config.SPECIES_TO_DATA_KEYS;
      const timelineData = config.getTimelineData();
      
      const startDate = window.AppConstants ?
        window.AppConstants.DEFAULT_DATE_RANGE.start : new Date('2025-04-01T00:00:00Z');
      const endDate = window.AppConstants ?
        window.AppConstants.DEFAULT_DATE_RANGE.getEnd() : new Date('2026-03-31T23:59:59Z');

      const dataPath = window.AppConstants ?
        window.AppConstants.getDataPath('aquascope') : 'data/aquascope_0425_0426/';
      const lake = window.AppConstants ?
        window.AppConstants.DEFAULT_LAKE : 'Lake_Greifen';

      const fileCandidates = buildAquascopeFileList(dataPath, lake, startDate, endDate);
      
      const dataKeys = SPECIES_TO_DATA_KEYS[speciesId]?.keys || [];
      if (dataKeys.length === 0) {
        console.warn(`No data keys for species: ${speciesId}`);
        return null;
      }

      const speciesData = [];
      let loadedCount = 0;

      for (const candidates of fileCandidates) {
        let data = null;

        for (const f of candidates) {
          try {
            const res = await fetch(encodeURI(f));
            if (res.ok) {
              data = await res.json();
              loadedCount++;
              break;
            }
          } catch (e) {
            console.warn(`Error loading ${f}:`, e.message);
          }
        }

        if (!data || !data.x || !Array.isArray(data.x)) continue;

        const times = data.x.map(t => {
          if (typeof t === 'number' && t > 0) {
            const date = new Date(t * 1000);
            if (date >= startDate && date <= endDate) {
              return date;
            }
          }
          return null;
        });

        const timeMap = new Map();
        
        dataKeys.forEach(key => {
          const values = data[key];
          if (!values || !Array.isArray(values)) return;

          values.forEach((v, i) => {
            // Allow zero values - only filter out invalid numbers
            if (!times[i] || typeof v !== 'number' || !isFinite(v) || v < 0) return;
            
            const timeKey = times[i].getTime();
            if (!timeMap.has(timeKey)) {
              timeMap.set(timeKey, { t: times[i], v: 0 });
            }
            timeMap.get(timeKey).v += v;
          });
        });

        // Include all points, including zeros
        timeMap.forEach((point) => {
          speciesData.push(point);
        });
      }

      speciesData.sort((a, b) => a.t - b.t);

      timelineData.plankton[speciesId] = speciesData;
      config.setTimelineData(timelineData);
      
      console.log(`Loaded ${speciesData.length} data points for ${speciesId} from ${loadedCount} files`);

      return timelineData;
    } catch (error) {
      console.error('Error loading timeline data:', error);
      return null;
    }
  }

  // Export
  window.PlanktonTimelineData = {
    loadAvailableSpecies,
    loadTimelineData,
    buildAquascopeFileList
  };

})();

