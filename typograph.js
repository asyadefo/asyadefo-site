/* =====================================================
   ТИПОГРАФ: никаких висячих предлогов
   Короткие слова (в, на, и, не, для, что …) склеиваются со следующим
   неразрывным пробелом, поэтому не остаются в конце строки.
   Текст при этом не двигается: меняются только пробелы.
   Работает на всех страницах, в том числе в попапе архива (window.typo).
   Нужно добавить слово в список — допиши его через | в WORDS.
   ===================================================== */
(() => {
  const WORDS = 'в|во|на|к|ко|с|со|у|о|об|обо|от|до|из|за|по|при|про|для|без|над|под|перед|между|через|и|а|но|да|же|бы|ли|не|ни|как|что|или|то';
  const NB = '\u00a0';
  const re = new RegExp('(?<![\\p{L}\\p{N}\\-])(' + WORDS + ')[ \\t\\r\\n]+(?=\\S|$)', 'giu');

  function typo(s) {
    return s
      .replace(re, (m, w) => w + NB)
      .replace(/[ \t\r\n]+(—|–)(?=[\s\u00a0])/g, NB + '$1');   // тире не отрывается от слова слева
  }
  window.typo = typo;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
      return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => { const v = typo(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; });
})();
