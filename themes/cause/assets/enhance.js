// enhance.js — progressive enhancement only (cms-spec.md C5).
// The hero's impact number counts up when it scrolls into view — purely
// decorative, skipped for reduced-motion users, and the real number is in
// the HTML the whole time.

const number = document.querySelector('.impact-number');
const motionOk = matchMedia('(prefers-reduced-motion: no-preference)').matches;

if (number && motionOk && 'IntersectionObserver' in window) {
  const finalText = number.textContent;
  const target = Number(finalText.replace(/[^\d]/g, ''));
  const suffix = finalText.replace(/^[\d,.\s]+/, '');
  const grouped = finalText.includes(',');

  if (target > 0 && target < 1e7) {
    const format = (n) => (grouped ? n.toLocaleString('en-US') : String(n)) + suffix;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      const started = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - started) / 900, 1);
        const eased = 1 - (1 - progress) ** 3;
        number.textContent = format(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
        else number.textContent = finalText;
      };
      requestAnimationFrame(tick);
    });
    observer.observe(number);
  }
}
