const dictionaries = {
  uk: {
    'meta.title': 'Brick Rigs Web — гараж і міні-пісочниця',
    'meta.description':
      'Неофіційний браузерний гараж Brick Rigs: відкрий свої .brv просто у вкладці, роздивись у 3D і покатай у міні-пісочниці. Повну гру можна стрімити з ПК.',
    'nav.garage': 'Гараж',
    'nav.drive': 'Покатати',
    'nav.full': 'Повна гра',
    'nav.faq': 'FAQ',
    'header.online': 'Працює локально',
    'hero.badge': 'Неофіційний браузерний гараж',
    'hero.title1': 'Твої цеглинки.',
    'hero.title2': 'Твій браузер.',
    'hero.subtitle':
      'Закинь файл .brv з Brick Rigs — роздивись свою машину в 3D і покатай її в міні-пісочниці. А повну гру можна стрімити з власного ПК прямо у вкладку.',
    'hero.drop': 'Закинути .brv',
    'hero.demo': 'Спробувати демо',
    'hero.note': 'Файли не завантажуються на сервер. Усе відбувається у твоєму браузері.',
    'hero.stat1': '0 завантажень',
    'hero.stat1label': 'файли залишаються у тебе',
    'hero.stat2': '3D + фізика',
    'hero.stat2label': 'перегляд і водіння',
    'hero.stat3': 'UA / EN',
    'hero.stat3label': 'дві мови інтерфейсу',
    'garage.kicker': 'Гараж',
    'garage.title': 'Відкрий своє творіння',
    'garage.subtitle':
      'Перетягни .brv, zip або цілу теку Brick Rigs. Якщо це тека гри — знайдемо файли машин і підкажемо, як запустити повну гру.',
    'drop.title': 'Перетягни файли сюди',
    'drop.subtitle': 'або натисни, щоб вибрати .brv, .zip чи теку гри',
    'drop.button': 'Вибрати файли',
    'drop.folder': 'Вибрати теку',
    'drop.hint': '.brv · .zip · тека Brick Rigs',
    'drop.local': 'Локально · без завантаження на сервер',
    'garage.emptyTitle': 'Тут з’явиться твоя машина',
    'garage.emptyText': 'Почни з демо або закинь власний .brv.',
    'garage.demoCar': 'Демо: спорткар',
    'garage.demoTruck': 'Демо: вантажівка',
    'garage.resetCamera': 'Скинути камеру',
    'garage.drive': 'Покатати',
    'garage.change': 'Інший файл',
    'garage.stats.bricks': 'Цеглинок',
    'garage.stats.size': 'Розмір',
    'garage.stats.types': 'Типів',
    'garage.stats.wheels': 'Коліс',
    'garage.stats.version': 'Версія',
    'garage.list': 'Знайдені машини',
    'garage.loading': 'Читаю .brv…',
    'garage.noWebgl': 'Схоже, WebGL недоступний. Перегляд 3D не працюватиме, але решта сторінки — так.',
    'garage.tooMany': 'Велика машина: увімкнено швидкий режим відображення.',
    'garage.fileLoaded': 'Завантажено',
    'garage.demoLoaded': 'Демо-машина',
    'game.detectedTitle': 'Знайдено теку Brick Rigs',
    'game.detectedText':
      'Це повна UE4-гра для ПК. Браузер не може запустити її .exe напряму — але ти можеш грати в неї у вкладці через хмарний геймінг або стрімінг зі свого ПК.',
    'game.foundBrv': 'Знайдено файлів .brv: {count}. Перший уже відкрито в гаражі.',
    'game.noBrv': 'Файлів .brv у цій теці не знайдено, але гру розпізнано.',
    'game.gfn': 'Відкрити GeForce NOW',
    'game.stream': 'Як стрімити з ПК',
    'drive.kicker': 'Міні-пісочниця',
    'drive.title': 'Покатай свою машину',
    'drive.subtitle':
      'Спрощена аркадна фізика: цеглинки не ламаються, але машина їде, повертає і розкидає ящики. Для справжньої фізики Brick Rigs — стрім з ПК.',
    'drive.start': 'Почати заїзд',
    'drive.exit': 'Вийти з заїзду',
    'drive.reset': 'Скинути машину',
    'drive.hint': 'WASD / стрілки · пробіл — гальмо · R — скинути · Esc — вийти',
    'drive.speed': 'Швидкість',
    'drive.distance': 'Дистанція',
    'drive.touchForward': 'Газ',
    'drive.touchBack': 'Назад',
    'drive.touchLeft': 'Ліворуч',
    'drive.touchRight': 'Праворуч',
    'drive.noVehicle': 'Спочатку відкрий .brv у гаражі.',
    'drive.ready': 'Машину завантажено. Натисни «Почати заїзд».',
    'full.kicker': 'Справжня гра',
    'full.title': 'Повна Brick Rigs у браузері',
    'full.subtitle':
      'Так, це можливо — але гру виконує не браузер, а твій ПК або хмарний сервер, який передає відео у вкладку. Ось два робочі шляхи.',
    'full.whyTitle': 'Чому не можна просто закинути .exe?',
    'full.why1': 'Brick Rigs — 64-бітна UE4-гра з DirectX 11. Браузер не виконує Windows .exe і не дає прямого доступу до GPU так, як Windows.',
    'full.why2': 'Це не ROM для емулятора: емулятори консолей не запускають ПК-гру. WebAssembly-версії гри не існує.',
    'full.why3': 'Єдиний спосіб грати саме в повну гру у вкладці — стрімінг з ПК або хмари. Файли при цьому залишаються у тебе.',
    'full.gfnTitle': 'GeForce NOW',
    'full.gfnBadge': 'Найшвидший старт',
    'full.gfnText':
      'Якщо Brick Rigs у тебе в Steam — відкрий GeForce NOW у браузері, підключи Steam і запускай гру. Нічого встановлювати не треба.',
    'full.gfnButton': 'Грати в GeForce NOW',
    'full.gfnNote': 'Потрібна власна копія гри в Steam. Доступність залежить від регіону та тарифу.',
    'full.mwTitle': 'MoonlightWeb',
    'full.mwBadge': 'Без підписки',
    'full.mwText':
      'MoonlightWeb ставиться на твій ігровий ПК і віддає його екран у будь-який браузер. Додай Brick Rigs як картку застосунку — і запускай з телефона, ноутбука чи телевізора.',
    'full.mwStep1': 'Завантаж і встанови MoonlightWeb на ПК, де встановлена Brick Rigs.',
    'full.mwStep2': 'Відкрий https://localhost у браузері на цьому ПК і прийми самопідписаний сертифікат.',
    'full.mwStep3': 'У Admin → Apps on this PC додай картку з командою нижче.',
    'full.mwStep4': 'Запусти гру з картки — або відкрий стрім з іншого пристрою в тій самій мережі.',
    'full.mwStep5': 'Для доступу ззовні увімкни Internet Access в адмінці MoonlightWeb (за бажанням).',
    'full.mwDownload': 'Завантажити MoonlightWeb',
    'full.mwOpen': 'Відкрити локальний стрім',
    'full.mwCommand': 'Команда для картки',
    'full.mwCommandHint':
      'Найпростіше — Steam-посилання. Якщо гра встановлена не через Steam, вкажи повний шлях до BrickRigs.exe у лапках.',
    'full.mwCopy': 'Скопіювати команду',
    'full.mwImage': 'Картинка для картки',
    'full.mwHost': 'Адреса твого ПК у мережі',
    'full.mwHostPlaceholder': '192.168.1.50',
    'full.mwOpenHost': 'Відкрити стрім',
    'full.mwQr': 'QR для телефона',
    'full.mwLanHint':
      'Дізнайся IP на ПК: Windows — ipconfig, Linux — ip a, macOS — ipconfig getifaddr en0. Пристрої мають бути в одній Wi-Fi/локальній мережі.',
    'full.mwWinCmd': 'Windows: ipconfig',
    'full.mwLinuxCmd': 'Linux: ip a',
    'full.mwMacCmd': 'macOS: ipconfig getifaddr en0',
    'full.mwNote': 'MoonlightWeb — сторонній відкритий проєкт (GPL-3.0), не пов’язаний з Fluppisoft.',
    'full.legal': 'Ти використовуєш власну легальну копію гри. Сайт не хостить і не розповсюджує файли Brick Rigs.',
    'faq.kicker': 'Питання',
    'faq.title': 'Коротко про головне',
    'faq.q1': 'Чи можна запустити справжню Brick Rigs з файлів у вкладці?',
    'faq.a1':
      'Ні. Це UE4-гра під Windows/Linux з DirectX 11, а не консольний ROM. Браузер не виконує .exe. Але ти можеш грати в неї через GeForce NOW або стрімінг зі свого ПК — це і є «браузерний» варіант.',
    'faq.q2': 'Що таке .brv?',
    'faq.a2':
      '.brv — файл машини Brick Rigs: цеглинки, їхні позиції, повороти, кольори та властивості. Цей сайт читає його локально і будує 3D-модель.',
    'faq.q3': 'Мої файли кудись надсилаються?',
    'faq.a3': 'Ні. Парсинг, 3D і фізика працюють у браузері. Немає ні завантаження на сервер, ні акаунта.',
    'faq.q4': 'Чи працює на телефоні?',
    'faq.a4':
      'Гараж і перегляд — так. У заїзді є екранні кнопки. Стрімінг повної гри теж працює з мобільного браузера, якщо ПК доступний у мережі.',
    'faq.q5': 'Чи це офіційний сайт Brick Rigs?',
    'faq.a5':
      'Ні, це неофіційний фанатський інструмент. Brick Rigs належить Fluppisoft. Сайт не пов’язаний з розробником.',
    'faq.q6': 'Які браузери підтримуються?',
    'faq.a6':
      'Сучасні Chrome, Edge, Firefox і Safari з WebGL2. Для стрімінгу — браузер із WebCodecs/WebRTC; найкраще працює Chrome або Edge.',
    'footer.disclaimer':
      'Неофіційний фанатський проєкт. Brick Rigs © Fluppisoft. Сайт не пов’язаний з розробником і не розповсюджує гру.',
    'footer.built': 'Зроблено з Three.js, cannon-es і любов’ю до цеглинок.',
    'footer.source': 'Код на GitHub',
    'common.copy': 'Копіювати',
    'common.copied': 'Скопійовано',
    'common.close': 'Закрити',
    'common.error': 'Помилка',
    'common.demo': 'Демо',
    'common.or': 'або',
    'common.loading': 'Зачекай…',
    'common.supported': 'Підтримується',
    'common.unsupported': 'Не підтримується',
    'toast.invalid': 'Не вдалося прочитати файл. Це точно .brv?',
    'toast.fileLoaded': 'Файл відкрито',
    'toast.filesLoaded': 'Відкрито файлів: {count}',
    'toast.copied': 'Скопійовано в буфер',
    'toast.noBrv': 'У файлах не знайдено .brv',
    'toast.zipError': 'Не вдалося розпакувати zip',
    'toast.hostRequired': 'Спочатку введи адресу ПК у мережі',
    'toast.tooBig': 'Файл завеликий для браузера',
    'toast.gameDetected': 'Знайдено теку Brick Rigs',
    'toast.webgl': 'WebGL недоступний — 3D вимкнено',
    'a11y.theme': 'Перемкнути тему',
    'a11y.lang': 'Змінити мову',
    'a11y.menu': 'Меню',
  },
  en: {
    'meta.title': 'Brick Rigs Web — garage & mini sandbox',
    'meta.description':
      'An unofficial Brick Rigs browser garage: open your .brv files in a tab, inspect them in 3D and drive them in a mini sandbox. Stream the full game from your PC.',
    'nav.garage': 'Garage',
    'nav.drive': 'Drive',
    'nav.full': 'Full game',
    'nav.faq': 'FAQ',
    'header.online': 'Runs locally',
    'hero.badge': 'Unofficial browser garage',
    'hero.title1': 'Your bricks.',
    'hero.title2': 'Your browser.',
    'hero.subtitle':
      'Drop a .brv file from Brick Rigs, inspect your build in 3D and drive it in a mini sandbox. The full game can be streamed from your own PC into a browser tab.',
    'hero.drop': 'Drop a .brv',
    'hero.demo': 'Try the demo',
    'hero.note': 'Files are never uploaded. Everything happens in your browser.',
    'hero.stat1': '0 uploads',
    'hero.stat1label': 'files stay with you',
    'hero.stat2': '3D + physics',
    'hero.stat2label': 'inspect and drive',
    'hero.stat3': 'UA / EN',
    'hero.stat3label': 'two interface languages',
    'garage.kicker': 'Garage',
    'garage.title': 'Open your creation',
    'garage.subtitle':
      'Drop a .brv, a zip, or an entire Brick Rigs folder. If it is the game folder, we will find vehicle files and point you to the full-game options.',
    'drop.title': 'Drop files here',
    'drop.subtitle': 'or click to choose a .brv, .zip or the game folder',
    'drop.button': 'Choose files',
    'drop.folder': 'Choose folder',
    'drop.hint': '.brv · .zip · Brick Rigs folder',
    'drop.local': 'Local · no server upload',
    'garage.emptyTitle': 'Your vehicle will appear here',
    'garage.emptyText': 'Start with a demo or drop your own .brv.',
    'garage.demoCar': 'Demo: sports car',
    'garage.demoTruck': 'Demo: truck',
    'garage.resetCamera': 'Reset camera',
    'garage.drive': 'Drive it',
    'garage.change': 'Another file',
    'garage.stats.bricks': 'Bricks',
    'garage.stats.size': 'Size',
    'garage.stats.types': 'Types',
    'garage.stats.wheels': 'Wheels',
    'garage.stats.version': 'Version',
    'garage.list': 'Found vehicles',
    'garage.loading': 'Reading .brv…',
    'garage.noWebgl': 'WebGL seems unavailable. 3D view will not work, but the rest of the page will.',
    'garage.tooMany': 'Large vehicle: fast display mode enabled.',
    'garage.fileLoaded': 'Loaded',
    'garage.demoLoaded': 'Demo vehicle',
    'game.detectedTitle': 'Brick Rigs folder detected',
    'game.detectedText':
      'This is the full PC UE4 game. A browser cannot run its .exe directly — but you can play it in a tab through cloud gaming or by streaming from your own PC.',
    'game.foundBrv': 'Found .brv files: {count}. The first one is already open in the garage.',
    'game.noBrv': 'No .brv files were found in this folder, but the game was recognised.',
    'game.gfn': 'Open GeForce NOW',
    'game.stream': 'How to stream from a PC',
    'drive.kicker': 'Mini sandbox',
    'drive.title': 'Drive your creation',
    'drive.subtitle':
      'Simplified arcade physics: bricks do not break, but the vehicle drives, steers and scatters crates. For real Brick Rigs physics, stream the full game.',
    'drive.start': 'Start driving',
    'drive.exit': 'Exit drive',
    'drive.reset': 'Reset vehicle',
    'drive.hint': 'WASD / arrows · Space to brake · R to reset · Esc to exit',
    'drive.speed': 'Speed',
    'drive.distance': 'Distance',
    'drive.touchForward': 'Gas',
    'drive.touchBack': 'Reverse',
    'drive.touchLeft': 'Left',
    'drive.touchRight': 'Right',
    'drive.noVehicle': 'Open a .brv in the garage first.',
    'drive.ready': 'Vehicle loaded. Press “Start driving”.',
    'full.kicker': 'The real game',
    'full.title': 'Full Brick Rigs in a browser',
    'full.subtitle':
      'Yes, it is possible — but the game runs on your PC or a cloud server, which sends video to the tab. Here are two working routes.',
    'full.whyTitle': 'Why can’t I just drop the .exe in?',
    'full.why1': 'Brick Rigs is a 64-bit UE4 game using DirectX 11. A browser cannot execute Windows .exe files or expose the GPU the way Windows does.',
    'full.why2': 'It is not a console ROM: console emulators do not run PC games. There is no WebAssembly build of the game.',
    'full.why3': 'The only way to play the actual game in a tab is streaming from a PC or the cloud. Your files stay with you.',
    'full.gfnTitle': 'GeForce NOW',
    'full.gfnBadge': 'Fastest start',
    'full.gfnText':
      'If you own Brick Rigs on Steam, open GeForce NOW in your browser, connect Steam and launch the game. Nothing to install.',
    'full.gfnButton': 'Play on GeForce NOW',
    'full.gfnNote': 'You need your own Steam copy. Availability depends on region and plan.',
    'full.mwTitle': 'MoonlightWeb',
    'full.mwBadge': 'No subscription',
    'full.mwText':
      'MoonlightWeb runs on your gaming PC and streams its screen to any browser. Add Brick Rigs as an app card and launch it from a phone, laptop or TV.',
    'full.mwStep1': 'Download and install MoonlightWeb on the PC where Brick Rigs is installed.',
    'full.mwStep2': 'Open https://localhost in a browser on that PC and accept the self-signed certificate.',
    'full.mwStep3': 'In Admin → Apps on this PC, add a card with the command below.',
    'full.mwStep4': 'Launch the game from the card — or open the stream from another device on the same network.',
    'full.mwStep5': 'For access outside your network, enable Internet Access in MoonlightWeb admin (optional).',
    'full.mwDownload': 'Download MoonlightWeb',
    'full.mwOpen': 'Open local stream',
    'full.mwCommand': 'App card command',
    'full.mwCommandHint':
      'The easiest option is the Steam link. If the game is not from Steam, use the full quoted path to BrickRigs.exe.',
    'full.mwCopy': 'Copy command',
    'full.mwImage': 'Card image',
    'full.mwHost': 'Your PC address on the network',
    'full.mwHostPlaceholder': '192.168.1.50',
    'full.mwOpenHost': 'Open stream',
    'full.mwQr': 'QR for your phone',
    'full.mwLanHint':
      'Find the IP on the PC: Windows — ipconfig, Linux — ip a, macOS — ipconfig getifaddr en0. Devices must be on the same Wi-Fi/LAN.',
    'full.mwWinCmd': 'Windows: ipconfig',
    'full.mwLinuxCmd': 'Linux: ip a',
    'full.mwMacCmd': 'macOS: ipconfig getifaddr en0',
    'full.mwNote': 'MoonlightWeb is a third-party open-source project (GPL-3.0), not affiliated with Fluppisoft.',
    'full.legal': 'Use your own legal copy of the game. This site does not host or distribute Brick Rigs files.',
    'faq.kicker': 'Questions',
    'faq.title': 'The short version',
    'faq.q1': 'Can the real Brick Rigs run from files in a tab?',
    'faq.a1':
      'No. It is a Windows/Linux UE4 game with DirectX 11, not a console ROM. Browsers do not execute .exe files. You can still play it through GeForce NOW or by streaming from your PC — that is the browser route.',
    'faq.q2': 'What is a .brv file?',
    'faq.a2':
      'A .brv is a Brick Rigs vehicle file: bricks, positions, rotations, colours and properties. This site reads it locally and builds a 3D model.',
    'faq.q3': 'Are my files uploaded anywhere?',
    'faq.a3': 'No. Parsing, 3D and physics run in the browser. There is no server upload and no account.',
    'faq.q4': 'Does it work on a phone?',
    'faq.a4':
      'Garage and viewing — yes. Drive mode has on-screen buttons. Full-game streaming also works from a mobile browser if your PC is reachable.',
    'faq.q5': 'Is this an official Brick Rigs site?',
    'faq.a5':
      'No, it is an unofficial fan tool. Brick Rigs belongs to Fluppisoft. This site is not affiliated with the developer.',
    'faq.q6': 'Which browsers are supported?',
    'faq.a6':
      'Modern Chrome, Edge, Firefox and Safari with WebGL2. For streaming, use a browser with WebCodecs/WebRTC; Chrome or Edge works best.',
    'footer.disclaimer':
      'Unofficial fan project. Brick Rigs © Fluppisoft. Not affiliated with the developer and does not distribute the game.',
    'footer.built': 'Built with Three.js, cannon-es and a love of bricks.',
    'footer.source': 'Source on GitHub',
    'common.copy': 'Copy',
    'common.copied': 'Copied',
    'common.close': 'Close',
    'common.error': 'Error',
    'common.demo': 'Demo',
    'common.or': 'or',
    'common.loading': 'Loading…',
    'common.supported': 'Supported',
    'common.unsupported': 'Unsupported',
    'toast.invalid': 'Could not read the file. Is it really a .brv?',
    'toast.fileLoaded': 'File loaded',
    'toast.filesLoaded': 'Loaded files: {count}',
    'toast.copied': 'Copied to clipboard',
    'toast.noBrv': 'No .brv files found',
    'toast.zipError': 'Could not unzip the file',
    'toast.hostRequired': 'Enter your PC address on the network first',
    'toast.tooBig': 'File is too large for the browser',
    'toast.gameDetected': 'Brick Rigs folder detected',
    'toast.webgl': 'WebGL unavailable — 3D disabled',
    'a11y.theme': 'Toggle theme',
    'a11y.lang': 'Switch language',
    'a11y.menu': 'Menu',
  },
};

