function initNavigation(navContainerId)
{
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const navLinksContainer = document.getElementById(navContainerId);

    if (!navLinksContainer) return;

    if (user)
    {
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.alignItems = 'center';
        btnContainer.style.gap = '15px';

    const dashBtn = document.createElement('button');
    dashBtn.className = 'btn btn-primary btn-sm';
    dashBtn.innerText = 'Dashboard';
    dashBtn.onclick = function() {
      if (user.role === 'teacher') {
        window.location.href = 'teacher.html';
      } else {
        window.location.href = 'student.html';
      }
    };

        const dashBtn = document.createElement('button');
        dashBtn.className = 'btn btn-primary btn-sm';
        dashBtn.innerText = 'Dashboard';
        dashBtn.onclick = function()
        {
            if (user.role === 'teacher')
            {
                window.location.href = '/teacher.html';
            }
            else
            {
                window.location.href = '/student.html';
            }
        };

    btnContainer.appendChild(greeting);
    btnContainer.appendChild(dashBtn);
    btnContainer.appendChild(logoutBtn);
    
    navLinksContainer.appendChild(btnContainer);
  } else {
    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn btn-secondary btn-sm';
    loginBtn.innerText = 'Login';
    loginBtn.onclick = function() { window.location.href = 'login.html'; };

    const startBtn = document.createElement('button');
    startBtn.className = 'btn btn-primary btn-sm';
    startBtn.innerText = 'Get Started';
    startBtn.style.marginLeft = '10px';
    startBtn.onclick = function() { window.location.href = 'login.html'; };

        navLinksContainer.appendChild(btnContainer);
    }
    else
    {
        const loginBtn = document.createElement('button');
        loginBtn.className = 'btn btn-secondary btn-sm';
        loginBtn.innerText = 'Login';
        loginBtn.onclick = function()
        {
            window.location.href = '/login.html';
        };

        const startBtn = document.createElement('button');
        startBtn.className = 'btn btn-primary btn-sm';
        startBtn.innerText = 'Get Started';
        startBtn.style.marginLeft = '10px';
        startBtn.onclick = function()
        {
            window.location.href = '/login.html';
        };

        navLinksContainer.appendChild(loginBtn);
        navLinksContainer.appendChild(startBtn);
    }
}