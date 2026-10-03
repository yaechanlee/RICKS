'use strict';
(() => {
 const form=document.getElementById('ricks-submission'),status=document.getElementById('submission-status'),button=form.querySelector('button[type="submit"]');
 const endpoint='https://script.google.com/macros/s/AKfycbzoanbmQg-J3h6I-yZTRaQPR0jbwRPgeqTpgsNuRpSw6XmnZ6ocp8l80flHu2NVDiD6/exec';
 const show=(message,error=false)=>{status.hidden=false;status.className=error?'error':'';status.textContent=message;};
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const file=form.elements.manuscript.files[0];
  if(!file||!/\.(pdf|docx)$/i.test(file.name)){show('Please attach a DOCX or PDF manuscript.',true);return;}
  if(file.size>10*1024*1024){show('The file must be 10 MB or smaller.',true);return;}
  button.disabled=true;button.textContent='Sending…';status.hidden=true;
  try{
   const fileData=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('The file could not be read. Please attach it again.'));reader.readAsDataURL(file);});
   const data={};['submissionType','name','email','title','details','website'].forEach(key=>data[key]=form.elements[key].value);
   data.fileData=fileData;data.fileName=file.name;data.fileType=/\.pdf$/i.test(file.name)?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
   const response=await fetch(endpoint,{method:'POST',credentials:'omit',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)});
   if(!response.ok)throw new Error('The submission service could not be reached. Please try again later.');
   const result=await response.json();if(!result.ok)throw new Error(result.error||'Your submission could not be accepted.');
   form.reset();show('Thank you. Your manuscript has been received for editorial review.');
  }catch(error){show(error instanceof TypeError?'We could not confirm receipt. Please contact gsis@hanyang.ac.kr before resubmitting.':error.message,true);}
  finally{button.disabled=false;button.textContent='Send submission';}
 });
})();
