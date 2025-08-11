

let state = { blurHomepageEnabled: true, blockShortsEnabled: true };
let styleEl = null;
let observer = null;

function isHomepage() {
  const p = location.pathname;
  return p === '/' || p === '' || p.startsWith('/feed');
}
function isShorts() { return location.pathname.startsWith('/shorts'); }

function ensureStyle() {
  if (styleEl) return;
  styleEl = document.createElement('style');
  styleEl.id = 'yt-focus-style';
  styleEl.textContent = `
  /* blurred feed area */
  .yt-focus-blurred { filter: blur(12px) !important; pointer-events: none !important; user-select: none !important; }
  /* small overlay card placed inside feed so header/search remain clickable */
  .yt-focus-overlay-card { position:absolute; left:50%; transform:translateX(-50%); top:12px; z-index:2147483647; background:rgba(0,0,0,0.82); color:#fff; padding:10px 14px; border-radius:8px; font-family:Arial, sans-serif; font-size:13px; display:flex; gap:8px; align-items:center; }
  .yt-focus-overlay-card button{ padding:6px 10px; border-radius:6px; border:none; background:#1a73e8; color:#fff; cursor:pointer; }
  `;
  document.head.appendChild(styleEl);
}

function findHomepageFeed() {
  const feedSelectors = [
    'ytd-rich-grid-renderer',
    'ytd-rich-section-renderer',
    'ytd-two-column-browse-results-renderer',
    'ytd-browse',
    'ytd-rich-grid-row'
  ];
  for (const s of feedSelectors) {
    const el = document.querySelector(s);
    if (el) return el;
  }
  // fallback: main #contents but make sure it's not a watch or search page header contents
  const contents = document.getElementById('contents');
  return contents;
}

function applyBlurToHomepageFeed() {
  removeBlurFromHomepageFeed(); // clean first
  const feed = findHomepageFeed();
  if (!feed) return;
  ensureStyle();

 
  const computed = getComputedStyle(feed);
  if (computed.position === 'static') feed.style.position = 'relative';

  
  feed.classList.add('yt-focus-blurred');


  const overlay = document.createElement('div');
  overlay.className = 'yt-focus-overlay-card';
  overlay.innerHTML = `<div>Focus: homepage blurred</div><button id="yt-focus-disable-btn">Disable</button>`;
  feed.appendChild(overlay);

  const btn = overlay.querySelector('#yt-focus-disable-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      chrome.storage.sync.set({ blurHomepageEnabled: false }, () => {
        loadAndApply();
      });
    });
  }
}

function removeBlurFromHomepageFeed() {
  const feeds = document.querySelectorAll('.yt-focus-blurred');
  feeds.forEach(feed => {
    feed.classList.remove('yt-focus-blurred');
    // remove overlay cards inside this feed
    const overlay = feed.querySelector('.yt-focus-overlay-card');
    if (overlay) overlay.remove();
    // if we set style.position earlier, don't revert it to avoid layout jank
  });
}

function handleShortsBlocking() {
  if (isShorts() && state.blockShortsEnabled) {
    // redirect back to homepage to prevent watching Shorts
    try {
      location.replace('https://www.youtube.com/');
    } catch (e) {
      console.warn('YT Focus: redirect failed', e);
    }
    return true;
  }
  return false;
}

function loadAndApply() {
  chrome.storage.sync.get({
    blurHomepageEnabled: true,
    blockShortsEnabled: true
  }, prefs => {
    state.blurHomepageEnabled = prefs.blurHomepageEnabled;
    state.blockShortsEnabled = prefs.blockShortsEnabled;

    // handle shorts first
    if (handleShortsBlocking()) return;

    // apply blur only on homepage and only to feed area
    if (isHomepage() && state.blurHomepageEnabled) {
      applyBlurToHomepageFeed();
    } else {
      removeBlurFromHomepageFeed();
    }
  });
}

function startObserver() {
  if (observer) return;
  observer = new MutationObserver(() => {
    // SPA navigation or dynamic load: re-evaluate
    loadAndApply();
  });
  observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') loadAndApply();
});

// initial
loadAndApply();
startObserver();
