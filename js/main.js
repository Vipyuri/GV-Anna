/* ============================================================
   Лендинг консультанта по ГВ — main.js
   1) Отправка формы записи в Telegram-бота
   2) Lightbox для галереи дипломов
   3) Яндекс Метрика (подключается после вставки ID)
   ============================================================ */

// ======================= КОНФИГУРАЦИЯ =======================
// Заполните перед публикацией (см. README.md, раздел «Подключить форму»).
const CONFIG = {
  telegramBotToken: '', // токен бота от @BotFather, например '123456:ABC-DEF...'
  telegramChatId: '',   // ваш chat_id, узнайте у @userinfobot
  metricaId: '',        // номер счётчика Яндекс Метрики, например '12345678'
  telegramLink: 'https://t.me/username' // ссылка-фолбэк, если бот не настроен
};

// ======================= Яндекс Метрика =======================
// Раскомментируйте и вставьте номер счётчика — скрипт загрузится сам.
(function () {
  if (!CONFIG.metricaId) return;
  /* eslint-disable */
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
  (window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
  ym(CONFIG.metricaId, 'init', { clickmap: true, webvisor: true, accurateTrackBounce: true });
  /* eslint-enable */
})();

// Цель Метрики (безопасно вызывать даже без счётчика)
function reachGoal(goalId) {
  if (typeof window.ym === 'function' && CONFIG.metricaId) {
    window.ym(CONFIG.metricaId, 'reachGoal', goalId);
  }
}

// ======================= Форма записи =======================
(function () {
  const form = document.getElementById('lead-form');
  if (!form) return;
  const status = document.getElementById('form-status');

  function setStatus(text, ok) {
    status.textContent = text;
    status.className = 'lead-form__status ' + (ok ? 'lead-form__status--ok' : 'lead-form__status--err');
  }

  function sendMessage(text) {
    const url = 'https://api.telegram.org/bot' + CONFIG.telegramBotToken + '/sendMessage';
    const abort = new AbortController();
    const timer = setTimeout(function () { abort.abort(); }, 10000);
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.telegramChatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
      signal: abort.signal
    }).then(function (res) {
      if (!res.ok) throw new Error('Telegram API: ' + res.status);
      return res.json();
    }).finally(function () {
      clearTimeout(timer);
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // honeypot: бот заполнил скрытое поле — молча игнорируем
    if (form.company && form.company.value) return;

    if (!form.checkValidity()) {
      setStatus('Пожалуйста, заполните имя, контакт и подтвердите согласие.', false);
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляю…';

    const text =
      '<b>Новая заявка с сайта</b>\n' +
      'Имя: ' + form.name.value.trim() + '\n' +
      'Контакт: ' + form.contact.value.trim() + '\n' +
      'Способ связи: ' + form.method.value + '\n' +
      'Ситуация: ' + (form.situation.value.trim() || '—');

    sendMessage(text)
      .then(function () {
        reachGoal('form_submit');
        form.reset();
        setStatus('Спасибо! Отвечу в течение часа в рабочее время (8:00–21:00).', true);
      })
      .catch(function () {
        setStatus('Форма ещё не подключена. Напишите, пожалуйста, напрямую: ' + CONFIG.telegramLink, false);
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить заявку';
      });
  });

  // Цель: клик по кнопкам мессенджеров
  document.querySelectorAll('.messenger-cta .btn').forEach(function (btn) {
    btn.addEventListener('click', function () { reachGoal('messenger_click'); });
  });
})();

// ======================= Lightbox для дипломов =======================
(function () {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const img = document.getElementById('lightbox-img');
  const caption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close');

  function open(figure) {
    const source = figure.querySelector('img');
    if (!source) return;
    img.src = source.src;
    img.alt = source.alt;
    caption.textContent = figure.querySelector('figcaption')
      ? figure.querySelector('figcaption').textContent
      : source.alt;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.diploma-item').forEach(function (figure) {
    figure.addEventListener('click', function () { open(figure); });
    figure.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(figure); }
    });
    figure.tabIndex = 0;
    figure.setAttribute('role', 'button');
    figure.setAttribute('aria-label', 'Открыть документ: ' + (figure.querySelector('figcaption') ? figure.querySelector('figcaption').textContent : ''));
  });

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lightbox.hidden) close();
  });
})();
