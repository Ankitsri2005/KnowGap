document.addEventListener("DOMContentLoaded", function() {
    const navLinksId = document.querySelector('.navbar-links')?.id;
    if (navLinksId) initNavigation(navLinksId);
});

function toggleMobileNav() {
    const navHamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('mobile-nav-overlay');
    const menu = document.getElementById('mobile-nav-menu');
    
    if(navHamburger) navHamburger.classList.toggle('open');
    if(overlay) overlay.classList.toggle('open');
    if(menu) {
        menu.classList.toggle('open');
        document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
    }
}

function closeMobileNav() {
    const navHamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('mobile-nav-overlay');
    const menu = document.getElementById('mobile-nav-menu');
    
    if(navHamburger) navHamburger.classList.remove('open');
    if(overlay) overlay.classList.remove('open');
    if(menu) menu.classList.remove('open');
    document.body.style.overflow = '';
}
