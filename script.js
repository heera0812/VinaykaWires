/* ============================================================
   VINAYKA WIRES & CABLE — Premium Site JavaScript
   Scroll animations · Stat counters · Product tabs · Full API
   ============================================================ */

'use strict';

// ── Shared Helpers ─────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const formatCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n || 0));
const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg';
const sanitizeInput = (value) => String(value || '').trim();
const normalizeWhitespace = (value) => sanitizeInput(value).replace(/\s+/g, ' ').trim();
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const isValidPhone = (value) => /^\+?[0-9]{7,15}$/.test(String(value || '').replace(/\s+/g, ''));
const hasMinLength = (value, min) => String(value || '').trim().length >= min;
const isAllowedContent = (value) => /^[a-zA-Z0-9.,!?@&()'"% +\-\s\/#:]+$/.test(String(value || ''));
const isLikelyFullName = (value) => {
  const normalized = normalizeWhitespace(value);
  const parts = normalized.split(' ');
  if (parts.length < 2) return false;
  return parts.every(part => /^[A-Za-z][A-Za-z'.-]{1,}$/.test(part));
};

// ── Footer Year ────────────────────────────────────────────
(() => {
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();

// ── Sticky Header on Scroll ────────────────────────────────
(() => {
  const header = $('#site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ── Mobile Nav Toggle ──────────────────────────────────────
(() => {
  const btn = $('#nav-toggle');
  const nav = $('#site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? '✕' : '☰';
  });
  // Close on link click
  $$('.nav-link', nav).forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
      btn.textContent = '☰';
    });
  });
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
      btn.textContent = '☰';
    }
  });
})();

// ── Scroll Reveal (IntersectionObserver) ───────────────────
(() => {
  const reveals = $$('.reveal');
  if (!reveals.length || !window.IntersectionObserver) {
    reveals.forEach(el => el.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => observer.observe(el));
})();

// ── Stat Counter Animation ─────────────────────────────────
(() => {
  const counters = $$('.stat-number[data-target]');
  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOut(progress) * target);
      el.textContent = value >= 1000 ? value.toLocaleString('en-IN') : value;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (!window.IntersectionObserver) {
    counters.forEach(animateCounter);
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => observer.observe(el));
})();

// ── API Wrapper ────────────────────────────────────────────
const API_BASE = '';
async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (auth) {
    const token = localStorage.getItem('adminToken');
    if (token) headers['x-admin-token'] = token;
  }
  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || res.statusText);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

// ── Page Router ────────────────────────────────────────────
const page = document.body.getAttribute('data-page');

// ══════════════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════════════
if (page === 'home') {
  (async () => {
    const grid = $('#featured-products-grid');
    if (!grid) return;
    try {
      const products = await api('/api/products');
      if (!products.length) {
        grid.innerHTML = `
          <article class="product-card">
            <div class="product-card-body">
              <h3>No products yet</h3>
              <p class="muted">Add products via the admin panel to showcase them here.</p>
            </div>
          </article>`;
        return;
      }
      const featured = products.slice(0, 3);
      grid.innerHTML = featured.map(p => {
        const image = p.image || PLACEHOLDER_IMAGE;
        return `
          <article class="product-card reveal">
            <div class="product-card-media">
              <img src="${image}" alt="${p.name}" loading="lazy" />
              ${p.category ? `<span class="category-badge badge-${(p.category || '').toLowerCase().replace(/\\s+/g, '-')}">${p.category}</span>` : ''}
            </div>
            <div class="product-card-body">
              <h3>${p.name}</h3>
              <p class="muted">${(p.description || '').slice(0, 120)}${(p.description && p.description.length > 120) ? '…' : ''}</p>
              <div class="price-row">
                <span class="price">${formatCurrency(p.price)}</span>
                ${p.sku ? `<span class="pill">SKU: ${p.sku}</span>` : ''}
              </div>
              <div class="product-card-actions">
                <a class="btn ghost" href="/products.html">View Details →</a>
              </div>
            </div>
          </article>`;
      }).join('');

      // Re-run reveal observer on new cards
      if (window.IntersectionObserver) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
          });
        }, { threshold: 0.1 });
        $$('.product-card.reveal', grid).forEach(el => observer.observe(el));
      } else {
        $$('.product-card.reveal', grid).forEach(el => el.classList.add('revealed'));
      }

    } catch (err) {
      grid.innerHTML = `
        <article class="product-card">
          <div class="product-card-body">
            <h3>Could not load products</h3>
            <p class="muted">${err.message}</p>
          </div>
        </article>`;
    }
  })();
}

