/**
 * Utility functions for Plankton Timeline
 */

(function() {
  'use strict';

  /**
   * Filter species by selected magnification
   */
  function filterSpeciesByMagnification() {
    const config = window.PlanktonTimelineConfig;
    const availableSpecies = config.getAvailableSpecies();

    // Show all cyanobacteria species across both magnifications
    config.setFilteredSpecies(availableSpecies);
    // Do not override selectedSpeciesIds — preserve the default initial selection
  }

  /**
   * Convert data to different units using centralized ChartControls
   * Raw data is in roi/sec (roi per second)
   */
  function convertDataUnit(data, unit) {
    // Use centralized ChartControls if available
    if (window.ChartControls && window.ChartControls.convertSeriesData) {
      // Convert single series to object format expected by ChartControls
      const seriesObj = { 'temp': data };
      const converted = window.ChartControls.convertSeriesData(seriesObj, unit);
      return converted['temp'] || data;
    }
    
    // Fallback to local implementation if ChartControls not available
    if (unit === 'roi_sec') {
      return data; // Already in roi/sec
    } else if (unit === 'roi_hour') {
      // Convert roi/sec to roi/hour: multiply by 3600 (seconds in an hour)
      return data.map(d => ({ ...d, v: d.v * 3600 }));
    } else if (unit === 'roi_day') {
      // Aggregate by day: sum all roi_sec values for each day, then convert to roi_day
      const dailyMap = new Map();
      
      data.forEach(point => {
        const dayKey = new Date(point.t.getFullYear(), point.t.getMonth(), point.t.getDate()).getTime();
        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, { t: new Date(dayKey), v: 0 });
        }
        // Sum roi_sec values for the day
        dailyMap.get(dayKey).v += point.v;
      });

      // Convert to roi_day: sum of roi_sec per day * 86400 (seconds in a day)
      const dailyData = Array.from(dailyMap.values()).map(d => ({
        t: d.t,
        v: d.v * 86400 // roi_sec * 86400 (seconds per day) = roi/day
      }));

      return dailyData.sort((a, b) => a.t - b.t);
    }
    return data;
  }

  /**
   * Format number with German thousand separator (apostrophe)
   */
  function formatNumberGerman(num) {
    // Use d3.format to format with commas, then replace with apostrophes
    const formatted = d3.format(',.2f')(num);
    return formatted.replace(/,/g, "'");
  }

  /**
   * Format species name for display (remove magnification suffixes and replace underscores)
   */
  function formatSpeciesNameForDisplay(speciesKey) {
    if (!speciesKey) return speciesKey;
    return speciesKey.replace(/_5p0x$/, '').replace(/_0p5x$/, '').replace(/_/g, ' ');
  }

  /**
   * Map speciesId from timeline to data key format used in dashboard
   */
  function mapSpeciesIdToDataKey(speciesId) {
    // Map timeline species IDs to dashboard data keys
    const mapping = {
      'aphanziano': 'aphanizomenon_0p5x',
      'asterionella_colony': 'asterionella_0p5x',
      'bosmina': 'bosmina_0p5x',
      'cillate': 'ciliate_5p0x',
      'cryptomonas_cryptophyceae': 'cryptophyte_5p0x',
      'cyanobakteria_5p0x': 'cyanobacteria_filament_5p0x',
      'cyanobakteria_0p5x': 'cyanobacteria_filament_0p5x',
      'cyanobakteria_colonial_clathrate': 'cyanobacteria_colonial_5p0x',
      'daphnia': 'daphnia_0p5x',
      'dinobryon': 'dinobryon_0p5x',
      'eudiaptomus': 'eudiaptomus_0p5x',
      'fragilara': 'fragilaria_0p5x',
      'kartella_quadrata': 'keratella_0p5x',
      'leptodora_kindtii': 'leptodora_0p5x',
      'pandorina': 'pandorina_5p0x',
      'pediastrum': 'pediastrum_5p0x'
    };
    return mapping[speciesId] || speciesId;
  }

  /**
   * Get color for a species using centralized BioTomicColors system
   */
  function getSpeciesColor(speciesKey, index) {
    // Use centralized color system if available
    if (window.BioTomicColors && window.BioTomicColors.getColor) {
      return window.BioTomicColors.getColor(speciesKey);
    }
    // Fallback: use index-based color (shouldn't happen if BioTomicColors is loaded)
    const fallbackColors = [
      '#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2',
      '#c2185b', '#0097a7', '#455a64', '#e64a19', '#5d4037',
      '#0288d1', '#689f38', '#fbc02d', '#ab47bc', '#00acc1'
    ];
    return fallbackColors[index % fallbackColors.length];
  }

  /**
   * Create color map for species keys (same logic as renderer)
   * This ensures legend colors match line colors
   */
  function createColorMapForSpecies(speciesKeys) {
    let colorOf;
    if (window.BioTomicColors && window.BioTomicColors.createColorMap) {
      colorOf = window.BioTomicColors.createColorMap(speciesKeys);
    } else {
      // Fallback: create viridis color map directly (same as renderer)
      colorOf = new Map();
      const viridisInterpolator = d3.interpolateViridis;
      
      // Use hash function from BioTomicColors if available, otherwise define locally
      const hashString = window.BioTomicColors && window.BioTomicColors.hashString
        ? window.BioTomicColors.hashString
        : (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
              const char = str.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash) / 2147483647; // Normalize to 0-1
          };
      
      // Distribute colors evenly across full viridis spectrum (0.0 to 1.0)
      speciesKeys.forEach((key, index) => {
        // Use hash for consistent colors, fallback to index-based distribution
        const hash = hashString(key || String(index));
        // Spread across full viridis range for good color distinction
        const t = hash; // Use full range 0.0-1.0
        const color = viridisInterpolator(t);
        colorOf.set(key, color);
      });
    }

    // Override cyanobacteria: turquoise for filamentous (same for both magnifications), green for colonial
    const CYANO_COLORS = {
      'cyanobacteria_filament_5p0x': '#1fab83',
      'cyanobacteria_filament_0p5x': '#0b5c45',
      'cyanobacteria_colonial_5p0x': '#64cb69',
      'aphanizomenon_0p5x':          '#10ce16',
    };
    speciesKeys.forEach(key => {
      if (CYANO_COLORS[key]) colorOf.set(key, CYANO_COLORS[key]);
    });

    return colorOf;
  }

  /**
   * Calculate and update time range based on selected timespan
   */
  function updateTimeRangeFromTimespan() {
    const config = window.PlanktonTimelineConfig;
    const timelineData = config.getTimelineData();
    const selectedTimespan = config.getSelectedTimespan();
    let fullTimeRange = config.getFullTimeRange();
    
    if (!fullTimeRange.end) {
      // Calculate full range from loaded data
      const allTimes = [];
      Object.values(timelineData.plankton).forEach(data => {
        if (data && Array.isArray(data)) {
          data.forEach(d => allTimes.push(d.t));
        }
      });
      
      if (allTimes.length > 0) {
        fullTimeRange.start = new Date(Math.min(...allTimes.map(d => d.getTime())));
        fullTimeRange.end = new Date(Math.max(...allTimes.map(d => d.getTime())));
      } else {
        // Default range if no data loaded yet
        fullTimeRange.end = new Date('2025-08-31T23:00:00Z');
        fullTimeRange.start = new Date('2024-01-01T00:00:00Z');
      }
      config.setFullTimeRange(fullTimeRange);
    }
    
    // Calculate start date based on timespan
    const end = new Date(fullTimeRange.end);
    let start = new Date(end);
    
    switch (selectedTimespan) {
      case '1W':
        start.setDate(start.getDate() - 7);
        break;
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'All':
        // Use full range - no filtering
        start = new Date(fullTimeRange.start);
        break;
      default:
        // Use full range
        start = new Date(fullTimeRange.start);
    }
    
    // Ensure start is not before full start
    if (start < fullTimeRange.start) {
      start = new Date(fullTimeRange.start);
    }
    
    const currentTimeRange = { start, end };
    config.setCurrentTimeRange(currentTimeRange);
  }

  /**
   * Filter data by current time range
   */
  function filterDataByTimeRange(data) {
    const config = window.PlanktonTimelineConfig;
    const selectedTimespan = config.getSelectedTimespan();
    const currentTimeRange = config.getCurrentTimeRange();
    
    // If "All" is selected, don't filter
    if (selectedTimespan === 'All') {
      return data;
    }
    
    if (!currentTimeRange.start || !currentTimeRange.end) {
      return data; // Return all data if no range set
    }
    
    return data.filter(d => {
      const time = d.t instanceof Date ? d.t : new Date(d.t);
      return time >= currentTimeRange.start && time <= currentTimeRange.end;
    });
  }

  // Export
  window.PlanktonTimelineUtils = {
    filterSpeciesByMagnification,
    convertDataUnit,
    formatNumberGerman,
    formatSpeciesNameForDisplay,
    mapSpeciesIdToDataKey,
    getSpeciesColor,
    createColorMapForSpecies,
    updateTimeRangeFromTimespan,
    filterDataByTimeRange
  };

})();

