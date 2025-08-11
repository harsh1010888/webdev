// popup.js - controls
const blurHomepageToggle = document.getElementById('blurHomepageToggle');
const blockShortsToggle = document.getElementById('blockShortsToggle');
const applyBtn = document.getElementById('applyBtn');

function loadSettings() {
  chrome.storage.sync.get({
    blurHomepageEnabled: true,
    blockShortsEnabled: true
  }, prefs => {
    blurHomepageToggle.checked = prefs.blurHomepageEnabled;
    blockShortsToggle.checked = prefs.blockShortsEnabled;
  });
}

applyBtn.addEventListener('click', () => {
  const settings = {
    blurHomepageEnabled: blurHomepageToggle.checked,
    blockShortsEnabled: blockShortsToggle.checked
  };
  chrome.storage.sync.set(settings, () => {
    // signal active tab to re-run logic (set global var)
    chrome.tabs.query({active:true,currentWindow:true}, tabs => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => { window.__youtube_focus_reload_settings = Date.now(); }
        });
      }
    });
    window.close();
  });
});

loadSettings();
