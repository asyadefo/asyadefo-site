/* =====================================================
   ОБЩИЕ ЧАСТИ САЙТА: шапка и подвал
   --------------------------------------------------
   Шапка и подвал одинаковые на каждой странице, поэтому они лежат здесь,
   в одном месте. Поправишь тут — поменяется на всех страницах сразу.

   Как подключить на странице:
   1) в <head> одна строка:        <script src="site.js"></script>
   2) в <body> вместо шапки:       <site-header active="works"></site-header>
   3) в самом низу вместо подвала: <site-footer></site-footer>

   active — какой пункт меню подчёркнут: about | works | archive | contact
            (пусто = ничего не подчёркнуто)
   home   — ставь только на главной странице: тогда ссылки меню просто
            прокручивают её вниз, а не открывают страницу заново
   ===================================================== */
(() => {

  /* ---------- НАСТРОЙКИ: ШАПКА ---------- */
  const HOME = 'index.html';          // файл главной страницы
  const LOGO = 'img/logo.png';        // логотип слева
  // Пункты меню слева направо. target — id раздела на главной странице.
  const NAV = [
    { key: 'about',   text: 'обо мне', target: 'about' },
    { key: 'works',   text: 'работы',  target: 'portfolio-works' },
    { key: 'archive', text: 'архив',   target: 'archive' },
    { key: 'contact', text: 'связь',   target: 'contact' },   // «связь» всегда ведёт вниз, в подвал
  ];

  /* ---------- НАСТРОЙКИ: ПОДВАЛ ---------- */
  const WORDMARK  = 'asyadefo';                                // большая надпись
  const COPYRIGHT = '© asyadefo 2026. all rights reserved.';
  const CONTACTS = [
    // label — слово слева, text — что написано, href — куда ведёт, underline:false — без подчёркивания
    { label: 'почта',    text: 'asyadefo@mail.ru',  href: 'mailto:asyadefo@mail.ru',        underline: false },
    { label: 'канал',    text: '@asyadefo_channel', href: 'https://t.me/asyadefo_channel' },
    { label: 'телеграм', text: '@asyadefo',         href: 'https://t.me/asyadefo' },
  ];


  /* ---------- ШАПКА (не трогать) ---------- */
  class SiteHeader extends HTMLElement {
    connectedCallback() {
      const home = this.hasAttribute('home');
      const active = this.getAttribute('active') || '';
      const url = t => t === 'contact' ? '#contact' : (home ? '#' + t : HOME + '#' + t);
      const links = NAV.map(n =>
        `<a href="${url(n.target)}"${n.key === active ? ' class="active"' : ''}>${n.text}</a>`).join('');
      this.innerHTML =
        `<header class="header">` +
        `<a class="logo" href="${home ? '#top' : HOME}" aria-label="asyadefo"><img src="${LOGO}" alt="asyadefo"></a>` +
        `<nav class="nav">${links}</nav>` +
        `<button class="burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="site-menu"><span></span><span></span></button>` +
        `</header>` +
        // меню на телефоне: открывается по кнопке-бургеру (на компьютере не видно)
        `<div class="menu" id="site-menu" aria-hidden="true"><nav class="menu__nav">${links}</nav>` +
        `<p class="menu__foot">${CONTACTS.map(c => `<a href="${c.href}">${c.text}</a>`).join('')}</p></div>`;

      const root = document.documentElement;
      const btn = this.querySelector('.burger'), menu = this.querySelector('.menu');
      const setOpen = open => {
        root.classList.toggle('menu-open', open);
        btn.setAttribute('aria-expanded', open);
        menu.setAttribute('aria-hidden', !open);
      };
      btn.addEventListener('click', () => setOpen(!root.classList.contains('menu-open')));
      menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
      window.matchMedia('(min-width: 701px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
    }
  }

  /* ---------- ПОДВАЛ (не трогать) ---------- */
  class SiteFooter extends HTMLElement {
    connectedCallback() {
      // сюда ведут все кнопки «связаться». На главной свой блок «связь» уже есть, там подвал id не берёт
      if (!document.getElementById('contact')) this.id = 'contact';
      const rows = CONTACTS.map(c => {
        const ext = /^https?:/.test(c.href) ? ' target="_blank" rel="noopener"' : '';
        const cls = c.underline === false ? ' class="plain"' : '';
        return `<li><span>${c.label}</span><a href="${c.href}"${cls}${ext}>${c.text}</a></li>`;
      }).join('');
      this.innerHTML =
        `<footer class="footer">` +
        `<div class="footer__mark"><span aria-label="${WORDMARK}">${WORDMARK}</span></div>` +
        `<div class="footer__info"><ul class="footer__list">${rows}</ul>` +
        `<p class="footer__copy">${COPYRIGHT}</p></div></footer>`;

      // большая надпись растягивается до нужной ширины (≈ 61% экрана, на телефоне — на всю ширину)
      const mark = this.querySelector('.footer__mark span');
      const fit = () => {
        const wide = window.matchMedia('(min-width: 701px)').matches;
        const target = window.innerWidth * (wide ? 0.6075 : 0.9);
        mark.style.fontSize = '100px';
        const w = mark.getBoundingClientRect().width;
        if (w) mark.style.fontSize = (100 * target / w) + 'px';
      };
      fit();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
      window.addEventListener('resize', fit);
    }
  }

  customElements.define('site-header', SiteHeader);
  customElements.define('site-footer', SiteFooter);

  /* ---------- СТРАНИЦЫ ПРОЕКТОВ: галерея ---------- */
  // Если файла картинки/видео ещё нет — вместо битой иконки серая заглушка
  document.addEventListener('error', e => {
    const t = e.target;
    if (t && (t.tagName === 'IMG' || t.tagName === 'VIDEO') && t.closest && t.closest('.case-gallery')) {
      t.classList.add('is-missing');
    }
  }, true);

  // Видео в галерее играют, пока видны на экране, и стоят, когда их не видно
  document.addEventListener('DOMContentLoaded', () => {
    const vids = document.querySelectorAll('.case-gallery video');
    if (!vids.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); });
    }, { rootMargin: '120px' });
    vids.forEach(v => { v.muted = true; io.observe(v); });
  });
})();
