// enhance.js — progressive enhancement only (cms-spec.md C5).
// Without JavaScript the CV page shows a keyboard hint for printing; with it,
// the hint becomes a real Print button. Nothing else is added.

const hint = document.querySelector('.cv-print .print-hint');
if (hint) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'print-button';
  button.textContent = 'Print this page';
  button.style.font = 'inherit';
  button.style.cursor = 'pointer';
  button.addEventListener('click', () => window.print());
  hint.replaceWith(button);
}