// ══════════════════════════════════════════════════════════
// PRODUCTS PAGE
// ══════════════════════════════════════════════════════════
if (page === 'products') {
  // ── Tab system (Wires ↔ Extension Boards) ────────────
  (() => {
    const tabBtns = $$('.product-tab-btn');
    const wiresPanel = $('#wires-panel');
    const boardsPanel = $('#boards-panel');

    function activateTab(tab) {
      tabBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
        b.setAttribute('aria-selected', b.dataset.tab === tab);
      });
      if (wiresPanel) wiresPanel.hidden = (tab !== 'wires');
      if (boardsPanel) boardsPanel.hidden = (tab !== 'boards');
      // Update URL query param for SEO / bookmarking
      const url = new URL(window.location);
      url.searchParams.set('tab', tab);
      history.replaceState(null, '', url);
    }

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });

    // Check URL param on load
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get('tab') === 'boards' ? 'boards' : 'wires';
    activateTab(initialTab);
  })();

  // ── Wires / Cables product grid ──────────────────────
  (async () => {
    const grid = $('#products-grid');
    const search = $('#product-search');
    const modal = $('#product-modal');
    const modalTitle = $('#modal-title');
    const modalDesc = $('#modal-desc');
    const modalPrice = $('#modal-price');
    const modalSku = $('#modal-sku');
    const modalImage = $('#modal-image');
    const closeEls = $$('[data-close]', modal);
    const filterBtns = $$('.filter-btn');
    if (!grid) return;

    let currentCategory = 'all';

    function openModal() { if (modal) modal.hidden = false; }
    function closeModal() { if (modal) modal.hidden = true; }
    closeEls.forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    let products = [];
    async function load() {
      products = await api('/api/products');
      render(products);
    }

    function render(list) {
      const q = (search ? search.value : '').toLowerCase();
      let filtered = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      );
      if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
      }
      if (filtered.length === 0) {
        grid.innerHTML = `<div class="card" style="grid-column:1/-1;text-align:center;padding:56px;">
          <h3 style="margin-bottom:10px;">No products found</h3>
          <p class="muted">Try adjusting your search or filter.</p>
        </div>`;
        return;
      }
      grid.innerHTML = filtered.map(p => {
        const image = p.image || PLACEHOLDER_IMAGE;
        return `
          <article class="product-card">
            <div class="product-card-media">
              <img src="${image}" alt="${p.name}" loading="lazy" />
              ${p.category ? `<span class="category-badge badge-${(p.category || '').toLowerCase().replace(/\\s+/g, '-')}">${p.category}</span>` : ''}
            </div>
            <div class="product-card-body">
              <h3>${p.name}</h3>
              <p class="muted">${(p.description || '').slice(0, 140)}${(p.description && p.description.length > 140) ? '…' : ''}</p>
              <div class="price-row">
                <span class="price">${formatCurrency(p.price)}</span>
                ${p.sku ? `<span class="pill">SKU: ${p.sku}</span>` : ''}
              </div>
              <div class="product-card-actions">
                <button class="btn accent" data-id="${p.id}" data-action="details">View Details →</button>
              </div>
            </div>
          </article>`;
      }).join('');
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        render(products);
      });
    });

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action="details"]');
      if (!btn) return;
      const p = (products || []).find(x => String(x.id) === btn.dataset.id);
      if (!p) return;
      if (modalTitle) modalTitle.textContent = p.name;
      if (modalDesc) modalDesc.textContent = p.description || '';
      if (modalPrice) modalPrice.textContent = formatCurrency(p.price);
      if (modalSku) { modalSku.textContent = p.sku ? `SKU: ${p.sku}` : ''; modalSku.hidden = !p.sku; }
      if (modalImage) { modalImage.src = p.image || PLACEHOLDER_IMAGE; modalImage.alt = p.name; }
      openModal();
    });

    if (search) search.addEventListener('input', () => render(products));
    load().catch(err => {
      if (grid) grid.innerHTML = `<div class="card" style="grid-column:1/-1;padding:40px;text-align:center;">
        <h3>Could not load products</h3>
        <p class="muted">${err.message}</p>
      </div>`;
    });
  })();
}

