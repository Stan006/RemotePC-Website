// FAQ accordion
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    
    // Close all items
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });
    
    // Open clicked item if it was closed
    if (!isOpen) {
      item.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');

if (mobileMenuBtn && navMenu) {
  const menuIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>';
  const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  const closeMobileMenu = () => {
    navMenu.classList.remove('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.setAttribute('aria-label', 'Open menu');
    mobileMenuBtn.innerHTML = menuIcon;
  };

  const openMobileMenu = () => {
    navMenu.classList.add('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
    mobileMenuBtn.setAttribute('aria-label', 'Close menu');
    mobileMenuBtn.innerHTML = closeIcon;
  };

  mobileMenuBtn.addEventListener('click', () => {
    if (navMenu.classList.contains('open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  // Close the menu when any link inside it is tapped
  navMenu.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      closeMobileMenu();
    }
  });

  // Close it if the viewport grows back past the mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 968 && navMenu.classList.contains('open')) {
      closeMobileMenu();
    }
  });

  // Close on outside tap/click
  document.addEventListener('click', (e) => {
    if (
      navMenu.classList.contains('open') &&
      !navMenu.contains(e.target) &&
      !mobileMenuBtn.contains(e.target)
    ) {
      closeMobileMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) {
      closeMobileMenu();
      mobileMenuBtn.focus();
    }
  });
}

// Feature card mouse tracking
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  });
});

// Smooth scroll with offset for fixed header
// (":not([href=\"#\"])" excludes bare "#" links like the logo and the
// download buttons, which already have their own click handlers and would
// otherwise throw on document.querySelector('#'))
document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return; // no matching element for this hash, let default behavior happen
    e.preventDefault();
    const offset = 72; // Header height
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  });
});

// Search functionality
const searchInput = document.getElementById('searchInput');
const categoriesContainer = document.getElementById('categoriesContainer');
const noResults = document.getElementById('noResults');

if (searchInput && categoriesContainer && noResults) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const categories = categoriesContainer.querySelectorAll('.category-card');
    let hasResults = false;

    categories.forEach(category => {
      const articles = category.querySelectorAll('.article-link');
      let categoryHasMatch = false;

      articles.forEach(article => {
        const titleElement = article.querySelector('span');
        if (titleElement) {
          const title = titleElement.textContent.toLowerCase();
          const parent = article.parentElement;
          
          if (title.includes(query)) {
            parent.style.display = 'block';
            categoryHasMatch = true;
            hasResults = true;
          } else {
            parent.style.display = query ? 'none' : 'block';
          }
        }
      });

      category.style.display = (categoryHasMatch || !query) ? 'block' : 'none';
    });

    noResults.classList.toggle('hidden', hasResults || !query);
  });
}

// Form validation and submission
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  const submitBtn = document.getElementById('submitBtn');
  const formMessage = document.getElementById('formMessage');

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Suspicious patterns to detect
  // Note: no 'g' flag here — these are only ever used with .test(), and a
  // global regex keeps a lastIndex between calls, which makes repeated
  // .test() calls on the same pattern unreliable (a match can be skipped
  // or falsely reported depending on where the previous call left off).
  const suspiciousPatterns = [
    /script/i,
    /<[^>]*>/,  // HTML tags
    /javascript:/i,
    /on\w+=/i,  // Event handlers
    /\{[^}]*\}/,  // Template strings
    /viagra|cialis|casino|lottery/i  // Common spam words
  ];

  // Rate limiting (simple client-side check)
  let lastSubmitTime = 0;
  const SUBMIT_COOLDOWN = 60000; // 1 minute

  function validateField(field) {
    const formGroup = field.closest('.form-group');
    let isValid = true;

    // Check required
    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
    }

    // Check minlength
    if (field.hasAttribute('minlength')) {
      const minLength = parseInt(field.getAttribute('minlength'));
      if (field.value.trim().length < minLength) {
        isValid = false;
      }
    }

    // Check maxlength
    if (field.hasAttribute('maxlength')) {
      const maxLength = parseInt(field.getAttribute('maxlength'));
      if (field.value.length > maxLength) {
        isValid = false;
      }
    }

    // Email specific validation
    if (field.type === 'email' && field.value.trim()) {
      isValid = emailRegex.test(field.value.trim());
    }

    // Check for suspicious content
    const value = field.value;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(value)) {
        isValid = false;
        break;
      }
    }

    formGroup.classList.toggle('error', !isValid);
    return isValid;
  }

  // Real-time validation
  ['name', 'email', 'message'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.closest('.form-group').classList.contains('error')) {
          validateField(field);
        }
      });
    }
  });

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous messages
    formMessage.className = 'form-message';
    formMessage.textContent = '';

    // Rate limiting check
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
      const waitTime = Math.ceil((SUBMIT_COOLDOWN - (now - lastSubmitTime)) / 1000);
      formMessage.className = 'form-message error';
      formMessage.textContent = `Please wait ${waitTime} seconds before submitting again.`;
      return;
    }

    // Validate all fields
    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const messageField = document.getElementById('message');

    const isNameValid = validateField(nameField);
    const isEmailValid = validateField(emailField);
    const isMessageValid = validateField(messageField);

    if (!isNameValid || !isEmailValid || !isMessageValid) {
      formMessage.className = 'form-message error';
      formMessage.textContent = 'Please fix the errors in the form.';
      return;
    }

    // Check reCAPTCHA
    // Guard against the reCAPTCHA script failing to load (ad blockers, offline
    // testing, network issues) — otherwise grecaptcha is undefined here and
    // this throws before the button/message state is ever updated.
    if (typeof grecaptcha === 'undefined') {
      formMessage.className = 'form-message error';
      formMessage.textContent = 'Verification failed to load. Please refresh the page and try again.';
      return;
    }

    const recaptchaResponse = grecaptcha.getResponse();
    if (!recaptchaResponse) {
      formMessage.className = 'form-message error';
      formMessage.textContent = 'Please complete the reCAPTCHA verification.';
      return;
    }

    // Set replyTo field
    const replyToField = document.getElementById('replyTo');
    if (replyToField) {
      replyToField.value = emailField.value;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const formData = new FormData(contactForm);
      formData.append('g-recaptcha-response', recaptchaResponse);

      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        formMessage.className = 'form-message success';
        formMessage.textContent = 'Message sent successfully! We\'ll get back to you soon.';
        contactForm.reset();
        grecaptcha.reset();
        lastSubmitTime = Date.now();
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      formMessage.className = 'form-message error';
      formMessage.textContent = 'Failed to send message. Please try again or contact us directly via email.';
      console.error('Form submission error:', error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send Message';
    }
  });
}
