/**
 * ==========================================
 * CRUMBLE BAKERY - MAIN JAVASCRIPT
 * ==========================================
 * 
 * Main functionality for the Crumble Bakery Coming Soon website
 * Includes: Loading management, countdown timer, scroll effects,
 * and general interactive features
 */

'use strict';

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================

const CONFIG = {
  // Launch date - Update this to your actual launch date
  LAUNCH_DATE: new Date('2024-12-31T00:00:00').getTime(),
  
  // Animation settings
  LOADING_DURATION: 2000,
  SCROLL_THROTTLE: 16, // ~60fps
  
  // Countdown update interval
  COUNTDOWN_INTERVAL: 1000,
  
  // Element selectors
  SELECTORS: {
    loadingScreen: '#loading-screen',
    mainContent: '#main-content',
    countdown: '#countdown',
    countdownNumbers: {
      days: '#days',
      hours: '#hours',
      minutes: '#minutes',
      seconds: '#seconds'
    },
    scrollElements: '.animate-on-scroll',
    parallaxElements: '.parallax-element',
    floatingElements: '.floating-element'
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Throttle function to limit function execution frequency
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Debounce function to delay function execution
 */
function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * Check if element is in viewport
 */
function isElementInViewport(el, threshold = 0.1) {
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return (
    rect.top <= windowHeight * (1 + threshold) &&
    rect.bottom >= windowHeight * -threshold &&
    rect.left <= windowWidth * (1 + threshold) &&
    rect.right >= windowWidth * -threshold
  );
}

/**
 * Add leading zero to numbers less than 10
 */
function addLeadingZero(num) {
  return num < 10 ? '0' + num : num.toString();
}

/**
 * Format time units for countdown
 */
function formatTimeUnit(unit) {
  return addLeadingZero(Math.floor(unit));
}

// ==========================================
// LOADING SCREEN MANAGEMENT
// ==========================================

class LoadingManager {
  constructor() {
    this.loadingScreen = document.querySelector(CONFIG.SELECTORS.loadingScreen);
    this.mainContent = document.querySelector(CONFIG.SELECTORS.mainContent);
    this.isLoaded = false;
  }

  init() {
    // Wait for DOM content and fonts to load
    Promise.all([
      new Promise(resolve => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve);
        } else {
          resolve();
        }
      }),
      document.fonts.ready
    ]).then(() => {
      this.hideLoading();
    });

    // Fallback timeout to ensure loading doesn't hang
    setTimeout(() => {
      if (!this.isLoaded) {
        console.warn('Loading timeout reached, showing content');
        this.hideLoading();
      }
    }, CONFIG.LOADING_DURATION * 2);
  }

  hideLoading() {
    if (this.isLoaded) return;
    
    this.isLoaded = true;
    
    // Add delay for better UX
    setTimeout(() => {
      if (this.loadingScreen) {
        this.loadingScreen.classList.add('hidden');
      }
      
      if (this.mainContent) {
        this.mainContent.classList.add('loaded');
      }
      
      // Remove loading screen from DOM after transition
      setTimeout(() => {
        if (this.loadingScreen && this.loadingScreen.parentNode) {
          this.loadingScreen.parentNode.removeChild(this.loadingScreen);
        }
      }, 500);
    }, CONFIG.LOADING_DURATION);
  }
}

// ==========================================
// COUNTDOWN TIMER
// ==========================================

class CountdownTimer {
  constructor() {
    this.countdownElement = document.querySelector(CONFIG.SELECTORS.countdown);
    this.countdownNumbers = {};
    this.intervalId = null;
    this.launchDate = CONFIG.LAUNCH_DATE;
    
    // Get countdown number elements
    Object.keys(CONFIG.SELECTORS.countdownNumbers).forEach(key => {
      this.countdownNumbers[key] = document.querySelector(
        CONFIG.SELECTORS.countdownNumbers[key]
      );
    });
  }

  init() {
    if (!this.countdownElement) return;
    
    // Initial update
    this.updateCountdown();
    
    // Start interval
    this.intervalId = setInterval(() => {
      this.updateCountdown();
    }, CONFIG.COUNTDOWN_INTERVAL);
  }

