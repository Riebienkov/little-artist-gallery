export type Language = 'uk' | 'de' | 'en';

export interface Translations {
  // Navigation & Branding
  siteTitle: string;
  gallerySubtitle: string;
  navGallery: string;
  navPuzzle: string;
  navParents: string;
  starsCount: string;
  
  // Hero Section
  badgeDaily: string;
  heroTitle: string;
  heroDesc: string;
  btnViewDrawings: string;
  btnPlayPuzzle: string;
  statArtworks: string;
  statStarsGiven: string;

  // Gallery
  vernissageTitle: string;
  vernissageSubtitle: string;
  categories: {
    all: string;
    animals: string;
    fairytales: string;
    space: string;
    family: string;
    nature: string;
    other: string;
  };
  emptyCategory: string;
  zoomIn: string;
  childStoryLabel: string;
  btnPuzzle: string;
  btnWords: string;

  // Modal
  mediaTabs: {
    original: string;
    aiVariations: string;
    video: string;
  };
  btnRotate: string;
  btnAssemblePuzzle: string;
  warmWordsTitle: string;
  chooseSticker: string;
  namePlaceholder: string;
  commentPlaceholder: string;
  btnSend: string;
  sending: string;
  commentSuccess: string;
  noCommentsYet: string;
  
  // Quick Stickers
  stickers: {
    masterpiece: string;
    magical: string;
    fairytale: string;
    withLove: string;
    cosmic: string;
  };

  // Puzzle Game
  puzzleTitle: string;
  backToGallery: string;
  selectDrawing: string;
  difficultyLabel: string;
  diffEasy: string;
  diffMedium: string;
  diffHard: string;
  btnHint: string;
  btnHideHint: string;
  btnShuffle: string;
  puzzleGuide: string;
  movesLabel: string;
  congratsTitle: string;
  congratsDesc: string;
  btnPlayAgain: string;
  btnAllDrawings: string;

  // Admin
  adminTitle: string;
  adminSubtitle: string;
  adminPinPrompt: string;
  adminPinPlaceholder: string;
  adminEnterBtn: string;
  adminLogout: string;
  tabUpload: string;
  tabBatch: string;
  tabDuplicates: string;
  tabComments: string;
  tabManage: string;
  uploadTitle: string;
  uploadSuccessMsg: string;
  drawingTitleLabel: string;
  drawingTitlePlaceholder: string;
  dateLabel: string;
  categoryLabel: string;
  storyLabel: string;
  storyPlaceholder: string;
  btnPublish: string;
  btnRotate90: string;
  derivativeSectionTitle: string;
  derivativeAddAiImage: string;
  derivativeAddVideo: string;
  pendingBadge: string;
  btnApprove: string;
  btnDelete: string;
  alreadyApprovedTitle: string;
  allArtworksTitle: string;
}

