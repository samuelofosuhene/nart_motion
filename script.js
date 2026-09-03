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

const projectOverlay = document.createElement('div');
projectOverlay.className = 'project-overlay';
projectOverlay.setAttribute('aria-hidden', 'true');
projectOverlay.innerHTML = '<div class="project-overlay-backdrop"></div><div class="project-overlay-content" role="dialog" aria-modal="true" aria-label="Project preview"></div>';
document.body.appendChild(projectOverlay);

let activeOverlayVideo;

const trackProjectInteraction = (action, title) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, { project_name: title });
  }
};

const getProjectStorageKey = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const closeProjectOverlay = () => {
  activeOverlayVideo?.pause();
  activeOverlayVideo = null;
  projectOverlay.classList.remove('is-open');
  projectOverlay.setAttribute('aria-hidden', 'true');
  projectOverlay.querySelector('.project-overlay-content').replaceChildren();
  document.body.style.overflow = '';
};

const openProjectOverlay = async (card, video, title) => {
  const preview = video.cloneNode(true);
  preview.removeAttribute('id');
  preview.controls = true;
  preview.autoplay = true;
  preview.muted = false;
  preview.className = 'project-overlay-video';
  preview.currentTime = video.currentTime;
  activeOverlayVideo = preview;
  projectOverlay.querySelector('.project-overlay-content').replaceChildren(preview);
  projectOverlay.setAttribute('aria-label', `${card.querySelector('h2')?.textContent || 'Project'} preview`);
  projectOverlay.classList.add('is-open');
  projectOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const viewKey = `nart-motion-views-${getProjectStorageKey(title)}`;
  localStorage.setItem(viewKey, String(Number(localStorage.getItem(viewKey) || 0) + 1));
  card.querySelector('[data-view-count]').textContent = localStorage.getItem(viewKey);
  trackProjectInteraction('project_view', title);

  try {
    await preview.play();
  } catch (error) {
    // Playback can wait for the tap gesture to complete.
  }
};

document.querySelectorAll('.project').forEach((card, index) => {
  const title = card.querySelector('h2')?.textContent || `Project ${index + 1}`;
  const storageKey = getProjectStorageKey(title);
  const meta = card.querySelector('.project-meta');
  const media = card.querySelector('.project-player');
  if (!meta) return;

  const actions = document.createElement('div');
  actions.className = 'project-actions';
  actions.innerHTML = `<button type="button" data-like-project aria-pressed="false">♡ <span data-like-count>0</span></button><button type="button" class="project-view-count" data-view-project>◉ <span data-view-count>0</span></button>`;
  meta.after(actions);

  const likeKey = `nart-motion-likes-${storageKey}`;
  const viewKey = `nart-motion-views-${storageKey}`;
  const likeCount = actions.querySelector('[data-like-count]');
  const viewCount = actions.querySelector('[data-view-count]');
  const likeButton = actions.querySelector('[data-like-project]');
  likeCount.textContent = localStorage.getItem(likeKey) || '0';
  viewCount.textContent = localStorage.getItem(viewKey) || '0';

  likeButton.addEventListener('click', () => {
    const nextCount = Number(localStorage.getItem(likeKey) || 0) + 1;
    localStorage.setItem(likeKey, String(nextCount));
    likeCount.textContent = String(nextCount);
    likeButton.setAttribute('aria-pressed', 'true');
    trackProjectInteraction('project_like', title);
  });

  const video = media?.querySelector('video');
  const galleryTrigger = card.querySelector('[data-gallery]');
  video?.addEventListener('click', (event) => {
    event.stopPropagation();
    openProjectOverlay(card, video, title);
  });

  actions.querySelector('[data-view-project]').addEventListener('click', () => {
    if (video) {
      openProjectOverlay(card, video, title);
    } else {
      galleryTrigger?.click();
    }
  });

  galleryTrigger?.addEventListener('click', () => {
    const nextCount = Number(localStorage.getItem(viewKey) || 0) + 1;
    localStorage.setItem(viewKey, String(nextCount));
    viewCount.textContent = String(nextCount);
  });
});

projectOverlay.querySelector('.project-overlay-backdrop').addEventListener('click', closeProjectOverlay);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeProjectOverlay();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !galleryModal.hidden) {
    galleryModal.hidden = true;
    document.body.classList.remove('gallery-modal-open');
  }
});
