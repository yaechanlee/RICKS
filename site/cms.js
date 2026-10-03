(()=>{
'use strict';
const endpoint='https://script.google.com/macros/s/AKfycbzoanbmQg-J3h6I-yZTRaQPR0jbwRPgeqTpgsNuRpSw6XmnZ6ocp8l80flHu2NVDiD6/exec';
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(action,data={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);try{const response=await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...data}),signal:controller.signal});const result=await response.json();if(!result.ok)throw new Error(result.error||'Please try again.');return result;}finally{clearTimeout(timer);}}
const date=s=>new Date(s+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
const link=x=>'article.html?id='+encodeURIComponent(x.id);
function render(item){
 const chunks=item.body.split(/\n\s*\n/),images=item.images||[];
 const photo=i=>`<figure><img src="${esc(i.data)}" alt="${esc(i.alt||i.caption)}"><figcaption>${esc(i.caption)}</figcaption></figure>`;
 let body=images.filter(i=>i.after===0).map(photo).join('');
 chunks.forEach((p,n)=>{if(/^#{1,3}\s/.test(p)){body+=`<h2>${esc(p.replace(/^#{1,3}\s+/,''))}</h2>`;}else if(/^>\s/.test(p)){body+=`<blockquote>${esc(p.replace(/^>\s*/gm,''))}</blockquote>`;}else body+=`<p>${esc(p).replace(/\n/g,'<br>')}</p>`;body+=images.filter(i=>i.after===n+1).map(photo).join('');});
 body+=images.filter(i=>i.after>chunks.length).map(photo).join('');
 return `<article class="reading-article"><header><p class="eyebrow">${esc(item.type)}</p><h1>${esc(item.title)}</h1>${item.summary?`<p class="reading-deck">${esc(item.summary)}</p>`:''}<div class="reading-meta"><strong>${esc(item.author||'RICKS')}</strong>${item.affiliation?`<span>${esc(item.affiliation)}</span>`:''}<time>${date(item.date)}</time></div></header><div class="reading-body">${body}</div></article>`;
}
window.RicksCMS={api,esc,date,render};
async function publicContent(){
 const host=document.querySelector('#article-view');if(host){try{const id=new URLSearchParams(location.search).get('id');if(!id)throw new Error('Choose an article from Reviews, Korea Now, or Notices.');const {item}=await api('publicArticle',{id});host.innerHTML=render(item);document.title=item.title+' | RICKS';}catch(e){host.textContent=e.message;}return;}
 if(!document.querySelector('#reviews-list,#commentary-list,#notices-list,#latest-publications,.page-comment-grid,.hero'))return;
 try{
 const {items}=await api('publicFeed');
 const reviews=items.filter(x=>/review$/.test(x.type)),comments=items.filter(x=>x.type==='Commentary'),notices=items.filter(x=>x.type==='Notice');
 const card=x=>`<article class="cms-card"><p class="eyebrow">${esc(x.type)}</p><h3><a href="${link(x)}">${esc(x.title)}</a></h3><p>${esc(x.summary)}</p><div class="byline"><span>${esc(x.author||'RICKS')}${x.affiliation?`<small>${esc(x.affiliation)}</small>`:''}</span><time datetime="${esc(x.date)}">${date(x.date)}</time></div></article>`;
 const home=!!document.querySelector('.hero');
 const homeCard=x=>`<article class="cms-card" data-publication="${esc(x.id)}"><a class="home-cover" href="${link(x)}" aria-label="Read ${esc(x.title)}"><span aria-hidden="true">RICKS<small>${esc(x.type)}</small></span></a><div class="home-card-copy"><p class="eyebrow">${esc(x.type)}</p><h3><a href="${link(x)}">${esc(x.title)}</a></h3><p>${esc(x.summary)}</p><div class="byline"><span>${esc(x.author||'RICKS')}</span><time datetime="${esc(x.date)}">${date(x.date)}</time></div></div></article>`;
 for(const [selector,list,empty] of [['#reviews-list',reviews,'Reviews will appear here when published.'],['#commentary-list,.page-comment-grid',comments,'Commentaries will appear here when published.'],['#notices-list',notices,'No notices at present.'],['#latest-publications',items.filter(x=>x.type!=='Notice'),'New reviews and commentaries will appear here when published.']]){const node=document.querySelector(selector);if(node)node.innerHTML=list.length?(home?list.slice(0,3):list).map(selector==='#latest-publications'?homeCard:card).join(''):`<p class="cms-empty">${empty}</p>`;}
 for(const node of document.querySelectorAll('#latest-publications [data-publication]')){api('publicArticle',{id:node.dataset.publication}).then(({item})=>{const image=item.images?.[0];if(image)node.querySelector('.home-cover').innerHTML=`<img src="${esc(image.data)}" alt="${esc(image.alt||image.caption||item.title)}" loading="lazy">`;}).catch(()=>{});}

 const noticeSlide=document.querySelector('.notice-feature');
 if(noticeSlide){
   const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   const notice=notices.find(x=>x.date===today)||notices.find(x=>x.date<=today);
   noticeSlide.querySelector('.notice-kicker').innerHTML='<span></span> '+(notice&&notice.date===today?'TODAY’S NEWS':'NEWS & NOTICES');
   noticeSlide.querySelector('.notice-date').textContent=notice?date(notice.date):date(today);
   noticeSlide.querySelector('.notice-title').textContent=notice?notice.title:'No notices today';
   noticeSlide.querySelector('.notice-byline').textContent=notice?(notice.summary.length>180?notice.summary.slice(0,177)+'…':notice.summary):'Institute announcements will appear here when published.';
   const target=noticeSlide.querySelector('.notice-link');target.href=notice?link(notice):'notices.html';target.innerHTML=(notice?'Read the notice':'View all notices')+' <span aria-hidden="true">↗</span>';
 }
 const latest=items.find(x=>x.type!=='Notice');const hero=document.querySelector('.hero');if(hero){hero.querySelector('.feature-title').textContent=latest?latest.title:'Our latest publications will appear here';hero.querySelector('.feature-type').textContent=latest?latest.type:'RICKS PUBLICATIONS';hero.querySelector('.feature-byline').textContent=latest?[latest.author,latest.affiliation].filter(Boolean).join(' · '):'Reviews and commentary on Korea';hero.querySelector('.feature-link').href=latest?link(latest):'reviews.html';hero.querySelector('.hero-slide[data-slide="1"] .hero-kicker').innerHTML='<span></span> LATEST PUBLICATION';hero.querySelector('.hero-slide[data-slide="1"] h1').innerHTML='Recent<br><em>publication.</em>';}
 }catch(e){const noticeSlide=document.querySelector('.notice-feature');if(noticeSlide){noticeSlide.querySelector('.notice-title').textContent='View institute notices';noticeSlide.querySelector('.notice-byline').textContent='Open the notices page for the latest announcements.';}for(const node of document.querySelectorAll('#reviews-list,#commentary-list,.page-comment-grid,#notices-list,#latest-publications'))node.innerHTML='<p class="cms-empty">Publications could not be loaded. Please refresh in a moment.</p>';}
}
publicContent();
})();

