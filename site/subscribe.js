(() => {
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbxTXfcFl7OwTWfyuawNxYobL7L563hcq2_99zGqd_W-pDyR5gYA3kCmX543EF4oebuD/exec";
  const form = document.getElementById("ricks-submission");
  if (!form) return;
  const status = document.getElementById("subscription-status");
  const button = form.querySelector("button[type=submit]");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    button.disabled = true;
    button.textContent = (document.documentElement.lang==='ko'?"구독 신청 중…":"Subscribing…");
    status.hidden = false;
    status.textContent = (document.documentElement.lang==='ko'?"구독 정보를 저장하고 있습니다…":"Saving your subscription…");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=utf-8"},
        body: JSON.stringify({email: fields.get("email"), name: fields.get("name"), consent: fields.get("consent") === "on", website: fields.get("website")})
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || (document.documentElement.lang==='ko'?"구독 정보를 저장하지 못했습니다. 다시 시도해 주세요.":"Subscription could not be saved. Please try again."));
      form.reset();
      status.textContent = (document.documentElement.lang==='ko'?"구독 신청이 완료되었습니다. RICKS와 함께해 주셔서 감사합니다.":"You’re subscribed. Thank you for joining RICKS.");
    } catch (error) {
      status.textContent = (document.documentElement.lang==='ko'?"구독 정보를 저장하지 못했습니다. 다시 시도해 주세요.":"Subscription could not be saved. Please try again.");
    } finally {
      button.disabled = false;
      button.textContent = (document.documentElement.lang==='ko'?"구독하기":"Subscribe");
    }
  });
})();
