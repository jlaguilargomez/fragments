import { computed, ref, watch } from 'vue';

export type Locale = 'en' | 'es';

type TranslationKey = keyof typeof translations.en;
type TranslationParams = Record<string, string | number>;

const STORAGE_KEY = 'fragments-locale';

const translations = {
  en: {
    invalidInvitation: 'Invalid invitation code.',
    demoTitle: 'About this demo',
    demoDescription: 'You are using the Fragments demo version. It is designed to let you try the writing experience without creating an account or connecting to a server.',
    demoStorage: 'Your fragments are saved only in this browser, in local storage. They remain after reloading this page.',
    demoNoLogin: 'No login, email or password is required.',
    demoNoVoice: 'Voice capture and transcription are not available in the demo.',
    demoNoSync: 'Your demo fragments are not sent to Cloudflare, are not shared with anyone and do not sync with the premium version.',
    demoReset: 'To start again, clear the site data for this website in your browser. This permanently removes the demo fragments stored there.',
    demoLocalOnly: 'Keep your fragments in this browser only.',
    premiumTitle: 'About the premium version',
    premiumDescription: 'The premium version is the private, account-based version of Fragments for real use.',
    premiumStorage: 'Fragments are persisted in the Cloudflare D1 database and remain available when you return from another session or device.',
    premiumLogin: 'Login is required. Notes are encrypted in your browser using a key derived from your password.',
    premiumVoice: 'Premium includes voice recording and transcription through Cloudflare Workers AI.',
    premiumInvite: 'Access may require an invitation code when registration is restricted.',
    visualDemo: 'Visual demo · changes are temporary',
    trialMode: 'Trial · saved in this browser',
    help: 'Help',
    backToFragments: 'Back to fragments',
    signOut: 'Sign out',
    language: 'Language',
    english: 'English',
    spanish: 'Español',
    littleGuidance: 'A little guidance',
    helpIntro: 'A quiet place to put your thoughts down before you decide what to do with them.',
    whatIsFragments: 'What is Fragments?',
    fragmentsDescription: 'Fragments is a private notebook for thoughts that are not ready to become anything else yet. Save an idea, memory, task, reflection, observation, quote, or simply something you want to remember.',
    howUse: 'How do I use it?',
    howUseDescription: 'Start by writing whatever is on your mind; you can organise it later. Choose a day, add a title if you like, and save your fragment. Use the arrows to move between days, and edit or delete anything whenever you need to.',
    whatToday: 'What can I do here?',
    createText: 'Write a fragment and give it a title if you want one.',
    recordVoice: 'Record a short voice note and turn it into a text fragment.',
    browseByDay: 'Move through your fragments by day.',
    editOrDelete: 'Change or remove fragments whenever you like.',
    keepPrivate: 'Keep everything private to your account.',
    voiceNotes: 'Voice notes',
    voiceDescription: 'Voice capture works in supported browsers and needs permission to use your microphone. Recordings can last up to five minutes. The audio is sent for transcription and discarded afterwards; only the resulting text is saved.',
    voicePreview: 'Voice transcription is available in the deployed preview. Local development currently focuses on the text workflow.',
    notAvailable: 'What is not here yet?',
    noEmailRecovery: 'Email verification or password recovery.',
    noOrganisation: 'Tags, folders, contexts, or other ways to sort fragments.',
    noSearch: 'Search, semantic search, exports, sharing, or synchronisation.',
    noMobile: 'Mobile apps or notifications.',
    noAi: 'AI writing help beyond the current voice transcription.',
    mayComeNext: 'What might come next?',
    futureDescription: 'The idea is to add optional AI enrichment that keeps your voice, followed by simple contexts such as Work, Books, or Personal.',
    futureExperiments: 'Further experiments might explore search, links, and ways to turn fragments into longer pieces of writing. They are possibilities, not promises with a date.',
    privacy: 'Privacy and limitations',
    privacyDescription: 'Your note titles and contents are encrypted in the browser before they are stored. Your browser is the only place that can decrypt them with your password, so the API and database hold encrypted text rather than readable notes.',
    privacyWarning: 'Fragments belong to the account that created them. Your password is part of the encryption key, so losing it also means losing access to your encrypted notes. This is still an early technical preview, not a finished production service. For now, please use test content while the project evolves.',
    needToKnow: 'One thing to remember',
    needToKnowDescription: 'Fragments is made for getting thoughts out quickly, not for organising them perfectly. A fragment does not have to be complete, useful, or well written. If it feels worth keeping, that is enough.',
    dailyNotes: 'Daily notes',
    dateNavigation: 'Date navigation',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    today: 'Today',
    writeFragment: 'Write a fragment',
    fragmentsForDay: 'Fragments for this day',
    fragmentCount: '{count} {word}',
    fragmentSingular: 'fragment',
    fragmentPlural: 'fragments',
    openingPage: 'Opening the page…',
    nothingYet: 'Nothing here yet. Start with one small thought.',
    deleteConfirm: 'Delete this fragment?',
    couldNotLoad: 'Could not load your fragments.',
    couldNotSave: 'Could not save your fragment.',
    couldNotTranscribe: 'Could not transcribe your recording.',
    couldNotUpdate: 'Could not update your fragment.',
    couldNotDelete: 'Could not delete your fragment.',
    unlockNotes: 'Unlock your notes to continue.',
    fragmentNotFound: 'Fragment not found.',
    requestFailed: 'Request failed.',
    transcriptionFailed: 'Transcription failed.',
    authenticationRequired: 'Authentication required.',
    accountExists: 'An account with that email already exists.',
    invalidCredentials: 'Invalid email or password.',
    invalidRequest: 'Invalid request.',
    internalServerError: 'Internal server error.',
    unsupportedAudio: 'Unsupported audio format.',
    audioMissing: 'Audio is missing.',
    audioTooLarge: 'Audio is missing or too large.',
    noSpeech: 'No speech was detected.',
    voiceUnavailable: 'Voice transcription is currently unavailable.',
    privateNotebook: 'Private notebook',
    welcomeBack: 'Welcome back',
    makePrivateSpace: 'Make a private space',
    continueThoughts: 'Continue with your thoughts.',
    startCapturing: 'Start capturing thoughts without organising them first.',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 12 characters.',
    working: 'Working…',
    signIn: 'Sign in',
    createAccount: 'Create account',
    createNewAccount: 'Create a new account',
    alreadyHaveAccount: 'I already have an account',
    inviteCode: 'Invitation code',
    titleOptional: 'Title (optional)', captureOptions: 'Capture options', writeManually: 'Write manually', writeManuallyHint: 'Use the form and save your fragment.', recordAndTranscribe: 'Record and transcribe', recordAndTranscribeHint: 'Speak freely. We will turn it into a fragment.', voiceAlternative: 'Prefer to speak?', voiceAlternativeHint: 'Record a note and we will transcribe it.', backToWriting: 'Back to writing', voiceReadyTitle: 'Ready to record a voice fragment?', voiceReadyHint: 'The audio is transcribed and discarded after processing.', startRecording: 'Start recording', transcribingHint: 'Your fragment will appear in the list in a moment.',
    fragmentTitle: 'Fragment title',
    titleHint: 'A short title, if useful',
    whatMind: 'What is on your mind?',
    fragmentContent: 'Fragment content',
    shortRecordings: 'Short recordings are transcribed and then discarded.',
    transcribing: 'Transcribing…',
    pause: 'Pause',
    paused: 'Paused',
    recording: 'Recording',
    resume: 'Resume',
    useRecording: 'Use recording',
    cancel: 'Cancel',
    saveFragment: 'Save fragment',
    saveChanges: 'Save changes',
    edit: 'Edit',
    delete: 'Delete',
    voiceUnsupported: 'Voice recording is not supported in this browser.',
    microphonePermission: 'Microphone permission is required.',
    couldNotAuthenticate: 'Could not authenticate.'
  },
  es: {
    invalidInvitation: 'El código de invitación no es válido.',
    demoTitle: 'Sobre esta Demo',
    demoDescription: 'Estás usando la versión Demo de Fragments. Está pensada para probar la experiencia de escritura sin crear una cuenta ni conectarse a un servidor.',
    demoStorage: 'Tus fragmentos se guardan únicamente en este navegador, en el almacenamiento local. Permanecen aunque recargues la página.',
    demoNoLogin: 'No necesitas iniciar sesión ni introducir correo o contraseña.',
    demoNoVoice: 'La captura y transcripción de voz no están disponibles en la Demo.',
    demoNoSync: 'Tus fragmentos de la Demo no se envían a Cloudflare, no se comparten con nadie y no se sincronizan con la versión premium.',
    demoReset: 'Para empezar de nuevo, borra los datos de este sitio desde la configuración de tu navegador. Esto elimina permanentemente los fragmentos guardados en la Demo.',
    demoLocalOnly: 'Tus fragmentos sólo se mantienen en este navegador.',
    premiumTitle: 'Sobre la versión premium',
    premiumDescription: 'La versión premium es la versión privada y basada en cuentas de Fragments para un uso real.',
    premiumStorage: 'Los fragmentos se guardan en la base de datos D1 de Cloudflare y siguen disponibles al volver desde otra sesión o dispositivo.',
    premiumLogin: 'Es necesario iniciar sesión. Las notas se cifran en el navegador usando una clave derivada de tu contraseña.',
    premiumVoice: 'La versión premium incluye grabación de voz y transcripción mediante Cloudflare Workers AI.',
    premiumInvite: 'El acceso puede requerir un código de invitación cuando el registro está restringido.',
    captureOptions: 'Opciones de captura', writeManually: 'Escribir manualmente', writeManuallyHint: 'Usa el formulario y guarda tu fragmento.', recordAndTranscribe: 'Grabar y transcribir', recordAndTranscribeHint: 'Habla con libertad. Lo convertiremos en un fragmento.', voiceAlternative: '¿Prefieres hablar?', voiceAlternativeHint: 'Graba una nota y la transcribiremos.', backToWriting: 'Volver a escribir', voiceReadyTitle: '¿Listo para grabar un fragmento de voz?', voiceReadyHint: 'El audio se transcribe y se descarta después de procesarlo.', startRecording: 'Empezar a grabar', transcribingHint: 'Tu fragmento aparecerá en la lista en un momento.',
    visualDemo: 'Demo visual · los cambios son temporales', trialMode: 'Prueba · guardado en este navegador', help: 'Ayuda', backToFragments: 'Volver a fragmentos', signOut: 'Cerrar sesión', language: 'Idioma', english: 'English', spanish: 'Español', littleGuidance: 'Un poco de orientación', helpIntro: 'Un lugar tranquilo para dejar tus pensamientos antes de decidir qué hacer con ellos.', whatIsFragments: '¿Qué es Fragments?', fragmentsDescription: 'Fragments es un cuaderno privado para esos pensamientos que todavía no tienen que convertirse en nada. Guarda una idea, un recuerdo, una tarea, una reflexión, una observación, una cita o, simplemente, algo que quieras recordar.', howUse: '¿Cómo se usa?', howUseDescription: 'Empieza por escribir lo que tengas en mente; ya lo organizarás después. Elige un día, añade un título si te apetece y guarda el fragmento. Usa las flechas para moverte entre días, y edita o elimina lo que necesites en cualquier momento.', whatToday: '¿Qué puedo hacer aquí?', createText: 'Escribir un fragmento y ponerle título si quieres.', recordVoice: 'Grabar una nota de voz breve y convertirla en texto.', browseByDay: 'Recorrer tus fragmentos por día.', editOrDelete: 'Cambiar o eliminar fragmentos cuando quieras.', keepPrivate: 'Mantenerlo todo en privado dentro de tu cuenta.', voiceNotes: 'Notas de voz', voiceDescription: 'La captura de voz funciona en navegadores compatibles y necesita permiso para usar el micrófono. Las grabaciones pueden durar hasta cinco minutos. El audio se envía para transcribirlo y se descarta después; solo se guarda el texto resultante.', voicePreview: 'La transcripción de voz está disponible en la vista premium desplegada. La prueba local y de GitHub Pages se centra en el flujo de texto.', notAvailable: '¿Qué falta todavía?', noEmailRecovery: 'Verificación del correo o recuperación de contraseña.', noOrganisation: 'Etiquetas, carpetas, contextos u otras formas de ordenar los fragmentos.', noSearch: 'Búsqueda, búsqueda semántica, exportaciones, uso compartido o sincronización.', noMobile: 'Aplicaciones móviles o notificaciones.', noAi: 'Asistencia de escritura con IA más allá de la transcripción de voz actual.', mayComeNext: '¿Qué podría venir después?', futureDescription: 'La idea es añadir un enriquecimiento opcional con IA que conserve tu voz, seguido de contextos sencillos como Trabajo, Libros o Personal.', futureExperiments: 'Más adelante podríamos probar búsquedas, enlaces y formas de convertir fragmentos en textos más largos. Son posibilidades, no promesas con fecha.', privacy: 'Privacidad y limitaciones', privacyDescription: 'Los títulos y contenidos de tus notas se cifran en el navegador antes de almacenarse. Tu navegador es el único lugar que puede descifrarlos con tu contraseña, así que la API y la base de datos guardan texto cifrado, no notas legibles.', privacyWarning: 'Los fragmentos pertenecen a la cuenta que los creó. Tu contraseña forma parte de la clave de cifrado, así que perderla también significa perder el acceso a tus notas cifradas. Esto sigue siendo una vista previa técnica inicial, no un servicio de producción terminado. Por ahora, usa contenido de prueba mientras el proyecto evoluciona.', needToKnow: 'Una cosa importante', needToKnowDescription: 'Fragments está pensado para sacar los pensamientos de la cabeza rápidamente, no para organizarlos a la perfección. Un fragmento no tiene que estar completo, ser útil ni estar bien escrito. Si sientes que merece la pena guardarlo, es suficiente.', dailyNotes: 'Notas diarias', dateNavigation: 'Navegación por fecha', previousDay: 'Día anterior', nextDay: 'Día siguiente', today: 'Hoy', writeFragment: 'Escribir un fragmento', fragmentsForDay: 'Fragmentos de este día', fragmentCount: '{count} {word}', fragmentSingular: 'fragmento', fragmentPlural: 'fragmentos', openingPage: 'Abriendo la página…', nothingYet: 'Todavía no hay nada aquí. Empieza con un pensamiento pequeño.', deleteConfirm: '¿Eliminar este fragmento?', couldNotLoad: 'No se han podido cargar tus fragmentos.', couldNotSave: 'No se ha podido guardar tu fragmento.', couldNotTranscribe: 'No se ha podido transcribir tu grabación.', couldNotUpdate: 'No se ha podido actualizar tu fragmento.', couldNotDelete: 'No se ha podido eliminar tu fragmento.', unlockNotes: 'Desbloquea tus notas para continuar.', fragmentNotFound: 'No se ha encontrado el fragmento.', requestFailed: 'La solicitud ha fallado.', transcriptionFailed: 'La transcripción ha fallado.', authenticationRequired: 'Se requiere autenticación.', accountExists: 'Ya existe una cuenta con ese correo.', invalidCredentials: 'El correo o la contraseña no son válidos.', invalidRequest: 'La solicitud no es válida.', internalServerError: 'Error interno del servidor.', unsupportedAudio: 'Formato de audio no compatible.', audioMissing: 'Falta el audio.', audioTooLarge: 'Falta el audio o es demasiado grande.', noSpeech: 'No se ha detectado voz.', voiceUnavailable: 'La transcripción de voz no está disponible actualmente.', privateNotebook: 'Cuaderno privado', welcomeBack: 'Te damos la bienvenida', makePrivateSpace: 'Crea un espacio privado', continueThoughts: 'Continúa con tus pensamientos.', startCapturing: 'Empieza a capturar pensamientos sin organizarlos primero.', email: 'Correo electrónico', password: 'Contraseña', passwordHint: 'Al menos 12 caracteres.', working: 'Trabajando…', signIn: 'Iniciar sesión', createAccount: 'Crear cuenta', createNewAccount: 'Crear una cuenta nueva', alreadyHaveAccount: 'Ya tengo una cuenta', inviteCode: 'Código de invitación', titleOptional: 'Título (opcional)', fragmentTitle: 'Título del fragmento', titleHint: 'Un título breve, si te resulta útil', whatMind: '¿Qué tienes en mente?', fragmentContent: 'Contenido del fragmento', shortRecordings: 'Las grabaciones breves se transcriben y después se descartan.', transcribing: 'Transcribiendo…', paused: 'En pausa', pause: 'Pausa', recording: 'Grabando', resume: 'Continuar', useRecording: 'Usar grabación', cancel: 'Cancelar', saveFragment: 'Guardar fragmento', saveChanges: 'Guardar cambios', edit: 'Editar', delete: 'Eliminar', voiceUnsupported: 'La grabación de voz no es compatible con este navegador.', microphonePermission: 'Se necesita permiso para usar el micrófono.', couldNotAuthenticate: 'No se ha podido autenticar.'
  }
} as const;

