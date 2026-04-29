/**
 * Configuration and constants for Plankton Timeline
 */

(function() {
  'use strict';

  // Mapping from planktons.json id to data file keys with magnification info
  const SPECIES_TO_DATA_KEYS = {
    'aphanziano': { keys: ['y3'], magnification: '0.5x' }, // aphanizomenon_0p5x
    'asterionella_colony': { keys: ['y5'], magnification: '0.5x' }, // asterionella_0p5x
    'bosmina': { keys: ['y7'], magnification: '0.5x' }, // bosmina_0p5x
    'cillate': { keys: ['y13'], magnification: '5.0x' }, // ciliate_5p0x
    'cryptomonas_cryptophyceae': { keys: ['y17'], magnification: '5.0x' }, // cryptophyte_5p0x
    'cyanobakteria_5p0x': { keys: ['y19'], magnification: '5.0x' }, // cyanobacteria_filament_5p0x
    'cyanobakteria_0p5x': { keys: ['y20'], magnification: '0.5x' }, // cyanobacteria_filament_0p5x
    'cyanobakteria_colonial_clathrate': { keys: ['y18'], magnification: '5.0x' }, // cyanobacteria_colonial_5p0x
    'daphnia': { keys: ['y2'], magnification: '0.5x' }, // daphnia_0p5x
    'dinobryon': { keys: ['y24'], magnification: '0.5x' }, // dinobryon_0p5x
    'eudiaptomus': { keys: ['y26'], magnification: '0.5x' }, // eudiaptomus_0p5x
    'fragilara': { keys: ['y27'], magnification: '0.5x' }, // fragilaria_0p5x
    'kartella_quadrata': { keys: ['y32'], magnification: '0.5x' }, // keratella_0p5x
    'leptodora_kindtii': { keys: ['y33'], magnification: '0.5x' }, // leptodora_0p5x
    'pandorina': { keys: ['y36'], magnification: '5.0x' }, // pandorina_5p0x
    'pediastrum': { keys: ['y38'], magnification: '5.0x' }, // pediastrum_5p0x
  };

  // State variables
  let timelineData = {
    plankton: {}
  };

  let availableSpecies = [];
  let filteredSpecies = [];
  let selectedSpeciesIds = ['cyanobakteria_5p0x', 'cyanobakteria_colonial_clathrate'];
  let selectedUnit = 'roi_hour'; // Default unit
  let selectedMagnification = '5.0x';
  let selectedTimespan = 'All'; // Default: show all data
  let fullTimeRange = { start: null, end: null }; // Full data time range
  let currentTimeRange = { start: null, end: null }; // Current filtered time range

  // Export configuration
  window.PlanktonTimelineConfig = {
    SPECIES_TO_DATA_KEYS,
    getTimelineData: () => timelineData,
    setTimelineData: (data) => { timelineData = data; },
    getAvailableSpecies: () => availableSpecies,
    setAvailableSpecies: (species) => { availableSpecies = species; },
    getFilteredSpecies: () => filteredSpecies,
    setFilteredSpecies: (species) => { filteredSpecies = species; },
    getSelectedSpeciesIds: () => selectedSpeciesIds,
    setSelectedSpeciesIds: (ids) => { selectedSpeciesIds = ids; },
    getSelectedUnit: () => selectedUnit,
    setSelectedUnit: (unit) => { selectedUnit = unit; },
    getSelectedMagnification: () => selectedMagnification,
    setSelectedMagnification: (mag) => { selectedMagnification = mag; },
    getSelectedTimespan: () => selectedTimespan,
    setSelectedTimespan: (timespan) => { selectedTimespan = timespan; },
    getFullTimeRange: () => fullTimeRange,
    setFullTimeRange: (range) => { fullTimeRange = range; },
    getCurrentTimeRange: () => currentTimeRange,
    setCurrentTimeRange: (range) => { currentTimeRange = range; }
  };

})();