  updateCountdown() {
    const now = new Date().getTime();
    const distance = this.launchDate - now;
    
    if (distance < 0) {
      this.handleLaunchReached();
      return;
    }
    
    const timeUnits = this.calculateTimeUnits(distance);
    this.updateDisplay(timeUnits);
  }

  calculateTimeUnits(distance) {
    return {
      days: distance / (1000 * 60 * 60 * 24),
      hours: (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      minutes: (distance % (1000 * 60 * 60)) / (1000 * 60),
      seconds: (distance % (1000 * 60)) / 1000
    };
  }

  updateDisplay(timeUnits) {
    Object.keys(timeUnits).forEach(unit => {
      const element = this.countdownNumbers[unit];
      if (element) {
        const newValue = formatTimeUnit(timeUnits[unit]);
        if (element.textContent !== newValue) {
          element.classList.add('updating');
          element.textContent = newValue;
          
          setTimeout(() => {
            element.classList.remove('updating');
          }, 300);
        }
      }
    });
  }

  handleLaunchReached() {
    clearInterval(this.intervalId);
    
    if (this.countdownElement) {
      this.countdownElement.innerHTML = `
        <div class="launch-message">
          <i class="fas fa-rocket"></i>
          <h3>We're Live!</h3>
          <p>Crumble Bakery is now open!</p>
        </div>
      `;
    }
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// ==========================================
// SCROLL EFFECTS MANAGER
// ==========================================

class ScrollEffectsManager {
  constructor() {
    this.scrollElements = document.querySelectorAll(CONFIG.SELECTORS.scrollElements);
    this.parallaxElements = document.querySelectorAll(CONFIG.SELECTORS.parallaxElements);
    this.lastScrollY = 0;
    this.ticking = false;
  }

  init() {
    // Initial check for elements already in viewport
    this.checkScrollElements();
    
    // Bind scroll event with throttling
    window.addEventListener('scroll', throttle(() => {
      this.handleScroll();
    }, CONFIG.SCROLL_THROTTLE));
    
    // Handle resize
    window.addEventListener('resize', debounce(() => {
      this.checkScrollElements();
    }, 250));
  }

  handleScroll() {
    this.lastScrollY = window.pageYOffset;
    
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.checkScrollElements();
        this.updateParallaxElements();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  checkScrollElements() {
    this.scrollElements.forEach(element => {
      if (isElementInViewport(element, 0.1)) {
        element.classList.add('visible');
      }
    });
  }

  updateParallaxElements() {
    if (window.innerWidth < 768) return; // Disable on mobile for performance
    
    this.parallaxElements.forEach(element => {
      const speed = parseFloat(element.dataset.speed) || 0.5;
      const yPos = -(this.lastScrollY * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  }
}

// ==========================================
// FLOATING ELEMENTS MANAGER
// ==========================================

class FloatingElementsManager {
  constructor() {
    this.floatingElements = document.querySelectorAll(CONFIG.SELECTORS.floatingElements);
    this.mouseX = 0;
    this.mouseY = 0;
    this.animationId = null;
  }

  init() {
    if (window.innerWidth < 768) return; // Disable on mobile
    
    // Mouse move event for interactive floating
    document.addEventListener('mousemove', throttle((e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    }, 50));
    
    this.animate();
  }

  animate() {
    this.floatingElements.forEach((element, index) => {
      const speed = parseFloat(element.dataset.speed) || 0.5;
      const x = this.mouseX * speed * 10;
      const y = this.mouseY * speed * 10;
      
      element.style.transform = `translate(${x}px, ${y}px)`;
    });
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// ==========================================
// SMOOTH SCROLL HANDLER
// ==========================================

class SmoothScrollHandler {
  constructor() {
    this.links = document.querySelectorAll('a[href^="#"]');
  }

  init() {
    this.links.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          this.scrollToElement(targetElement);
        }
      });
    });
  }

  scrollToElement(element) {
    const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
    const targetPosition = element.offsetTop - headerHeight - 20;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
}

// ==========================================
// PERFORMANCE MONITOR
// ==========================================

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
  }

  init() {
    if (!window.performance) return;
    
    // Monitor page load performance
    window.addEventListener('load', () => {
      this.recordLoadMetrics();
    });
    
    // Monitor largest contentful paint
    if ('PerformanceObserver' in window) {
      this.observeLCP();
      this.observeFID();
    }
  }

  recordLoadMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
      
      console.log('Page Performance Metrics:', this.metrics);
    }
  }

  observeLCP() {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(observer);
  }

  observeFID() {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-input') {
          this.metrics.fid = entry.processingStart - entry.startTime;
        }
      });
    });
    
    observer.observe({ entryTypes: ['first-input'] });
    this.observers.push(observer);
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
  }
}

