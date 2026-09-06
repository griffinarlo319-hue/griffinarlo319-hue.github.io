// Interaction layer only — original page content is unchanged.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Refined sticky navigation and compact mobile menu.
  const header = document.querySelector('.nav');
  const navigation = header?.querySelector('.nav-links');
  if (header && navigation) {
    const menuButton = document.createElement('button');
    menuButton.className = 'menu-toggle';
    menuButton.type = 'button';
    menuButton.setAttribute('aria-label', 'Toggle navigation');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.innerHTML = '<span></span><span></span><span></span>';
    header.insertBefore(menuButton, header.querySelector('.btn'));

    const closeMenu = () => {
      header.classList.remove('menu-open');
      menuButton.setAttribute('aria-expanded', 'false');
    };
    menuButton.addEventListener('click', () => {
      const open = header.classList.toggle('menu-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('click', (event) => {
      if (!header.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 48);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  // Drag-to-explore interaction for the carousel artwork sequence.
  document.querySelectorAll('.works-grid-4').forEach((track) => {
    let active = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    track.addEventListener('pointerdown', (event) => {
      active = true;
      moved = false;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
      track.setPointerCapture?.(event.pointerId);
    });
    track.addEventListener('pointermove', (event) => {
      if (!active) return;
      const distance = event.clientX - startX;
      if (Math.abs(distance) > 5) moved = true;
      track.scrollLeft = startScroll - distance;
    });
    const endDrag = (event) => {
      active = false;
      track.classList.remove('is-dragging');
      try { track.releasePointerCapture?.(event.pointerId); } catch (_) {}
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('click', (event) => {
      if (moved) {
        event.preventDefault();
        event.stopImmediatePropagation();
        moved = false;
      }
    }, true);
  });

  // Gracefully reveal sections while scrolling.
  const reveals = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });
    reveals.forEach((el) => revealObserver.observe(el));
  }

  // Highlight the matching navigation item.
  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  // Preserve intentionally missing image spaces without broken-image icons.
  document.querySelectorAll('img').forEach((img) => {
    if (img.closest('.lightbox')) return;
    const markMissing = () => img.classList.add('asset-missing');
    img.addEventListener('load', () => img.classList.remove('asset-missing'));
    img.addEventListener('error', markMissing);
    if (img.complete && img.getAttribute('src') && img.naturalWidth === 0) markMissing();
  });

  // Full-resolution image viewer for every portfolio image.
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const closeButton = lightbox?.querySelector('.lb-close');
  const galleryImages = [...document.querySelectorAll('.work img, .cert img')];
  let currentImageIndex = -1;

  let previousButton;
  let nextButton;
  if (lightbox) {
    previousButton = document.createElement('button');
    previousButton.className = 'lb-nav lb-prev';
    previousButton.type = 'button';
    previousButton.setAttribute('aria-label', 'Previous image');
    previousButton.textContent = '‹';

    nextButton = document.createElement('button');
    nextButton.className = 'lb-nav lb-next';
    nextButton.type = 'button';
    nextButton.setAttribute('aria-label', 'Next image');
    nextButton.textContent = '›';

    lightbox.append(previousButton, nextButton);
  }

  const openImage = (index) => {
    if (!lightbox || !lightboxImage || !galleryImages.length) return;
    currentImageIndex = (index + galleryImages.length) % galleryImages.length;
    const selectedImage = galleryImages[currentImageIndex];
    lightboxImage.classList.remove('asset-missing');
    lightboxImage.src = selectedImage.currentSrc || selectedImage.src;
    lightboxImage.alt = selectedImage.alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox?.classList.remove('open');
    document.body.style.overflow = '';
    currentImageIndex = -1;
    if (lightboxImage) lightboxImage.src = '';
  };

  galleryImages.forEach((img, index) => {
    img.addEventListener('load', () => img.classList.remove('asset-missing'));
    const card = img.closest('.work, .cert');
    if (card) {
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Open ${img.alt}`);
      card.addEventListener('click', () => openImage(index));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openImage(index);
        }
      });
    }
  });

  previousButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    openImage(currentImageIndex - 1);
  });
  nextButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    openImage(currentImageIndex + 1);
  });
  closeButton?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (!lightbox?.classList.contains('open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') openImage(currentImageIndex - 1);
    if (event.key === 'ArrowRight') openImage(currentImageIndex + 1);
  });

  // Click-to-copy controls for contact details.
  document.querySelectorAll('.copy-email, .copy-phone').forEach((copyControl) => {
    copyControl.addEventListener('click', async (event) => {
      event.preventDefault();
      const value = copyControl.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
      } catch (_) {
        const field = document.createElement('textarea');
        field.value = value;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        document.execCommand('copy');
        field.remove();
      }
      copyControl.classList.add('copied');
      window.setTimeout(() => copyControl.classList.remove('copied'), 1400);
    });
  });
})();
