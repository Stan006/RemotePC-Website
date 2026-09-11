// ============================================================
// FAQ accordion (single-open across all groups)
// ============================================================
document.querySelectorAll('.faq-q').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      item.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});

// ============================================================
// Mobile nav toggle
// ============================================================
const navToggle = document.getElementById('navToggle');
const navPanel = document.getElementById('navPanel');

if (navToggle && navPanel) {
  const menuIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>';
  const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  const closeMobileMenu = () => {
    navPanel.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    navToggle.innerHTML = menuIcon;
  };

  const openMobileMenu = () => {
    navPanel.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
    navToggle.innerHTML = closeIcon;
  };

  navToggle.addEventListener('click', () => {
    if (navPanel.classList.contains('open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  // Close the menu when any link inside it is tapped
  navPanel.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      closeMobileMenu();
    }
  });

  // Close it if the viewport grows back past the mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && navPanel.classList.contains('open')) {
      closeMobileMenu();
    }
  });

  // Close on outside tap/click
  document.addEventListener('click', (e) => {
    if (
      navPanel.classList.contains('open') &&
      !navPanel.contains(e.target) &&
      !navToggle.contains(e.target)
    ) {
      closeMobileMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navPanel.classList.contains('open')) {
      closeMobileMenu();
      navToggle.focus();
    }
  });
}

// ============================================================
// Feature grid — cursor-follow highlight (responds to the
// user's own mouse position, not a scroll/load animation)
// ============================================================
document.querySelectorAll('.feature, .category-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', `${x}%`);
    card.style.setProperty('--my', `${y}%`);
  });
});

// ============================================================
// Smooth scroll with offset for the sticky header
// (":not([href=\"#\"])" excludes bare "#" links like the logo,
// which would otherwise throw on document.querySelector('#'))
// ============================================================
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

// ============================================================
// Scroll progress bar, header "scrolled" state, back-to-top
// ============================================================
const scrollProgressBar = document.getElementById('scrollProgressBar');
const backToTop = document.getElementById('backToTop');
const siteHeader = document.querySelector('.site-header');

function updateScrollState() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;

  if (scrollProgressBar) scrollProgressBar.style.width = `${progress}%`;
  if (siteHeader) siteHeader.classList.toggle('scrolled', scrollTop > 12);
  if (backToTop) backToTop.classList.toggle('visible', progress > 50);
}

window.addEventListener('scroll', updateScrollState, { passive: true });
updateScrollState();

if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ============================================================
// Download modal + latest Windows build lookup
// ============================================================
const downloadModal = document.getElementById('downloadModal');
const downloadBtn = document.getElementById('downloadBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const understandCheckbox = document.getElementById('understandCheckbox');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
const downloadBtnLabel = document.getElementById('downloadBtnLabel');
const modalDownloadBtnLabel = document.getElementById('modalDownloadBtnLabel');

const GITHUB_RELEASES_API = 'https://api.github.com/repos/Stan006/RemotePC/releases/latest';
const GITHUB_RELEASES_PAGE = 'https://github.com/Stan006/RemotePC/releases/latest';

let resolvedExeUrl = null;

async function resolveLatestWindowsBuild() {
  try {
    const res = await fetch(GITHUB_RELEASES_API);
    if (!res.ok) throw new Error('GitHub API request failed');
    const release = await res.json();

    const exeAsset = (release.assets || []).find(a => a.name.toLowerCase().endsWith('.exe'));
    resolvedExeUrl = exeAsset ? exeAsset.browser_download_url : GITHUB_RELEASES_PAGE;

    if (release.tag_name) {
      [downloadBtnLabel, modalDownloadBtnLabel].forEach(label => {
        if (label) label.textContent = `Download for Windows (${release.tag_name})`;
      });
    }
  } catch (error) {
    // Network/API hiccup — fall back to the releases page so the
    // button still does something useful.
    resolvedExeUrl = GITHUB_RELEASES_PAGE;
    console.error('Could not resolve the latest release:', error);
  }
}

resolveLatestWindowsBuild();

function openDownloadModal() {
  if (!downloadModal) return;
  downloadModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  modalCloseBtn?.focus();
}

function closeDownloadModal() {
  if (!downloadModal) return;
  downloadModal.style.display = 'none';
  document.body.style.overflow = '';
  downloadBtn?.focus();
}

if (downloadBtn && downloadModal) {
  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openDownloadModal();
  });
}

modalCloseBtn?.addEventListener('click', closeDownloadModal);

downloadModal?.addEventListener('click', (e) => {
  if (e.target === downloadModal) closeDownloadModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && downloadModal && downloadModal.style.display === 'flex') {
    closeDownloadModal();
  }
});

understandCheckbox?.addEventListener('change', () => {
  if (!modalDownloadBtn) return;
  const enabled = understandCheckbox.checked;
  modalDownloadBtn.classList.toggle('btn-disabled', !enabled);
  modalDownloadBtn.setAttribute('aria-disabled', String(!enabled));
});

modalDownloadBtn?.addEventListener('click', (e) => {
  if (!understandCheckbox?.checked) {
    e.preventDefault();
    return;
  }
  if (resolvedExeUrl) {
    modalDownloadBtn.setAttribute('href', resolvedExeUrl);
  }
  closeDownloadModal();
});

// ============================================================
// Search functionality
// Guarded — not present on every page that loads this script,
// but kept here so pages with a search UI (e.g. a help center)
// continue to work against the same shared script.
// ============================================================
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

if (searchInput) {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}

// ============================================================
// Form validation and submission
// Guarded — this page doesn't include a contact form, but other
// pages on the same site (e.g. /contact/) share this script.
// ============================================================
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