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
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          const offset = 72; // Header height
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const noResults = document.getElementById('noResults');
    const categoryCards = document.querySelectorAll('.category-card');
    const articleLinks = document.querySelectorAll('.article-link');

    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();

      if (searchTerm === '') {
        // Show all categories
        categoryCards.forEach(card => card.classList.remove('hidden'));
        noResults.classList.add('hidden');
        return;
      }

      let hasResults = false;

      categoryCards.forEach(card => {
        const articles = card.querySelectorAll('.article-link');
        let categoryHasMatch = false;

        articles.forEach(article => {
          const title = article.getAttribute('data-title').toLowerCase();
          const parent = article.closest('li');

          if (title.includes(searchTerm)) {
            parent.classList.remove('hidden');
            categoryHasMatch = true;
            hasResults = true;
          } else {
            parent.classList.add('hidden');
          }
        });

        // Hide category if no articles match
        if (categoryHasMatch) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });

      // Show no results message if nothing found
      if (!hasResults) {
        noResults.classList.remove('hidden');
      } else {
        noResults.classList.add('hidden');
      }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

// Search functionality
    const searchInput = document.getElementById('searchInput');
    const categoriesContainer = document.getElementById('categoriesContainer');
    const noResults = document.getElementById('noResults');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const categories = categoriesContainer.querySelectorAll('.category-card');
        let hasResults = false;

        categories.forEach(category => {
          const articles = category.querySelectorAll('.article-link');
          let categoryHasMatch = false;

          articles.forEach(article => {
            const title = article.querySelector('span').textContent.toLowerCase();
            if (title.includes(query)) {
              article.parentElement.style.display = 'block';
              categoryHasMatch = true;
              hasResults = true;
            } else {
              article.parentElement.style.display = query ? 'none' : 'block';
            }
          });

          category.style.display = (categoryHasMatch || !query) ? 'block' : 'none';
        });

        noResults.classList.toggle('hidden', hasResults || !query);
      });
    }

    // Form validation and submission
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Suspicious patterns to detect
    const suspiciousPatterns = [
      /script/i,
      /<[^>]*>/g,  // HTML tags
      /javascript:/i,
      /on\w+=/i,  // Event handlers
      /\{[^}]*\}/g,  // Template strings
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
      const recaptchaResponse = grecaptcha.getResponse();
      if (!recaptchaResponse) {
        formMessage.className = 'form-message error';
        formMessage.textContent = 'Please complete the reCAPTCHA verification.';
        return;
      }

      // Set replyTo field
      document.getElementById('replyTo').value = emailField.value;

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