// ══════════════════════════════════════════════════════════
// CONTACT PAGE
// ══════════════════════════════════════════════════════════
if (page === 'contact') {
  const form = $('#contact-form');
  if (form) {
    const statusEl = $('#contact-status');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';

    const setStatus = (message, variant = 'info') => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.hidden = !message;
      statusEl.className = 'form-status';
      if (variant === 'success') statusEl.classList.add('success');
      if (variant === 'error') statusEl.classList.add('error');
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('', 'info');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite;margin-right:8px;">⏳</span> Sending…';
      }
      try {
        const fd = new FormData(form);
        const name = normalizeWhitespace(fd.get('name'));
        const email = sanitizeInput(fd.get('email'));
        const phone = sanitizeInput(fd.get('phone')).replace(/\s+/g, '');
        const company = normalizeWhitespace(fd.get('company'));
        const message = normalizeWhitespace(fd.get('message'));

        if (!isLikelyFullName(name)) throw new Error('Please provide your full name (first and last).');
        if (!isAllowedContent(name)) throw new Error('Name contains unsupported characters.');
        if (!isValidEmail(email)) throw new Error('Please enter a valid email address so we can reply.');
        if (phone && !isValidPhone(phone)) throw new Error('Enter a valid phone number (digits only, include country code if needed).');
        if (company) {
          if (!hasMinLength(company, 2)) throw new Error('Company name should be at least 2 characters.');
          if (!isAllowedContent(company)) throw new Error('Company name has unsupported characters.');
        }
        if (!hasMinLength(message, 20) || !message.includes(' ')) {
          throw new Error('Please share more detail so our team can assist (at least 20 characters, using full sentences).');
        }
        if (!isAllowedContent(message)) throw new Error('Message contains unsupported characters.');

        await api('/api/contact', { method: 'POST', body: { name, email, phone, company, message } });
        form.reset();
        setStatus('✅ Thanks! Your message has been sent to our team. We\'ll reply within one business day.', 'success');
      } catch (err) {
        console.error('Contact form error:', err);
        setStatus(err.message || 'Unable to send your message right now. Please call us directly.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML || 'Submit Request';
        }
      }
    });
  }
}