function detectLocale(): Locale {
  const languages = [...(navigator.languages ?? []), navigator.language, document.documentElement.lang]
    .filter(Boolean)
    .map(language => language.toLowerCase());
  if (languages.some(language => language === 'es' || language.startsWith('es-') || language === 'ca' || language.startsWith('ca-'))) return 'es';
  if (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Madrid') return 'es';
  return 'en';
}

function storedLocale(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'en' || value === 'es' ? value : null;
  } catch { return null; }
}

export const locale = ref<Locale>(storedLocale() ?? detectLocale());
export const isSpanish = computed(() => locale.value === 'es');

watch(locale, value => {
  document.documentElement.lang = value;
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Storage can be unavailable in private browsing. */ }
}, { immediate: true });

export function setLocale(value: Locale) { locale.value = value; }

export function t(key: TranslationKey, params: TranslationParams = {}): string {
  let value: string = translations[locale.value][key];
  for (const [name, replacement] of Object.entries(params)) value = value.replace(`{${name}}`, String(replacement));
  return value;
}

export function translateError(error: unknown, fallbackKey: TranslationKey): string {
  const message = error instanceof Error ? error.message : '';
  const keyByMessage: Record<string, TranslationKey> = {
    'Unlock your notes to continue.': 'unlockNotes', 'Fragment not found': 'fragmentNotFound', 'Request failed': 'requestFailed',
    'Transcription failed': 'transcriptionFailed', 'Authentication required': 'authenticationRequired', 'An account with that email already exists': 'accountExists',
    'Invalid email or password': 'invalidCredentials', 'Invalid email or password.': 'invalidCredentials', 'Invalid invitation code': 'invalidInvitation', 'Invalid invitation code.': 'invalidInvitation', 'Invalid request': 'invalidRequest', 'Internal server error': 'internalServerError',
    'Unsupported audio format.': 'unsupportedAudio', 'Audio is missing.': 'audioMissing', 'Audio is missing or too large.': 'audioTooLarge',
    'No speech was detected.': 'noSpeech', 'Voice transcription is currently unavailable.': 'voiceUnavailable', 'Voice transcription is unavailable in the local API.': 'voiceUnavailable'
  };
  return keyByMessage[message] ? t(keyByMessage[message]) : t(fallbackKey);
}
