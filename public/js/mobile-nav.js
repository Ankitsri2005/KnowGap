/**
 * Injects mobile nav UI on marketing pages and wires toggle handlers.
 * Call initSiteNav({ navContainerId, activePage }) after DOM ready.
 */
(function () {
  const NAV_LINKS = [
    { href: 'index.html', label: 'Home', icon: '🏠', key: 'home' },
    { href: 'about.html', label: 'About', icon: 'ℹ️', key: 'about' },
    { href: 'contact.html', label: 'Contact', icon: '📬', key: 'contact' },
    { href: 'developers.html', label: 'Developers', icon: '👨‍💻', key: 'developers' },
  ];

  function ensureMobileNavStructure(activePage) {
    const navbar = document.querySelector('.navbar .container');
    if (!navbar) return;

    if (!document.getElementById('nav-hamburger')) {
      const btn = document.createElement('button');
      btn.className = 'hamburger';
      btn.id = 'nav-hamburger';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Toggle menu');
      btn.innerHTML = '<span></span><span></span><span></span>';
      btn.addEventListener('click', toggleMobileNav);
      navbar.appendChild(btn);
    }

    if (!document.getElementById('mobile-nav-menu')) {
      const overlay = document.createElement('div');
      overlay.className = 'mobile-nav-overlay';
      overlay.id = 'mobile-nav-overlay';
      overlay.addEventListener('click', closeMobileNav);

      const menu = document.createElement('div');
      menu.className = 'mobile-nav-menu';
      menu.id = 'mobile-nav-menu';

      const closeBtn = document.createElement('button');
      closeBtn.className = 'mobile-nav-close';
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Close menu');
      closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', closeMobileNav);
      menu.appendChild(closeBtn);

      NAV_LINKS.forEach(function (link) {
        const a = document.createElement('a');
        a.href = link.href;
        a.className = 'nav-item' + (link.key === activePage ? ' active' : '');
        a.textContent = link.icon + ' ' + link.label;
        a.addEventListener('click', closeMobileNav);
        menu.appendChild(a);
      });

      const actions = document.createElement('div');
      actions.id = 'mobile-nav-actions';
      actions.className = 'mobile-nav-actions';
      menu.appendChild(actions);

      document.body.appendChild(overlay);
      document.body.appendChild(menu);
    } else {
      document.querySelectorAll('#mobile-nav-menu .nav-item').forEach(function (el) {
        const href = el.getAttribute('href') || '';
        const key = href === 'index.html' ? 'home' : href.replace('.html', '');
        el.classList.toggle('active', key === activePage);
      });
    }
  }

  window.toggleMobileNav = function () {
    const hamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('mobile-nav-overlay');
    const menu = document.getElementById('mobile-nav-menu');
    if (!hamburger || !overlay || !menu) return;
    hamburger.classList.toggle('open');
    overlay.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  };

  window.closeMobileNav = function () {
    const hamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('mobile-nav-overlay');
    const menu = document.getElementById('mobile-nav-menu');
    if (hamburger) hamburger.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (menu) menu.classList.remove('open');
    document.body.style.overflow = '';
  };

  window.initSiteNav = function (options) {
    const opts = options || {};
    ensureMobileNavStructure(opts.activePage || 'home');
    if (typeof initNavigation === 'function' && opts.navContainerId) {
      initNavigation(opts.navContainerId);
    }
  };

  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) closeMobileNav();
  });
})();
