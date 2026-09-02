const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelector('#year').textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const galleryModal = document.querySelector('[data-gallery-modal]');
const galleryImages = document.querySelector('[data-gallery-images]');
const galleryCollections = {
  moosla: Array.from({ length: 30 }, (_, index) => `assets/projects/moosla/Artboard-${String(index + 1).padStart(2, '0')}.png`),
  fliers: [
    'assets/projects/fliers/B2B (1).png',
    'assets/projects/fliers/BOBA_FESTA.png',
    'assets/projects/fliers/D&D_press.png',
    'assets/projects/fliers/KEJEFAIR_1.png',
    'assets/projects/fliers/Kejefair_next.png',
    'assets/projects/fliers/Kenten.png',
    'assets/projects/fliers/Mc_2.png',
    'assets/projects/fliers/monitor_fees.png',
    'assets/projects/fliers/Salikod_05_Social.png',
    'assets/projects/fliers/The Alpha_shop.png'
  ]
};

const getGalleryPaths = (key) => galleryCollections[key].map((path) => encodeURI(path));

document.querySelectorAll('[data-gallery]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const key = trigger.dataset.gallery;
    const galleryPaths = getGalleryPaths(key);
    const label = key === 'fliers' ? 'Still graphics preview' : 'Moosla brand identity preview';

    galleryImages.replaceChildren(...galleryPaths.map((path, index) => {
      const image = document.createElement('img');
      image.src = path;
      image.alt = `${key === 'fliers' ? 'Still graphics' : 'Moosla brand identity'} work ${index + 1}`;
      image.loading = index === 0 ? 'eager' : 'lazy';
      return image;
    }));

    galleryModal.hidden = false;
    galleryModal.setAttribute('aria-label', label);
    galleryModal.querySelector('.gallery-modal-panel').setAttribute('aria-label', label);
    document.body.classList.add('gallery-modal-open');
  });
});

document.querySelectorAll('[data-gallery-close]').forEach((closeButton) => {
  closeButton.addEventListener('click', () => {
    galleryModal.hidden = true;
    document.body.classList.remove('gallery-modal-open');
  });
});

const portraitCards = document.querySelectorAll('.project-feature-portrait');

portraitCards.forEach((card) => {
  const player = card.querySelector('.project-player--portrait');
  const video = player?.querySelector('video');

  if (!player || !video) return;

  const closePortrait = () => {
    card.classList.remove('is-expanded');
    document.body.style.overflow = '';
    video.pause();
    video.currentTime = 0;
  };

  player.addEventListener('click', async () => {
    const isExpanded = card.classList.toggle('is-expanded');
    document.body.style.overflow = isExpanded ? 'hidden' : '';

    if (isExpanded) {
      try {
        await video.play();
      } catch (error) {
        // Gesture-driven playback can be blocked until the user interacts; the video still remains visible.
      }

      if (typeof video.requestFullscreen === 'function') {
        try {
          await video.requestFullscreen();
        } catch (error) {
          // Fullscreen preference is optional; the expanded portrait layout still works.
        }
      }
    } else {
      closePortrait();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && card.classList.contains('is-expanded')) {
      closePortrait();
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !galleryModal.hidden) {
    galleryModal.hidden = true;
    document.body.classList.remove('gallery-modal-open');
  }
});
