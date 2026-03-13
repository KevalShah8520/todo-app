/*
  script.js - Todo App (Vanilla JS)
  Features: CRUD, archive, grouping, filters, LocalStorage, Notifications, export, theme
*/

const STORAGE_KEY = 'todo.tasks.v1';
const THEME_KEY = 'todo.theme.v1';

// App state
let tasks = [];
let editingId = null; // used by creation form
let editTaskId = null; // used by separate edit panel
let activeTab = 'active'; // active | archive

// Elements
const refs = {};
['taskForm','title','description','dueDate','status','saveBtn','resetBtn','errTitle','errDesc','errDue','listContainer','emptyState','filterStatus','filterDate','exportBtn','exportFormat','tabActive','tabArchive','themeToggle',
 'editPanel','editForm','editTitle','editDescription','editDueDate','editCreatedAt','editStatus','editSaveBtn','editDiscardBtn','errEditTitle','errEditDesc','errEditDue'].forEach(id=>refs[id]=document.getElementById(id));

// add logout ref
refs.logoutBtn = document.getElementById('logoutBtn');

// Utilities
const uid = ()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const nowISO = ()=>new Date().toISOString();
const save = ()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks));
const load = ()=>{ const raw=localStorage.getItem(STORAGE_KEY); tasks = raw?JSON.parse(raw):[]; }

// Toast notifications (in-page)
function showToast(type, message, timeout=3200){
  try{
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const node = document.createElement('div');
    node.className = 'toast ' + (type || 'info');
    node.textContent = message;
    container.appendChild(node);
    // auto-hide
    setTimeout(()=>{
      node.classList.add('hide');
      setTimeout(()=>{ try{ container.removeChild(node); }catch(e){} }, 220);
    }, timeout);
  }catch(e){/* fail silently */}
}

// Validation
function validateForm(data){
  const errors = {};
  const title = (data.title||'').trim();
  if(!title) errors.title = 'Title is required';
  else if(title.length>100) errors.title = 'Title max 100 chars';

  const desc = data.description||'';
  if(desc.length>1000) errors.description = 'Description max 1000 chars';

  if(!data.dueDate) errors.dueDate='Due date is required';
  else {
    const d = new Date(data.dueDate);
    if(isNaN(d)) errors.dueDate='Invalid date';
    else if(d.getTime() <= Date.now()) errors.dueDate='Due date must be in the future';
  }

  const valid = Object.keys(errors).length===0;
  return {valid,errors};
}

// Render
function render(){
  const container = refs.listContainer;
  container.innerHTML='';
  const onlyArchived = activeTab==='archive';

  const initialList = tasks.filter(t=>t.archived===onlyArchived);
  let filtered = initialList.slice();
  const fs = refs.filterStatus && refs.filterStatus.value;
  if(fs && fs !== 'ALL') filtered = filtered.filter(t=>t.status === fs);
  const fd = refs.filterDate && refs.filterDate.value;
  if(fd) filtered = filtered.filter(t=> (new Date(t.dueDate)).toISOString().slice(0,10) === fd);

  if(filtered.length === 0){
    refs.emptyState.style.display = 'block';
    // show contextual empty state: no tasks at all vs no matches for current filters
    if(initialList.length === 0){
      refs.emptyState.innerHTML = 'No tasks yet — add one from the left.';
    } else {
      refs.emptyState.innerHTML = `
        <div class="placeholder">
          <svg width="120" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 6h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.18"/>
            <path d="M8 11l2 2 4-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div>No tasks match the selected filters.</div>
        </div>`;
    }
    return;
  }
  refs.emptyState.style.display='none';

  // simple list sorted by due date
  filtered.sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).forEach(t=>container.appendChild(createTaskNode(t)));
}

function createTaskNode(t){
  const card = document.createElement('div'); card.className='task-card enter';
  if(t.archived) card.classList.add('archived');
  if(t.status==='Completed') card.classList.add('completed');

  const left = document.createElement('div'); left.className='left';
  const title = document.createElement('h4'); title.textContent = t.title;
  const desc = document.createElement('p'); desc.textContent = t.description||'';
  const meta = document.createElement('div'); meta.className='meta';
  meta.textContent = `Due: ${new Date(t.dueDate).toLocaleString()} • Created: ${new Date(t.createdAt).toLocaleString()} • Status: ${t.status}`;
  left.appendChild(title); if(t.description) left.appendChild(desc); left.appendChild(meta);

  const actions = document.createElement('div'); actions.className='actions';
  const edit = document.createElement('button'); edit.className='icon-btn'; edit.textContent='Edit'; edit.onclick=()=>startEdit(t.id);
  const archive = document.createElement('button'); archive.className='icon-btn'; archive.textContent = t.archived? 'Unarchive':'Archive'; archive.onclick=()=>toggleArchive(t.id);
  const del = document.createElement('button'); del.className='icon-btn'; del.textContent='Delete'; del.onclick=()=>removeTask(t.id);
  const statusBtn = document.createElement('button'); statusBtn.className='icon-btn'; statusBtn.textContent='Change Status'; statusBtn.onclick=()=>cycleStatus(t.id);

  actions.appendChild(statusBtn); actions.appendChild(edit); actions.appendChild(archive); actions.appendChild(del);

  card.appendChild(left); card.appendChild(actions);
  return card;
}

