// ============================================
// Configuration
// ============================================
const CONFIG = {
  SERVER_HOST: 'sachaserver.play.minekube.net', // Replace with your actual server IP
  TYPEFORM_ID: 'IK9rnMVd', // Replace with your Typeform ID (e.g., 'IK9rnMVd')
  DISCORD_INVITE: 'https://discord.gg/dFwMD8jk4J', // Discord invite URL
  STATUS_REFRESH_INTERVAL: 60000, // 60 seconds
};

// ============================================
// IP Blacklist
// ============================================
const IP_BLACKLIST = [
  '192.168.50.145',
  // Add more IPs below:
  // '10.0.0.123',
  // '172.16.0.45',
  
];

/**
 * Check if the current user's IP is blacklisted
 * Note: This is client-side and can be bypassed. For real security,
 * implement IP blocking on your server/firewall level.
 */
function checkIPBlacklist() {
  // Attempt to get user's IP (limited in browser environment)
  // This is a placeholder - actual IP detection requires server-side implementation
  // or using a third-party service
  
  // For demonstration, you could use a service like:
  // fetch('https://api.ipify.org?format=json')
  //   .then(response => response.json())
  //   .then(data => {
  //     if (IP_BLACKLIST.includes(data.ip)) {
  //       blockAccess();
  //     }
  //   });
  
  console.log('IP blacklist check initialized');
}

function blockAccess() {
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #1a1a1a;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 2rem;
    ">
      <h1 style="font-size: 3rem; margin-bottom: 1rem;">🚫</h1>
      <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">Access Denied</h2>
      <p style="color: #999; font-size: 1.1rem;">Your IP address has been blocked.</p>
    </div>
  `;
}

// ============================================
// Utilities
// ============================================
const qs = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

const prefersReducedMotion = () => 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================
// Toast Notification
// ============================================
let toastTimeout;

function showToast(message, duration = 3000) {
  const toast = qs('#toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.classList.add('show');
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// ============================================
// Copy to Clipboard
// ============================================
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
}

// ============================================
// Copy IP Handlers
// ============================================
function setupCopyHandlers() {
  // Copy from header server name
  const serverName = qs('#server-name');
  if (serverName) {
    serverName.addEventListener('click', async () => {
      const success = await copyToClipboard(CONFIG.SERVER_HOST);
      if (success) {
        showToast(`Copied ${CONFIG.SERVER_HOST}!`);
        serverName.style.transform = 'scale(1.1)';
        setTimeout(() => {
          serverName.style.transform = '';
        }, 200);
      }
    });
  }

  // Copy from IP bar button
  const copyIpBtn = qs('#copy-ip-btn');
  const ipBar = qs('#ip-bar');
  if (copyIpBtn) {
    copyIpBtn.addEventListener('click', async () => {
      const success = await copyToClipboard(CONFIG.SERVER_HOST);
      if (success) {
        showToast(`Copied ${CONFIG.SERVER_HOST}!`);
        if (ipBar) {
          ipBar.classList.add('copied');
          setTimeout(() => {
            ipBar.classList.remove('copied');
          }, 500);
        }
      }
    });
  }

  // Copy buttons in join section
  qsa('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const textToCopy = btn.getAttribute('data-copy') || CONFIG.SERVER_HOST;
      const success = await copyToClipboard(textToCopy);
      if (success) {
        showToast(`Copied ${textToCopy}!`);
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = 'Copy IP';
        }, 2000);
      }
    });
  });
}

// ============================================
// Server Status (mcsrvstat.us API)
// ============================================
let statusInterval;

async function fetchServerStatus() {
  const statusIndicator = qs('#status-indicator');
  const statusText = qs('#status-indicator .status-text');
  const playersOnline = qs('#players-online');
  const serverVersion = qs('#server-version');
  const motd = qs('#motd');

  try {
    const response = await fetch(`https://api.mcsrvstat.us/3/${CONFIG.SERVER_HOST}`);
    const data = await response.json();

    if (data.online) {
      // Server is online
      if (statusIndicator) statusIndicator.classList.add('online');
      if (statusText) statusText.textContent = 'Online';
      
      if (playersOnline) {
        const current = data.players?.online ?? 0;
        const max = data.players?.max ?? 0;
        playersOnline.textContent = `${current} / ${max}`;
      }
      
      if (serverVersion) {
        serverVersion.textContent = data.version || 'Unknown';
      }
      
      if (motd) {
        const motdText = data.motd?.clean?.join(' ') || 'Welcome to Sachaserver!';
        motd.textContent = motdText;
      }
    } else {
      // Server is offline
      if (statusIndicator) statusIndicator.classList.remove('online');
      if (statusText) statusText.textContent = 'Offline';
      if (playersOnline) playersOnline.textContent = '0 / 0';
      if (serverVersion) serverVersion.textContent = '—';
      if (motd) motd.textContent = 'Server is currently offline';
    }
  } catch (error) {
    console.error('Failed to fetch server status:', error);
    if (statusIndicator) statusIndicator.classList.remove('online');
    if (statusText) statusText.textContent = 'Error';
    if (playersOnline) playersOnline.textContent = '—';
    if (serverVersion) serverVersion.textContent = '—';
    if (motd) motd.textContent = 'Unable to connect';
  }
}

