/* =====================================================
   ПЕЧАТЬ ТЕКСТА ПРИ СКРОЛЛЕ
   Когда текст появляется на экране, буквы проявляются по очереди,
   как будто их печатают. У последней буквы бежит палочка-курсор.
   ===================================================== */
(() => {

  /* ---------- НАСТРОЙКИ ---------- */
  const CHAR_MS  = 14;    // сколько миллисекунд на одну букву. Меньше = быстрее (10 — очень бодро, 25 — неспешно)
  const MAX_MS   = 1800;  // длинные тексты ускоряются и всё равно допечатываются не дольше, чем за это время
  const START_AT = 12;    // начинать, когда текст поднялся выше нижнего края экрана на столько % (больше = раньше)

  // Какие тексты печатать (любые CSS-селекторы через запятую)
  const TEXTS  = '.sub > div, .about p, .believe h3, .believe p, .work p';
  // Внутри одной группы тексты печатаются по очереди, разные группы — независимо
  const GROUPS = '.sub, .about, .believe, .work';

  /* ---------- ПОДГОТОВКА (не трогать) ---------- */

  // Тем, у кого в системе включено «уменьшить движение», показываем всё сразу
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('tw');

  // Разбиваем текст элемента на буквы. Теги (<br>, <small>, <span>) остаются на месте
  function split(el) {
    const chars = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      if (!node.nodeValue.trim()) return;
      const frag = document.createDocumentFragment();
      let space = '';
      const flush = () => {
        if (space) { frag.appendChild(document.createTextNode(space)); space = ''; }
      };
      for (const ch of node.nodeValue) {
        if (/\s/.test(ch)) { space += ch; continue; }
        flush();
        const s = document.createElement('span');
        s.className = 'tc';
        s.textContent = ch;
        frag.appendChild(s);
        chars.push(s);
      }
      flush();
      node.parentNode.replaceChild(frag, node);
    });
    return chars;
  }

  function show(ch) {
    ch.classList.add('on');
    const pill = ch.parentElement && ch.parentElement.closest('.pill');
    if (pill) pill.classList.add('show');
  }

  const items = new Map();
  document.querySelectorAll(TEXTS).forEach(el => {
    const chars = split(el);
    if (chars.length) {
      items.set(el, { el, chars, group: el.closest(GROUPS) || el });
    }
  });

  /* ---------- ПЕЧАТЬ ---------- */
  function play(item, done) {
    const n = item.chars.length;
    const step = Math.min(CHAR_MS, MAX_MS / n);
    const t0 = performance.now();
    let shown = 0;

    function frame(now) {
      const target = Math.min(n, Math.floor((now - t0) / step) + 1);
      while (shown < target) {
        if (shown) item.chars[shown - 1].classList.remove('caret');
        show(item.chars[shown]);
        item.chars[shown].classList.add('caret');
        shown++;
      }
      if (shown < n) {
        requestAnimationFrame(frame);
      } else {
        const last = item.chars[n - 1];
        setTimeout(() => last.classList.remove('caret'), 500);
        done();
      }
    }
    requestAnimationFrame(frame);
  }

  // очередь для каждой группы
  const queues = new Map();
  function enqueue(item) {
    let q = queues.get(item.group);
    if (!q) { q = { list: [], busy: false }; queues.set(item.group, q); }
    q.list.push(item);
    // в порядке расположения на странице
    q.list.sort((a, b) =>
      a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    next(q);
  }
  function next(q) {
    if (q.busy || !q.list.length) return;
    q.busy = true;
    play(q.list.shift(), () => { q.busy = false; next(q); });
  }

  /* ---------- СЛЕДИМ ЗА СКРОЛЛОМ ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const item = items.get(e.target);
      if (e.isIntersecting) {
        io.unobserve(e.target);
        enqueue(item);
      } else if (e.boundingClientRect.top < 0) {
        // страницу открыли уже прокрученной: то, что осталось выше, показываем сразу
        io.unobserve(e.target);
        item.chars.forEach(show);
      }
    });
  }, { rootMargin: `0px 0px -${START_AT}% 0px` });

  items.forEach(item => io.observe(item.el));
})();
