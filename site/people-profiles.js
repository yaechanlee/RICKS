(()=>{
'use strict';
const {api,esc}=window.RicksCMS;
const types=['Faculty profile','Executive profile','Graduate student profile'];
const $=id=>document.getElementById(id);
function fields(item){try{return JSON.parse(item.body||'{}');}catch{return {};}}
function card(item){
const p=fields(item),faculty=item.type===types[0],photo=item.images?.[0]?.data;
const portrait=photo?'<img class="'+(faculty?'faculty-portrait':'community-portrait')+'" src="'+esc(photo)+'" alt="'+esc(item.title)+'" loading="lazy">':'';
const email=p.email&&/^[^\s@<>]+@[^\s@<>]+$/.test(p.email)?'<a href="mailto:'+esc(p.email)+'">'+esc(p.email)+'</a>':'';
if(faculty)return '<article class="faculty-card">'+portrait+'<p class="faculty-role">'+esc(p.role)+'</p><h3>'+esc(item.title)+'</h3><p class="faculty-degree">'+esc(p.degree)+(p.affiliation?'<br>'+esc(p.affiliation):'')+'</p>'+(p.research?'<div class="faculty-interests"><h4>Research interests</h4><p>'+esc(p.research)+'</p></div>':'')+'<div class="faculty-links">'+email+'</div></article>';
return '<article class="community-editor">'+(portrait||'<div aria-hidden="true"></div>')+'<div class="community-details"><p class="community-role">'+esc(p.role)+'</p><h3>'+esc(item.title)+'</h3><p>'+esc(p.degree)+(p.affiliation?'<br>'+esc(p.affiliation):'')+'</p>'+(p.research?'<p><strong>Research:</strong> '+esc(p.research)+'</p>':'')+'<div class="community-contact">'+email+'</div></div></article>';
}
async function publicProfiles(){
try{const result=await api('publicFeed');const entries=result.items.filter(x=>types.includes(x.type));const full=await Promise.all(entries.map(x=>api('publicArticle',{id:x.id}).then(r=>r.item)));
for(const type of types){const target=type===types[0]?document.querySelector('.faculty-grid'):$(type===types[1]?'executive-profiles':'graduate-profiles');const items=full.filter(x=>x&&x.type===type);if(target)target.insertAdjacentHTML('beforeend',items.map(card).join(''));if(type===types[2]&&items.length)$('graduate-empty').hidden=true;}
}catch{const target=$('graduate-profiles');if(target)target.innerHTML='<p class="editor-help">Additional profiles could not be loaded. Please refresh.</p>';}
}
if($('graduate-profiles')){publicProfiles();return;}
if(!$('profile-form'))return;
let current={},images=[],dirty=false,busy=false;
const status=s=>{$('editor-status').textContent=s;};
const request=(action,data={})=>api(action,{...data,token:sessionStorage.getItem('ricks-editor-session')||''});
function lock(value){busy=value;$('profile-workspace').querySelectorAll('button,input,textarea,select').forEach(n=>n.disabled=value);}
function photoPreview(){$('profile-photo-preview').innerHTML=images.length?'<img src="'+esc(images[0].data)+'" alt="Portrait preview" style="width:100px;height:100px;border-radius:50%;object-fit:cover;margin:16px 0">':'';$('profile-photo-remove').hidden=!images.length;}
function edit(item={}){
current=item;images=(item.images||[]).map(x=>({...x}));const p=fields(item);
$('profile-group').value=item.type||types[0];$('profile-name').value=item.title||'';
for(const key of ['role','degree','affiliation','research','email'])$('profile-'+key).value=p[key]||'';
$('profile-heading').textContent=item.id?'Edit profile':'New profile';$('profile-unpublish').hidden=item.status!=='published';$('profile-draft').hidden=item.status==='published';$('profile-publish').textContent=item.status==='published'?'Update profile':'Publish profile';photoPreview();dirty=false;$('profile-delete').hidden=!item.id;
}
async function refresh(){const r=await request('adminList');$('profile-library').innerHTML=r.items.filter(x=>types.includes(x.type)).map(x=>'<button type="button" data-profile="'+esc(x.id)+'">'+esc(x.title)+'<small>'+esc(x.type)+' · '+esc(x.status)+'</small></button>').join('')||'<p class="editor-help">Saved profiles will appear here.</p>';}
$('people-tab').addEventListener('click',async()=>{$('content-workspace').hidden=true;$('profile-workspace').hidden=false;$('people-tab').setAttribute('aria-pressed','true');$('content-tab').setAttribute('aria-pressed','false');lock(true);try{await refresh();}catch(e){status(e.message);}finally{lock(false);}});
$('content-tab').addEventListener('click',()=>{$('content-workspace').hidden=false;$('profile-workspace').hidden=true;$('people-tab').setAttribute('aria-pressed','false');$('content-tab').setAttribute('aria-pressed','true');});
window.addEventListener('ricks-editor-ready',()=>{edit();$('content-tab').click();});
$('profile-new').addEventListener('click',()=>{if(dirty&&!confirm('Discard unsaved profile changes?'))return;edit();status('');});
$('profile-library').addEventListener('click',async e=>{const b=e.target.closest('[data-profile]');if(!b||busy)return;if(dirty&&!confirm('Discard unsaved profile changes?'))return;lock(true);try{const r=await request('adminGet',{id:b.dataset.profile});edit(r.item);status('');}catch(e){status(e.message);}finally{lock(false);}});
$('profile-form').addEventListener('input',()=>dirty=true);
$('profile-form').addEventListener('submit',e=>e.preventDefault());
$('profile-group').addEventListener('change',()=>{if(!$('profile-role').value)$('profile-role').value=$('profile-group').value===types[2]?'Graduate Student':'';});
async function upload(file){if(!file)return;lock(true);status('Preparing portrait…');try{if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>15000000)throw new Error('Choose a JPG, PNG, or WebP portrait below 15 MB.');const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);let data=canvas.toDataURL('image/jpeg',.82);if(data.length>1450000)data=canvas.toDataURL('image/jpeg',.6);if(data.length>1450000)throw new Error('Please choose a smaller portrait.');images=[{data,alt:$('profile-name').value,caption:'',after:0}];dirty=true;photoPreview();status('Portrait added.');}finally{bitmap.close();}}catch(e){status(e.message);}finally{$('profile-photo').value='';lock(false);}}
$('profile-photo').addEventListener('change',e=>upload(e.target.files[0]));
$('profile-form').addEventListener('paste',e=>{const photo=[...e.clipboardData.items].find(x=>x.kind==='file'&&x.type.startsWith('image/'));if(photo){e.preventDefault();upload(photo.getAsFile());}});
$('profile-photo-remove').addEventListener('click',()=>{images=[];dirty=true;photoPreview();});
async function save(state){
if(busy||!$('profile-form').reportValidity())return;lock(true);status('Saving profile…');
try{const p={};for(const key of ['role','degree','affiliation','research','email'])p[key]=$('profile-'+key).value.trim();
const item={id:current.id,updatedAt:current.updatedAt,type:$('profile-group').value,title:$('profile-name').value.trim(),author:'',affiliation:p.affiliation,date:current.date||new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'}),summary:p.role,body:JSON.stringify(p),images,status:state};
const r=await request('adminSave',{item});edit(r.item);await refresh();status(state==='published'?'Profile published on People.':'Profile saved as a draft.');}catch(e){status(e.message);}finally{lock(false);}
}
$('profile-draft').addEventListener('click',()=>save('draft'));
$('profile-publish').addEventListener('click',()=>save('published'));
$('profile-unpublish').addEventListener('click',()=>{if(confirm('Remove this profile from the public People page and keep it as a draft?'))save('draft');});
$('profile-delete').addEventListener('click',async()=>{if(busy||!current.id)return;if(!confirm('Delete “'+current.title+'”? This removes the profile from People and the editor.'))return;lock(true);status('Deleting profile…');try{await window.RicksCMS.deleteItem(current,sessionStorage.getItem('ricks-editor-session')||'');edit();await refresh();status('Profile deleted.');}catch(e){status(e.message);}finally{lock(false);}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
edit();
})();