function setupServerStatus() {
  // Initial fetch
  fetchServerStatus();
  
  // Periodic refresh
  statusInterval = setInterval(fetchServerStatus, CONFIG.STATUS_REFRESH_INTERVAL);
  
  // Manual refresh button
  const refreshBtn = qs('#refresh-status');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchServerStatus();
      showToast('Status refreshed!', 2000);
    });
  }
}

// ============================================
// Typeform Integration
// ============================================
function embedTypeform() {
  if (!CONFIG.TYPEFORM_ID) {
    console.log('No Typeform ID provided');
    return;
  }

  const container = qs('#typeform-root');
  if (!container) return;

  // Clear placeholder
  container.innerHTML = '';

  // Create embed element
  const embedDiv = document.createElement('div');
  embedDiv.setAttribute('data-tf-widget', `https://form.typeform.com/to/${CONFIG.TYPEFORM_ID}`);
  embedDiv.style.width = '100%';
  embedDiv.style.height = '400px';
  container.appendChild(embedDiv);

  // Load Typeform embed script (use explicit https to work over file:// and http servers)
  const script = document.createElement('script');
  script.src = 'https://embed.typeform.com/next/embed.js';
  script.async = true;
  document.head.appendChild(script);
}

// ============================================
// Smooth Scroll
// ============================================
function setupSmoothScroll() {
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = qs(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });
}

// ============================================
// Active Nav Link Highlight
// ============================================
function setupActiveNavLinks() {
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav-link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    },
    {
      threshold: 0.3,
      rootMargin: '-100px 0px -66%',
    }
  );

  sections.forEach(section => observer.observe(section));
}

// ============================================
// Reveal on Scroll (Intersection Observer)
// ============================================
function setupRevealOnScroll() {
  if (prefersReducedMotion()) {
    qsa('.reveal').forEach(el => el.classList.add('in'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -10%',
    }
  );

  qsa('.reveal').forEach(el => observer.observe(el));
}

// ============================================
// Parallax Effect
// ============================================
function setupParallax() {
  if (prefersReducedMotion()) return;

  const parallaxElements = qsa('[data-parallax]');
  if (parallaxElements.length === 0) return;

  const handleScroll = throttle(() => {
    const scrolled = window.pageYOffset;
    
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.getAttribute('data-parallax')) || 0.5;
      const rect = el.getBoundingClientRect();
      const elementTop = rect.top + scrolled;
      const elementHeight = rect.height;
      const viewportHeight = window.innerHeight;
      
      // Only apply parallax when element is in or near viewport
      if (scrolled + viewportHeight > elementTop && scrolled < elementTop + elementHeight) {
        const yPos = (scrolled - elementTop) * speed;
        el.style.transform = `translateY(${yPos}px)`;
      }
    });
  }, 16); // ~60fps

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial call
}

// ============================================
// Update IP Display
// ============================================
function updateIPDisplay() {
  qsa('#ip-display, #ip-java').forEach(el => {
    if (el) el.textContent = CONFIG.SERVER_HOST;
  });
}

// ============================================
// Initialize Everything
// ============================================
// ============================================
// Announcement Bar (show until Sun 9 Nov, 12:00 AM AEDT)
// ============================================
function setupAnnouncement() {
  const bar = qs('#announcement-bar');
  if (!bar) return;

  const AEDT_OFFSET_MIN = 11 * 60; // AEDT = UTC+11 in November
  const toUtcMs = (y, m, d, h = 0, min = 0) => Date.UTC(y, m - 1, d, h - AEDT_OFFSET_MIN / 60, min);

  const nowUtc = Date.now();
  const year = new Date().getFullYear();

  // End: Sunday 9 Nov, 00:00 AEDT (midnight)
  const endMs = toUtcMs(year, 11, 9, 0, 0);

  if (nowUtc < endMs) {
    bar.classList.add('show');
  } else {
    bar.classList.remove('show');
  }

  // Re-check every minute in case the page stays open across the deadline
  setInterval(() => {
    const now = Date.now();
    if (now < endMs) {
      bar.classList.add('show');
    } else {
      bar.classList.remove('show');
    }
  }, 60000);
}

function init() {
  // Check IP blacklist first
  checkIPBlacklist();
  
  updateIPDisplay();
  setupCopyHandlers();
  setupServerStatus();
  setupSmoothScroll();
  setupActiveNavLinks();
  setupRevealOnScroll();
  setupParallax();
  embedTypeform();
  setupAnnouncement();
  
  console.log('🎮 Sachaserver website initialized!');
}

// ============================================
// DOM Ready
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ============================================
// Cleanup on Page Unload
// ============================================
window.addEventListener('beforeunload', () => {
  if (statusInterval) {
    clearInterval(statusInterval);
  }
});