// CRUD
function startEdit(id){
  // open the separate edit panel and populate fields
  const t = tasks.find(x=>x.id===id); if(!t) return;
  editTaskId = id;
  if(refs.editPanel){ refs.editPanel.classList.remove('hidden'); refs.editPanel.setAttribute('aria-hidden','false'); }
  if(refs.editTitle) refs.editTitle.value = t.title || '';
  if(refs.editDescription) refs.editDescription.value = t.description || '';
  if(refs.editDueDate) refs.editDueDate.value = toInputDateTime(t.dueDate);
  if(refs.editCreatedAt) refs.editCreatedAt.value = toInputDateTime(t.createdAt || nowISO());
  if(refs.editStatus) refs.editStatus.value = t.status || 'TODO';
  if(refs.errEditTitle) refs.errEditTitle.textContent=''; if(refs.errEditDesc) refs.errEditDesc.textContent=''; if(refs.errEditDue) refs.errEditDue.textContent='';
  if(refs.editTitle) refs.editTitle.focus();
}

function closeEditPanel(){ editTaskId = null; if(refs.editPanel){ refs.editPanel.classList.add('hidden'); refs.editPanel.setAttribute('aria-hidden','true'); } if(refs.editForm) refs.editForm.reset(); }

function toInputDateTime(iso){
  const d = new Date(iso);
  const pad = n=>String(n).padStart(2,'0');
  const yyyy=d.getFullYear(), mm=pad(d.getMonth()+1), dd=pad(d.getDate()), hh=pad(d.getHours()), min=pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function resetForm(){ editingId=null; refs.formTitle.textContent='New Task'; refs.taskForm.reset(); refs.saveBtn.textContent='Add Task'; clearErrors(); }

function clearErrors(){ refs.errTitle.textContent=''; refs.errDesc.textContent=''; refs.errDue.textContent=''; }

function createOrUpdate(e){
  e.preventDefault();
  const wasEditing = !!editingId;
  const data = { title: refs.title.value, description: refs.description.value, dueDate: refs.dueDate.value, status: refs.status.value };
  const v = validateForm(data);
  clearErrors();
  if(!v.valid){ if(v.errors.title) refs.errTitle.textContent=v.errors.title; if(v.errors.description) refs.errDesc.textContent=v.errors.description; if(v.errors.dueDate) refs.errDue.textContent=v.errors.dueDate; return; }

  if(editingId){
    const idx = tasks.findIndex(t=>t.id===editingId);
    if(idx!==-1){ tasks[idx].title = data.title.trim(); tasks[idx].description=data.description; tasks[idx].dueDate=new Date(data.dueDate).toISOString(); tasks[idx].status=data.status; }
    editingId=null;
    // reschedule notifications for edited task
    const updated = tasks.find(x=>x.id===data.id);
    const editedTask = tasks[idx]; if(editedTask){ editedTask.notified=false; scheduleNotification(editedTask); }
  } else {
    const t = { id: uid(), title: data.title.trim(), description: data.description, dueDate:new Date(data.dueDate).toISOString(), createdAt: nowISO(), status: data.status, archived:false };
    tasks.push(t);
    scheduleNotification(t);
  }
  save(); render(); resetForm();
  // show toast
  if(wasEditing) showToast('success','Task updated successfully'); else showToast('success','New task created');
}

// Handle edit form submit (separate panel)
if(window.document){
  document.addEventListener('DOMContentLoaded', ()=>{
    if(refs.editForm){
      refs.editForm.addEventListener('submit', function(ev){
        ev.preventDefault();
        if(!editTaskId) return closeEditPanel();
        const data = { title: refs.editTitle.value, description: refs.editDescription.value, dueDate: refs.editDueDate.value, status: refs.editStatus.value };
        const v = validateForm(data);
        if(!v.valid){ if(v.errors.title) refs.errEditTitle.textContent=v.errors.title; else refs.errEditTitle.textContent=''; if(v.errors.description) refs.errEditDesc.textContent=v.errors.description||''; if(v.errors.dueDate) refs.errEditDue.textContent=v.errors.dueDate||''; return; }
        const idx = tasks.findIndex(t=>t.id===editTaskId);
        if(idx===-1) return closeEditPanel();
        const task = tasks[idx];
        task.title = data.title.trim(); task.description = data.description; task.dueDate = new Date(data.dueDate).toISOString();
        // allow createdAt override if provided
        if(refs.editCreatedAt && refs.editCreatedAt.value){ const ca=new Date(refs.editCreatedAt.value); if(!isNaN(ca)) task.createdAt = ca.toISOString(); }
        task.status = data.status;
        task.notified = false; // reset notification flag
        save(); scheduleNotification(task); render(); closeEditPanel();
        showToast('success','Task updated successfully');
      });
    }
    if(refs.editDiscardBtn) refs.editDiscardBtn.addEventListener('click', ()=>{ if(confirm('Discard changes?')) closeEditPanel(); });
  });
}

function removeTask(id){
  if(!confirm('Delete task permanently?')) return;
  tasks = tasks.filter(t=>t.id!==id); save(); render();
}

function toggleArchive(id){
  const t = tasks.find(x=>x.id===id); if(!t) return; t.archived = !t.archived; save(); render();
}

function cycleStatus(id){
  const t = tasks.find(x=>x.id===id); if(!t) return; const order=['TODO','In Progress','Completed']; const i = order.indexOf(t.status); t.status = order[(i+1)%order.length]; save(); render();
}

// Export
function exportForSelected(){
  const fd = refs.filterDate.value; if(!fd){ alert('Select a filter date to export tasks for that date'); return; }
  const selected = tasks.filter(t=> (new Date(t.dueDate)).toISOString().slice(0,10) === fd );
  const fmt = refs.exportFormat.value;
  if(fmt==='json'){
    const blob = new Blob([JSON.stringify(selected,null,2)],{type:'application/json'});
    downloadBlob(blob,`tasks_${fd}.json`);
  } else {
    const csv = toCSV(selected); const blob=new Blob([csv],{type:'text/csv'}); downloadBlob(blob,`tasks_${fd}.csv`);
  }
}

function toCSV(list){
  const esc = s=>('"'+String(s).replace(/"/g,'""')+'"');
  const rows = [['id','title','description','dueDate','createdAt','status','archived']];
  list.forEach(t=>rows.push([t.id,t.title,t.description,t.dueDate,t.createdAt,t.status,t.archived]));
  return rows.map(r=>r.map(esc).join(',')).join('\n');
}

function downloadBlob(blob, filename){ const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }

// Notifications (in-page scheduling)
function scheduleNotification(t){
  if(!('Notification' in window)) return;
  const due = new Date(t.dueDate).getTime(); const ms = due - Date.now(); if(ms<=0) return;
  // set up a timeout only while the page is open
  setTimeout(()=>{
    if(Notification.permission==='granted'){
      new Notification('Todo Reminder', { body: t.title+' — due now', tag: t.id });
    }
    // visually mark
    const tt = tasks.find(x=>x.id===t.id); if(tt) tt.notified = true; save(); render();
  }, ms);
}

function scheduleAll(){ tasks.forEach(t=>{ if(!t.notified && !t.archived){ scheduleNotification(t); } }); }

// Theme
function applyTheme(theme){ document.documentElement.setAttribute('data-theme', theme); localStorage.setItem(THEME_KEY, theme); refs.themeToggle.checked = (theme==='dark'); }

function logout(){
  try{ sessionStorage.removeItem('todo.auth'); }catch(e){}
  window.location.replace('login.html');
}

// Helpers
function init(){
  load();
  // bind events
  refs.taskForm.addEventListener('submit', createOrUpdate);
  refs.resetBtn.addEventListener('click', resetForm);
  refs.filterStatus.addEventListener('change', render);
  refs.filterDate.addEventListener('change', render);
  refs.exportBtn.addEventListener('click', exportForSelected);
  refs.tabActive.addEventListener('click', ()=>{ activeTab='active'; refs.tabActive.classList.add('active'); refs.tabArchive.classList.remove('active'); render(); });
  refs.tabArchive.addEventListener('click', ()=>{ activeTab='archive'; refs.tabArchive.classList.add('active'); refs.tabActive.classList.remove('active'); render(); });
  refs.themeToggle.addEventListener('change', ()=>applyTheme(refs.themeToggle.checked? 'dark':'light'));
  if(refs.logoutBtn) refs.logoutBtn.addEventListener('click', logout);

  // load theme
  const savedTheme = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light');
  applyTheme(savedTheme);

  // request notifications permission (ask user politely)
  if('Notification' in window && Notification.permission==='default'){
    Notification.requestPermission().then(()=>{});
  }

  // schedule existing
  scheduleAll();
  render();
}

// init on ready, require a short-lived session flag set by login
document.addEventListener('DOMContentLoaded', ()=>{
  try{
    const authed = sessionStorage.getItem('todo.auth');
    if(!authed){ window.location.replace('login.html'); return; }
  }catch(e){ /* ignore storage errors */ }
  init();
});
