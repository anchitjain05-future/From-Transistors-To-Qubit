/**
 * @file main.js
 * @description Main application entry point for the Quantum Computing Educational Platform.
 * Provides client-side SPA hash routing, theme switching, mobile navigation,
 * interactive widget initializers, and core mathematical utilities.
 */

import {
  QuantumState,
  GATES,
  runShots,
  complex,
  complexAdd,
  complexMul,
  complexAbs
} from './quantum-sim.js';

import { BlochSphere } from './bloch-sphere.js';

// Re-export required complex math utilities
export { complexAdd, complexMul, complexAbs };

/**
 * Weighted or uniform random item picker.
 * @template T
 * @param {Array<T>} items - Items to pick from
 * @param {Array<number>} [weights] - Non-negative weights corresponding to each item
 * @returns {T} Selected item
 */
export function randomChoice(items, weights) {
  if (!items || items.length === 0) {
    throw new Error('randomChoice requires a non-empty array of items');
  }
  if (!weights || weights.length !== items.length) {
    const idx = Math.floor(Math.random() * items.length);
    return items[idx];
  }

  const sum = weights.reduce((acc, w) => acc + (w > 0 ? w : 0), 0);
  if (sum <= 0) {
    return items[Math.floor(Math.random() * items.length)];
  }

  const rand = Math.random() * sum;
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += Math.max(0, weights[i]);
    if (rand <= cumulative) {
      return items[i];
    }
  }
  return items[items.length - 1];
}

/**
 * Valid SPA route IDs.
 */
const VALID_ROUTES = [
  '#home',
  '#mapping',
  '#level1',
  '#level2',
  '#level3',
  '#level4',
  '#noise',
  '#simulator',
  '#assessment',
  '#about'
];

/**
 * Initializes Theme management (dark / light mode).
 * Reads preference from localStorage and updates <body> class.
 */
function initTheme() {
  const THEME_STORAGE_KEY = 'quantum_edu_theme';
  const themeToggleBtn = document.getElementById('theme-toggle') || document.querySelector('.theme-toggle');

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
    // If user prefers light or saved light
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    }
  } else if (savedTheme === 'dark') {
    document.body.classList.remove('light-theme');
  }

  const updateToggleIcon = () => {
    if (!themeToggleBtn) return;
    const isLight = document.body.classList.contains('light-theme');
    themeToggleBtn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    const icon = themeToggleBtn.querySelector('.theme-icon') || themeToggleBtn;
    if (icon) {
      icon.textContent = isLight ? '🌙' : '☀️';
    }
  };

  updateToggleIcon();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      localStorage.setItem(THEME_STORAGE_KEY, isLight ? 'light' : 'dark');
      updateToggleIcon();

      // Trigger custom event so any active Bloch sphere or charts re-render
      window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: isLight ? 'light' : 'dark' } }));
    });
  }
}

/**
 * Initializes mobile hamburger menu toggle.
 */
function initMobileMenu() {
  const hamburgerBtn = document.getElementById('mobile-menu-toggle') || document.querySelector('.hamburger');
  const navMenu = document.getElementById('nav-menu') || document.querySelector('.nav-links') || document.querySelector('nav');

  if (!hamburgerBtn || !navMenu) return;

  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navMenu.classList.contains('open');
    navMenu.classList.toggle('open', isOpen);
    hamburgerBtn.classList.toggle('active', isOpen);
    hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  };

  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking any nav link
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      toggleMenu(false);
    }
  });
}

/**
 * Single-Page App Hash Router.
 * Shows the active section matching current hash and hides others.
 */
function initRouter() {
  function handleRoute() {
    let hash = window.location.hash || '#home';
    if (!VALID_ROUTES.includes(hash)) {
      hash = '#home';
    }

    const targetId = hash.substring(1);

    // Toggle active section visibility — supports both .page and .page-section, .active and .active-section
    VALID_ROUTES.forEach(route => {
      const sectionId = route.substring(1);
      const section = document.getElementById(sectionId);
      if (section) {
        if (sectionId === targetId) {
          section.classList.add('active');
          section.classList.add('active-section');
          section.removeAttribute('hidden');
        } else {
          section.classList.remove('active');
          section.classList.remove('active-section');
        }
      }
    });

    // Also support any element selected with .page-section or .page
    document.querySelectorAll('.page, .page-section').forEach(sec => {
      if (sec.id === targetId) {
        sec.classList.add('active');
        sec.classList.add('active-section');
        sec.removeAttribute('hidden');
      } else if (sec.id && VALID_ROUTES.includes('#' + sec.id)) {
        sec.classList.remove('active');
        sec.classList.remove('active-section');
      }
    });

    // Update active nav links (both in main nav and dropdowns)
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      const href = link.getAttribute('href');
      if (href === hash) {
        link.classList.add('active');
        link.classList.add('active-section');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.classList.remove('active-section');
        link.removeAttribute('aria-current');
      }
    });

    // Highlight parent dropdown if active route is a sub-level
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      const subLinkActive = dropdown.querySelector(`a[href="${hash}"]`);
      const parentLink = dropdown.querySelector('.nav-link');
      if (parentLink) {
        if (subLinkActive) {
          parentLink.classList.add('active');
          parentLink.classList.add('active-section');
        }
      }
    });

    // Scroll to top of section or page smoothly
    const activeSection = document.getElementById(targetId);
    if (activeSection) {
      activeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Dispatch route event for custom section initializers
    window.dispatchEvent(new CustomEvent('pagechanged', { detail: { route: hash, sectionId: targetId } }));

    // Re-render mathematics for the activated section
    if (typeof window.renderAllMath === 'function') {
      const activeEl = document.getElementById(targetId);
      if (activeEl) {
        window.renderAllMath(activeEl);
      }
    }
  }

  window.addEventListener('hashchange', handleRoute);
  // Initial route execution
  handleRoute();
}

/**
 * Smooth scrolling for navigation links that are in-page anchors.
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetHash = this.getAttribute('href');
      if (VALID_ROUTES.includes(targetHash)) {
        // Handled by hash router
        if (window.location.hash === targetHash) {
          // If already on the hash, scroll to it manually
          const el = document.getElementById(targetHash.substring(1));
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  });
}

/**
 * Initializes interactive elements present on the page.
 */
function initInteractiveElements() {
  // Automatically bind any canvas with class or id 'bloch-canvas'
  const blochCanvases = document.querySelectorAll('canvas[data-bloch], canvas.bloch-canvas, #bloch-sphere-canvas');
  blochCanvases.forEach(canvas => {
    if (!canvas.__blochInstance) {
      const bloch = new BlochSphere(canvas);
      canvas.__blochInstance = bloch;
      bloch.render(0, 0); // Ground state |0>

      window.addEventListener('themechanged', () => {
        bloch.draw();
      });
    }
  });
}

/**
 * Main application bootstrap on DOM ready.
 */
export function initApp() {
  initTheme();
  initMobileMenu();
  initRouter();
  initSmoothScroll();
  initInteractiveElements();
}

// Auto-run when DOM is loaded in browser
if (typeof window !== 'undefined') {
  window.initApp = initApp;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }
}

export default {
  QuantumState,
  GATES,
  runShots,
  BlochSphere,
  complexAdd,
  complexMul,
  complexAbs,
  randomChoice,
  initApp
};
