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

  // Корень сайта = папка, где лежит site.js. От него считаются логотип и ссылки на главную,
  // поэтому шапка одинаково работает на / , /concept/ , /404.html и т.д.
  const ROOT = new URL('.', document.currentScript.src).pathname;

  /* ---------- НАСТРОЙКИ: ШАПКА ---------- */
  const HOME = ROOT;                  // адрес главной: «/» (без index.html)
  const LOGO = ROOT + 'img/logo.png';        // логотип слева
  // Пункты меню слева направо. target — id раздела на главной странице.
  const NAV = [
    { key: 'about',   text: 'обо мне', target: 'about' },
    { key: 'works',   text: 'работы',  target: 'works' },
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
        `<header class="header${home ? ' is-top' : ''}">` +
        `<a class="logo" href="${HOME}" aria-label="asyadefo"><img src="${LOGO}" alt="asyadefo"></a>` +
        `<nav class="nav" id="site-nav">${links}</nav>` +
        `<button class="burger" type="button" aria-label="Меню" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span></button>` +
        `</header>`;

      const hd = this.querySelector('.header');
      const bt = this.querySelector('.burger');

      // бургер (виден только на телефоне)
      const setOpen = o => {
        hd.classList.toggle('is-open', o);
        bt.setAttribute('aria-expanded', String(o));
        document.documentElement.classList.toggle('menu-open', o);
      };
      bt.addEventListener('click', () => setOpen(!hd.classList.contains('is-open')));
      this.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => setOpen(false)));
      document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
      window.matchMedia('(min-width: 701px)').addEventListener('change', e => { if (e.matches) setOpen(false); });

      if (home) {
        // логотип на главной: наверх, без «#top» в адресе
        this.querySelector('.logo').addEventListener('click', e => {
          e.preventDefault(); setOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          history.replaceState(null, '', location.pathname + location.search);
        });
        // на телефоне шапка прозрачная, пока над ней синий блок; потом становится белой
        const upd = () => {
          const hero = document.querySelector('.hero');
          hd.classList.toggle('is-top', !!hero && hero.getBoundingClientRect().bottom > hd.offsetHeight);
        };
        window.addEventListener('scroll', upd, { passive: true });
        window.addEventListener('resize', upd);
        document.addEventListener('DOMContentLoaded', upd);
        upd();
      }
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
        const target = window.innerWidth * (wide ? 0.6075 : 0.918);
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
