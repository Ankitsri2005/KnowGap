/* ── API & Utility Layer ── */
const API = {
    base: '/api',
    token: () => localStorage.getItem('token'),

    async req(method, path, body)
    {
        const opts = {
            method,
            headers:
            {
                'Content-Type': 'application/json',
                ...(this.token() ?
                {
                    Authorization: `Bearer ${this.token()}`
                } :
                {})
            }
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(this.base + path, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    },

    get: (p) => API.req('GET', p),
    post: (p, b) => API.req('POST', p, b),
    put: (p, b) => API.req('PUT', p, b),
    delete: (p) => API.req('DELETE', p),

    auth:
    {
        login: (b) => API.post('/auth/login', b),
        register: (b) => API.post('/auth/register', b),
        profile: () => API.get('/auth/profile')
    },
    subjects:
    {
        all: () => API.get('/subjects'),
        topics: (id) => API.get(`/subjects/${id}/topics`),
        create: (b) => API.post('/subjects', b),
        addTopic: (id, b) => API.post(`/subjects/${id}/topics`, b),
        delete: (id) => API.delete(`/subjects/${id}`)
    },
    questions:
    {
        forSubject: (id, params) => API.get(`/questions/subject/${id}?${new URLSearchParams(params)}`),
        add: (b) => API.post('/questions', b),
        manage: (id) => API.get(`/questions/manage/${id}`),
        delete: (id) => API.delete(`/questions/${id}`)
    },
    tests:
    {
        start: (b) => API.post('/tests/start', b),
        submit: (sid, b) => API.post(`/tests/${sid}/submit`, b),
        result: (sid) => API.get(`/tests/${sid}/result`),
        history: () => API.get('/tests/history')
    },
    teacher:
    {
        overview: () => API.get('/teacher/overview'),
        students: () => API.get('/teacher/students'),
        student: (id) => API.get(`/teacher/students/${id}`),
        subjectStats: () => API.get('/teacher/stats/subjects'),
        distribution: () => API.get('/teacher/stats/distribution')
    }
};

/* ── State ── */
const State = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    setUser(u, token)
    {
        this.user = u;
        if (u)
        {
            localStorage.setItem('user', JSON.stringify(u));
            localStorage.setItem('token', token);
        }
        else
        {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    },
    logout()
    {
        this.setUser(null, null);
        Router.go('home');
    }
};

/* ── Router (MPA Redirects) ── */
const Router = {
    go(page, params = {})
    {
        let url = '/';
        if (page === 'home') url = '/index.html';
        else if (page === 'auth') url = '/login.html';
        else if (page === 'student') url = '/student.html';
        else if (page === 'teacher') url = '/teacher.html';
        else if (page === 'taketest')
        {
            url = `/taketest.html?subjectId=${params.subjectId}&subjectName=${params.subjectName}`;
        }
        else if (page === 'results')
        {
            url = `/results.html?sessionId=${params.sessionId}`;
        }
        window.location.href = url;
    }
};

/* ── Toast ── */
function toast(msg, type = 'info')
{
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    container.appendChild(el);
    // Trigger animation after paint
    requestAnimationFrame(() =>
    {
        requestAnimationFrame(() =>
        {
            el.classList.add('show');
        });
    });
    setTimeout(() =>
    {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, 3500);
}

/* ── Helpers ── */
function el(tag, cls, html)
{
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
}

function scoreColor(s)
{
    if (s >= 85) return '#10b981';
    if (s >= 70) return '#3b82f6';
    if (s >= 50) return '#f59e0b';
    if (s >= 35) return '#f97316';
    return '#ef4444';
}

function scoreBadge(s)
{
    if (s >= 85) return 'badge-success';
    if (s >= 70) return 'badge-info';
    if (s >= 50) return 'badge-warning';
    return 'badge-danger';
}

function timeAgo(dt)
{
    if (!dt) return 'N/A';
    const d = new Date(dt),
        now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString('en-IN');
}