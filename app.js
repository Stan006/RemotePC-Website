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