let current = 'uk';
const listeners = new Set();

export function getLang() {
  return current;
}

export function t(key, vars = {}) {
  const dictionary = dictionaries[current] || dictionaries.uk;
  let value = dictionary[key] ?? dictionaries.uk[key] ?? key;
  for (const [name, replacement] of Object.entries(vars)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

export function setLang(lang, { persist = true } = {}) {
  current = lang === 'en' ? 'en' : 'uk';
  if (persist) {
    try {
      localStorage.setItem('brick-rigs-lang', current);
    } catch {
      // Private mode: ignore.
    }
  }
  document.documentElement.lang = current;
  applyTranslations();
  for (const listener of listeners) listener(current);
}

export function initLang() {
  let saved = null;
  try {
    saved = localStorage.getItem('brick-rigs-lang');
  } catch {
    saved = null;
  }
  // Ukrainian is the default interface language; English is one click away.
  current = saved === 'en' || saved === 'uk' ? saved : 'uk';
  document.documentElement.lang = current;
}

export function onLangChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function applyTranslations(root = document) {
  for (const element of root.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of root.querySelectorAll('[data-i18n-placeholder]')) {
    element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
  }
  for (const element of root.querySelectorAll('[data-i18n-title]')) {
    element.setAttribute('title', t(element.dataset.i18nTitle));
  }
  for (const element of root.querySelectorAll('[data-i18n-aria]')) {
    element.setAttribute('aria-label', t(element.dataset.i18nAria));
  }
  const title = t('meta.title');
  document.title = title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', t('meta.description'));
}

export function createTranslator() {
  return t;
}
