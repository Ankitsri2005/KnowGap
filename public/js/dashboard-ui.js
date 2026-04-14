function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = "/login.html";
}

function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-backdrop')?.classList.toggle('open');
    document.getElementById('mob-hamburger')?.classList.toggle('open');
    if (document.getElementById('sidebar')) {
        document.body.style.overflow = document.getElementById('sidebar').classList.contains('open') ? 'hidden' : '';
    }
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-backdrop')?.classList.remove('open');
    document.getElementById('mob-hamburger')?.classList.remove('open');
    document.body.style.overflow = '';
}
