(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // RENDER INFO BOX
  // ---------------------------------------------------------------------------

  function renderInfoBox(container) {
    container.innerHTML = `
      <details class="datastory-infobox-details" open>
        <summary class="datastory-infobox-title">Magnification explained</summary>

        <div class="datastory-infobox-content">

          <p>
            The Aquascope works with two different magnifications so it can observe plankton across a wide range of sizes.
            Each magnification offers a different field of view and captures different types of organisms.
            </p>

            <p>
            <strong>5.0× magnification</strong> (orange range) is used for very small plankton such as single cells, tiny colonies,
            and fine particles. It reveals detailed shapes and structures but shows only a small area of water at once.
            </p>

            <p>
            <strong>0.5× magnification</strong> (blue range) captures much larger organisms such as zooplankton and larvae.
            It covers a much wider area, allowing more and bigger individuals to appear in a single frame.
            </p>

            <p>
            Because the field of view and resolution are different, measurements from the two magnifications cannot be directly
            compared. Each magnification represents a different “window” into the plankton community, and together they provide
            a more complete picture of the ecosystem.
            </p>

          <div class="magnification-scale-image">
            <img src="images/scale.png" alt="Magnification scale comparison">
          </div>

        </div>
      </details>
    `;
  }

  // ---------------------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------------------

  function init() {
    const container = document.querySelector('[data-visual="magnification-comparison"]');
    if (!container) return;

    renderInfoBox(container);
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();

})();

