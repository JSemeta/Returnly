const $ = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const addDays = (date, days) => { const d = new Date(date+'T12:00:00'); d.setDate(d.getDate()+Number(days)); return d.toISOString().slice(0,10); };
const pretty = date => date ? new Date(date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : 'Not set';
const daysLeft = date => Math.ceil((new Date(date+'T12:00:00')-new Date(today()+'T12:00:00'))/86400000);
const defaultRetailers = {'Zara':30,'ASOS':28,'PrettyLittleThing':28,'Pretty Little Thing':28,'H&M':30,'Next':28,'Boohoo':28,'Mango':30,'John Lewis':35,'Amazon':30,'River Island':28,'New Look':28,'Nike':30,'Shein':30};
let retailers = JSON.parse(localStorage.getItem('returnly-retailers')||'null') || defaultRetailers;
let returns = JSON.parse(localStorage.getItem('returnly-returns')||'[]');
let completedView = false, selectedId = null;
const save = () => {localStorage.setItem('returnly-retailers',JSON.stringify(retailers));localStorage.setItem('returnly-returns',JSON.stringify(returns));};
const normalise = s => s.trim().toLowerCase();
function retailerMatch(name){const key=Object.keys(retailers).find(k=>normalise(k)===normalise(name));return key||null;}
function render(){
 const active=returns.filter(x=>!x.done),done=returns.filter(x=>x.done);
 $('activeCount').textContent=active.length;
 $('soonCount').textContent=active.filter(x=>daysLeft(x.due)>=0&&daysLeft(x.due)<=3).length;
 $('doneCount').textContent=done.length;
 const list=(completedView?done:active).slice().sort((a,b)=>a.due.localeCompare(b.due));
 $('returnsList').innerHTML=list.map(x=>{
  const left=daysLeft(x.due),status=left<0?`${Math.abs(left)} days overdue`:left===0?'Due today':`${left} days left`;
  const cls=left<=3?'urgent':left>7?'safe':'';
  return `<article class="return-card" data-id="${x.id}"><div class="company-mark">${escapeHtml(x.company.trim().charAt(0).toUpperCase())}</div><div class="return-info"><strong>${escapeHtml(x.company)}</strong><small>${escapeHtml(x.item||'Return parcel')}</small></div><div class="due ${cls}"><strong>${pretty(x.due)}</strong><span>${completedView?'Completed':status}</span></div></article>`;
 }).join('');
 $('emptyState').classList.toggle('hidden',list.length>0);
 $('returnsList').classList.toggle('hidden',list.length===0);
 $('emptyState').querySelector('h3').textContent=completedView?'No completed returns yet':'Nothing to return just yet';
 $('emptyState').querySelector('p').textContent=completedView?'Returns you mark as completed will appear here.':'Add your first parcel and we’ll help you keep an eye on the deadline.';
 $('emptyAdd').classList.toggle('hidden',completedView);
 $('showCompleted').textContent=completedView?'Upcoming returns':'Completed';
 $('addBtn').classList.toggle('hidden',completedView);
 $('returnsList').querySelectorAll('.return-card').forEach(el=>el.addEventListener('click',()=>showDetail(el.dataset.id)));
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function updateSuggestions(){
 const name=$('company').value, key=retailerMatch(name), start=$('startDate').value;
 $('startDateLabel').firstChild.textContent=$('dateBasis').value==='delivery'?'Delivery date':'Purchase date';
 if(key&&start){const d=addDays(start,retailers[key]);$('suggestedDate').textContent=pretty(d);$('dueDate').value=d;$('policyHint').textContent=`Using your saved ${retailers[key]}-day suggestion for ${key}. Check the retailer's policy before relying on it.`;}
 else if(start){$('suggestedDate').textContent='Add a saved retailer to calculate';$('policyHint').textContent='No saved return period for this company yet. You can still choose the deadline yourself.';}
 else {$('suggestedDate').textContent='Choose a company and date';}
}
function openAdd(){ $('returnForm').reset();$('startDate').value=today();$('dueDate').value='';$('suggestedDate').textContent='Choose a company and date';$('policyHint').textContent='Choose a saved retailer to see its usual return period. Always check the retailer’s own policy.';$('returnDialog').showModal(); }
$('addBtn').onclick=openAdd;$('emptyAdd').onclick=openAdd;
$('showCompleted').onclick=()=>{completedView=!completedView;render();};
$('settingsBtn').onclick=()=>{renderRetailers();$('retailerDialog').showModal();};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$('company').addEventListener('input',updateSuggestions);$('startDate').addEventListener('change',updateSuggestions);$('dateBasis').addEventListener('change',updateSuggestions);
$('returnForm').addEventListener('submit',e=>{
 e.preventDefault();
 const company=$('company').value.trim(),start=$('startDate').value,due=$('dueDate').value;
 if(!company||!start||!due){alert('Please add a company and both dates.');return;}
 const known=retailerMatch(company);
 if(!known){retailers[company]=Math.max(0,daysLeft(due)-daysLeft(start));}
 returns.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),company:known||company,item:$('item').value.trim(),start,basis:$('dateBasis').value,due,reminders:$('reminders').value,done:false,created:today()});
 save();$('returnDialog').close();render();
});
function renderRetailers(){
 $('retailerSettings').innerHTML=Object.entries(retailers).sort((a,b)=>a[0].localeCompare(b[0])).map(([name,days])=>`<div class="retailer-row"><span>${escapeHtml(name)}</span><input aria-label="${escapeHtml(name)} return days" type="number" min="1" max="365" value="${days}" data-retailer="${escapeHtml(name)}"><button type="button" aria-label="Remove ${escapeHtml(name)}" data-remove="${escapeHtml(name)}">×</button></div>`).join('');
 $('retailerSettings').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{delete retailers[b.dataset.remove];renderRetailers();});
}
$('addRetailerBtn').onclick=()=>{const n=$('newRetailer').value.trim();if(!n)return;if(!retailerMatch(n))retailers[n]=30;$('newRetailer').value='';renderRetailers();};
$('retailerForm').addEventListener('submit',e=>{e.preventDefault();$('retailerSettings').querySelectorAll('[data-retailer]').forEach(i=>{const n=i.dataset.retailer;retailers[n]=Math.max(1,Math.min(365,Number(i.value)||30));});save();$('retailerDialog').close();render();});
function showDetail(id){
 selectedId=id;const x=returns.find(r=>r.id===id);if(!x)return;
 $('detailContent').innerHTML=`<div class="detail-top"><div><p class="eyebrow">RETURN DETAILS</p><h2>${escapeHtml(x.company)}</h2></div><button class="close-button" id="detailClose">×</button></div><p class="detail-date">${pretty(x.due)}</p><p class="helper">${escapeHtml(x.item||'Return parcel')} · ${daysLeft(x.due)<0?`${Math.abs(daysLeft(x.due))} days overdue`:daysLeft(x.due)===0?'Due today':`${daysLeft(x.due)} days remaining`}</p><p class="helper">Started from ${x.basis==='delivery'?'delivery':'purchase'} date: ${pretty(x.start)}<br>Reminder preference: ${x.reminders==='none'?'None':x.reminders==='0'?'On due date':x.reminders.split(',').join(', ')+' days before'}</p><div class="detail-actions"><button class="secondary-action" id="calendarBtn">Add calendar reminder</button><button class="secondary-action" id="editBtn">Edit deadline</button><button class="primary-button" id="completeBtn">${x.done?'Mark as active':'Mark returned ✓'}</button><button class="danger-action" id="deleteBtn">Delete return</button></div>`;
 $('detailDialog').showModal();$('detailClose').onclick=()=>$('detailDialog').close();
 $('completeBtn').onclick=()=>{x.done=!x.done;save();$('detailDialog').close();render();};
 $('deleteBtn').onclick=()=>{if(confirm('Delete this return?')){returns=returns.filter(r=>r.id!==id);save();$('detailDialog').close();render();}};
 $('editBtn').onclick=()=>{const d=prompt('New return deadline (YYYY-MM-DD)',x.due);if(d&&/^\d{4}-\d{2}-\d{2}$/.test(d)){x.due=d;save();$('detailDialog').close();render();}};
 $('calendarBtn').onclick=()=>downloadCalendar(x);
}
function downloadCalendar(x){
 const dt=x.due.replaceAll('-','');const title=`Return ${x.company}${x.item?' - '+x.item:''}`;
 const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Returnly//Returns//EN\r\nBEGIN:VEVENT\r\nUID:${x.id}@returnly\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}\r\nDTSTART;VALUE=DATE:${dt}\r\nSUMMARY:${title.replace(/[,;]/g,' ')}\r\nDESCRIPTION:Return deadline. ${x.reminders==='none'?'':`Reminder preference in Returnly: ${x.reminders} days before.`}\r\nBEGIN:VALARM\r\nTRIGGER:-P1D\r\nACTION:DISPLAY\r\nDESCRIPTION:Return due tomorrow\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR`;
 const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='returnly-reminder.ics';a.click();URL.revokeObjectURL(url);
}
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
$('startDate').value=today();render();