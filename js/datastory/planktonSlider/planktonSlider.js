(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // DATA
  // ---------------------------------------------------------------------------

  const exampleData = [
    { labelShort: "1s", labelLong: "1 second after start", secondsSinceStart: 1, roi: 7, image_path: "images/reconstructed_frames_with_boxes/reconstructed_1s.png" },
    { labelShort: "1 min", labelLong: "1 minute after start", secondsSinceStart: 60, roi: 5, image_path: "images/reconstructed_frames_with_boxes/reconstructed_1min.png" },
    { labelShort: "1h", labelLong: "1 hour after start", secondsSinceStart: 3600, roi: 4, image_path: "images/reconstructed_frames_with_boxes/reconstructed_1h.png" },
    { labelShort: "12h", labelLong: "12 hours after start", secondsSinceStart: 43200, roi: 3, image_path: "images/reconstructed_frames_with_boxes/reconstructed_12h.png" },
    { labelShort: "1 day", labelLong: "1 day after start", secondsSinceStart: 86400, roi: 6, image_path: "images/reconstructed_frames_with_boxes/reconstructed_1day.png" },
  ];

  let currentIndex = 0;
  const maxIndex = exampleData.length - 1;



  // ---------------------------------------------------------------------------
  // CALCULATIONS
  // ---------------------------------------------------------------------------

  function calculateAggregatedStats(data, currentSeconds) {
    const totalROI = data
      .filter(d => d.secondsSinceStart <= currentSeconds)
      .reduce((sum, d) => sum + d.roi, 0);

    return {
      totalROI,
      roisPerSecond: totalROI / currentSeconds,
      roisPerHour: totalSecondsTo(totalROI, currentSeconds, 3600),
      roisPerDay: totalSecondsTo(totalROI, currentSeconds, 86400)
    };
  }

  function totalSecondsTo(totalROI, seconds, interval) {
    return seconds >= interval ? totalROI / (seconds / interval) : totalROI;
  }



  // ---------------------------------------------------------------------------
  // SLIDER UI UPDATE
  // ---------------------------------------------------------------------------



  // ---------------------------------------------------------------------------
  // UI UPDATE
  // ---------------------------------------------------------------------------

  function updateUI(container) {
    const data = exampleData[currentIndex];
    const stats = calculateAggregatedStats(exampleData, data.secondsSinceStart);

    // DOM elements
    const title = container.querySelector(".plankton-image-title");
    const img = container.querySelector(".plankton-image");
    const statsBox = container.querySelector(".plankton-stats");
    const labels = container.querySelectorAll(".interval-labels span");
    const slider = container.querySelector("#interval-slider");

    // Keep the slider thumb aligned with the current state.
    if (slider && Number(slider.value) !== currentIndex) {
      slider.value = String(currentIndex);
    }

    // Update selected label
    labels.forEach((label, index) => {
      if (index === currentIndex) {
        label.classList.add('selected');
      } else {
        label.classList.remove('selected');
      }
    });

    // Update content
    const titleText = `Frame observed at ${data.labelLong}`;
    title.textContent = titleText;
    img.src = data.image_path;

    statsBox.innerHTML = `
      <div class="plankton-stats-title-spacer">${titleText}</div>
      <div class="stat-item"><div class="stat-label">Total Observations</div><div class="stat-value">${stats.totalROI.toFixed(0)}</div></div>
      <div class="stat-item"><div class="stat-label">Detected organisms (ROI) per second</div><div class="stat-value">${stats.roisPerSecond.toFixed(6)}</div></div>
      <div class="stat-item"><div class="stat-label">Detected organisms (ROI) per hour</div><div class="stat-value">${stats.roisPerHour.toFixed(2)}</div></div>
      <div class="stat-item"><div class="stat-label">Detected organisms (ROI) per day</div><div class="stat-value">${stats.roisPerDay.toFixed(2)}</div></div>
    `;
  }



  // ---------------------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------------------

  function init() {
    const container = document.querySelector('[data-visual="plankton-slider"]');
    if (!container) return;

    updateUI(container);

    const slider = container.querySelector("#interval-slider");
    if (!slider) return;
    slider.addEventListener("input", e => {
      currentIndex = Number(e.target.value);
      updateUI(container);
    });
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();

})();
