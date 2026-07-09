// contact-form plugin — browser part: submit inline instead of navigating away.
// Without this file the form still works; the endpoint shows its own page.

for (const form of document.querySelectorAll('form.contact-form')) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error();
      const note = document.createElement('p');
      note.className = 'contact-form-success';
      note.textContent = form.dataset.success || 'Thanks — your message is on its way.';
      form.replaceWith(note);
    } catch {
      button.disabled = false;
      button.textContent = 'Send';
      form.submit(); // fall back to the no-JS path
    }
  });
}
