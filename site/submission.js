'use strict';
(() => {
 const form=document.getElementById('ricks-submission'),status=document.getElementById('submission-status'),button=form.querySelector('button[type="submit"]');
 const endpoint='https://script.google.com/macros/s/AKfycbzoanbmQg-J3h6I-yZTRaQPR0jbwRPgeqTpgsNuRpSw6XmnZ6ocp8l80flHu2NVDiD6/exec';
 const textPanel=document.getElementById('text-submission'),filePanel=document.getElementById('file-submission');
 const syncMode=()=>{const text=form.elements.submissionMode.value==='text';textPanel.hidden=!text;filePanel.hidden=text;form.elements.manuscriptText.disabled=!text;form.elements.manuscriptText.required=text;form.elements.manuscript.disabled=text;form.elements.manuscript.required=!text;};
 form.addEventListener('change',event=>{if(event.target.name==='submissionMode')syncMode();});syncMode();
 const show=(message,error=false)=>{status.hidden=false;status.className=error?'error':'';status.textContent=message;};
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const textMode=form.elements.submissionMode.value==='text';
  const file=form.elements.manuscript.files[0];
  if(textMode&&!form.elements.manuscriptText.value.trim()){show((document.documentElement.lang==='ko'?"영문 원고를 작성하거나 붙여넣어 주세요.":"Write or paste your manuscript."),true);return;}
  if(!textMode&&(!file||!/\.(pdf|docx)$/i.test(file.name))){show((document.documentElement.lang==='ko'?"DOCX 또는 PDF 원고를 첨부해 주세요.":"Please attach a DOCX or PDF manuscript."),true);return;}
  if(!textMode&&file.size>10*1024*1024){show((document.documentElement.lang==='ko'?"파일 크기는 10MB 이하여야 합니다.":"The file must be 10 MB or smaller."),true);return;}
  button.disabled=true;button.textContent=(document.documentElement.lang==='ko'?"전송 중…":"Sending…");status.hidden=true;
  try{
   const fileData=textMode?null:await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('The file could not be read. Please attach it again.'));reader.readAsDataURL(file);});
   const data={};['submissionType','name','email','title','website'].forEach(key=>data[key]=form.elements[key].value);
   if(textMode){data.manuscriptText=form.elements.manuscriptText.value;}else{data.fileData=fileData;data.fileName=file.name;data.fileType=/\.pdf$/i.test(file.name)?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document';}
   const response=await fetch(endpoint,{method:'POST',credentials:'omit',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)});
   if(!response.ok)throw new Error('The submission service could not be reached. Please try again later.');
   const result=await response.json();if(!result.ok)throw new Error(result.error||'Your submission could not be accepted.');
   form.reset();syncMode();show((document.documentElement.lang==='ko'?"감사합니다. 편집 검토를 위해 원고가 접수되었습니다.":"Thank you. Your manuscript has been received for editorial review."));
  }catch(error){show(error instanceof TypeError?'We could not confirm receipt. Please contact ricks@hanyang.ac.kr before resubmitting.':error.message,true);}
  finally{button.disabled=false;button.textContent=(document.documentElement.lang==='ko'?"원고 보내기":"Send submission");}
 });
})();
