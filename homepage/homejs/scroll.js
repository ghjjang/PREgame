export function setupSectionScroll() {
  const sections = Array.from(document.querySelectorAll('.section'));
  if (!sections.length) return;

  let currentSection = 0;
  let isScrolling = false;

  function scrollToSection(index) {
    if (index < 0 || index >= sections.length) return;
    isScrolling = true;
    sections[index].scrollIntoView({ behavior: 'smooth' });
    currentSection = index;
    setTimeout(() => isScrolling = false, 700);
  }

  window.addEventListener('wheel', (e) => {
    if (isScrolling) return;
    if (e.deltaY > 0) scrollToSection(currentSection + 1);
    else if (e.deltaY < 0) scrollToSection(currentSection - 1);
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (isScrolling) return;
    if (e.key === 'ArrowDown') scrollToSection(currentSection + 1);
    if (e.key === 'ArrowUp') scrollToSection(currentSection - 1);
  });

  // expose a safe scrollToTop
   function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    currentSection = 0;
  }

  return { scrollToTop };
}