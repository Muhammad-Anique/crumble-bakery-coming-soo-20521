/**
 * ==========================================
 * CRUMBLE BAKERY - FORM VALIDATION & HANDLING
 * ==========================================
 * 
 * Handles email subscription form validation, submission,
 * and user feedback with comprehensive error handling
 */

'use strict';

// ==========================================
// CONFIGURATION
// ==========================================

const FORM_CONFIG = {
  // Form elements
  SELECTORS: {
    form: '#emailForm',
    emailInput: '#email',
    submitButton: '#submitBtn',
    errorMessage: '#emailError',
    successMessage: '#successMessage',
    buttonText: '.btn-text',
    buttonLoading: '.btn-loading'
  },
  
  // Validation settings
  VALIDATION: {
    emailRegex: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    minLength: 5,
    maxLength: 254,
    debounceDelay: 300
  },
  
  // Messages
  MESSAGES: {
    required: 'Please enter your email address',
    invalid: 'Please enter a valid email address',
    tooShort: 'Email address is too short',
    tooLong: 'Email address is too long',
    submitting: 'Subscribing...',
    success: 'Thank you! We\'ll notify you when we launch.',
    networkError: 'Network error. Please try again.',
    serverError: 'Something went wrong. Please try again later.',
    alreadySubscribed: 'You\'re already subscribed! We\'ll be in touch soon.',
    rateLimited: 'Too many attempts. Please try again in a few minutes.'
  },
  
  // Timing
  TIMING: {
    submitDelay: 1500, // Simulate network delay
    successDisplayTime: 5000,
    errorDisplayTime: 4000
  }
};

// ==========================================
// EMAIL VALIDATOR CLASS
// ==========================================

class EmailValidator {
  constructor() {
    this.config = FORM_CONFIG.VALIDATION;
  }

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {Object} Validation result with isValid and message
   */
  validate(email) {
    // Check if email is provided
    if (!email || email.trim() === '') {
      return {
        isValid: false,
        message: FORM_CONFIG.MESSAGES.required
      };
    }

    // Trim whitespace
    email = email.trim();

    // Check length
    if (email.length < this.config.minLength) {
      return {
        isValid: false,
        message: FORM_CONFIG.MESSAGES.tooShort
      };
    }

    if (email.length > this.config.maxLength) {
      return {
        isValid: false,
        message: FORM_CONFIG.MESSAGES.tooLong
      };
    }

    // Check format using regex
    if (!this.config.emailRegex.test(email)) {
      return {
        isValid: false,
        message: FORM_CONFIG.MESSAGES.invalid
      };
    }

    // Additional validation checks
    if (!this.validateEmailStructure(email)) {
      return {
        isValid: false,
        message: FORM_CONFIG.MESSAGES.invalid
      };
    }

    return {
      isValid: true,
      message: 'Valid email address'
    };
  }

  /**
   * Additional email structure validation
   * @param {string} email - Email to validate
   * @returns {boolean} Is structure valid
   */
  validateEmailStructure(email) {
    // Check for multiple @ symbols
    if ((email.match(/@/g) || []).length !== 1) {
      return false;
    }

    // Split into local and domain parts
    const [local, domain] = email.split('@');

    // Validate local part
    if (!this.validateLocalPart(local)) {
      return false;
    }

    // Validate domain part
    if (!this.validateDomainPart(domain)) {
      return false;
    }

    return true;
  }

  /**
   * Validate local part of email (before @)
   * @param {string} local - Local part
   * @returns {boolean} Is valid
   */
  validateLocalPart(local) {
    if (!local || local.length === 0 || local.length > 64) {
      return false;
    }

    // Check for invalid characters or patterns
    if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
      return false;
    }

    return true;
  }

  /**
   * Validate domain part of email (after @)
   * @param {string} domain - Domain part
   * @returns {boolean} Is valid
   */
  validateDomainPart(domain) {
    if (!domain || domain.length === 0 || domain.length > 253) {
      return false;
    }

    // Check for valid domain format
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      return false;
    }

    // Check each domain part
    for (const part of domainParts) {
      if (!part || part.length === 0 || part.length > 63) {
        return false;
      }
      
      // Check for invalid characters
      if (!/^[a-zA-Z0-9-]+$/.test(part)) {
        return false;
      }
      
      // Cannot start or end with hyphen
      if (part.startsWith('-') || part.endsWith('-')) {
        return false;
      }
    }

    // Last part should be valid TLD (at least 2 characters)
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
      return false;
    }

    return true;
  }
}

// ==========================================
// LOCAL STORAGE MANAGER
// ==========================================

class LocalStorageManager {
  constructor() {
    this.storageKey = 'crumbleBakery_emailSubmissions';
    this.rateLimitKey = 'crumbleBakery_rateLimiting';
  }

  /**
   * Check if email was already submitted
   * @param {string} email - Email to check
   * @returns {boolean} Was already submitted
   */
  wasEmailSubmitted(email) {
    try {
      const submissions = this.getSubmissions();
      return submissions.includes(email.toLowerCase());
    } catch (error) {
      console.warn('LocalStorage check failed:', error);
      return false;
    }
  }

