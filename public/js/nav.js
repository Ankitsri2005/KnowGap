function initNavigation(navContainerId) {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const navLinksContainer = document.getElementById(navContainerId);
  const mobileActions = document.getElementById('mobile-nav-actions');

  if (mobileActions) mobileActions.innerHTML = '';

  if (!navLinksContainer && !mobileActions) return;

  function goDashboard() {
    window.location.href = user.role === 'teacher' ? 'teacher.html' : 'student.html';
  }

  function doLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.reload();
  }

  if (user) {
    const greeting = document.createElement('span');
    greeting.className = 'nav-greeting';
    greeting.innerText = 'Hi, ' + user.name.split(' ')[0] + ' 👋';

    const dashBtn = document.createElement('button');
    dashBtn.className = 'btn btn-primary btn-sm';
    dashBtn.innerText = 'Dashboard';
    dashBtn.onclick = goDashboard;

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-outline btn-sm';
    logoutBtn.innerText = 'Logout';
    logoutBtn.onclick = doLogout;

    if (navLinksContainer) {
      const btnContainer = document.createElement('div');
      btnContainer.className = 'navbar-auth';
      btnContainer.appendChild(greeting);
      btnContainer.appendChild(dashBtn);
      btnContainer.appendChild(logoutBtn);
      navLinksContainer.appendChild(btnContainer);
    }

    if (mobileActions) {
      const mobileGreeting = document.createElement('p');
      mobileGreeting.className = 'mobile-nav-greeting';
      mobileGreeting.textContent = greeting.innerText;
      mobileActions.appendChild(mobileGreeting);
      const mDash = dashBtn.cloneNode(true);
      mDash.onclick = goDashboard;
      const mLogout = logoutBtn.cloneNode(true);
      mLogout.onclick = doLogout;
      mobileActions.appendChild(mDash);
      mobileActions.appendChild(mLogout);
    }
  } else {
    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn btn-secondary btn-sm';
    loginBtn.innerText = 'Login';
    loginBtn.onclick = function () { window.location.href = 'login.html'; };

    const startBtn = document.createElement('button');
    startBtn.className = 'btn btn-primary btn-sm';
    startBtn.innerText = 'Get Started';
    startBtn.onclick = function () { window.location.href = 'login.html'; };

    if (navLinksContainer) {
      const btnContainer = document.createElement('div');
      btnContainer.className = 'navbar-auth';
      btnContainer.appendChild(loginBtn);
      btnContainer.appendChild(startBtn);
      navLinksContainer.appendChild(btnContainer);
    }

    if (mobileActions) {
      const mLogin = loginBtn.cloneNode(true);
      mLogin.className = 'btn btn-secondary btn-full';
      mLogin.onclick = loginBtn.onclick;
      const mStart = startBtn.cloneNode(true);
      mStart.className = 'btn btn-primary btn-full';
      mStart.onclick = startBtn.onclick;
      mobileActions.appendChild(mLogin);
      mobileActions.appendChild(mStart);
    }
  }
}
