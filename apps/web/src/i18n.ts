import { computed, ref, watch } from 'vue';

export type Locale = 'en' | 'es';

type TranslationKey = keyof typeof translations.en;
type TranslationParams = Record<string, string | number>;

const STORAGE_KEY = 'fragments-locale';

const translations = {
  en: {
    visualDemo: 'Visual demo · changes are temporary',
    help: 'Help',
    backToFragments: 'Back to fragments',
    signOut: 'Sign out',
    language: 'Language',
    english: 'English',
    spanish: 'Español',
    littleGuidance: 'A little guidance',
    helpIntro: 'Fragments is a calm place to capture thoughts before deciding what they need to become.',
    whatIsFragments: 'What is Fragments?',
    fragmentsDescription: 'Fragments is a calm, private notebook for capturing thoughts before organising them. A fragment can be an idea, memory, task, reflection, observation, quote, or anything you want to keep for later.',
    howUse: 'How should I use it?',
    howUseDescription: 'Write first, organise later. Choose a day, add an optional title, write what is on your mind, and save it. You can return to previous or future days using the arrows. Your fragments can be edited or deleted at any time.',
    whatToday: 'What can I do today?',
    createText: 'Create text fragments with an optional title.',
    recordVoice: 'Record a short voice note and have it transcribed into a fragment.',
    browseByDay: 'Browse fragments by day.',
    editOrDelete: 'Edit or delete your fragments.',
    keepPrivate: 'Keep fragments private to your account.',
    voiceNotes: 'Voice notes',
    voiceDescription: 'Voice capture works in supported browsers and requires microphone permission. Recordings can be up to five minutes long. The audio is sent for transcription and then discarded; the resulting text is saved as a voice fragment.',
    voicePreview: 'Voice transcription is available in the deployed preview, while local development currently focuses on the text workflow.',
    notAvailable: 'What is not available yet?',
    noEmailRecovery: 'Email verification or password recovery.',
    noOrganisation: 'Tags, folders, contexts, or other ways to organise fragments.',
    noSearch: 'Search, semantic search, exports, sharing, or synchronisation.',
    noMobile: 'Mobile applications or notifications.',
    noAi: 'AI writing assistance beyond the current voice transcription.',
    mayComeNext: 'What may come next?',
    futureDescription: 'The proposed direction is optional AI enrichment that preserves your voice, followed by lightweight contexts such as Work, Books, or Personal.',
    futureExperiments: 'Later experiments may explore search, links, and ways to turn fragments into longer pieces of writing. These are ideas, not scheduled promises.',
    privacy: 'Privacy and limitations',
    privacyDescription: 'Your note titles and contents are encrypted in your browser before they are stored. Only your browser can decrypt them with your password, so the API and database store ciphertext rather than readable notes.',
    privacyWarning: 'Fragments belong to the signed-in account that created them. Because your password is part of the encryption key, losing it also means losing access to encrypted notes. This is an early technical preview, so it should not yet be treated as a finished production service. Please use test content while the project continues to evolve.',
    needToKnow: 'Need to know',
    needToKnowDescription: 'The app is designed for quick capture, not perfect organisation. A fragment does not need to be complete, useful, or well written. It only needs to be worth keeping.',
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
    titleOptional: 'Title (optional)', captureOptions: 'Capture options', writeManually: 'Write manually', writeManuallyHint: 'Use the form and save your fragment.', recordAndTranscribe: 'Record and transcribe', recordAndTranscribeHint: 'Speak freely. We will turn it into a fragment.', voiceReadyTitle: 'Ready to record a voice fragment?', voiceReadyHint: 'The audio is transcribed and discarded after processing.', startRecording: 'Start recording', transcribingHint: 'Your fragment will appear in the list in a moment.',
    fragmentTitle: 'Fragment title',
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
    captureOptions: 'Opciones de captura', writeManually: 'Escribir manualmente', writeManuallyHint: 'Usa el formulario y guarda tu fragmento.', recordAndTranscribe: 'Grabar y transcribir', recordAndTranscribeHint: 'Habla con libertad. Lo convertiremos en un fragmento.', voiceReadyTitle: '¿Listo para grabar un fragmento de voz?', voiceReadyHint: 'El audio se transcribe y se descarta después de procesarlo.', startRecording: 'Empezar a grabar', transcribingHint: 'Tu fragmento aparecerá en la lista en un momento.',
    visualDemo: 'Demo visual · los cambios son temporales', help: 'Ayuda', backToFragments: 'Volver a fragmentos', signOut: 'Cerrar sesión', language: 'Idioma', english: 'English', spanish: 'Español', littleGuidance: 'Un poco de orientación', helpIntro: 'Fragments es un lugar tranquilo para capturar pensamientos antes de decidir en qué deben convertirse.', whatIsFragments: '¿Qué es Fragments?', fragmentsDescription: 'Fragments es un cuaderno privado y tranquilo para capturar pensamientos antes de organizarlos. Un fragmento puede ser una idea, un recuerdo, una tarea, una reflexión, una observación, una cita o cualquier cosa que quieras guardar para después.', howUse: '¿Cómo debería usarlo?', howUseDescription: 'Escribe primero y organiza después. Elige un día, añade un título opcional, escribe lo que tengas en mente y guárdalo. Puedes volver a días anteriores o posteriores usando las flechas. Puedes editar o eliminar tus fragmentos en cualquier momento.', whatToday: '¿Qué puedo hacer hoy?', createText: 'Crear fragmentos de texto con un título opcional.', recordVoice: 'Grabar una nota de voz breve y transcribirla en un fragmento.', browseByDay: 'Consultar fragmentos por día.', editOrDelete: 'Editar o eliminar tus fragmentos.', keepPrivate: 'Mantener tus fragmentos privados en tu cuenta.', voiceNotes: 'Notas de voz', voiceDescription: 'La captura de voz funciona en navegadores compatibles y requiere permiso para usar el micrófono. Las grabaciones pueden durar hasta cinco minutos. El audio se envía para transcribirlo y después se descarta; el texto resultante se guarda como un fragmento de voz.', voicePreview: 'La transcripción de voz está disponible en la vista previa desplegada, mientras que el desarrollo local se centra actualmente en el flujo de texto.', notAvailable: '¿Qué no está disponible todavía?', noEmailRecovery: 'Verificación del correo o recuperación de contraseña.', noOrganisation: 'Etiquetas, carpetas, contextos u otras formas de organizar fragmentos.', noSearch: 'Búsqueda, búsqueda semántica, exportaciones, uso compartido o sincronización.', noMobile: 'Aplicaciones móviles o notificaciones.', noAi: 'Asistencia de escritura con IA más allá de la transcripción de voz actual.', mayComeNext: '¿Qué puede venir después?', futureDescription: 'La dirección propuesta es añadir enriquecimiento opcional con IA que preserve tu voz, seguido de contextos ligeros como Trabajo, Libros o Personal.', futureExperiments: 'Experimentos posteriores podrían explorar la búsqueda, los enlaces y formas de convertir fragmentos en textos más largos. Son ideas, no compromisos con fecha.', privacy: 'Privacidad y limitaciones', privacyDescription: 'Los títulos y contenidos de tus notas se cifran en el navegador antes de almacenarse. Solo tu navegador puede descifrarlos con tu contraseña, por lo que la API y la base de datos guardan texto cifrado en lugar de notas legibles.', privacyWarning: 'Los fragmentos pertenecen a la cuenta que los creó. Como tu contraseña forma parte de la clave de cifrado, perderla también significa perder el acceso a las notas cifradas. Esta es una vista previa técnica inicial, así que todavía no debe considerarse un servicio de producción terminado. Usa contenido de prueba mientras el proyecto sigue evolucionando.', needToKnow: 'Lo que debes saber', needToKnowDescription: 'La aplicación está diseñada para capturar rápidamente, no para organizar a la perfección. Un fragmento no tiene que estar completo, ser útil ni estar bien escrito. Solo tiene que merecer la pena conservarlo.', dailyNotes: 'Notas diarias', dateNavigation: 'Navegación por fecha', previousDay: 'Día anterior', nextDay: 'Día siguiente', today: 'Hoy', writeFragment: 'Escribir un fragmento', fragmentsForDay: 'Fragmentos de este día', fragmentCount: '{count} {word}', fragmentSingular: 'fragmento', fragmentPlural: 'fragmentos', openingPage: 'Abriendo la página…', nothingYet: 'Todavía no hay nada aquí. Empieza con un pensamiento pequeño.', deleteConfirm: '¿Eliminar este fragmento?', couldNotLoad: 'No se han podido cargar tus fragmentos.', couldNotSave: 'No se ha podido guardar tu fragmento.', couldNotTranscribe: 'No se ha podido transcribir tu grabación.', couldNotUpdate: 'No se ha podido actualizar tu fragmento.', couldNotDelete: 'No se ha podido eliminar tu fragmento.', unlockNotes: 'Desbloquea tus notas para continuar.', fragmentNotFound: 'No se ha encontrado el fragmento.', requestFailed: 'La solicitud ha fallado.', transcriptionFailed: 'La transcripción ha fallado.', authenticationRequired: 'Se requiere autenticación.', accountExists: 'Ya existe una cuenta con ese correo.', invalidCredentials: 'El correo o la contraseña no son válidos.', invalidRequest: 'La solicitud no es válida.', internalServerError: 'Error interno del servidor.', unsupportedAudio: 'Formato de audio no compatible.', audioMissing: 'Falta el audio.', audioTooLarge: 'Falta el audio o es demasiado grande.', noSpeech: 'No se ha detectado voz.', voiceUnavailable: 'La transcripción de voz no está disponible actualmente.', privateNotebook: 'Cuaderno privado', welcomeBack: 'Te damos la bienvenida', makePrivateSpace: 'Crea un espacio privado', continueThoughts: 'Continúa con tus pensamientos.', startCapturing: 'Empieza a capturar pensamientos sin organizarlos primero.', email: 'Correo electrónico', password: 'Contraseña', passwordHint: 'Al menos 12 caracteres.', working: 'Trabajando…', signIn: 'Iniciar sesión', createAccount: 'Crear cuenta', createNewAccount: 'Crear una cuenta nueva', alreadyHaveAccount: 'Ya tengo una cuenta', titleOptional: 'Título (opcional)', fragmentTitle: 'Título del fragmento', whatMind: '¿Qué tienes en mente?', fragmentContent: 'Contenido del fragmento', shortRecordings: 'Las grabaciones breves se transcriben y después se descartan.', transcribing: 'Transcribiendo…', paused: 'En pausa', pause: 'Pausa', recording: 'Grabando', resume: 'Continuar', useRecording: 'Usar grabación', cancel: 'Cancelar', saveFragment: 'Guardar fragmento', saveChanges: 'Guardar cambios', edit: 'Editar', delete: 'Eliminar', voiceUnsupported: 'La grabación de voz no es compatible con este navegador.', microphonePermission: 'Se necesita permiso para usar el micrófono.', couldNotAuthenticate: 'No se ha podido autenticar.'
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
    'Invalid email or password': 'invalidCredentials', 'Invalid email or password.': 'invalidCredentials', 'Invalid request': 'invalidRequest', 'Internal server error': 'internalServerError',
    'Unsupported audio format.': 'unsupportedAudio', 'Audio is missing.': 'audioMissing', 'Audio is missing or too large.': 'audioTooLarge',
    'No speech was detected.': 'noSpeech', 'Voice transcription is currently unavailable.': 'voiceUnavailable', 'Voice transcription is unavailable in the local API.': 'voiceUnavailable'
  };
  return keyByMessage[message] ? t(keyByMessage[message]) : t(fallbackKey);
}
