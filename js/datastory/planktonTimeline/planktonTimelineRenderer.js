(function() {
  'use strict';
  function insertSvg(svgContainer) {
    d3.select(svgContainer).selectAll('svg').remove();
    const sentinel = svgContainer.querySelector('.timeline-bottom-controls');
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    if (sentinel) {
      svgContainer.insertBefore(svgEl, sentinel);
    } else {
      svgContainer.appendChild(svgEl);
    }
    return d3.select(svgEl);
  }

  async function updateTimeline() {
    const container = document.querySelector('[data-visual="plankton-timeline"]');
    if (!container) return;

    const config = window.PlanktonTimelineConfig;
    const dataLoader = window.PlanktonTimelineData;
    const utils = window.PlanktonTimelineUtils;

    const svgContainer = container.querySelector('.timeline-svg-container');
    if (!svgContainer) return;

    const selectedSpeciesIds = config.getSelectedSpeciesIds();

    if (selectedSpeciesIds.length === 0) {
      const placeholder = insertSvg(svgContainer)
        .attr('width', '100%')
        .attr('height', 500);
      placeholder.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--muted)')
        .text('Please select at least one species');
      return;
    }

    const allTimes = [];
    const timelineData = config.getTimelineData();
    
    for (const speciesId of selectedSpeciesIds) {
      if (!timelineData.plankton[speciesId]) {
        await dataLoader.loadTimelineData(speciesId);
      }
      const rawData = timelineData.plankton[speciesId] || [];
      if (rawData.length > 0) {
        rawData.forEach(d => allTimes.push(d.t));
      }
    }
    
    let fullTimeRange = config.getFullTimeRange();
    if (allTimes.length > 0) {
      fullTimeRange.start = new Date(Math.min(...allTimes.map(d => d.getTime())));
      fullTimeRange.end = new Date(Math.max(...allTimes.map(d => d.getTime())));
      config.setFullTimeRange(fullTimeRange);
    }
    
    utils.updateTimeRangeFromTimespan();
    
    const speciesDataArray = [];
    const availableSpecies = config.getAvailableSpecies();
    
    for (const speciesId of selectedSpeciesIds) {
      const rawData = timelineData.plankton[speciesId] || [];
      if (rawData.length > 0) {
        const filteredData = utils.filterDataByTimeRange(rawData);
        if (filteredData.length > 0) {
          const selectedUnit = config.getSelectedUnit();
          const convertedData = utils.convertDataUnit(filteredData, selectedUnit);
          const species = availableSpecies.find(s => s.id === speciesId);
          speciesDataArray.push({
            speciesId,
            species,
            data: convertedData
          });
        }
      }
    }

    if (speciesDataArray.length === 0) {
      const placeholder = insertSvg(svgContainer)
        .attr('width', '100%')
        .attr('height', 500);
      placeholder.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--muted)')
        .text('No data available for selected species');
      return;
    }

    const containerWidth = svgContainer.clientWidth || svgContainer.offsetWidth;
    let margin, width, height;
    if (window.PlotConfig && window.PlotConfig.getMargin) {
      margin = window.PlotConfig.getMargin('timeseries');
      margin = { ...margin, top: 8, right: 20, bottom: 70 };
      width = Math.max(300, containerWidth - margin.left - margin.right - 20);
      height = 460 - margin.top - margin.bottom;
    } else {
      margin = { top: 8, right: 20, bottom: 70, left: 70 };
      width = Math.max(300, containerWidth - margin.left - margin.right - 20);
      height = 460 - margin.top - margin.bottom;
    }

    const svg = insertSvg(svgContainer)
      .attr('width', '100%')
      .attr('height', height + margin.top + margin.bottom)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    let innerWidth, innerHeight;
    if (window.SvgHelpers && window.SvgHelpers.prepareSvg) {
      try {
        const prepared = window.SvgHelpers.prepareSvg(svg, margin);
        innerWidth = prepared.innerWidth;
        innerHeight = prepared.innerHeight;
      } catch (e) {
        console.warn('Error preparing SVG with SvgHelpers, using fallback:', e);
        innerWidth = width;
        innerHeight = height;
      }
    } else {
      innerWidth = width;
      innerHeight = height;
    }

    if (!innerWidth || !innerHeight || innerWidth <= 0 || innerHeight <= 0) {
      console.error('Invalid dimensions:', { innerWidth, innerHeight, width, height });
      innerWidth = width || 300;
      innerHeight = height || 400;
    }

    renderTimeline(svg, innerWidth, innerHeight, speciesDataArray, margin);
  }

  function renderTimeline(svg, innerWidth, innerHeight, speciesDataArray, margin) {
    const config = window.PlanktonTimelineConfig;
    const utils = window.PlanktonTimelineUtils;
    
    if (!svg || !svg.node()) {
      console.error('Invalid SVG element in renderTimeline');
      return;
    }
    
    if (!speciesDataArray || speciesDataArray.length === 0) {
      svg.append('text')
        .attr('x', (margin.left || 60) + (innerWidth || 300) / 2)
        .attr('y', (margin.top || 20) + (innerHeight || 400) / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--muted)')
        .text('No data available');
      return;
    }

    const series = {};
    const speciesKeys = [];
    speciesDataArray.forEach(({ speciesId, data }) => {
      const dataKey = utils.mapSpeciesIdToDataKey(speciesId);
      series[dataKey] = data;
      speciesKeys.push(dataKey);
    });

    const selectedTimespan = config.getSelectedTimespan();
    const currentTimeRange = config.getCurrentTimeRange();
    let domainTime;
    
    if (selectedTimespan === 'All') {
      const allTimes = Object.values(series).flatMap(arr => arr.map(d => d.t));
      domainTime = d3.extent(allTimes);
    } else if (currentTimeRange.start && currentTimeRange.end) {
      domainTime = [currentTimeRange.start, currentTimeRange.end];
    } else {
      const allTimes = Object.values(series).flatMap(arr => arr.map(d => d.t));
      domainTime = d3.extent(allTimes);
    }

    const selectedUnit = config.getSelectedUnit();
    let convertedSeries = series;
    let unitLabel = 'roi/sec';
    
    if (window.ChartControls && window.ChartControls.convertSeriesData) {
      convertedSeries = window.ChartControls.convertSeriesData(series, selectedUnit);
      unitLabel = selectedUnit.replace('_', '/');
    } else {
      convertedSeries = {};
      Object.keys(series).forEach(key => {
        convertedSeries[key] = utils.convertDataUnit(series[key], selectedUnit);
      });
      unitLabel = selectedUnit.replace('_', '/');
    }

    const x = d3.scaleTime()
      .domain(domainTime)
      .range([margin.left, margin.left + innerWidth]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(Object.values(convertedSeries).flatMap(arr => arr.map(d => d.v))) || 1])
      .nice()
      .range([margin.top + innerHeight, margin.top]);

    const line = d3.line()
      .x(d => x(d.t))
      .y(d => y(d.v))
      .curve(d3.curveMonotoneX);

    const area = d3.area()
      .x(d => x(d.t))
      .y0(margin.top + innerHeight)
      .y1(d => y(d.v))
      .curve(d3.curveMonotoneX);

    const isDaily = unitLabel === 'roi/day';
    
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${margin.top + innerHeight})`);
    
    if (isDaily) {
      const spanDays = (domainTime[1] - domainTime[0]) / (1000 * 60 * 60 * 24);
      let tickInterval;
      if (spanDays > 60) {
        tickInterval = d3.timeWeek.every(1);
      } else if (spanDays > 21) {
        tickInterval = d3.timeDay.every(3);
      } else {
        tickInterval = d3.timeDay.every(1);
      }
      const dailyTicks = tickInterval.range(domainTime[0], domainTime[1]);
      if (!dailyTicks.length || +dailyTicks[0] > +domainTime[0]) dailyTicks.unshift(domainTime[0]);
      xAxis.call(d3.axisBottom(x)
        .tickValues(dailyTicks)
        .tickFormat(d3.timeFormat('%b %d')));
    } else {
      const monthTicks = d3.timeMonth.every(1).range(domainTime[0], domainTime[1]);
      if (!monthTicks.length || +monthTicks[0] > +domainTime[0]) monthTicks.unshift(domainTime[0]);
      xAxis.call(d3.axisBottom(x)
        .tickValues(monthTicks)
        .tickFormat(d3.timeFormat('%b %Y')));
    }
    
    xAxis.selectAll("text")
      .attr("y",3)
      .attr("x", -10)
      .attr("dx", "0")
      .attr("dy", "0")
      .style("text-anchor", "end")
      .attr("transform", "rotate(-90)");
    
    const yTickValues = y.ticks();
    if (!yTickValues.includes(0)) yTickValues.unshift(0);
    const yAxis = svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickValues(yTickValues));

    if (window.PlotConfig && window.PlotConfig.createAxisLabel) {
      window.PlotConfig.createAxisLabel(svg, 'x', window.PlotConfig.AXIS_LABELS.time, margin, innerWidth, innerHeight);
      const yAxisLabel = {
        text: `Abundance [${unitLabel}]`,
        fontSize: "12px",
        fill: "var(--muted)",
        offset: 40,
        rotate: -90
      };
      window.PlotConfig.createAxisLabel(svg, 'y', yAxisLabel, margin, innerWidth, innerHeight);
    } else {
      svg.append('text')
        .attr('x', margin.left + innerWidth / 2)
        .attr('y', margin.top + innerHeight + margin.bottom - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'var(--muted, #888)')
        .text('Date');

      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(margin.top + innerHeight / 2))
        .attr('y', 12)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'var(--muted, #888)')
        .text(`Abundance [${unitLabel}]`);
    }

    // Colors (all species → stable colors via centralized system - exact same as dashboard)
    // Use shared utility function to ensure consistency with legend
    const colorOf = utils.createColorMapForSpecies(speciesKeys);

    // Clip path (using centralized helpers - exact same as dashboard)
    if (window.SvgHelpers && window.SvgHelpers.createClipPath) {
      window.SvgHelpers.createClipPath(svg, "plot-clip", margin, innerWidth, innerHeight);
    } else {
      svg.append('defs').append('clipPath')
        .attr('id', 'plot-clip')
        .append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', innerWidth)
        .attr('height', innerHeight);
    }

    // --- Filter visible species --- (exact same as dashboard)
    const visibleKeys = Object.keys(convertedSeries).filter(k => convertedSeries[k] && convertedSeries[k].length > 0);

    svg.selectAll("path.series-area")
      .data(visibleKeys, d => d)
      .join("path")
      .attr("class", "series-area")
      .attr("clip-path", "url(#plot-clip)")
      .datum(key => ({ key, values: convertedSeries[key] }))
      .attr("fill", d => colorOf.get(d.key))
      .attr("opacity", 0.15)
      .attr("d", d => area(d.values));

    const pathSelections = svg.selectAll("path.series")
      .data(visibleKeys, d => d)
      .join("path")
      .attr("class", "series")
      .attr("clip-path", "url(#plot-clip)")
      .attr("data-key", d => d)
      .datum(key => ({ key, values: convertedSeries[key] }))
      .attr("fill", "none")
      .attr("stroke", d => colorOf.get(d.key))
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.85)
      .attr("d", d => line(d.values));

    const dotsGroup = svg.append("g")
      .attr("class", "series-dots")
      .attr("clip-path", "url(#plot-clip)");

    visibleKeys.forEach(key => {
      const data = convertedSeries[key];
      const color = colorOf.get(key);
      
      dotsGroup.selectAll(`circle.series-dot-${key.replace(/[^a-zA-Z0-9]/g, '_')}`)
        .data(data)
        .join("circle")
        .attr("class", `series-dot series-dot-${key.replace(/[^a-zA-Z0-9]/g, '_')}`)
        .attr("data-key", key)
        .attr("cx", d => x(d.t))
        .attr("cy", d => y(d.v))
        .attr("r", 1.5)
        .attr("fill", color)
        .attr("opacity", 0.9)
        .style("cursor", "pointer");
    });

    let tooltip;
    try {
      if (window.PlotTooltip && window.PlotTooltip.create) {
        tooltip = window.PlotTooltip.create(svg, x, y, margin, innerHeight);
      } else if (window.SvgHelpers && window.SvgHelpers.createTooltip) {
        const tooltipElements = window.SvgHelpers.createTooltip(svg);
        tooltip = {
          group: tooltipElements.group,
          bg: tooltipElements.bg,
          text: tooltipElements.text
        };
      } else {
        tooltip = {
          group: svg.append('g').attr('class', 'plot-tooltip').style('display', 'none'),
          bg: null,
          text: null
        };
        tooltip.bg = tooltip.group.append('rect').attr('class', 'plot-tooltip-bg');
        tooltip.text = tooltip.group.append('text').attr('class', 'plot-tooltip-text');
      }
    } catch (e) {
      console.error('Error creating tooltip:', e);
      tooltip = {
        group: svg.append('g').attr('class', 'plot-tooltip').style('display', 'none'),
        bg: svg.append('rect').attr('class', 'plot-tooltip-bg'),
        text: svg.append('text').attr('class', 'plot-tooltip-text')
      };
    }
    
    const bisectDate = d3.bisector(d => d.t).left;
    const timeFmt = window.AppConstants && window.AppConstants.TIME_FORMATS ? 
      window.AppConstants.TIME_FORMATS.tooltip : 
      d3.timeFormat('%Y-%m-%d %H:%M');
    
    pathSelections
      .style("cursor", "pointer")
      .on("mouseover", () => {
        if (tooltip && tooltip.group) {
          tooltip.group.style("display", "block");
          tooltip.group.raise();
        }
      })
      .on("mousemove", function(event, d) {
        if (!tooltip || !tooltip.group) return;
        const [mx] = d3.pointer(event, svg.node());
        const x0 = x.invert(mx);
        const i = bisectDate(d.values, x0, 1);
        const d0 = d.values[i - 1], d1 = d.values[i];
        if (!d0) return;
        const point = !d1 || (x0 - d0.t < d1.t - x0) ? d0 : d1;

        const speciesName = utils.formatSpeciesNameForDisplay(d.key);
        
        const lines = [
          `${speciesName}`,
          `Abundance: ${point.v.toFixed(2)} ${unitLabel}`,
          `Time: ${timeFmt(point.t)}`
        ];

        if (tooltip.text) {
          tooltip.text.selectAll("tspan").remove();
          lines.forEach((line, i) => {
            tooltip.text.append("tspan")
              .attr("x", 0)
              .attr("dy", i === 0 ? 0 : "1.2em")
              .text(line);
          });

          const bbox = tooltip.text.node().getBBox();
          if (tooltip.bg) {
            tooltip.bg
              .attr("width", bbox.width + 8)
              .attr("height", bbox.height + 6)
              .attr("x", bbox.x - 4)
              .attr("y", bbox.y - 3);
          }

          tooltip.group.attr("transform", `translate(${mx + 12}, ${y(point.v) - 12})`);
        }
      })
      .on("mouseout", () => {
        if (tooltip && tooltip.group) {
          tooltip.group.style("display", "none");
        }
      });

    dotsGroup.selectAll("circle.series-dot")
      .on("mouseover", function(event, d) {
        if (tooltip && tooltip.group) {
          tooltip.group.style("display", "block");
          tooltip.group.raise();
        }
      })
      .on("mousemove", function(event, d) {
        if (!tooltip || !tooltip.group) return;
        const speciesKey = d3.select(this).attr("data-key");
        const data = convertedSeries[speciesKey];
        if (!data) return;
        const [mx] = d3.pointer(event, svg.node());
        const x0 = x.invert(mx);
        const i = bisectDate(data, x0, 1);
        const d0 = data[i - 1], d1 = data[i];
        if (!d0) return;
        const point = !d1 || (x0 - d0.t < d1.t - x0) ? d0 : d1;

        const speciesName = utils.formatSpeciesNameForDisplay(speciesKey);
        
        const lines = [
          `${speciesName}`,
          `Abundance: ${point.v.toFixed(2)} ${unitLabel}`,
          `Time: ${timeFmt(point.t)}`
        ];

        if (tooltip.text) {
          tooltip.text.selectAll("tspan").remove();
          lines.forEach((line, i) => {
            tooltip.text.append("tspan")
              .attr("x", 0)
              .attr("dy", i === 0 ? 0 : "1.2em")
              .text(line);
          });

          const bbox = tooltip.text.node().getBBox();
          if (tooltip.bg) {
            tooltip.bg
              .attr("width", bbox.width + 8)
              .attr("height", bbox.height + 6)
              .attr("x", bbox.x - 4)
              .attr("y", bbox.y - 3);
          }

          tooltip.group.attr("transform", `translate(${mx + 12}, ${y(point.v) - 12})`);
        }
      })
      .on("mouseout", function() {
        if (tooltip && tooltip.group) {
          tooltip.group.style("display", "none");
        }
      });
    
  }

  window.PlanktonTimelineRenderer = {
    updateTimeline,
    renderTimeline
  };

})();