// ==========================================
// ERROR HANDLER
// ==========================================

class ErrorHandler {
  constructor() {
    this.errors = [];
  }

  init() {
    // Catch JavaScript errors
    window.addEventListener('error', (e) => {
      this.handleError({
        message: e.message,
        source: e.filename,
        line: e.lineno,
        column: e.colno,
        stack: e.error?.stack
      });
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.handleError({
        message: 'Unhandled Promise Rejection',
        reason: e.reason
      });
    });
  }

  handleError(errorInfo) {
    this.errors.push({
      ...errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Log to console in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.error('Application Error:', errorInfo);
    }
    
    // In production, you might want to send errors to a logging service
    // this.sendErrorToService(errorInfo);
  }

  getErrors() {
    return this.errors;
  }
}

// ==========================================
// MAIN APPLICATION CLASS
// ==========================================

class CrumbleBakeryApp {
  constructor() {
    this.modules = {
      loadingManager: new LoadingManager(),
      countdownTimer: new CountdownTimer(),
      scrollEffectsManager: new ScrollEffectsManager(),
      floatingElementsManager: new FloatingElementsManager(),
      smoothScrollHandler: new SmoothScrollHandler(),
      performanceMonitor: new PerformanceMonitor(),
      errorHandler: new ErrorHandler()
    };
  }

  init() {
    try {
      // Initialize error handling first
      this.modules.errorHandler.init();
      
      // Initialize performance monitoring
      this.modules.performanceMonitor.init();
      
      // Initialize loading screen
      this.modules.loadingManager.init();
      
      // Initialize other modules after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.initModules();
        });
      } else {
        this.initModules();
      }
      
      console.log('🧁 Crumble Bakery website initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize Crumble Bakery app:', error);
      this.modules.errorHandler.handleError({
        message: 'App initialization failed',
        error: error.message,
        stack: error.stack
      });
    }
  }

  initModules() {
    // Initialize countdown timer
    this.modules.countdownTimer.init();
    
    // Initialize scroll effects
    this.modules.scrollEffectsManager.init();
    
    // Initialize floating elements
    this.modules.floatingElementsManager.init();
    
    // Initialize smooth scrolling
    this.modules.smoothScrollHandler.init();
    
    // Add any additional initialization here
    this.setupGlobalEventListeners();
    this.setupKeyboardNavigation();
  }

  setupGlobalEventListeners() {
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden - pause animations if needed
        this.modules.floatingElementsManager.destroy();
      } else {
        // Page is visible - resume animations
        if (window.innerWidth >= 768) {
          this.modules.floatingElementsManager.init();
        }
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', debounce(() => {
      // Reinitialize floating elements based on screen size
      this.modules.floatingElementsManager.destroy();
      if (window.innerWidth >= 768) {
        this.modules.floatingElementsManager.init();
      }
    }, 250));
  }

  setupKeyboardNavigation() {
    // Improve keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Escape key to close any open modals (future enhancement)
      if (e.key === 'Escape') {
        // Handle escape key
      }
      
      // Skip to main content on Tab
      if (e.key === 'Tab' && !e.shiftKey && document.activeElement === document.body) {
        const mainContent = document.querySelector('main');
        if (mainContent) {
          mainContent.focus();
        }
      }
    });
  }

  destroy() {
    // Clean up all modules
    Object.values(this.modules).forEach(module => {
      if (typeof module.destroy === 'function') {
        module.destroy();
      }
    });
  }
}

// ==========================================
// INITIALIZATION
// ==========================================

// Initialize the application
const app = new CrumbleBakeryApp();
app.init();

// Make app available globally for debugging
window.CrumbleBakeryApp = app;

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CrumbleBakeryApp;
}