(() => {
  'use strict';
  const { pages, lessons } = window.LIBRARY_CONTENT;
  const main = document.getElementById('main');
  const context = document.getElementById('header-context');
  const themeButton = document.getElementById('theme-toggle');
  const storage = {
    get(key) { try { return localStorage.getItem('tawhid.' + key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem('tawhid.' + key, String(value)); } catch { /* Reading works without storage. */ } }
  };
  const icons = {
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
    diagonal: '<path d="M6 18 18 6M6 6h12v12"/>',
    moon: '<path d="M20.7 13.1A8.7 8.7 0 0 1 10.9 3.3 8.8 8.8 0 1 0 20.7 13.1Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    bookmark: '<path d="M6 4h12v17l-6-4-6 4V4Z"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lessonUrl = (lesson, page) => `#/book/tawhid/lesson/${lesson.id}${page ? '?page=' + page : ''}`;
  const range = lesson => `с. ${lesson.start}–${lesson.end}`;
  let activeLesson = null;
  let navigationPointerDown = false;
  let scrollQueued = false;
  let fontSize = Number(storage.get('font-size')) || 28;
  fontSize = Math.min(38, Math.max(24, fontSize));
  document.documentElement.style.setProperty('--arabic-size', fontSize + 'px');

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
    const label = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1b221e' : '#f5f3ed';
    storage.set('theme', theme);
  }
  setTheme(storage.get('theme') === 'dark' ? 'dark' : 'light');
  themeButton.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

  function bookCover() {
    return `<div class="book-stage" aria-hidden="true"><div class="book"><div class="cover-frame" lang="ar" dir="rtl"><span class="cover-top">فتح المجيد</span><span class="cover-name">كتاب<br>التوحيد</span><span class="cover-rule"></span><span class="cover-bottom">شرح كتاب التوحيد</span></div></div></div>`;
  }
  function getPosition() {
    try {
      const saved = JSON.parse(storage.get('position'));
      const lesson = lessons.find(l => l.id === saved?.lesson);
      return lesson && saved.page >= lesson.start && saved.page <= lesson.end ? { lesson, page: saved.page } : null;
    } catch { return null; }
  }
  function libraryView() {
    const saved = getPosition();
    return `<div class="shell library-view"><div class="heading-row"><h1 class="view-title">Выберите книгу</h1><span class="count" aria-label="1 книга">1</span></div>
      <a class="book-card" href="#/book/tawhid" aria-label="Книга Таухида, 8 уроков, страницы 70–99">
        ${bookCover()}<div class="book-info"><p class="eyebrow">Единобожие</p><h2>Книга<br>Таухида</h2><p class="arabic-subtitle" lang="ar" dir="rtl">فتح المجيد</p><div class="book-meta"><span>8 уроков</span><i class="dot"></i><span>с. 70–99</span></div><div class="card-action"><span>Открыть книгу</span>${icon('diagonal')}</div></div>
      </a>${saved ? `<a class="resume" href="${lessonUrl(saved.lesson, saved.page)}">${icon('bookmark')}<span>Продолжить</span><strong>Урок ${saved.lesson.id}</strong><span>· с. ${saved.page}</span>${icon('arrow')}</a>` : ''}
    </div>`;
  }
  function lessonsView() {
    return `<div class="shell"><a class="back" href="#/">${icon('back')}<span>Библиотека</span></a>
      <div class="lessons-layout"><aside class="book-summary">${bookCover()}<h1 class="view-title">Книга Таухида</h1><p class="arabic-subtitle" lang="ar" dir="rtl">فتح المجيد</p><div class="summary-meta"><span>8 уроков</span><span>с. 70–99</span></div><a class="pdf-download book-pdf" href="./pdf/kitab-at-tawhid-70-99.pdf" download>${icon('download')}<span>Скачать PDF</span></a></aside>
      <section aria-labelledby="lesson-list-title"><div class="lesson-list-heading"><h2 id="lesson-list-title">Уроки</h2><span>01 — 08</span></div><div class="lesson-list">${lessons.map(l => `<a class="lesson-row" href="${lessonUrl(l)}"><span class="lesson-num">${String(l.id).padStart(2, '0')}</span><div><h3>${esc(l.title)}</h3><span class="page-range">${range(l)}</span></div>${icon('arrow')}</a>`).join('')}</div></section></div></div>`;
  }
  function lessonLinks(current) {
    return lessons.map(l => `<a class="nav-lesson${l.id === current.id ? ' active' : ''}" href="${lessonUrl(l)}"${l.id === current.id ? ' aria-current="page"' : ''}><span>${String(l.id).padStart(2, '0')}</span><div><strong>${esc(l.title)}</strong><small>${range(l)}</small></div></a>`).join('');
  }
  function readerView(lesson) {
    const previous = lessons[lesson.id - 2];
    const next = lessons[lesson.id];
    return `<div class="reader-progress" aria-hidden="true"><i></i></div><div class="reading-shell">
      <article class="reader"><a class="back reader-back" href="#/book/tawhid">${icon('back')}<span>Все уроки</span></a><details class="mobile-lessons"><summary><span>Книга Таухида · Урок ${lesson.id}</span>${icon('down')}</summary><nav class="mobile-list" aria-label="Выбрать урок"><a class="nav-lesson" href="#/book/tawhid">Все уроки</a>${lessonLinks(lesson)}</nav></details>
      <header class="reader-head"><p class="eyebrow">Урок ${String(lesson.id).padStart(2, '0')} / 08</p><h1>${esc(lesson.title)}</h1><div class="reader-head-bottom"><span class="page-range">Страницы ${lesson.start}–${lesson.end}</span><div class="reader-tools" role="group" aria-label="Настройки чтения и PDF"><a class="pdf-download" href="./pdf/lesson-${String(lesson.id).padStart(2, '0')}-${lesson.start}-${lesson.end}.pdf" download aria-label="Скачать PDF урока ${lesson.id}">${icon('download')}<span>PDF</span></a><button class="type-button" data-size="-2" aria-label="Уменьшить текст" title="Уменьшить текст">А−</button><button class="type-button large" data-size="2" aria-label="Увеличить текст" title="Увеличить текст">А+</button></div></div></header>
      <div class="reader-pages">${pages.filter(p => p.number >= lesson.start && p.number <= lesson.end).map(p => `<section class="reader-page" id="page-${p.number}" aria-label="Страница ${p.number}"><div class="page-marker"><a href="${lessonUrl(lesson, p.number)}" aria-label="Страница ${p.number}">${p.number}</a></div><div class="arabic-content" lang="ar" dir="rtl" data-source-page="${p.number}">${p.html}</div></section>`).join('')}</div>
      <nav class="reader-end" aria-label="Переход между уроками">${previous ? `<a class="lesson-step" href="${lessonUrl(previous)}"><span>← Урок ${previous.id}</span>${esc(previous.title)}</a>` : ''}${next ? `<a class="lesson-step" href="${lessonUrl(next)}"><span>Урок ${next.id} →</span>${esc(next.title)}</a>` : `<a class="lesson-step" href="#/book/tawhid"><span>Все уроки →</span>Книга Таухида</a>`}</nav></article></div>`;
  }
  function updateFontButtons() {
    const minus = main.querySelector('[data-size="-2"]');
    const plus = main.querySelector('[data-size="2"]');
    if (minus) minus.disabled = fontSize <= 24;
    if (plus) plus.disabled = fontSize >= 38;
  }
  function recordPosition() {
    if (!activeLesson || navigationPointerDown) return;
    const elements = Array.from(document.querySelectorAll('.reader-page'));
    let current = elements[0];
    for (const element of elements) if (element.getBoundingClientRect().top < window.innerHeight * .4) current = element;
    if (current) storage.set('position', JSON.stringify({ lesson: activeLesson.id, page: Number(current.id.slice(5)) }));
    const progress = document.querySelector('.reader-progress i');
    if (progress) {
      const article = document.querySelector('.reader-pages');
      const distance = article.getBoundingClientRect();
      progress.style.width = Math.min(100, Math.max(0, (window.innerHeight * .4 - distance.top) / Math.max(1, distance.height) * 100)) + '%';
    }
  }
  function render(initial = false) {
    const [route, query] = (location.hash.slice(1) || '/').split('?');
    const match = route.match(/^\/book\/tawhid\/lesson\/(\d+)$/);
    const lesson = match && lessons.find(l => l.id === Number(match[1]));
    activeLesson = lesson || null;
    document.body.dataset.view = lesson ? 'reader' : route === '/book/tawhid' ? 'lessons' : 'library';
    main.innerHTML = lesson ? readerView(lesson) : route === '/book/tawhid' ? lessonsView() : libraryView();
    context.innerHTML = route === '/' ? '' : '<span lang="ar" dir="rtl" style="font:21px Amiri,serif">كتاب التوحيد</span>';
    document.title = lesson ? `Урок ${lesson.id} · ${lesson.title} — Книга Таухида` : route === '/book/tawhid' ? 'Уроки · Книга Таухида' : 'Библиотека · Книга Таухида';
    updateFontButtons();
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!initial) main.focus({ preventScroll: true });
    const page = Number(new URLSearchParams(query).get('page'));
    if (lesson && page >= lesson.start && page <= lesson.end) {
      Promise.all([document.fonts.load('28px Amiri'), document.fonts.load('700 28px Amiri')]).then(() => document.fonts.ready).then(() => {
        if (activeLesson === lesson) document.getElementById('page-' + page)?.scrollIntoView({ behavior: 'instant' });
        recordPosition();
      });
    } else recordPosition();
  }
  main.addEventListener('click', event => {
    const button = event.target.closest('[data-size]');
    if (!button) return;
    fontSize = Math.min(38, Math.max(24, fontSize + Number(button.dataset.size)));
    document.documentElement.style.setProperty('--arabic-size', fontSize + 'px');
    storage.set('font-size', fontSize);
    updateFontButtons();
  });
  document.addEventListener('pointerdown', event => {
    const link = event.target.closest('a[href^="#/"]');
    if (link && link.hash !== location.hash && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) navigationPointerDown = true;
  }, true);
  document.addEventListener('pointerup', () => requestAnimationFrame(() => { navigationPointerDown = false; }), true);
  document.addEventListener('pointercancel', () => { navigationPointerDown = false; }, true);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#/"]');
    if (link && link.hash !== location.hash && activeLesson && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      // Freeze the reading position before native anchor navigation scrolls.
      activeLesson = null;
    }
  }, true);
  window.addEventListener('hashchange', () => render());
  window.addEventListener('scroll', () => {
    if (!activeLesson || scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { recordPosition(); scrollQueued = false; });
  }, { passive: true });
  render(true);
})();
