/* =====================================================
   АРХИВ: фото и видео в карточках + попап
   Что делает:
   1. Кладёт в каждую карточку архива фото или видео из data-media
      (картинка или видео — определяется по расширению файла).
   2. Видео играют сами: без звука, по кругу; пока не видны на экране — стоят.
   3. По клику открывает попап: название, текст и фото/видео в цвете.
      Закрыть: крестик, клик по тёмному фону или Esc.
   Если файла ещё нет — остаётся серая заглушка вместо битой картинки.
   ===================================================== */
(() => {

  const VIDEO = /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i;   // какие расширения считать видео

  /* ---------- 0. битые картинки не показываем ---------- */
  document.querySelectorAll('.marquee img, .proj .media img').forEach(img => {
    const hide = () => { img.style.display = 'none'; };
    img.addEventListener('error', hide, { once: true });
    if (img.complete && img.naturalWidth === 0 && !/\.svg(\?|$)/i.test(img.src)) hide();
  });

  /* ---------- 1. фото и видео в карточках архива ---------- */
  const cards = document.querySelectorAll('.arch');
  const videos = [];

  function makeVideo(src) {
    const v = document.createElement('video');
    v.src = src;
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.preload = 'metadata';
    return v;
  }

  cards.forEach(card => {
    const src = card.dataset.media;
    const box = card.querySelector('.media');
    if (!src || !box) return;
    if (VIDEO.test(src)) {
      const v = makeVideo(src);
      v.addEventListener('error', () => v.remove(), { once: true });
      box.appendChild(v);
      videos.push(v);
      v.play().catch(() => {});
    } else {
      const img = new Image();
      img.src = src;
      img.alt = (card.querySelector('.cap > span') || {}).textContent || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => img.remove(), { once: true });
      box.appendChild(img);
    }
  });

  // на телефоне наведения нет: карточка становится цветной, когда проезжает через середину экрана
  if ('IntersectionObserver' in window && window.matchMedia('(hover: none)').matches) {
    const seen = new IntersectionObserver(entries => {
      entries.forEach(e => e.target.classList.toggle('is-seen', e.isIntersecting));
    }, { rootMargin: '-38% 0px -38% 0px' });   // «середина» = полоса 24% высоты экрана; меняй проценты, чтобы сузить или расширить
    cards.forEach(c => seen.observe(c));
  }

  // видео вне экрана ставим на паузу, чтобы страница не тормозила
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.play().catch(() => {});
        else e.target.pause();
      });
    }, { rootMargin: '120px' });
    videos.forEach(v => io.observe(v));
  }

  /* ---------- 2. попап ---------- */
  const pop = document.getElementById('pop');
  if (!pop) return;
  const panel   = pop.querySelector('.pop__panel');
  const titleEl = pop.querySelector('.pop__title');
  const textEl  = pop.querySelector('.pop__text');
  const mediaEl = pop.querySelector('.pop__media');
  const closeBt = pop.querySelector('.pop__close');
  let lastFocus = null, clearTimer = null;

  // убираем отступы из текста, переносы строк оставляем
  const tidy = s => s.split('\n').map(l => l.trim()).join('\n').trim();

  // вертикальный проект: картинка слева, текст справа
  const setPortrait = on => panel.classList.toggle('is-portrait', on);

  function open(card) {
    clearTimeout(clearTimer);
    lastFocus = card;
    const caps = card.querySelectorAll('.cap > span');
    const more = card.querySelector('.more');
    titleEl.textContent = card.dataset.title || (caps[0] ? caps[0].textContent.trim() : '');
    textEl.textContent  = more ? tidy(more.textContent) : (caps[1] ? caps[1].textContent.trim() : '');

    mediaEl.replaceChildren();
    mediaEl.classList.remove('is-empty');
    mediaEl.style.aspectRatio = '';

    // сразу берём пропорции карточки, чтобы окно не прыгало, пока грузится файл
    const box = card.querySelector('.media');
    const ratio = box && box.offsetHeight ? box.offsetWidth / box.offsetHeight : 1.5;
    setPortrait(ratio < 0.95);

    const src = card.dataset.media;
    if (src) {
      let el;
      if (VIDEO.test(src)) {
        el = makeVideo(src);
        el.controls = true;
        el.addEventListener('loadedmetadata', () => setPortrait(el.videoHeight > el.videoWidth * 1.05), { once: true });
      } else {
        el = new Image();
        el.src = src;
        el.alt = titleEl.textContent;
        el.addEventListener('load', () => setPortrait(el.naturalHeight > el.naturalWidth * 1.05), { once: true });
      }
      el.addEventListener('error', () => {
        el.remove();
        mediaEl.classList.add('is-empty');
        mediaEl.style.aspectRatio = ratio;
      }, { once: true });
      mediaEl.appendChild(el);
      if (el.play) el.play().catch(() => {});
    }

    pop.classList.add('is-open');
    pop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBt.focus({ preventScroll: true });
  }

  function close() {
    pop.classList.remove('is-open');
    pop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // после исчезновения чистим окно (и останавливаем видео)
    clearTimer = setTimeout(() => mediaEl.replaceChildren(), 350);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  cards.forEach(card => card.addEventListener('click', () => open(card)));
  closeBt.addEventListener('click', close);
  pop.addEventListener('click', e => { if (e.target === pop) close(); });
  document.addEventListener('keydown', e => {
    if (!pop.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {                       // Tab не уходит за окно
      const f = [...pop.querySelectorAll('button, video[controls]')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
