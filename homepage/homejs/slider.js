export function setupSlider() {
  const slider = document.querySelector('.slider');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const nextBtn = document.querySelector('.slide-btn.next');
  const prevBtn = document.querySelector('.slide-btn.prev');
  if (!slider || slides.length === 0) return;

  let current = 0;

  function updateSlide() {
    slides.forEach((s, i) => {
      s.style.display = (i === current) ? 'block' : 'none';
      s.classList.toggle('active', i === current);
    });
  }

  function next() {
    current = (current + 1) % slides.length;
    updateSlide();
  }
  function prev() {
    current = (current - 1 + slides.length) % slides.length;
    updateSlide();
  }

  if (nextBtn) nextBtn.addEventListener('click', next);
  if (prevBtn) prevBtn.addEventListener('click', prev);

  // mouse drag + touch support
  let startX = null;

  function pointerStart(x) { startX = x; }
  function pointerEnd(x) {
    if (startX === null) return;
    const dx = startX - x;
    if (dx > 50) next();
    else if (dx < -50) prev();
    startX = null;
  }

  slider.addEventListener('mousedown', (e) => pointerStart(e.clientX));
  slider.addEventListener('mouseup', (e) => pointerEnd(e.clientX));
  slider.addEventListener('touchstart', (e) => pointerStart(e.touches[0].clientX), { passive: true });
  slider.addEventListener('touchend', (e) => pointerEnd(e.changedTouches[0].clientX));

  updateSlide();
  return { next, prev };
}