  /**
   * Store submitted email
   * @param {string} email - Email to store
   */
  storeSubmission(email) {
    try {
      const submissions = this.getSubmissions();
      submissions.push(email.toLowerCase());
      localStorage.setItem(this.storageKey, JSON.stringify(submissions));
    } catch (error) {
      console.warn('LocalStorage store failed:', error);
    }
  }

  /**
   * Get stored submissions
   * @returns {Array} Array of submitted emails
   */
  getSubmissions() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Check rate limiting
   * @returns {boolean} Is rate limited
   */
  isRateLimited() {
    try {
      const rateLimitData = localStorage.getItem(this.rateLimitKey);
      if (!rateLimitData) return false;

      const { timestamp, attempts } = JSON.parse(rateLimitData);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // Reset if more than 5 minutes passed
      if (now - timestamp > fiveMinutes) {
        localStorage.removeItem(this.rateLimitKey);
        return false;
      }

      // Check if too many attempts
      return attempts >= 3;
    } catch (error) {
      return false;
    }
  }

  /**
   * Record submission attempt
   */
  recordAttempt() {
    try {
      const now = Date.now();
      const rateLimitData = localStorage.getItem(this.rateLimitKey);
      
      if (rateLimitData) {
        const data = JSON.parse(rateLimitData);
        data.attempts = (data.attempts || 0) + 1;
        data.timestamp = now;
        localStorage.setItem(this.rateLimitKey, JSON.stringify(data));
      } else {
        localStorage.setItem(this.rateLimitKey, JSON.stringify({
          timestamp: now,
          attempts: 1
        }));
      }
    } catch (error) {
      console.warn('Failed to record attempt:', error);
    }
  }
}

// ==========================================
// EMAIL SUBMISSION HANDLER
// ==========================================

class EmailSubmissionHandler {
  constructor() {
    this.storageManager = new LocalStorageManager();
  }

  /**
   * Submit email (simulate API call)
   * @param {string} email - Email to submit
   * @returns {Promise} Submission result
   */
  async submitEmail(email) {
    // Check rate limiting
    if (this.storageManager.isRateLimited()) {
      throw new Error(FORM_CONFIG.MESSAGES.rateLimited);
    }

    // Record attempt
    this.storageManager.recordAttempt();

    // Check if already submitted
    if (this.storageManager.wasEmailSubmitted(email)) {
      throw new Error(FORM_CONFIG.MESSAGES.alreadySubscribed);
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, FORM_CONFIG.TIMING.submitDelay));

    // Simulate random network/server errors (5% chance)
    if (Math.random() < 0.05) {
      throw new Error(FORM_CONFIG.MESSAGES.networkError);
    }

    // In a real application, you would make an API call here:
    // const response = await fetch('/api/subscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email })
    // });
    
    // For now, we'll simulate success and store locally
    this.storageManager.storeSubmission(email);
    
    return {
      success: true,
      message: FORM_CONFIG.MESSAGES.success
    };
  }
}

// ==========================================
// FORM HANDLER CLASS
// ==========================================

class EmailFormHandler {
  constructor() {
    this.form = null;
    this.emailInput = null;
    this.submitButton = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.buttonText = null;
    this.buttonLoading = null;
    
    this.validator = new EmailValidator();
    this.submissionHandler = new EmailSubmissionHandler();
    
    this.isSubmitting = false;
    this.debounceTimeout = null;
    
    this.init();
  }

  /**
   * Initialize form handler
   */
  init() {
    this.bindElements();
    if (this.form) {
      this.bindEvents();
      this.setupAccessibility();
    }
  }

