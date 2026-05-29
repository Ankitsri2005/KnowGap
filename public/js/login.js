function switchAuthTab(tab) {
    document.getElementById('form-login').style.display = (tab === 'login') ? 'block' : 'none';
    document.getElementById('form-register').style.display = (tab === 'register') ? 'block' : 'none';
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!email || !password) return alert('Please fill all fields');
    if (!isValidEmail(email)) return alert('Please enter a valid email address (e.g. you@example.com)');
    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.textContent = 'Logging in...';
    try {
        const res = await API.auth.login({
            email,
            password
        });
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('token', res.token);
        window.location.href = (res.user.role === 'teacher') ? '/teacher.html' : '/student.html';
    } catch (e) {
        alert("Error: " + e.message);
        btn.disabled = false;
        btn.textContent = '🔐 Login to knowGap';
    }
}

async function doRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const role = document.getElementById('reg-role').value;
    if (!name || !email || !password) return alert('Please fill all fields');
    if (!isValidEmail(email)) return alert('Please enter a valid email address (e.g. you@example.com)');
    const btn = document.getElementById('btn-register');
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    try {
        const res = await API.auth.register({
            name,
            email,
            password,
            role
        });
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('token', res.token);
        window.location.href = (res.user.role === 'teacher') ? '/teacher.html' : '/student.html';
    } catch (e) {
        alert("Error: " + e.message);
        btn.disabled = false;
        btn.textContent = '🚀 Create My Account';
    }
}