// ══════════════════════════════════════════════════════════
// ADMIN PAGE
// ══════════════════════════════════════════════════════════
if (page === 'admin') {
  (async () => {
    const gate = $('#admin-gate');
    const panel = $('#admin-panel');
    const loginBtn = $('#admin-login');
    const passInput = $('#admin-pass');
    const form = $('#product-form');
    const resetBtn = $('#reset-form');
    const nameEl = $('#product-name');
    const descEl = $('#product-desc');
    const priceEl = $('#product-price');
    const skuEl = $('#product-sku');
    const categoryEl = $('#product-category');
    const idEl = $('#product-id');
    const imageInput = $('#product-image');
    const imagePreview = $('#product-image-preview');
    const imageWrap = $('#product-image-preview-wrap');
    const clearImageBtn = $('#clear-product-image');
    const removeImageEl = $('#product-remove-image');
    const tableBody = $('#admin-table tbody');
    const search = $('#admin-search');
    const hasRealImage = (src) => !!src && src !== PLACEHOLDER_IMAGE;

    function showPanel() { if (gate) gate.classList.add('hidden'); if (panel) panel.classList.remove('hidden'); }
    function showGate() { if (panel) panel.classList.add('hidden'); if (gate) gate.classList.remove('hidden'); }

    async function verify() {
      try { await api('/api/auth/verify', { auth: true }); showPanel(); await refresh(); }
      catch { showGate(); }
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const password = passInput ? passInput.value : '';
        try {
          const { token } = await api('/api/auth/login', { method: 'POST', body: { password } });
          localStorage.setItem('adminToken', token);
          await verify();
        } catch (e) { alert('Login failed: ' + e.message); }
      });
      if (passInput) {
        passInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });
      }
    }

    function rowTemplate(p) {
      const image = p.image || PLACEHOLDER_IMAGE;
      return `
        <tr>
          <td>${p.name}</td>
          <td><img src="${image}" alt="${p.name}" class="table-thumb" /></td>
          <td>${p.category || 'N/A'}</td>
          <td>${formatCurrency(p.price)}</td>
          <td>${p.sku || ''}</td>
          <td style="text-align:right;white-space:nowrap;">
            <button class="btn" data-id="${p.id}" data-action="edit">Edit</button>
            <button class="btn danger" data-id="${p.id}" data-action="delete">Delete</button>
          </td>
        </tr>`;
    }

    let products = [];
    async function refresh() { products = await api('/api/products', { auth: true }); renderTable(products); }
    function renderTable(list) {
      const q = (search ? search.value : '').toLowerCase();
      const filtered = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      );
      if (tableBody) tableBody.innerHTML = filtered.map(rowTemplate).join('');
    }

    if (tableBody) {
      tableBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === 'delete') {
          if (!confirm('Delete this product? This cannot be undone.')) return;
          try { await api(`/api/products/${id}`, { method: 'DELETE', auth: true }); await refresh(); }
          catch (err) { alert('Delete failed: ' + err.message); }
        } else if (action === 'edit') {
          const p = products.find(x => String(x.id) === id);
          if (!p) return;
          if (idEl) idEl.value = p.id;
          if (nameEl) nameEl.value = p.name;
          if (descEl) descEl.value = p.description || '';
          if (priceEl) priceEl.value = p.price;
          if (skuEl) skuEl.value = p.sku || '';
          if (categoryEl) categoryEl.value = p.category || '';
          if (removeImageEl) removeImageEl.value = 'false';
          if (imageInput) imageInput.value = '';
          const currentImage = hasRealImage(p.image) ? p.image : '';
          if (imagePreview) { imagePreview.src = currentImage || PLACEHOLDER_IMAGE; imagePreview.alt = p.name; }
          if (imageWrap) { imageWrap.dataset.currentImage = currentImage; imageWrap.classList.toggle('has-image', hasRealImage(p.image)); }
          if (clearImageBtn) clearImageBtn.disabled = !hasRealImage(p.image);
          const formTitle = $('#form-title');
          if (formTitle) formTitle.textContent = 'Edit Product';
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    function resetPreview() {
      if (imagePreview) { imagePreview.src = PLACEHOLDER_IMAGE; imagePreview.alt = 'Product preview'; }
      if (imageWrap) { imageWrap.dataset.currentImage = ''; imageWrap.classList.remove('has-image'); }
      if (clearImageBtn) clearImageBtn.disabled = true;
    }
    resetPreview();

    if (imageInput) {
      imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
          const objectUrl = URL.createObjectURL(file);
          if (imagePreview) { imagePreview.src = objectUrl; imagePreview.alt = file.name; }
          if (imageWrap) imageWrap.classList.add('has-image');
          if (clearImageBtn) clearImageBtn.disabled = false;
          if (removeImageEl) removeImageEl.value = 'false';
        } else {
          const current = imageWrap ? imageWrap.dataset.currentImage : '';
          if (current) {
            if (imagePreview) { imagePreview.src = current; imagePreview.alt = 'Product preview'; }
            if (imageWrap) imageWrap.classList.add('has-image');
            if (clearImageBtn) clearImageBtn.disabled = false;
          } else {
            resetPreview();
          }
        }
      });
    }

    if (clearImageBtn) {
      clearImageBtn.addEventListener('click', () => {
        if (imageInput) imageInput.value = '';
        resetPreview();
        if (imageWrap) imageWrap.dataset.currentImage = '';
        if (removeImageEl) removeImageEl.value = 'true';
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', nameEl ? nameEl.value.trim() : '');
        fd.append('description', descEl ? descEl.value.trim() : '');
        fd.append('price', priceEl ? priceEl.value : 0);
        fd.append('sku', skuEl ? skuEl.value.trim() : '');
        fd.append('category', categoryEl ? categoryEl.value : '');
        fd.append('removeImage', removeImageEl ? (removeImageEl.value || 'false') : 'false');
        if (imageInput && imageInput.files[0]) fd.append('image', imageInput.files[0]);
        try {
          if (idEl && idEl.value) {
            await api(`/api/products/${idEl.value}`, { method: 'PUT', body: fd, auth: true });
          } else {
            await api('/api/products', { method: 'POST', body: fd, auth: true });
          }
          form.reset();
          if (idEl) idEl.value = '';
          if (removeImageEl) removeImageEl.value = 'false';
          const formTitle = $('#form-title');
          if (formTitle) formTitle.textContent = 'Add Product';
          resetPreview();
          await refresh();
        } catch (err) { alert('Save failed: ' + err.message); }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (form) form.reset();
        if (idEl) idEl.value = '';
        if (removeImageEl) removeImageEl.value = 'false';
        resetPreview();
        const formTitle = $('#form-title');
        if (formTitle) formTitle.textContent = 'Add Product';
      });
    }

    if (search) search.addEventListener('input', () => renderTable(products));

    verify();
  })();
}

// ── Minimal content protection (non-blocking) ──────────────
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if (
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
    e.key === 'F12'
  ) { e.preventDefault(); }
});