  /**
   * Bind DOM elements
   */
  bindElements() {
    this.form = document.querySelector(FORM_CONFIG.SELECTORS.form);
    this.emailInput = document.querySelector(FORM_CONFIG.SELECTORS.emailInput);
    this.submitButton = document.querySelector(FORM_CONFIG.SELECTORS.submitButton);
    this.errorMessage = document.querySelector(FORM_CONFIG.SELECTORS.errorMessage);
    this.successMessage = document.querySelector(FORM_CONFIG.SELECTORS.successMessage);
    this.buttonText = document.querySelector(FORM_CONFIG.SELECTORS.buttonText);
    this.buttonLoading = document.querySelector(FORM_CONFIG.SELECTORS.buttonLoading);
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Form submission
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Real-time validation
    this.emailInput.addEventListener('input', () => {
      this.handleInputChange();
    });

    // Focus events
    this.emailInput.addEventListener('focus', () => {
      this.clearMessages();
    });

    // Paste event
    this.emailInput.addEventListener('paste', () => {
      // Delay validation to allow paste to complete
      setTimeout(() => this.handleInputChange(), 10);
    });

    // Prevent double submission on Enter
    this.emailInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.isSubmitting) {
        this.handleSubmit();
      }
    });
  }

  /**
   * Setup accessibility features
   */
  setupAccessibility() {
    // Add ARIA attributes
    this.emailInput.setAttribute('aria-describedby', 'emailError');
    this.errorMessage.setAttribute('role', 'alert');
    this.successMessage.setAttribute('role', 'status');
    
    // Add screen reader announcements
    const announcement = document.createElement('div');
    announcement.className = 'sr-only';
    announcement.setAttribute('aria-live', 'polite');
    announcement.id = 'form-announcements';
    this.form.appendChild(announcement);
    this.announcementElement = announcement;
  }

  /**
   * Handle input change with debouncing
   */
  handleInputChange() {
    clearTimeout(this.debounceTimeout);
    
    this.debounceTimeout = setTimeout(() => {
      const email = this.emailInput.value.trim();
      if (email) {
        this.validateInput(email, false);
      } else {
        this.clearMessages();
      }
    }, FORM_CONFIG.VALIDATION.debounceDelay);
  }

  /**
   * Validate input field
   * @param {string} email - Email to validate
   * @param {boolean} showSuccess - Whether to show success state
   */
  validateInput(email, showSuccess = false) {
    const validation = this.validator.validate(email);
    
    if (validation.isValid) {
      this.clearError();
      if (showSuccess) {
        this.emailInput.classList.add('valid');
      }
    } else {
      this.showError(validation.message);
      this.emailInput.classList.remove('valid');
    }
    
    return validation.isValid;
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    if (this.isSubmitting) return;

    const email = this.emailInput.value.trim();
    
    // Validate before submission
    if (!this.validateInput(email, true)) {
      this.announceToScreenReader('Please fix the errors before submitting');
      this.emailInput.focus();
      return;
    }

    this.setSubmittingState(true);
    this.announceToScreenReader('Submitting your email...');

    try {
      const result = await this.submissionHandler.submitEmail(email);
      this.handleSubmissionSuccess(result);
    } catch (error) {
      this.handleSubmissionError(error);
    } finally {
      this.setSubmittingState(false);
    }
  }

  /**
   * Handle successful submission
   * @param {Object} result - Submission result
   */
  handleSubmissionSuccess(result) {
    this.showSuccess(result.message);
    this.clearError();
    this.emailInput.value = '';
    this.emailInput.classList.remove('valid');
    this.announceToScreenReader(result.message);
    
    // Auto-hide success message
    setTimeout(() => {
      this.hideSuccess();
    }, FORM_CONFIG.TIMING.successDisplayTime);
  }

  /**
   * Handle submission error
   * @param {Error} error - Error object
   */
  handleSubmissionError(error) {
    const message = error.message || FORM_CONFIG.MESSAGES.serverError;
    this.showError(message);
    this.hideSuccess();
    this.announceToScreenReader(`Error: ${message}`);
    
    // Auto-hide error message
    setTimeout(() => {
      this.clearError();
    }, FORM_CONFIG.TIMING.errorDisplayTime);
  }

  /**
   * Set submitting state
   * @param {boolean} isSubmitting - Is form submitting
   */
  setSubmittingState(isSubmitting) {
    this.isSubmitting = isSubmitting;
    this.submitButton.disabled = isSubmitting;
    
    if (isSubmitting) {
      this.submitButton.classList.add('loading');
      this.submitButton.setAttribute('aria-label', FORM_CONFIG.MESSAGES.submitting);
    } else {
      this.submitButton.classList.remove('loading');
      this.submitButton.setAttribute('aria-label', 'Subscribe to notifications');
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.classList.add('show');
    }
    
    if (this.emailInput) {
      this.emailInput.classList.add('error');
      this.emailInput.setAttribute('aria-invalid', 'true');
    }
  }

  /**
   * Clear error message
   */
  clearError() {
    if (this.errorMessage) {
      this.errorMessage.classList.remove('show');
    }
    
    if (this.emailInput) {
      this.emailInput.classList.remove('error');
      this.emailInput.setAttribute('aria-invalid', 'false');
    }
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    if (this.successMessage) {
      this.successMessage.querySelector('span').textContent = message;
      this.successMessage.classList.add('show');
    }
  }

  /**
   * Hide success message
   */
  hideSuccess() {
    if (this.successMessage) {
      this.successMessage.classList.remove('show');
    }
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    this.clearError();
    this.hideSuccess();
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  announceToScreenReader(message) {
    if (this.announcementElement) {
      this.announcementElement.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        this.announcementElement.textContent = '';
      }, 1000);
    }
  }

  /**
   * Destroy form handler
   */
  destroy() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }
}

// ==========================================
// INITIALIZATION
// ==========================================

// Initialize form handler when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const formHandler = new EmailFormHandler();
  
  // Make available globally for debugging
  window.EmailFormHandler = formHandler;
});

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EmailFormHandler,
    EmailValidator,
    LocalStorageManager,
    EmailSubmissionHandler
  };
}