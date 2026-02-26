/* ============================================================
   NAV — mobile toggle
   ============================================================ */
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  toggle.classList.toggle('open', isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
});

// Close menu when a nav link is tapped on mobile
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
});

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
const revealEls = document.querySelectorAll(
  '.section-label, .section-title, .about-grid, .timeline-item, ' +
  '.post-card, .contact-form, .contact-links, .contact-sub'
);

revealEls.forEach((el, i) => {
  el.classList.add('reveal');
  // Stagger cards & timeline items within their group
  const parent = el.closest('.posts-grid, .timeline');
  if (parent) {
    const siblings = Array.from(parent.children);
    const idx = siblings.indexOf(el);
    if (idx === 1) el.classList.add('reveal-delay-1');
    if (idx === 2) el.classList.add('reveal-delay-2');
    if (idx === 3) el.classList.add('reveal-delay-3');
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

revealEls.forEach(el => observer.observe(el));

/* ============================================================
   CONTACT FORM — basic client-side feedback
   ============================================================ */
const form = document.querySelector('.contact-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name    = form.name.value.trim();
  const email   = form.email.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !message) {
    showFormMsg('Please fill in all fields.', 'error');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showFormMsg('Please enter a valid email address.', 'error');
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Sending…';

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, message })
    });

    if (res.ok) {
      showFormMsg("Message sent! I'll be in touch soon.", 'success');
      form.reset();
    } else {
      showFormMsg('Something went wrong. Please try emailing me directly.', 'error');
    }
  } catch {
    showFormMsg('Could not send — please check your connection and try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send message';
  }
});

function showFormMsg(text, type) {
  const existing = form.querySelector('.form-msg');
  if (existing) existing.remove();

  const msg = document.createElement('p');
  msg.className = 'form-msg';
  msg.textContent = text;
  msg.style.cssText = `
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.6em 0.9em;
    border-radius: 6px;
    margin-top: 0.25rem;
    color: ${type === 'success' ? '#a8ff78' : '#ff7878'};
    background: ${type === 'success' ? 'rgba(168,255,120,0.08)' : 'rgba(255,120,120,0.08)'};
    border: 1px solid ${type === 'success' ? 'rgba(168,255,120,0.2)' : 'rgba(255,120,120,0.2)'};
  `;
  form.appendChild(msg);

  setTimeout(() => msg.remove(), 5000);
}
