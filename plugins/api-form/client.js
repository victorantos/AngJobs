// api-form plugin — browser part: submit inline instead of navigating away.
// Without this file the form still works; the backend answers the plain POST.
// On fetch failure we re-enable the button and show an error instead of
// re-posting the form — an unreadable response (missing CORS, network drop)
// may mean the server already stored the submission, and a blind second
// POST would store it twice.

for (const form of document.querySelectorAll('form.api-form')) {
  const done = () => {
    const note = document.createElement('p');
    note.className = 'api-form-success';
    note.textContent = form.dataset.success;
    form.replaceWith(note);
  };
  // Past the closing date? Swap the form for the closed note. Cosmetic only:
  // no-JS visitors still see the form, so the backend must reject late posts.
  if (form.dataset.closes && Date.now() > new Date(`${form.dataset.closes}T23:59:59`).getTime()) {
    const note = document.createElement('p');
    note.className = 'api-form-closed';
    note.textContent = form.dataset.closedMessage;
    form.replaceWith(note);
    continue;
  }
  try {
    if (form.dataset.storageKey && localStorage.getItem(form.dataset.storageKey)) {
      done(); // this device already signed up — show the note, not the form
      continue;
    }
  } catch { /* private mode — just show the form */ }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.querySelector('.api-form-error')?.remove();
    const data = new FormData(form);
    const asJson = form.dataset.encoding === 'json';
    const response = await fetch(form.action, {
      method: 'POST',
      body: asJson ? JSON.stringify(Object.fromEntries(data)) : data,
      headers: asJson ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
    }).catch(() => null);
    if (!response?.ok) {
      button.disabled = false;
      button.textContent = label;
      const error = document.createElement('p');
      error.className = 'api-form-error';
      error.textContent = "That didn't go through — please try again.";
      form.append(error);
      return;
    }
    try { if (form.dataset.storageKey) localStorage.setItem(form.dataset.storageKey, 'true'); } catch { /* private mode — the note still shows */ }
    done();
  });
}
