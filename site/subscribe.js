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
    button.textContent = "Subscribing…";
    status.hidden = false;
    status.textContent = "Saving your subscription…";
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {"Content-Type": "text/plain;charset=utf-8"},
        body: JSON.stringify({email: fields.get("email"), name: fields.get("name"), consent: fields.get("consent") === "on", website: fields.get("website")})
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Subscription could not be saved. Please try again.");
      form.reset();
      status.textContent = "You’re subscribed. Thank you for joining RICKS.";
    } catch (error) {
      status.textContent = "Subscription could not be saved. Please try again.";
    } finally {
      button.disabled = false;
      button.textContent = "Subscribe";
    }
  });
})();
