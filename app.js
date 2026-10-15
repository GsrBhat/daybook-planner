(() => {
  const $ = (id) => document.getElementById(id);
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const shiftISO = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
  const fmtDate = (iso, opts={weekday:'short',month:'short',day:'numeric'}) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, opts);
  const fmtTime = (time) => { if(!time) return ''; const [h,m]=time.split(':').map(Number); return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`; };
  const escapeHTML = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const seed = {
    tasks: [
      {id:uid(),title:'Review today’s lecture notes',notes:'Summarize the key concepts',due:todayISO(),priority:'high',category:'College',done:false,created:Date.now()},
      {id:uid(),title:'Practice Verilog for 30 minutes',notes:'One small RTL exercise',due:todayISO(),priority:'medium',category:'VLSI',done:false,created:Date.now()},
      {id:uid(),title:'Plan tomorrow before winding down',notes:'Choose the top three priorities',due:todayISO(),priority:'low',category:'Personal',done:false,created:Date.now()}
    ],
    blocks: [
      {id:uid(),title:'Morning routine & workout',start:'06:30',end:'07:30',date:todayISO(),type:'personal',notes:'Move, reset, and get ready'},
      {id:uid(),title:'Focused study session',start:'07:30',end:'08:30',date:todayISO(),type:'focus',notes:'Work on the most important topic'},
      {id:uid(),title:'College / classes',start:'09:00',end:'16:00',date:todayISO(),type:'college',notes:'Lectures, labs, and notes'},
      {id:uid(),title:'Review and plan',start:'18:00',end:'18:30',date:todayISO(),type:'focus',notes:'Capture learnings and plan next steps'}
    ],
    habits: [
      {id:uid(),title:'Move your body',emoji:'🏃',checks:{}},
      {id:uid(),title:'Focused learning',emoji:'📚',checks:{}},
      {id:uid(),title:'Plan tomorrow',emoji:'✍️',checks:{}}
    ],
    theme:'light'
  };
  let data;
  try { data = JSON.parse(localStorage.getItem('daybook-data')) || seed; } catch { data = seed; }
  if (!data.tasks || !data.blocks || !data.habits) data = seed;
  let selectedDate = todayISO(), currentView = 'today', taskFilter = 'all';
  const persist = () => { localStorage.setItem('daybook-data', JSON.stringify(data)); updateNavCount(); };
  const showToast = (message) => { const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>el.classList.remove('show'),2200); };
  const updateNavCount = () => $('task-nav-count').textContent = data.tasks.filter(t=>!t.done).length;
  const setTheme = (theme) => { data.theme=theme; document.body.classList.toggle('dark',theme==='dark'); $('theme-label').textContent=theme==='dark'?'Light mode':'Dark mode'; $('theme-icon').textContent=theme==='dark'?'☀':'☾'; $('mobile-theme').textContent=theme==='dark'?'☀':'☾'; persist(); };
  const openDialog = id => $(id).showModal();
  const closeDialog = id => $(id).close();
  const showView = (view) => {
    currentView=view;
    document.querySelectorAll('.view').forEach(el=>el.classList.add('hidden'));
    $(`view-${view}`).classList.remove('hidden');
    document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
    const names={today:'Today',week:'Weekly planner',tasks:'All tasks',habits:'Habits'};
    $('breadcrumb-current').textContent=names[view];
    render();
    window.scrollTo({top:0,behavior:'smooth'});
  };
  const getTasks = () => data.tasks.filter(t=>t.due===selectedDate).sort((a,b)=>Number(a.done)-Number(b.done)||({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority]));
  const renderToday = () => {
    $('date-label').textContent=fmtDate(selectedDate,{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
    $('selected-date-label').textContent=selectedDate===todayISO()?'Today':fmtDate(selectedDate,{month:'short',day:'numeric',year:'numeric'});
    $('date-picker').value=selectedDate;
    $('greeting').innerHTML=(selectedDate===todayISO()?'Make today count':`Plan for ${escapeHTML(fmtDate(selectedDate,{weekday:'long'}))}`)+'<span class="title-period">.</span>';
    const tasks=getTasks(), done=tasks.filter(t=>t.done).length, pct=tasks.length?Math.round(done/tasks.length*100):0;
    $('completed-stat').textContent=done; $('total-stat').textContent=`/ ${tasks.length}`; $('task-progress').style.width=`${pct}%`; $('task-progress-label').textContent=`${pct}%`;
    const blocks=data.blocks.filter(b=>b.date===selectedDate).sort((a,b)=>a.start.localeCompare(b.start));
    const focus=blocks.reduce((sum,b)=>{const [sh,sm]=b.start.split(':').map(Number),[eh,em]=b.end.split(':').map(Number);return sum+(b.type==='focus'?Math.max(0,(eh*60+em-sh*60-sm)/60):0)},0);
    $('focus-stat').textContent=focus.toLocaleString(undefined,{maximumFractionDigits:1});
    const checked=data.habits.filter(h=>h.checks?.[selectedDate]).length; $('habit-stat').textContent=`${checked}/${data.habits.length}`; $('habit-caption').textContent=data.habits.length?(checked===data.habits.length?'All habits complete — lovely work!':'Keep building consistency'):'Add a habit to get started';
    $('schedule-list').innerHTML=blocks.length?blocks.map(b=>`<div class="schedule-item type-${escapeHTML(b.type)}"><div class="schedule-time">${fmtTime(b.start)}</div><div class="schedule-rail"><span class="schedule-dot"></span></div><div class="schedule-info"><strong>${escapeHTML(b.title)}</strong><p>${escapeHTML(b.notes||`${fmtTime(b.start)} – ${fmtTime(b.end)}`)}</p><span class="schedule-type">${escapeHTML(b.type)}</span></div><div class="schedule-actions"><button class="tiny-action" data-edit-block="${b.id}" aria-label="Edit block">✎</button><button class="tiny-action" data-delete-block="${b.id}" aria-label="Delete block">×</button></div></div>`).join(''):'<div class="empty-state"><strong>No time blocks yet</strong>Add a block to give your day some shape.</div>';
    const top=tasks.slice(0,5);
    $('priority-list').innerHTML=top.length?top.map(t=>`<div class="priority-item"><button class="check-button ${t.done?'checked':''}" data-toggle-task="${t.id}" aria-label="Toggle task">${t.done?'✓':''}</button><div><span class="priority-title ${t.done?'done':''}">${escapeHTML(t.title)}</span><div class="priority-meta"><span><i class="priority-dot ${t.priority}"></i>${t.priority} priority</span>${t.category?`<span>· ${escapeHTML(t.category)}</span>`:''}</div></div><span class="priority-badge">${t.done?'Done':'To do'}</span></div>`).join(''):'<div class="empty-state"><strong>Nothing on your list</strong>Add a task when something comes to mind.</div>';
    $('today-habits').innerHTML=data.habits.length?data.habits.map(h=>`<div class="habit-chip"><span class="habit-emoji">${escapeHTML(h.emoji||'✦')}</span><div><strong>${escapeHTML(h.title)}</strong><small>${h.checks?.[selectedDate]?'Completed today':'Daily habit'}</small></div><button class="habit-check ${h.checks?.[selectedDate]?'checked':''}" data-toggle-habit="${h.id}" aria-label="Toggle habit">${h.checks?.[selectedDate]?'✓':'✓'}</button></div>`).join(''):'<div class="empty-state">Add your first habit to build a routine.</div>';
  };
  const renderWeek = () => {
    const startOfWeek = iso => { const d=new Date(`${iso}T12:00:00`); d.setDate(d.getDate()-((d.getDay()+6)%7)); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    const start=startOfWeek(selectedDate), end=shiftISO(start,6);
    $('week-range').textContent=`${fmtDate(start,{month:'short',day:'numeric'})} – ${fmtDate(end,{month:'short',day:'numeric',year:'numeric'})}`;
    $('week-grid').innerHTML=Array.from({length:7},(_,i)=>{const date=shiftISO(start,i),blocks=data.blocks.filter(b=>b.date===date).sort((a,b)=>a.start.localeCompare(b.start));return `<div class="week-day ${date===todayISO()?'today':''}"><div class="week-day-head"><span>${fmtDate(date,{weekday:'short'})}</span><strong>${new Date(`${date}T12:00:00`).getDate()}</strong></div><div class="week-events">${blocks.map(b=>`<div class="week-event type-${escapeHTML(b.type)}" data-edit-block="${b.id}"><time>${fmtTime(b.start)}</time>${escapeHTML(b.title)}</div>`).join('')}<button class="week-add" data-add-block-date="${date}" aria-label="Add block on ${date}">＋</button></div></div>`}).join('');
  };
  const renderTasks = () => {
    const q=$('task-search').value.trim().toLowerCase();
    let tasks=[...data.tasks].filter(t=>(taskFilter==='all'||(taskFilter==='open'&&!t.done)||(taskFilter==='done'&&t.done))&&(`${t.title} ${t.notes||''} ${t.category||''}`).toLowerCase().includes(q));
    tasks.sort((a,b)=>Number(a.done)-Number(b.done)||(a.due||'9999').localeCompare(b.due||'9999'));
    $('all-task-list').innerHTML=tasks.length?tasks.map(t=>`<div class="task-row"><div class="task-row-main"><button class="check-button ${t.done?'checked':''}" data-toggle-task="${t.id}" aria-label="Toggle task">${t.done?'✓':''}</button><div><span class="task-row-title ${t.done?'done':''}">${escapeHTML(t.title)}</span>${t.notes?`<span class="task-row-sub">${escapeHTML(t.notes)}</span>`:''}</div></div><span class="task-row-date">${t.due?escapeHTML(fmtDate(t.due,{month:'short',day:'numeric',year:'numeric'})):'No date'}</span><span class="priority-pill ${t.priority}">${t.priority[0].toUpperCase()+t.priority.slice(1)}</span><span class="status-pill ${t.done?'done':'open'}">${t.done?'Completed':'To do'}</span><button class="row-menu" data-edit-task="${t.id}" aria-label="Edit task">···</button><span class="task-row-category">${escapeHTML(t.category||'')}</span></div>`).join(''):'<div class="empty-state"><strong>No tasks found</strong>Try a different filter or add a task.</div>';
  };
  const renderHabits = () => {
    $('habit-management').innerHTML=data.habits.length?data.habits.map(h=>{const dates=Object.keys(h.checks||{}).filter(d=>h.checks[d]);return `<article class="habit-manage-card"><div class="habit-manage-top"><span class="habit-manage-emoji">${escapeHTML(h.emoji||'✦')}</span><div><button class="tiny-action" data-edit-habit="${h.id}" aria-label="Edit habit">✎</button><button class="tiny-action" data-delete-habit="${h.id}" aria-label="Delete habit">×</button></div></div><h3>${escapeHTML(h.title)}</h3><p>Make it easy to show up consistently.</p><div class="habit-streak"><span>${dates.length} check-ins recorded</span><strong>${h.checks?.[selectedDate]?'✓ Done today':'○ Not checked today'}</strong></div><button class="add-row-button" style="margin-top:12px" data-toggle-habit="${h.id}">${h.checks?.[selectedDate]?'Undo today’s check':'✓ Mark done today'}</button></article>`}).join(''):'<div class="empty-state"><strong>No habits yet</strong>Add one small routine to begin.</div>';
  };
  const render = () => { if(currentView==='today')renderToday(); if(currentView==='week')renderWeek(); if(currentView==='tasks')renderTasks(); if(currentView==='habits')renderHabits(); updateNavCount(); };

  const openTask = id => { const t=data.tasks.find(x=>x.id===id); $('task-form').reset(); $('task-id').value=t?.id||''; $('task-modal-title').textContent=t?'Edit task':'Add a task'; $('task-title').value=t?.title||''; $('task-notes').value=t?.notes||''; $('task-due').value=t?.due||selectedDate; $('task-priority').value=t?.priority||'medium'; $('task-category').value=t?.category||''; openDialog('task-dialog'); setTimeout(()=>$('task-title').focus(),50); };
  const openBlock = (id,date=selectedDate) => { const b=data.blocks.find(x=>x.id===id); $('block-form').reset(); $('block-id').value=b?.id||''; $('block-modal-title').textContent=b?'Edit time block':'Add time block'; $('block-title').value=b?.title||''; $('block-start').value=b?.start||'09:00'; $('block-end').value=b?.end||'10:00'; $('block-date').value=b?.date||date; $('block-type').value=b?.type||'focus'; $('block-notes').value=b?.notes||''; openDialog('block-dialog'); setTimeout(()=>$('block-title').focus(),50); };
  const openHabit = id => { const h=data.habits.find(x=>x.id===id); $('habit-form').reset(); $('habit-id').value=h?.id||''; $('habit-modal-title').textContent=h?'Edit habit':'Add habit'; $('habit-title').value=h?.title||''; $('habit-emoji').value=h?.emoji||'✦'; openDialog('habit-dialog'); setTimeout(()=>$('habit-title').focus(),50); };

  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-view]'); if(nav){showView(nav.dataset.view);return;}
    const go=e.target.closest('[data-go]'); if(go){showView(go.dataset.go);return;}
    const close=e.target.closest('[data-close]'); if(close){closeDialog(close.dataset.close);return;}
    const toggleTask=e.target.closest('[data-toggle-task]'); if(toggleTask){const t=data.tasks.find(x=>x.id===toggleTask.dataset.toggleTask);if(t){t.done=!t.done;persist();render();}return;}
    const editTask=e.target.closest('[data-edit-task]'); if(editTask){openTask(editTask.dataset.editTask);return;}
    const editBlock=e.target.closest('[data-edit-block]'); if(editBlock){openBlock(editBlock.dataset.editBlock);return;}
    const deleteBlock=e.target.closest('[data-delete-block]'); if(deleteBlock){data.blocks=data.blocks.filter(b=>b.id!==deleteBlock.dataset.deleteBlock);persist();render();showToast('Time block removed');return;}
    const addDate=e.target.closest('[data-add-block-date]'); if(addDate){openBlock(null,addDate.dataset.addBlockDate);return;}
    const toggleHabit=e.target.closest('[data-toggle-habit]'); if(toggleHabit){const h=data.habits.find(x=>x.id===toggleHabit.dataset.toggleHabit);if(h){h.checks=h.checks||{};h.checks[selectedDate]=!h.checks[selectedDate];persist();render();}return;}
    const editHabit=e.target.closest('[data-edit-habit]'); if(editHabit){openHabit(editHabit.dataset.editHabit);return;}
    const deleteHabit=e.target.closest('[data-delete-habit]'); if(deleteHabit&&confirm('Delete this habit and its check-ins?')){data.habits=data.habits.filter(h=>h.id!==deleteHabit.dataset.deleteHabit);persist();render();showToast('Habit deleted');return;}
  });
  $('theme-toggle').addEventListener('click',()=>setTheme(data.theme==='dark'?'light':'dark'));
  $('mobile-theme').addEventListener('click',()=>setTheme(data.theme==='dark'?'light':'dark'));
  $('today-button').addEventListener('click',()=>{selectedDate=todayISO();showView(currentView);});
  $('prev-day').addEventListener('click',()=>{selectedDate=shiftISO(selectedDate,-1);render();});
  $('next-day').addEventListener('click',()=>{selectedDate=shiftISO(selectedDate,1);render();});
  $('date-picker-button').addEventListener('click',()=>{const p=$('date-picker');p.showPicker?p.showPicker():p.click();});
  $('date-picker').addEventListener('change',e=>{if(e.target.value){selectedDate=e.target.value;render();}});
  $('add-task-top').addEventListener('click',()=>openTask()); $('add-task-inline').addEventListener('click',()=>openTask()); $('add-task-page').addEventListener('click',()=>openTask());
  $('add-block').addEventListener('click',()=>openBlock()); $('add-block-bottom').addEventListener('click',()=>openBlock());
  $('add-habit').addEventListener('click',()=>openHabit());
  $('prev-week').addEventListener('click',()=>{selectedDate=shiftISO(selectedDate,-7);renderWeek();});
  $('next-week').addEventListener('click',()=>{selectedDate=shiftISO(selectedDate,7);renderWeek();});
  $('task-search').addEventListener('input',renderTasks);
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{taskFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));renderTasks();}));
  $('task-form').addEventListener('submit',e=>{e.preventDefault();const id=$('task-id').value;const obj={id:id||uid(),title:$('task-title').value.trim(),notes:$('task-notes').value.trim(),due:$('task-due').value,priority:$('task-priority').value,category:$('task-category').value.trim(),done:id?(data.tasks.find(t=>t.id===id)?.done||false):false,created:Date.now()};if(!obj.title)return;if(id)data.tasks=data.tasks.map(t=>t.id===id?obj:t);else data.tasks.push(obj);persist();closeDialog('task-dialog');render();showToast(id?'Task updated':'Task added');});
  $('block-form').addEventListener('submit',e=>{e.preventDefault();const id=$('block-id').value,start=$('block-start').value,end=$('block-end').value;if(end<=start){showToast('End time must be after start time');return;}const obj={id:id||uid(),title:$('block-title').value.trim(),start,end,date:$('block-date').value,type:$('block-type').value,notes:$('block-notes').value.trim()};if(id)data.blocks=data.blocks.map(b=>b.id===id?obj:b);else data.blocks.push(obj);selectedDate=obj.date;persist();closeDialog('block-dialog');render();showToast(id?'Time block updated':'Time block added');});
  $('habit-form').addEventListener('submit',e=>{e.preventDefault();const id=$('habit-id').value,obj={id:id||uid(),title:$('habit-title').value.trim(),emoji:$('habit-emoji').value.trim()||'✦',checks:id?(data.habits.find(h=>h.id===id)?.checks||{}):{}};if(id)data.habits=data.habits.map(h=>h.id===id?obj:h);else data.habits.push(obj);persist();closeDialog('habit-dialog');render();showToast(id?'Habit updated':'Habit added');});
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));
  setTheme(data.theme||'light');
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  render();
})();