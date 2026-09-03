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
projectOverlay.innerHTML = '<div class="project-overlay-backdrop"></div><div class="project-overlay-content" role="dialog" aria-modal="true" aria-label="Project preview"></div><button class="project-overlay-close" type="button" aria-label="Close full-screen preview">×</button>';
document.body.appendChild(projectOverlay);

let activeOverlayVideo;
let overlayTouchStartY;
const supabaseUrl = 'https://qpeamauhipgmuzuauawo.supabase.co';
const supabaseKey = 'sb_publishable_qSu9ZJf_oTWbYTnSPvFt3A_2ENFdb-K';
const visitorIdKey = 'nart-motion-visitor-id';
const visitorId = localStorage.getItem(visitorIdKey) || crypto.randomUUID();
localStorage.setItem(visitorIdKey, visitorId);

const trackProjectInteraction = (action, title) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, { project_name: title });
  }
};

const getProjectStorageKey = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const closeProjectOverlay = () => {
  activeOverlayVideo?.pause();
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  if (activeOverlayVideo?.webkitDisplayingFullscreen && activeOverlayVideo.webkitExitFullscreen) {
    activeOverlayVideo.webkitExitFullscreen();
  }
  activeOverlayVideo = null;
  projectOverlay.classList.remove('is-open');
  projectOverlay.setAttribute('aria-hidden', 'true');
  projectOverlay.querySelector('.project-overlay-content').replaceChildren();
  document.body.style.overflow = '';
};

const supabaseRpc = async (functionName, payload) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  const result = await response.json();
  return Array.isArray(result) ? result[0] : result;
};

const updateProjectStats = (card, stats) => {
  if (!stats) return;
  card.querySelector('[data-view-count]').textContent = stats.views ?? 0;
  card.querySelector('[data-like-count]').textContent = stats.likes ?? 0;
  const likeButton = card.querySelector('[data-like-project]');
  likeButton?.setAttribute('aria-pressed', String(Boolean(stats.liked)));
  card.querySelector('[data-like-icon]')?.classList.toggle('is-liked', Boolean(stats.liked));
};

const recordProjectView = async (card, title) => {
  try {
    const stats = await supabaseRpc('record_project_view', { p_project_key: getProjectStorageKey(title), p_visitor_id: visitorId });
    updateProjectStats(card, stats);
    trackProjectInteraction('project_view', title);
  } catch (error) {
    console.warn('Shared project view unavailable.', error);
  }
};

const openProjectOverlay = async (card, video, title) => {
  const playbackPosition = video.currentTime;
  video.pause();
  const preview = video.cloneNode(true);
  preview.removeAttribute('id');
  preview.controls = true;
  preview.autoplay = true;
  preview.muted = false;
  preview.className = `project-overlay-video${card.classList.contains('project-feature-portrait') ? ' project-overlay-video--portrait' : ''}`;
  preview.currentTime = playbackPosition;
  activeOverlayVideo = preview;
  projectOverlay.querySelector('.project-overlay-content').appendChild(preview);
  projectOverlay.setAttribute('aria-label', `${card.querySelector('h2')?.textContent || 'Project'} preview`);
  projectOverlay.classList.add('is-open');
  projectOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  recordProjectView(card, title);

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
  actions.innerHTML = `<button type="button" class="project-action-button" data-like-project aria-label="Like ${title}" aria-pressed="false"><svg class="project-action-icon" data-like-icon viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.9c0 5.1-8.8 10.2-8.8 10.2S3.2 14 3.2 8.9A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.8 2.5Z" /></svg><span class="project-action-count" data-like-count>0</span></button><button type="button" class="project-action-button project-view-count" data-view-project aria-label="View ${title}"><svg class="project-action-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg><span class="project-action-count" data-view-count>0</span></button><button type="button" class="project-action-button" data-share-project aria-label="Share ${title}" aria-expanded="false"><svg class="project-action-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 11 7.5-4.4M8.2 13l7.5 4.4" /></svg></button>`;
  meta.after(actions);

  const likeCount = actions.querySelector('[data-like-count]');
  const viewCount = actions.querySelector('[data-view-count]');
  const likeButton = actions.querySelector('[data-like-project]');
  const likeIcon = actions.querySelector('[data-like-icon]');
  const shareButton = actions.querySelector('[data-share-project]');
  likeCount.textContent = '0';
  viewCount.textContent = '0';
  supabaseRpc('get_project_stats', { p_project_key: storageKey, p_visitor_id: visitorId })
    .then((stats) => updateProjectStats(card, stats))
    .catch((error) => console.warn('Shared project stats unavailable.', error));

  likeButton.addEventListener('click', async () => {
    try {
      const stats = await supabaseRpc('toggle_project_like', { p_project_key: storageKey, p_visitor_id: visitorId });
      updateProjectStats(card, stats);
      trackProjectInteraction(stats.liked ? 'project_like' : 'project_dislike', title);
    } catch (error) {
      console.warn('Shared project like unavailable.', error);
    }
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

  shareButton.addEventListener('click', async () => {
    const shareUrl = window.location.href.split('?')[0] + `#${storageKey}`;
    const shareText = `${title} by Nart_Motion`;
    if (navigator.share) {
      await navigator.share({ title: shareText, text: shareText, url: shareUrl }).catch(() => {});
      return;
    }

    const existingMenu = actions.querySelector('.share-menu');
    if (existingMenu) {
      existingMenu.remove();
      shareButton.setAttribute('aria-expanded', 'false');
      return;
    }

    const menu = document.createElement('div');
    menu.className = 'share-menu';
    menu.innerHTML = `<a href="https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}" target="_blank" rel="noreferrer">WhatsApp</a><a href="mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}">Email</a>`;
    shareButton.after(menu);
    shareButton.setAttribute('aria-expanded', 'true');
    trackProjectInteraction('project_share', title);
  });

  galleryTrigger?.addEventListener('click', () => {
    recordProjectView(card, title);
  });
});

projectOverlay.querySelector('.project-overlay-close').addEventListener('click', (event) => {
  event.stopPropagation();
  closeProjectOverlay();
});

projectOverlay.querySelector('.project-overlay-close').addEventListener('touchend', (event) => {
  event.preventDefault();
  event.stopPropagation();
  closeProjectOverlay();
}, { passive: false });

projectOverlay.addEventListener('pointerdown', (event) => {
  if (event.target === projectOverlay || event.target.classList.contains('project-overlay-backdrop')) {
    closeProjectOverlay();
  }
});

projectOverlay.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'mouse') overlayTouchStartY = event.clientY;
});

projectOverlay.addEventListener('pointerup', (event) => {
  if (overlayTouchStartY === undefined) return;
  if (event.clientY - overlayTouchStartY > 80) closeProjectOverlay();
  overlayTouchStartY = undefined;
});

projectOverlay.addEventListener('touchend', (event) => {
  if (event.target === projectOverlay || event.target.classList.contains('project-overlay-backdrop')) {
    event.preventDefault();
    closeProjectOverlay();
  }
}, { passive: false });

projectOverlay.addEventListener('click', (event) => {
  if (event.target === projectOverlay || event.target.classList.contains('project-overlay-backdrop')) {
    closeProjectOverlay();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeProjectOverlay();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !galleryModal.hidden) {
    galleryModal.hidden = true;
    document.body.classList.remove('gallery-modal-open');
  }
});
