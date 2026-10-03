(()=>{
'use strict';
const {api,esc}=window.RicksCMS;
const types=['Faculty profile','Executive profile','Graduate student profile'];
const originalProfiles=[{"originalKey":"ryoo-joohan","type":"Faculty profile","title":"Ryoo Joohan","photo":"/assets/director-faculty.webp","body":"{\"role\":\"Professor · Chair of Global Strategy and Intelligence Program\",\"degree\":\"Ph.D. in Management, London School of Economics\",\"affiliation\":\"\",\"research\":\"International market entry, new business development, strategic alliances, mergers and acquisitions, post-merger integration, venture management, and new climate strategies.\",\"email\":\"jhryoo@hanyang.ac.kr\"}"},{"originalKey":"choi-lyong","type":"Faculty profile","title":"Choi Lyong","photo":"/assets/lyong-choi.webp","body":"{\"role\":\"Associate Professor · Chair of East Asian Studies Program\",\"degree\":\"Ph.D. in International History, London School of Economics\",\"affiliation\":\"\",\"research\":\"International security, Indo-Pacific international relations, nuclear security, U.S. foreign policy, and diplomatic history.\",\"email\":\"choiu2@hanyang.ac.kr\"}"},{"originalKey":"lee-yaechan","type":"Faculty profile","title":"Lee Yaechan","photo":"/assets/yaechan-lee.webp","body":"{\"role\":\"Assistant Professor · Chair of Korean Studies Program\",\"degree\":\"Ph.D. in Political Science, Boston University\",\"affiliation\":\"\",\"research\":\"International political economy, politics of finance, developmental states, Korean political economy, and comparative political economy of East Asia.\",\"email\":\"yaechanlee@hanyang.ac.kr\"}"},{"originalKey":"kim-youen","type":"Faculty profile","title":"Kim Youen","photo":"/assets/kim-youen.webp","body":"{\"role\":\"Professor Emeritus\",\"degree\":\"Ph.D. in Political Science, Hanyang University\",\"affiliation\":\"\",\"research\":\"\",\"email\":\"maloman@hanyang.ac.kr\"}"},{"originalKey":"ines-amrouche","type":"Executive profile","title":"Ines Amrouche","photo":"/assets/ines-amrouche.jpeg","body":"{\"role\":\"Executive Editor\",\"degree\":\"Ph.D. Candidate in International Studies (Korean Studies)\",\"affiliation\":\"Hanyang GSIS\",\"research\":\"Energy security, regional cooperation, and geopolitical dynamics in Asia\",\"email\":\"inesamrouche@hanyang.ac.kr\"}"}];
const $=id=>document.getElementById(id);
function fields(item){try{return JSON.parse(item.body||'{}');}catch{return {};}}
function displayOrder(item){const p=fields(item),n=Number(p.order);if(p.order!==undefined&&p.order!==''&&Number.isFinite(n))return n;const i=originalProfiles.filter(x=>x.type===item.type).findIndex(x=>x.originalKey===item.originalKey);return i<0?100:i+1;}
function profileLink(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}}
function syncProfileFields(){$('profile-link-field').hidden=$('profile-group').value!==types[0];$('profile-order-label').textContent='Order within '+$('profile-group').selectedOptions[0].textContent;}
function card(item){
const p=fields(item),faculty=item.type===types[0],photo=item.images?.[0]?.data;
const portrait=photo?'<img class="'+(faculty?'faculty-portrait':'community-portrait')+'" src="'+esc(photo)+'" alt="'+esc(item.title)+'" loading="lazy">':'';
const url=profileLink(p.profileUrl??(item.originalKey&&faculty?'https://gsis.hanyang.ac.kr/en/-faculty-members':'')),external=url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Profile ↗</a>':'';
const email=p.email&&/^[^\s@<>]+@[^\s@<>]+$/.test(p.email)?'<a href="mailto:'+esc(p.email)+'">'+esc(p.email)+'</a>':'';
if(faculty)return '<article class="faculty-card" data-display-order="'+displayOrder(item)+'">'+portrait+'<p class="faculty-role">'+esc(p.role)+'</p><h3>'+esc(item.title)+'</h3><p class="faculty-degree">'+esc(p.degree)+(p.affiliation?'<br>'+esc(p.affiliation):'')+'</p>'+(p.research?'<div class="faculty-interests"><h4>Research interests</h4><p>'+esc(p.research)+'</p></div>':'')+'<div class="faculty-links">'+external+email+'</div></article>';
return '<article class="community-editor" data-display-order="'+displayOrder(item)+'">'+(portrait||'<div aria-hidden="true"></div>')+'<div class="community-details"><p class="community-role">'+esc(p.role)+'</p><h3>'+esc(item.title)+'</h3><p>'+esc(p.degree)+(p.affiliation?'<br>'+esc(p.affiliation):'')+'</p>'+(p.research?'<p><strong>Research:</strong> '+esc(p.research)+'</p>':'')+'<div class="community-contact">'+email+'</div></div></article>';
}
async function publicProfiles(){
const executives=$('executive-profiles'),existingExecutive=document.querySelector('.graduate-section > [data-original-profile]');
if(executives&&existingExecutive){existingExecutive.dataset.displayOrder='1';executives.appendChild(existingExecutive);}
try{const result=await api('publicFeed');const entries=result.items.filter(x=>types.includes(x.type));const full=await Promise.all(entries.map(x=>api('publicArticle',{id:x.id}).then(r=>r.item)));
for(const item of full){if(!item?.originalKey)continue;const original=document.querySelector('[data-original-profile="'+item.originalKey.replace(/[^a-z0-9-]/g,'')+'"]');if(original){if(!item.removed&&item.status==='published'&&original.classList.contains(item.type===types[0]?'faculty-card':'community-editor'))original.outerHTML=card(item);else original.remove();item.renderedOriginal=true;}}
for(const type of types){const target=type===types[0]?document.querySelector('.faculty-grid'):$(type===types[1]?'executive-profiles':'graduate-profiles');const items=full.filter(x=>x&&x.type===type&&!x.removed&&x.status==='published'&&!x.renderedOriginal);if(target)target.insertAdjacentHTML('beforeend',items.map(card).join(''));if(target){const cards=[...target.children];cards.sort((a,b)=>Number(a.dataset.displayOrder||100)-Number(b.dataset.displayOrder||100)).forEach(node=>target.appendChild(node));}if(type===types[2]&&items.length)$('graduate-empty').hidden=true;}
}catch{const target=$('graduate-profiles');if(target)target.innerHTML='<p class="editor-help">Additional profiles could not be loaded. Please refresh.</p>';}
}
if($('graduate-profiles')){publicProfiles();return;}
if(!$('profile-form'))return;
let current={},images=[],dirty=false,busy=false;
const status=s=>{$('editor-status').textContent=s;};
const request=(action,data={})=>api(action,{...data,token:sessionStorage.getItem('ricks-editor-session')||''});
function lock(value){busy=value;$('profile-workspace').querySelectorAll('button,input,textarea,select').forEach(n=>n.disabled=value);if(!value)drawProfiles();}
function photoPreview(){$('profile-photo-preview').innerHTML=images.length?'<img src="'+esc(images[0].data)+'" alt="Portrait preview" style="width:100px;height:100px;border-radius:50%;object-fit:cover;margin:16px 0">':'';$('profile-photo-remove').hidden=!images.length;}
function edit(item={}){
current=item;images=(item.images||[]).map(x=>({...x}));const p=fields(item);
$('profile-group').value=item.type||types[0];$('profile-name').value=item.title||'';
for(const key of ['role','degree','affiliation','research','email'])$('profile-'+key).value=p[key]||'';$('profile-link').value=p.profileUrl??(item.originalKey&&item.type===types[0]?'https://gsis.hanyang.ac.kr/en/-faculty-members':'');$('profile-order').value=displayOrder(item);syncProfileFields();
$('profile-heading').textContent=item.id?'Edit profile':'New profile';$('profile-unpublish').hidden=item.status!=='published';$('profile-draft').hidden=item.status==='published';$('profile-publish').textContent=item.status==='published'?'Update profile':'Publish profile';photoPreview();dirty=false;$('profile-delete').hidden=!item.id;drawProfiles();
}
let profileItems=[],profilePage=0;
function drawProfiles(){
profilePage=Math.min(Math.max(0,profilePage),Math.max(0,Math.ceil(profileItems.length/10)-1));
const items=profileItems.slice(profilePage*10,profilePage*10+10);
$('profile-library').innerHTML=items.map(x=>'<div class="library-row"><button type="button" class="library-open" data-profile="'+esc(x.id)+'" aria-pressed="'+(current.id===x.id)+'"><span class="library-category category-profile">'+esc(x.type.replace(' profile',''))+'</span><span class="library-title">'+esc(x.title)+'</span><small>'+(x.status==='published'?'Published':'Draft')+'</small></button><button type="button" class="library-delete" data-profile-delete="'+esc(x.id)+'" aria-label="Delete '+esc(x.title)+'" title="Delete">×</button></div>').join('')+(items.length?'<div class="library-pagination"><button type="button" data-profile-page="-1" '+(profilePage===0?'disabled':'')+'>Previous</button><span>'+(profilePage+1)+' / '+Math.ceil(profileItems.length/10)+'</span><button type="button" data-profile-page="1" '+((profilePage+1)*10>=profileItems.length?'disabled':'')+'>Next</button></div>':'<p class="editor-help">Saved profiles will appear here.</p>');
}
async function refresh(){let r=await request('adminList');
for(const seed of originalProfiles){
if(r.items.some(x=>x.originalKey===seed.originalKey))continue;
status('Adding existing profiles to the editor…');
const response=await fetch(seed.photo);if(!response.ok)throw new Error('Could not load the existing portrait. Please try again.');
const bitmap=await createImageBitmap(await response.blob());let data;
try{const scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);data=canvas.toDataURL('image/jpeg',.85);}finally{bitmap.close();}
await request('adminSave',{item:{type:seed.type,originalKey:seed.originalKey,title:seed.title,author:'',affiliation:'',date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'}),summary:JSON.parse(seed.body).role,body:seed.body,images:[{data,alt:seed.title,caption:'',after:0}],status:'published'}});
}
r=await request('adminList');profileItems=r.items.filter(x=>types.includes(x.type)&&!x.removed).sort((a,b)=>String(b.updatedAt||b.date).localeCompare(String(a.updatedAt||a.date)));drawProfiles();}
$('people-tab').addEventListener('click',async()=>{if(busy)return;if(dirty&&!confirm('Start a new profile without saving your changes?'))return;edit();$('content-workspace').hidden=true;$('profile-workspace').hidden=false;$('people-tab').setAttribute('aria-pressed','true');$('content-tab').setAttribute('aria-pressed','false');lock(true);try{await refresh();}catch(e){status(e.message);}finally{lock(false);}});
$('content-tab').addEventListener('click',()=>{$('content-workspace').hidden=false;$('profile-workspace').hidden=true;$('people-tab').setAttribute('aria-pressed','false');$('content-tab').setAttribute('aria-pressed','true');});
window.addEventListener('ricks-editor-ready',()=>{edit();$('content-tab').click();});

$('profile-library').addEventListener('click',async e=>{
if(busy)return;
const pager=e.target.closest('[data-profile-page]');if(pager){profilePage+=Number(pager.dataset.profilePage);drawProfiles();return;}
const remove=e.target.closest('[data-profile-delete]');if(remove){const item=profileItems.find(x=>x.id===remove.dataset.profileDelete);if(!item||!confirm('Delete “'+item.title+'”? This removes the profile from People and the editor.'))return;lock(true);status('Deleting profile…');try{const full=await request('adminGet',{id:item.id});await window.RicksCMS.deleteItem(full.item,sessionStorage.getItem('ricks-editor-session')||'');if(current.id===item.id)edit();await refresh();status('Profile deleted.');}catch(e){status(e.message);}finally{lock(false);drawProfiles();}return;}
const b=e.target.closest('[data-profile]');if(!b||busy)return;if(dirty&&!confirm('Discard unsaved profile changes?'))return;lock(true);try{const r=await request('adminGet',{id:b.dataset.profile});edit(r.item);status('');}catch(e){status(e.message);}finally{lock(false);}});
$('profile-form').addEventListener('input',()=>dirty=true);
$('profile-form').addEventListener('submit',e=>e.preventDefault());
$('profile-group').addEventListener('change',()=>{syncProfileFields();if(!$('profile-role').value)$('profile-role').value=$('profile-group').value===types[2]?'Graduate Student':'';});
async function upload(file){if(!file)return;lock(true);status('Preparing portrait…');try{if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>15000000)throw new Error('Choose a JPG, PNG, or WebP portrait below 15 MB.');const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);let data=canvas.toDataURL('image/jpeg',.82);if(data.length>1450000)data=canvas.toDataURL('image/jpeg',.6);if(data.length>1450000)throw new Error('Please choose a smaller portrait.');images=[{data,alt:$('profile-name').value,caption:'',after:0}];dirty=true;photoPreview();status('Portrait added.');}finally{bitmap.close();}}catch(e){status(e.message);}finally{$('profile-photo').value='';lock(false);}}
$('profile-photo').addEventListener('change',e=>upload(e.target.files[0]));
$('profile-form').addEventListener('paste',e=>{const photo=[...e.clipboardData.items].find(x=>x.kind==='file'&&x.type.startsWith('image/'));if(photo){e.preventDefault();upload(photo.getAsFile());}});
$('profile-photo-remove').addEventListener('click',()=>{images=[];dirty=true;photoPreview();});
async function save(state){
if(busy||!$('profile-form').reportValidity())return;lock(true);status('Saving profile…');
try{const p={};for(const key of ['role','degree','affiliation','research','email'])p[key]=$('profile-'+key).value.trim();
p.order=Number($('profile-order').value);p.profileUrl=$('profile-link').value.trim();if(p.profileUrl&&!profileLink(p.profileUrl))throw new Error('Use an http:// or https:// profile link.');
const item={id:current.id,originalKey:current.originalKey,updatedAt:current.updatedAt,type:$('profile-group').value,title:$('profile-name').value.trim(),author:'',affiliation:p.affiliation,date:current.date||new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'}),summary:p.role,body:JSON.stringify(p),images,status:state};
const r=await request('adminSave',{item});edit(r.item);await refresh();status(state==='published'?'Profile published on People.':'Profile saved as a draft.');}catch(e){status(e.message);}finally{lock(false);}
}
$('profile-draft').addEventListener('click',()=>save('draft'));
$('profile-publish').addEventListener('click',()=>save('published'));
$('profile-unpublish').addEventListener('click',()=>{if(confirm('Remove this profile from the public People page and keep it as a draft?'))save('draft');});
$('profile-delete').addEventListener('click',async()=>{if(busy||!current.id)return;if(!confirm('Delete “'+current.title+'”? This removes the profile from People and the editor.'))return;lock(true);status('Deleting profile…');try{await window.RicksCMS.deleteItem(current,sessionStorage.getItem('ricks-editor-session')||'');edit();await refresh();status('Profile deleted.');}catch(e){status(e.message);}finally{lock(false);}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
edit();
})();