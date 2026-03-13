// login.js - simple client-side validation and redirect to todo app
(function(){
  const form = document.getElementById('loginForm');
  const user = document.getElementById('username');
  const pw = document.getElementById('password');
  const errUser = document.getElementById('errUser');
  const errPw = document.getElementById('errPw');
  const toggle = document.getElementById('togglePw');
  const clearBtn = document.getElementById('clearBtn');

  const pwRegex = /^(?=.{7,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).*$/;

  function showError(el, msg){ el.textContent = msg || ''; }

  toggle.addEventListener('click', ()=>{
    if(pw.type === 'password'){ pw.type = 'text'; toggle.textContent = '🙈'; }
    else { pw.type = 'password'; toggle.textContent = '👁️'; }
    pw.focus();
  });

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
      window.location.href = 'index.html';
    } else {
      showError(errPw, 'Invalid username or password');
    }
  });

})();