export const translations: Record<Language, Translations> = {
  uk: {
    siteTitle: 'Казкова Майстерня',
    gallerySubtitle: 'Галерея художниці Тетяни (Тані) 🌸',
    navGallery: 'Галерея',
    navPuzzle: 'Пазли 🧩',
    navParents: 'Батькам',
    starsCount: 'зірочок',
    
    badgeDaily: 'Щоденна виставка малюнків',
    heroTitle: 'Острівець фантазії та яскравих фарб Тані 🎨',
    heroDesc: 'Тут живуть сонячні котики, чарівні зіркові квіти та космічні ракети. Даруйте зірочки улюбленим роботам та залишайте теплі побажання маленькій авторці!',
    btnViewDrawings: 'Дивитися малюнки',
    btnPlayPuzzle: 'Скласти пазл 🧩',
    statArtworks: 'робіт у колекції',
    statStarsGiven: 'подарованих зірочок',

    vernissageTitle: 'Вернісаж малюнків',
    vernissageSubtitle: 'Натисніть на малюнок, щоб роздивитися ближче та дізнатися його історію',
    categories: {
      all: 'Всі',
      animals: 'Тваринки',
      fairytales: 'Казки',
      space: 'Космос',
      family: 'Родина',
      nature: 'Природа',
      other: 'Інше',
    },
    emptyCategory: 'У цій категорії поки що немає малюнків. Зазирніть в іншу категорію або додайте новий через панель батьків! 🎨',
    zoomIn: 'Роздивитися ближче',
    childStoryLabel: 'Що розповіла художниця:',
    btnPuzzle: 'Пазл',
    btnWords: 'Слова',

    mediaTabs: {
      original: '🎨 Оригінальний малюнок',
      aiVariations: '✨ Ожилий AI-арт',
      video: '🎬 Відео-анімація',
    },
    btnRotate: 'Обернути ↻',
    btnAssemblePuzzle: 'Зібрати пазл',
    warmWordsTitle: 'Книга теплих слів та побажань',
    chooseSticker: 'Оберіть чарівну наліпку:',
    namePlaceholder: "Ваше ім'я (напр. Бабуся, Оля, Марк)",
    commentPlaceholder: 'Напишіть кілька добрих слів для Тані...',
    btnSend: 'Надіслати',
    sending: 'Надсилаю...',
    commentSuccess: 'Дякуємо! Ваше тепле побажання надіслано і незабаром з’явиться тут після перегляду батьками. 🌸',
    noCommentsYet: 'Поки що немає відгуків. Станьте першим, хто подарує тепле слово! ✨',

    stickers: {
      masterpiece: 'Шедевр!',
      magical: 'Чарівно!',
      fairytale: 'Казково!',
      withLove: 'З любов’ю',
      cosmic: 'Космічно!',
    },

    puzzleTitle: 'Чарівний Пазл',
    backToGallery: 'До галереї',
    selectDrawing: 'Оберіть малюнок:',
    difficultyLabel: 'Шматочки:',
    diffEasy: '4 (Легко)',
    diffMedium: '6 (Цікаво)',
    diffHard: '9 (Майстер)',
    btnHint: 'Підказка',
    btnHideHint: 'Сховати підказку',
    btnShuffle: 'Перемішати',
    puzzleGuide: '💡 Натисніть на два шматочки, щоб поміняти їх місцями!',
    movesLabel: 'Ходів',
    congratsTitle: 'Ура! Шедевр зібрано! 🎉',
    congratsDesc: 'Ви чудово впоралися!',
    btnPlayAgain: 'Зібрати ще раз',
    btnAllDrawings: 'Всі малюнки',

    adminTitle: 'Керування майстернею',
    adminSubtitle: 'Додавайте нові малюнки, похідні анімації та переглядайте побажання',
    adminPinPrompt: 'Введіть PIN-код для входу в панель батьків',
    adminPinPlaceholder: 'PIN-код (напр. 2026)',
    adminEnterBtn: 'Увійти до панелі ✨',
    adminLogout: 'Вийти',
    tabUpload: 'Один малюнок',
    tabBatch: 'Масове завантаження',
    tabDuplicates: 'Пошук дублікатів',
    tabComments: 'Модерація побажань',
    tabManage: 'Усі малюнки',
    uploadTitle: 'Опублікувати новий малюнок',
    uploadSuccessMsg: 'Малюнок успішно додано до галереї! 🎉',
    drawingTitleLabel: 'Назва малюнка:',
    drawingTitlePlaceholder: 'наприклад: Зіркова Гілочка',
    dateLabel: 'Дата створення:',
    categoryLabel: 'Категорія:',
    storyLabel: 'Що розповіла Таня про цей малюнок?:',
    storyPlaceholder: '«Ця зірочка світить уночі маленьким котикам...»',
    btnPublish: 'Опублікувати в галереї! ✨',
    btnRotate90: '↻ Обернути на 90°',
    derivativeSectionTitle: 'Похідні матеріали (AI арт та Відео):',
    derivativeAddAiImage: '+ Додати AI-малюнок',
    derivativeAddVideo: '+ Додати відео-анімацію',
    pendingBadge: 'Очікують схвалення',
    btnApprove: 'Схвалити',
    btnDelete: 'Видалити',
    alreadyApprovedTitle: '✓ Уже опубліковані побажання:',
    allArtworksTitle: 'Список усіх робіт у галереї',
  },

  de: {
    siteTitle: 'Tanjas Zauberwerkstatt',
    gallerySubtitle: 'Kunstgalerie von Tanja 🌸',
    navGallery: 'Galerie',
    navPuzzle: 'Puzzle 🧩',
    navParents: 'Für Eltern',
    starsCount: 'Sterne',

    badgeDaily: 'Tägliche Zeichnungsausstellung',
    heroTitle: 'Tanjas bunte Fantasiewelt 🎨',
    heroDesc: 'Hier leben sonnige Kätzchen, zauberhafte Sternenblumen und bunte Raketen. Verschenkt Sterne und hinterlasst liebe Wünsche für die kleine Künstlerin!',
    btnViewDrawings: 'Zeichnungen ansehen',
    btnPlayPuzzle: 'Puzzle spielen 🧩',
    statArtworks: 'Kunstwerke in der Galerie',
    statStarsGiven: 'verschenkte Zaubersterne',

    vernissageTitle: 'Gemäldegalerie',
    vernissageSubtitle: 'Klicke auf ein Bild, um es groß zu sehen und seine Geschichte zu entdecken',
    categories: {
      all: 'Alle',
      animals: 'Tiere',
      fairytales: 'Märchen',
      space: 'Weltall',
      family: 'Familie',
      nature: 'Natur',
      other: 'Sonstiges',
    },
    emptyCategory: 'In dieser Kategorie gibt es noch keine Bilder. Wähle eine andere oder füge ein neues Bild hinzu! 🎨',
    zoomIn: 'Großansicht',
    childStoryLabel: 'Was Tanja dazu erzählt hat:',
    btnPuzzle: 'Puzzle',
    btnWords: 'Wünsche',

    mediaTabs: {
      original: '🎨 Originalzeichnung',
      aiVariations: '✨ AI-Variationen',
      video: '🎬 Video-Animation',
    },
    btnRotate: 'Drehen ↻',
    btnAssemblePuzzle: 'Als Puzzle legen',
    warmWordsTitle: 'Buch der lieben Wünsche',
    chooseSticker: 'Wähle einen Zaubersticker:',
    namePlaceholder: 'Dein Name (z.B. Oma, Mama, Mark)',
    commentPlaceholder: 'Schreibe ein paar liebe Worte für Tanja...',
    btnSend: 'Absenden',
    sending: 'Wird gesendet...',
    commentSuccess: 'Vielen Dank! Dein lieber Wunsch wurde eingereicht und erscheint nach kurzer elterlicher Freigabe. 🌸',
    noCommentsYet: 'Noch keine Wünsche da. Sei der Erste, der ein liebes Wort schenkt! ✨',

    stickers: {
      masterpiece: 'Meisterwerk!',
      magical: 'Zauberhaft!',
      fairytale: 'Märchenhaft!',
      withLove: 'Mit Liebe',
      cosmic: 'Galaktisch!',
    },

    puzzleTitle: 'Zauber-Puzzle',
    backToGallery: 'Zur Galerie',
    selectDrawing: 'Bild auswählen:',
    difficultyLabel: 'Teile:',
    diffEasy: '4 (Leicht)',
    diffMedium: '6 (Mittel)',
    diffHard: '9 (Schwer)',
    btnHint: 'Hinweis',
    btnHideHint: 'Hinweis verbergen',
    btnShuffle: 'Mischen',
    puzzleGuide: '💡 Klicke auf zwei Teile, um ihre Plätze zu tauschen!',
    movesLabel: 'Züge',
    congratsTitle: 'Hurra! Puzzle fertig! 🎉',
    congratsDesc: 'Du hast das Bild wunderbar zusammengesetzt!',
    btnPlayAgain: 'Noch einmal spielen',
    btnAllDrawings: 'Alle Zeichnungen',

    adminTitle: 'Werkstatt-Verwaltung',
    adminSubtitle: 'Neue Zeichnungen hochladen, Animationen verwalten und Gästewünsche freigeben',
    adminPinPrompt: 'PIN-Code für den Elternbereich eingeben',
    adminPinPlaceholder: 'PIN-Code (z.B. 2026)',
    adminEnterBtn: 'Anmelden ✨',
    adminLogout: 'Abmelden',
    tabUpload: 'Einzelbild',
    tabBatch: 'Stapel-Upload',
    tabDuplicates: 'Duplikate',
    tabComments: 'Wünsche prüfen',
    tabManage: 'Alle Bilder',
    uploadTitle: 'Neues Kunstwerk veröffentlichen',
    uploadSuccessMsg: 'Bild erfolgreich zur Galerie hinzugefügt! 🎉',
    drawingTitleLabel: 'Titel des Bildes:',
    drawingTitlePlaceholder: 'z.B. Zauberhafter Sternenzweig',
    dateLabel: 'Erstellungsdatum:',
    categoryLabel: 'Kategorie:',
    storyLabel: 'Was Tanja zu diesem Bild erzählt hat:',
    storyPlaceholder: '«Dieser Stern leuchtet nachts für kleine Kätzchen...»',
    btnPublish: 'In Galerie veröffentlichen! ✨',
    btnRotate90: '↻ Um 90° drehen',
    derivativeSectionTitle: 'Zusatzmedien (KI-Kunst & Video):',
    derivativeAddAiImage: '+ KI-Bild hinzufügen',
    derivativeAddVideo: '+ Video-Animation hinzufügen',
    pendingBadge: 'Warten auf Freigabe',
    btnApprove: 'Freigeben',
    btnDelete: 'Löschen',
    alreadyApprovedTitle: '✓ Bereits freigegebene Wünsche:',
    allArtworksTitle: 'Alle Werke in der Galerie',
  },

  en: {
    siteTitle: "Tanya's Magical Studio",
    gallerySubtitle: 'Art Gallery of Tetiana (Tanya) 🌸',
    navGallery: 'Gallery',
    navPuzzle: 'Puzzle 🧩',
    navParents: 'Parents',
    starsCount: 'stars',

    badgeDaily: 'Daily Drawing Exhibition',
    heroTitle: "Tanya's World of Imagination & Colors 🎨",
    heroDesc: 'Sunny kittens, magical star flowers, and chocolate-planet rockets live here. Give stars to your favorite drawings and leave warm wishes for the little artist!',
    btnViewDrawings: 'View Drawings',
    btnPlayPuzzle: 'Play Puzzle 🧩',
    statArtworks: 'artworks in collection',
    statStarsGiven: 'magical stars awarded',

    vernissageTitle: 'Art Vernissage',
    vernissageSubtitle: 'Click on any drawing to view in full resolution and discover its story',
    categories: {
      all: 'All',
      animals: 'Animals',
      fairytales: 'Fairy Tales',
      space: 'Space',
      family: 'Family',
      nature: 'Nature',
      other: 'Other',
    },
    emptyCategory: 'No drawings in this category yet. Explore other categories or upload a new one via the parents panel! 🎨',
    zoomIn: 'Zoom in',
    childStoryLabel: 'What Tanya told about this drawing:',
    btnPuzzle: 'Puzzle',
    btnWords: 'Wishes',

    mediaTabs: {
      original: '🎨 Original Drawing',
      aiVariations: '✨ AI Variations',
      video: '🎬 Video Animation',
    },
    btnRotate: 'Rotate ↻',
    btnAssemblePuzzle: 'Play as Puzzle',
    warmWordsTitle: 'Book of Warm Wishes',
    chooseSticker: 'Pick a magical sticker:',
    namePlaceholder: 'Your name (e.g. Grandma, Dad, Mark)',
    commentPlaceholder: 'Write a few kind words for Tanya...',
    btnSend: 'Send',
    sending: 'Sending...',
    commentSuccess: 'Thank you! Your kind wish has been submitted and will appear shortly after parents review. 🌸',
    noCommentsYet: 'No wishes yet. Be the first to send a warm compliment! ✨',

    stickers: {
      masterpiece: 'Masterpiece!',
      magical: 'Magical!',
      fairytale: 'Fairytale!',
      withLove: 'With Love',
      cosmic: 'Cosmic!',
    },

    puzzleTitle: 'Magical Puzzle',
    backToGallery: 'Back to Gallery',
    selectDrawing: 'Select drawing:',
    difficultyLabel: 'Pieces:',
    diffEasy: '4 (Easy)',
    diffMedium: '6 (Fun)',
    diffHard: '9 (Master)',
    btnHint: 'Hint',
    btnHideHint: 'Hide Hint',
    btnShuffle: 'Shuffle',
    puzzleGuide: '💡 Click any two pieces to swap them!',
    movesLabel: 'Moves',
    congratsTitle: 'Hooray! Puzzle completed! 🎉',
    congratsDesc: 'You solved it wonderfully!',
    btnPlayAgain: 'Play Again',
    btnAllDrawings: 'All Drawings',

    adminTitle: 'Studio Management',
    adminSubtitle: 'Upload drawings, manage AI animations, and moderate visitor wishes',
    adminPinPrompt: 'Enter PIN code to access the parents panel',
    adminPinPlaceholder: 'PIN code (e.g. 2026)',
    adminEnterBtn: 'Enter Panel ✨',
    adminLogout: 'Log Out',
    tabUpload: 'Single Upload',
    tabBatch: 'Batch Upload',
    tabDuplicates: 'Duplicates',
    tabComments: 'Moderate Wishes',
    tabManage: 'All Drawings',
    uploadTitle: 'Publish a New Artwork',
    uploadSuccessMsg: 'Drawing successfully added to gallery! 🎉',
    drawingTitleLabel: 'Drawing Title:',
    drawingTitlePlaceholder: 'e.g. Magical Star Branch',
    dateLabel: 'Creation Date:',
    categoryLabel: 'Category:',
    storyLabel: 'What Tanya told about this drawing:',
    storyPlaceholder: '«This little star shines at night for sleepy kittens...»',
    btnPublish: 'Publish to Gallery! ✨',
    btnRotate90: '↻ Rotate 90°',
    derivativeSectionTitle: 'Derivative Media (AI Art & Video):',
    derivativeAddAiImage: '+ Add AI Image',
    derivativeAddVideo: '+ Add Video Animation',
    pendingBadge: 'Pending Approval',
    btnApprove: 'Approve',
    btnDelete: 'Delete',
    alreadyApprovedTitle: '✓ Published Wishes:',
    allArtworksTitle: 'All Artworks in Gallery',
  },
};
