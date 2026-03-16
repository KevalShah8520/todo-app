// login.js - simple client-side validation and redirect to todo app
(function(){
  const form = document.getElementById('loginForm');
  const user = document.getElementById('username');
  const pw = document.getElementById('password');
  const errUser = document.getElementById('errUser');
  const errPw = document.getElementById('errPw');
  const toggle = document.getElementById('togglePw');
  const clearBtn = document.getElementById('clearBtn');
  const themeToggle = document.getElementById('themeToggle');
  const rememberChk = document.getElementById('rememberMe');
  const THEME_KEY = 'todo.theme.v1';
  const REMEMBER_KEY = 'todo.remember.user';

  const pwRegex = /^(?=.{7,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).*$/;

  function showError(el, msg){ el.textContent = msg || ''; }

  toggle.addEventListener('click', ()=>{
    if(pw.type === 'password'){ pw.type = 'text'; toggle.textContent = '🙈'; }
    else { pw.type = 'password'; toggle.textContent = '👁️'; }
    pw.focus();
  });

  // Initialize theme toggle and apply saved theme
  try{
    const savedTheme = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    if(themeToggle) themeToggle.checked = (savedTheme === 'dark');
    if(themeToggle) themeToggle.addEventListener('change', ()=>{
      const t = themeToggle.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(THEME_KEY, t);
    });
  }catch(e){/* ignore storage errors */}

  // Initialize 'remember me' if present
  try{
    const savedUser = localStorage.getItem(REMEMBER_KEY);
    if(savedUser && user) { user.value = savedUser; if(rememberChk) rememberChk.checked = true; }
  }catch(e){}

  clearBtn.addEventListener('click', ()=>{
    form.reset(); showError(errUser,''); showError(errPw,''); pw.type='password'; toggle.textContent='👁️';
  });

  form.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    let valid = true;
    showError(errUser,''); showError(errPw,'');
    const u = (user.value||'').trim();
    const p = pw.value||'';
    if(!u){ showError(errUser,'Username is required'); valid = false; }
    if(!p){ showError(errPw,'Password is required'); valid = false; }
    else if(!pwRegex.test(p)){
      showError(errPw,'Password must be 7+ chars with upper, lower, number and special char'); valid = false;
    }

    if(!valid) return;

    // Basic static credential check (demo). Only allow the defined demo pair.
    const demoUser = 'demo@todo.test';
    const demoPw = 'Demo@123';
    if (u === demoUser && p === demoPw) {
      // set a short-lived session flag and redirect to todo list (index.html)
      try{ sessionStorage.setItem('todo.auth','1'); }catch(e){}
      // persist remembered username if requested
      try{
        if(rememberChk && rememberChk.checked){ localStorage.setItem(REMEMBER_KEY, u); }
        else { localStorage.removeItem(REMEMBER_KEY); }
      }catch(e){}
      window.location.href = 'index.html';
    } else {
      showError(errPw, 'Invalid username or password');
    }
  });

})();
