

(function () {
  'use strict';

  const sections = [
    { id: 'landing', title: 'AQUASCOPE' },
    { id: 'what-is', title: 'What is the Aquascope project about?' },
    { id: 'lake-greifen', title: 'Why do we care about plankton dynamics?' },
    { id: 'explore-plankton', title: 'Explore the plankton of Greifensee' },
    { id: 'how-observes', title: 'Timeline of Real Plankton Data' },
    { id: 'future', title: 'A look into the future' }
  ];

  let navContainer;
  let observer = null;
  let visibleSections = new Set();

  function setActiveSection(sectionId) {
    if (!navContainer) return;
    
    const dots = navContainer.querySelectorAll('.nav-dot');
    const activeDot = navContainer.querySelector(`.nav-dot[data-section="${sectionId}"]`);
    const currentActive = navContainer.querySelector('.nav-dot.active');
    
    if (activeDot && activeDot !== currentActive) {
      dots.forEach(dot => dot.classList.remove('active'));
      activeDot.classList.add('active');
    }
  }

  // CURSOR: NAV_SCROLL_UPDATE
  function updateActiveSection() {
    // Special rule for first section (landing): activate it when at or near the top
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    if (scrollTop < 1) {
      const firstSection = sections[0].id;
      const firstEl = document.getElementById(firstSection);
      if (firstEl) {
        const rect = firstEl.getBoundingClientRect();
        // If landing section is visible and we're near the top
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          setActiveSection(firstSection);
          return;
        }
      }
    }

    const viewportCenter = window.innerHeight / 2;
    let closest = null;
    let minDist = Infinity;

    // Only check sections that are currently visible (from IntersectionObserver)
    visibleSections.forEach(sectionId => {
      const el = document.getElementById(sectionId);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const dist = Math.abs(sectionCenter - viewportCenter);
      
      if (dist < minDist) {
        minDist = dist;
        closest = sectionId;
      }
    });

    // Fallback: if no visible sections, check all sections
    if (!closest) {
      sections.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const dist = Math.abs(sectionCenter - viewportCenter);
        if (dist < minDist) {
          minDist = dist;
          closest = sec.id;
        }
      });
    }

    // Special rule for last section: activate it when its TOP enters the viewport enough
    const lastSection = sections[sections.length - 1].id;
    const lastEl = document.getElementById(lastSection);

    if (lastEl) {
      const rect = lastEl.getBoundingClientRect();

      // If the top of the last section enters the top 40% of the viewport
      if (rect.top < window.innerHeight * 1) {
        setActiveSection(lastSection);
        return;
      }
    }

    if (closest) {
      setActiveSection(closest);
    }
  }

  function createNavigation() {
    navContainer = document.createElement('nav');
    navContainer.className = 'story-navigation';
    navContainer.setAttribute('aria-label', 'Story navigation');

    const list = document.createElement('ul');
    list.className = 'nav-dots';

    sections.forEach(({ id, title }) => {
      const li = document.createElement('li');
      li.className = 'nav-dot-item';

      const btn = document.createElement('button');
      btn.className = 'nav-dot';
      btn.dataset.section = id;
      btn.title = title;
      btn.type = 'button';

      const tooltip = document.createElement('span');
      tooltip.className = 'nav-dot-tooltip';
      tooltip.textContent = title;

      btn.appendChild(tooltip);
      li.appendChild(btn);
      list.appendChild(li);

      btn.addEventListener('click', () => {
        const section = document.getElementById(id);
        if (!section) return;

        // Immediately update active state
        setActiveSection(id);

        // Scroll to section
        section.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      });
    });

    navContainer.appendChild(list);
    document.body.appendChild(navContainer);

    // Set up IntersectionObserver to track which sections are visible
    const observerOptions = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0 // Trigger when any part of section enters/exits viewport
    };

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const sectionId = entry.target.id;
        if (entry.isIntersecting) {
          visibleSections.add(sectionId);
        } else {
          visibleSections.delete(sectionId);
        }
      });
      
      // Update active section when visibility changes
      updateActiveSection();
    }, observerOptions);

    // Observe all sections
    sections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) {
        observer.observe(el);
      }
    });

    // Listen to scroll for real-time updates during scrolling
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial update
    setTimeout(() => {
      updateActiveSection();
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createNavigation);
  } else {
    createNavigation();
  }
})();
