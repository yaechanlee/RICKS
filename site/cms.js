(()=>{
'use strict';
const endpoint='https://script.google.com/macros/s/AKfycbzoanbmQg-J3h6I-yZTRaQPR0jbwRPgeqTpgsNuRpSw6XmnZ6ocp8l80flHu2NVDiD6/exec';
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const activityTypes=['Academic publications','Events','Research projects'];
const activityTag='[RICKS_ACTIVITY:';
function decodeItem(item){if(!item||item.type!=='Notice')return item;const match=String(item.summary||'').match(/^\[RICKS_ACTIVITY:(academic|events|projects)\]\s*/);if(!match)return item;const types={academic:activityTypes[0],events:activityTypes[1],projects:activityTypes[2]};return {...item,type:types[match[1]],summary:item.summary.slice(match[0].length)};}
function encodeItem(item){if(!item||!activityTypes.includes(item.type))return item;const key={ 'Academic publications':'academic','Events':'events','Research projects':'projects'}[item.type];const summary=(item.summary||String(item.body||'').replace(/^#+\s*/gm,'').slice(0,260)).trim();const marker=activityTag+key+'] ';return {...item,type:'Notice',summary:marker+summary.slice(0,600-marker.length)};}
async function api(action,data={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);try{const response=await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...data,...(data.item?{item:encodeItem(data.item)}:{})}),signal:controller.signal});const result=await response.json();if(!result.ok)throw new Error(result.error||'Please try again.');if(result.item)result.item=decodeItem(result.item);if(result.items)result.items=result.items.map(decodeItem);return result;}finally{clearTimeout(timer);}}
const date=s=>new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
const link=x=>'/article/?id='+encodeURIComponent(x.id);
function render(item){
 const chunks=item.body.split(/\n\s*\n/),images=item.images||[];
 const photo=i=>`<figure><img src="${esc(i.data)}" alt="${esc(i.alt||i.caption)}"><figcaption>${esc(i.caption)}</figcaption></figure>`;
 let body=images.filter(i=>i.after===0).map(photo).join('');
 chunks.forEach((p,n)=>{if(/^#{1,3}\s/.test(p)){body+=`<h2>${esc(p.replace(/^#{1,3}\s+/,''))}</h2>`;}else if(/^>\s/.test(p)){body+=`<blockquote>${esc(p.replace(/^>\s*/gm,''))}</blockquote>`;}else body+=`<p>${esc(p).replace(/\n/g,'<br>')}</p>`;body+=images.filter(i=>i.after===n+1).map(photo).join('');});
 body+=images.filter(i=>i.after>chunks.length).map(photo).join('');
 return `<article class="reading-article"><header><p class="eyebrow">${esc(item.type)}</p><h1>${esc(item.title)}</h1>${item.summary?`<p class="reading-deck">${esc(item.summary)}</p>`:''}<div class="reading-meta"><strong>${esc(item.author||'RICKS')}</strong>${item.affiliation?`<span>${esc(item.affiliation)}</span>`:''}<time>${date(item.date)}</time></div></header><div class="reading-body">${body}</div></article>`;
}
window.RicksCMS={api,esc,date,render,activityTypes};
async function publicContent(){
 const host=document.querySelector('#article-view');if(host){try{const id=new URLSearchParams(location.search).get('id');if(!id)throw new Error('Choose an article from Reviews, Korea Now, or Research & Activities.');const {item}=await api('publicArticle',{id});host.innerHTML=render(item);document.title=item.title+' | RICKS';}catch(e){host.textContent=e.message;}return;}
 if(!document.querySelector('#reviews-list,#commentary-list,#notices-list,#latest-publications,#activities-list,.page-comment-grid,.hero'))return;
 try{
 const {items}=await api('publicFeed');
 const activities=items.filter(x=>activityTypes.includes(x.type));
 const publications=items.filter(x=>['Book review','Article review','Commentary'].includes(x.type));
 const reviews=items.filter(x=>/review$/.test(x.type)),comments=items.filter(x=>x.type==='Commentary');
 const card=x=>`<article class="cms-card"><p class="eyebrow">${esc(x.type)}</p><h3><a href="${link(x)}">${esc(x.title)}</a></h3><p>${esc(x.summary)}</p><div class="byline"><span>${esc(x.author||'RICKS')}${x.affiliation?`<small>${esc(x.affiliation)}</small>`:''}</span><time datetime="${esc(x.date)}">${date(x.date)}</time></div></article>`;
 const home=!!document.querySelector('.hero');
 const homeCard=x=>`<article class="cms-card" data-publication="${esc(x.id)}"><a class="home-cover" href="${link(x)}" aria-label="Read ${esc(x.title)}"><span aria-hidden="true">RICKS<small>${esc(x.type)}</small></span></a><div class="home-card-copy"><p class="eyebrow">${esc(x.type)}</p><h3><a href="${link(x)}">${esc(x.title)}</a></h3><p>${esc(x.summary)}</p><div class="byline"><span>${esc(x.author||'RICKS')}</span><time datetime="${esc(x.date)}">${date(x.date)}</time></div></div></article>`;
 for(const [selector,list,empty] of [['#reviews-list',reviews,'Reviews will appear here when published.'],['#commentary-list,.page-comment-grid',comments,'Commentaries will appear here when published.'],['#activities-list',activities,'Research and activity updates will appear here when published.'],['#latest-publications',publications,'New reviews and commentaries will appear here when published.']]){const node=document.querySelector(selector);if(node)node.innerHTML=list.length?(home?list.slice(0,3):list).map(selector==='#latest-publications'?homeCard:card).join(''):`<p class="cms-empty">${empty}</p>`;}
 for(const node of document.querySelectorAll('#latest-publications [data-publication]')){api('publicArticle',{id:node.dataset.publication}).then(({item})=>{const image=item.images?.[0];if(image)node.querySelector('.home-cover').innerHTML=`<img src="${esc(image.data)}" alt="${esc(image.alt||image.caption||item.title)}" loading="lazy">`;}).catch(()=>{});}

 const noticeSlide=document.querySelector('.notice-feature');
 if(noticeSlide){
   const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   const notice=activities[0];
   
   noticeSlide.querySelector('.notice-date').textContent=notice?notice.type:'RESEARCH & ACTIVITIES';
   noticeSlide.querySelector('.notice-title').textContent=notice?notice.title:'Our latest research and activity updates will appear here';
   noticeSlide.querySelector('.notice-byline').textContent=notice?(notice.summary.length>180?notice.summary.slice(0,177)+'…':notice.summary):'Academic publications, events, and research projects.';
   const target=noticeSlide.querySelector('.notice-link');target.href=notice?link(notice):'/activities/';target.innerHTML=(notice?'Read the update':'View research & activities')+' <span aria-hidden="true">↗</span>';
 }
 const latest=publications[0];const hero=document.querySelector('.hero');if(hero){hero.querySelector('.feature-title').textContent=latest?latest.title:'Our latest publications will appear here';hero.querySelector('.feature-type').textContent=latest?latest.type:'RICKS PUBLICATIONS';hero.querySelector('.feature-byline').textContent=latest?[latest.author,latest.affiliation].filter(Boolean).join(' · '):'Reviews and commentary on Korea';hero.querySelector('.feature-link').href=latest?link(latest):'/reviews/';hero.querySelector('.hero-slide[data-slide="1"] h1').innerHTML='Recent<br><em>publication.</em>';}
 }catch(e){const noticeSlide=document.querySelector('.notice-feature');if(noticeSlide){noticeSlide.querySelector('.notice-title').textContent='Research & Activities';noticeSlide.querySelector('.notice-byline').textContent='Open Research & Activities for the latest updates.';}for(const node of document.querySelectorAll('#reviews-list,#commentary-list,.page-comment-grid,#notices-list,#latest-publications,#activities-list'))node.innerHTML='<p class="cms-empty">Publications could not be loaded. Please refresh in a moment.</p>';}
}
publicContent();
})();

