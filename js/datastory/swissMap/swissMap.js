(function () {
  "use strict";

  const HIGHLIGHTED_LAKES = ["Greifensee", "Zugersee"];
  const MAP_DIMENSIONS = { width: 600, height: 500 };
  const TOP_PADDING = 30;

  let svg = null;
  let projection = null;
  let path = null;

  function isHighlightedLake(name) {
    return name && HIGHLIGHTED_LAKES.some(hl => name.includes(hl));
  }

  async function initializeMap() {
    const container = document.querySelector("#swiss-map-container");
    if (!container) {
      console.warn("Swiss map container not found");
      return;
    }

    // Create SVG
    svg = d3.select(container)
      .append("svg")
      .attr("width", MAP_DIMENSIONS.width)
      .attr("height", MAP_DIMENSIONS.height)
      .attr("viewBox", `0 0 ${MAP_DIMENSIONS.width} ${MAP_DIMENSIONS.height}`)
      .style("background", "transparent")
      .node();

    try {
      const topoData = await d3.json("data/map/swiss-maps.json");
      if (!topoData) throw new Error("Failed to load map data");

      // GeoJSON conversion
      const country = topojson.feature(topoData, topoData.objects.country);
      const lakes = topojson.feature(topoData, topoData.objects.lakes);

      // Base projection - fit to entire country
      projection = d3.geoMercator().fitSize([MAP_DIMENSIONS.width, MAP_DIMENSIONS.height], country);
      
      // Adjust projection to align map to top with padding
      const bounds = d3.geoBounds(country);
      const [[minLon, minLat], [maxLon, maxLat]] = bounds;
      const topPoint = projection([(minLon + maxLon) / 2, maxLat]);
      const offsetY = TOP_PADDING - topPoint[1];
      const currentTranslate = projection.translate();
      projection.translate([currentTranslate[0], currentTranslate[1] + offsetY]);
      
      path = d3.geoPath().projection(projection);

      // Draw Switzerland
      d3.select(svg)
        .append("g")
        .attr("class", "country")
        .selectAll("path")
        .data(country.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#f0f0f0")
        .attr("stroke", "#666")
        .attr("stroke-width", 1);

      // Draw all lakes
      const lakePaths = d3.select(svg)
        .append("g")
        .attr("class", "lakes")
        .selectAll("path")
        .data(lakes.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => isHighlightedLake(d.properties.name) ? "#003366" : "#a1d0f7")
        .attr("stroke", "#4a90e2")
        .attr("stroke-width", 0.4)
        .attr("opacity", d => isHighlightedLake(d.properties.name) ? 1 : 0.8);
      
      // Add lake name labels - only for highlighted lakes
      const labelsGroup = d3.select(svg).append("g").attr("class", "lake-labels");
      
      lakes.features
        .filter(lake => isHighlightedLake(lake.properties.name))
        .forEach(lake => {
          const [cx, cy] = path.centroid(lake);
          labelsGroup.append("text")
            .attr("x", cx)
            .attr("y", cy - 15)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#333")
            .text(lake.properties.name);
        });

    } catch (err) {
      console.error(err);
      container.innerHTML = "<p class='map-error'>Map could not be loaded.</p>";
    }
  }

  // Init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeMap);
    } else {
      initializeMap();
    }
})();
