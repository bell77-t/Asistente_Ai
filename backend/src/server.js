require('dotenv').config();

const cors = require('cors');
const express = require('express');
const OpenAI = require('openai');
const { admin, db } = require('./firebase');

const app = express();
const port = process.env.PORT || 3000;
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
};
const configuredOpenAiKey = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_')
  ? process.env.OPENAI_API_KEY
  : '';
const looksLikeOpenAiKey = configuredOpenAiKey.startsWith('sk-');
const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || (!looksLikeOpenAiKey ? configuredOpenAiKey : '');
const aiProvider = (process.env.AI_PROVIDER || (looksLikeOpenAiKey ? 'openai' : 'gemini')).toLowerCase();
const openai = configuredOpenAiKey && aiProvider === 'openai'
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4s-mini';const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

const gameCatalog = [
  { id: 'daily-planning', title: 'Plan diario', genres: ['Estudio', 'Trabajo'], platforms: ['PC'], level: ['medio', 'pro'], tag: 'Prioridad', note: 'Organiza tus tareas del dia por prioridad, tiempo estimado y estado de avance.' },
  { id: 'study-blocks', title: 'Bloques de estudio', genres: ['Estudio'], platforms: ['PC', 'consola'], level: ['medio', 'pro'], tag: 'Enfoque', note: 'Divide un objetivo academico en sesiones cortas con entregables claros.' },
  { id: 'project-tracker', title: 'Seguimiento de proyecto', genres: ['Trabajo'], platforms: ['PC'], level: ['principiante', 'medio', 'pro'], tag: 'Proyecto', note: 'Convierte un proyecto en tareas, responsables, fechas y proximas acciones.' },
  { id: 'personal-routine', title: 'Rutina personal', genres: ['Personal'], platforms: ['PC', 'consola', 'movil'], level: ['principiante', 'medio'], tag: 'Habitos', note: 'Crea recordatorios y pasos simples para mantener habitos semanales.' },
  { id: 'quick-capture', title: 'Captura rapida', genres: ['Personal'], platforms: ['movil'], level: ['principiante', 'medio', 'pro'], tag: 'Inbox', note: 'Registra ideas, pendientes o solicitudes rapidamente para ordenarlas despues.' },
  { id: 'weekly-review', title: 'Revision semanal', genres: ['Trabajo', 'Estudio', 'Personal'], platforms: ['PC', 'consola'], level: ['principiante', 'medio', 'pro'], tag: 'Revision', note: 'Revisa pendientes, bloqueos y logros para planear la siguiente semana.' },
];
const trends = [
  { id: 'pomodoro', title: 'Pomodoro', genre: 'Productividad', signal: 'Trabajo en bloques de foco y descanso' },
  { id: 'kanban', title: 'Kanban personal', genre: 'Organizacion', signal: 'Pendiente, en progreso y completado' },
  { id: 'time-blocking', title: 'Time blocking', genre: 'Agenda', signal: 'Reserva tiempo real para cada prioridad' },
  { id: 'eisenhower', title: 'Matriz Eisenhower', genre: 'Priorizacion', signal: 'Distingue lo urgente de lo importante' },
];
const gamingTips = {
  principiante: [
    'Escribe cada tarea con un verbo claro: revisar, entregar, llamar, estudiar o preparar.',
    'Empieza con tres pendientes importantes en lugar de llenar la lista sin prioridad.',
  ],
  medio: [
    'Agrupa tareas por contexto: estudio, trabajo, casa o llamadas para reducir cambios de foco.',
    'Asigna una fecha y un siguiente paso a cada tarea que dure mas de 15 minutos.',
  ],
  pro: [
    'Revisa bloqueos al final del dia y decide si delegar, dividir o reprogramar.',
    'Mide progreso por entregables terminados, no por cantidad de tareas abiertas.',
  ],
};
const extraGameCatalog = [
  { id: 'meeting-notes', title: 'Notas de reunion', genres: ['Trabajo'], platforms: ['PC', 'movil'], level: ['medio', 'pro'], tag: 'Resumen', note: 'Transforma acuerdos de reunion en tareas accionables.', accent: '#ff7a1a' },
  { id: 'exam-plan', title: 'Plan de examen', genres: ['Estudio'], platforms: ['PC', 'consola', 'movil'], level: ['principiante', 'medio', 'pro'], tag: 'Estudio', note: 'Organiza temas, fechas y sesiones de repaso.', accent: '#62b84e' },
  { id: 'home-admin', title: 'Gestion del hogar', genres: ['Personal'], platforms: ['PC', 'consola', 'movil'], level: ['principiante', 'medio', 'pro'], tag: 'Casa', note: 'Lista compras, pagos, citas y mantenimiento domestico.', accent: '#2da9ff' },
  { id: 'client-request', title: 'Solicitud de cliente', genres: ['Trabajo'], platforms: ['movil', 'PC'], level: ['principiante', 'medio', 'pro'], tag: 'Cliente', note: 'Convierte solicitudes en pasos verificables.', accent: '#3f7cff' },
];

const fullGameCatalog = [...gameCatalog, ...extraGameCatalog];
const coverAccents = {
  valorant: '#ff4655',
  'elden-ring': '#c9a44f',
  'league-of-legends': '#0ac8b9',
  'genshin-impact': '#69b7ff',
  'call-of-duty-mobile': '#f4c542',
  'baldurs-gate-3': '#b447ff',
  'apex-legends': '#ff7a1a',
  minecraft: '#62b84e',
  'rocket-league': '#2da9ff',
  'clash-royale': '#3f7cff',
  marathon: '#00f2ff',
  'hades-2': '#ff4470',
  'monster-hunter-wilds': '#54d46a',
  fortnite: '#b447ff',
};

function normalizeProfile(profile = {}) {
  const level = (profile.level || profile.rank || 'principiante').toString().toLowerCase();
  const normalizedLevel = level === 'elite' ? 'pro' : level === 'beginner' ? 'principiante' : level === 'intermediate' ? 'medio' : level;
  const genres = Array.isArray(profile.genres) && profile.genres.length ? profile.genres : ['Trabajo', 'Estudio'];
  const platformAliases = {
    PC: 'Tareas academicas',
    consola: 'Tareas laborales',
    movil: 'Tareas personales',
  };
  const platform = platformAliases[profile.platform] || profile.platform || 'Tareas academicas';

  return {
    callsign: profile.callsign || 'Usuario',
    email: profile.email || 'usuario@taskflow.ai',
    level: ['principiante', 'medio', 'pro'].includes(normalizedLevel) ? normalizedLevel : 'principiante',
    genres,
    platform,
  };
}

function getUserId(req) {
  return req.header('x-user-id') || 'anonymous';
}

function sortByTimestampDesc(items, field = 'createdAt') {
  return items.sort((a, b) => timestampValue(b[field]) - timestampValue(a[field]));
}

async function getUserDocs(collectionName, userId) {
  const snapshot = await db.collection(collectionName).where('userId', '==', userId).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function deleteUserData(userId) {
  const collectionsToClean = ['tasks', 'messages', 'profiles', 'conversations', 'sessions'];

  for (const collectionName of collectionsToClean) {
    const snapshot = await db.collection(collectionName).where('userId', '==', userId).get();

    if (snapshot.empty) {
      continue;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function getActiveProfile(userId = 'anonymous') {
  const profiles = sortByTimestampDesc(await getUserDocs('profiles', userId));
  const doc = profiles[0];

  if (!doc) {
    return normalizeProfile();
  }

  return {
    id: doc.id,
    ...normalizeProfile(doc),
  };
}

function recommendationsForProfile(profile) {
  const normalized = normalizeProfile(profile);
  const matches = fullGameCatalog.filter((game) => {
    const genreMatch = game.genres.some((genre) => normalized.genres.includes(genre));
    const platformMatch = game.platforms.includes(normalized.platform);
    const levelMatch = game.level.includes(normalized.level);

    return genreMatch && platformMatch && levelMatch;
  });

  return (matches.length ? matches : fullGameCatalog).slice(0, 6).map(withCover);
}

function withCover(item) {
  return {
    ...item,
    imageUrl: `http://localhost:${port}/covers/${item.id}.svg`,
  };
}

function renderCover(title, subtitle, accent = '#00f2ff') {
  const safeTitle = title.replace(/[&<>]/g, '');
  const safeSubtitle = subtitle.replace(/[&<>]/g, '');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#0b0e14"/>
        <stop offset="0.58" stop-color="#151b29"/>
        <stop offset="1" stop-color="${accent}"/>
      </linearGradient>
      <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
        <path d="M36 0 L0 0 0 36" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="720" height="420" rx="18" fill="url(#bg)"/>
    <rect width="720" height="420" rx="18" fill="url(#grid)" opacity="0.58"/>
    <circle cx="585" cy="82" r="146" fill="${accent}" opacity="0.2"/>
    <path d="M42 58h120M42 58v120M678 362H558M678 362V242" stroke="${accent}" stroke-width="5" opacity="0.85"/>
    <text x="46" y="232" fill="#e1fdff" font-family="Arial, sans-serif" font-size="48" font-weight="800">${safeTitle}</text>
    <text x="50" y="286" fill="#b9cacb" font-family="Arial, sans-serif" font-size="24" font-weight="700">${safeSubtitle}</text>
    <text x="50" y="348" fill="${accent}" font-family="Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="4">TASKFLOW AI</text>
  </svg>`;
}

function tipsForProfile(profile) {
  return gamingTips[normalizeProfile(profile).level] || gamingTips.principiante;
}

function buildAssistantResponse(content, profile, contextMessages, tasks = []) {
  const normalized = normalizeProfile(profile);
  const lower = content.toLowerCase();
  const contextHint = contextMessages.length
    ? `Tomo en cuenta lo que ya hablamos (${contextMessages.length} mensajes recientes). `
    : '';
  const levelHint = {
    principiante: 'Te lo explico simple y paso a paso.',
    medio: 'Te doy una respuesta practica con prioridades claras.',
    pro: 'Voy directo a optimizacion, seguimiento y ejecucion.',
  }[normalized.level];

  if (lower.includes('prioridad') || lower.includes('priorizar') || lower.includes('urgente')) {
    if (tasks.length) {
      return `${contextHint}${levelHint} De tus tareas guardadas, empieza por estas: ${summarizeTasksForLocalResponse(tasks)}. Mi recomendacion es atender primero las de prioridad alta y fecha limite mas cercana, luego dividir cada una en pasos de 25 a 45 minutos.`;
    }

    return `${contextHint}${levelHint} Clasifica tus tareas en urgente/importante, importante/no urgente, urgente/no importante y descartable. Luego elige maximo tres prioridades para hoy.`;
  }

  if (lower.includes('plan') || lower.includes('organiza') || lower.includes('agenda')) {
    if (tasks.length) {
      return `${contextHint}${levelHint} Plan sugerido con tus tareas guardadas: ${summarizeTasksForLocalResponse(tasks)}. Ordenalas por fecha limite, bloquea tiempo para la primera tarea pendiente y deja una revision corta al final del dia.`;
    }

    return `${contextHint}${levelHint} Propongo este flujo: 1) lista todas las tareas, 2) define fecha limite, 3) estima duracion, 4) separa en bloques de trabajo, 5) revisa avances al final del dia.`;
  }

  if (lower.includes('resumen') || lower.includes('reunion') || lower.includes('solicitud')) {
    return `${contextHint}${levelHint} Extrae acuerdos, responsables, fechas y siguientes pasos. Si me pasas el texto, lo convierto en una lista de tareas accionables.`;
  }

  if (tasks.length) {
    return `${contextHint}${levelHint} Vi estas tareas guardadas: ${summarizeTasksForLocalResponse(tasks)}. Puedes pedirme: "prioriza mis tareas", "hazme un plan para hoy" o "resume mis pendientes".`;
  }

  return `${contextHint}${levelHint} Puedo ayudarte a crear tareas, priorizarlas, dividir proyectos, resumir solicitudes, planear una agenda y dar seguimiento. Dime que pendiente tienes, fecha limite y nivel de prioridad.`;
}

function summarizeTasksForLocalResponse(tasks = []) {
  return tasks.slice(0, 5).map((task) => {
    const status = task.status || (task.completed ? 'completada' : 'pendiente');
    const due = task.dueDate ? `, vence ${task.dueDate}${task.dueTime ? ` ${task.dueTime}` : ''}` : '';

    return `"${task.title}" (${status}, prioridad ${task.priority || 'media'}${due})`;
  }).join('; ');
}
const taskKeywords = [
  'tarea', 'tareas', 'pendiente', 'pendientes', 'actividad', 'actividades', 'recordatorio', 'recordatorios',
  'organizar', 'organizacion', 'planear', 'planificacion', 'agenda', 'calendario', 'prioridad', 'prioridades',
  'proyecto', 'proyectos', 'entrega', 'entregable', 'fecha', 'plazo', 'deadline', 'seguimiento', 'avance',
  'productividad', 'pomodoro', 'kanban', 'eisenhower', 'time blocking', 'bloque', 'bloques', 'estudio',
  'trabajo', 'reunion', 'reuniones', 'resumen', 'lista', 'checklist', 'objetivo', 'objetivos', 'habito', 'habitos',
  'delegar', 'programar', 'reprogramar', 'completar', 'completado', 'hacer', 'plan', 'rutina', 'solicitud',
];

const greetingKeywords = ['hola', 'buenas', 'hey', 'saludos'];

function isTaskRelated(content) {
  const normalized = content.toLowerCase();

  if (taskKeywords.some((keyword) => normalized.includes(keyword))) {
    return true;
  }

  return normalized.length <= 30 && greetingKeywords.some((keyword) => normalized.includes(keyword));
}

function buildTaskOnlyRejection() {
  return 'Solo puedo ayudarte con gestion de tareas: organizar pendientes, planear actividades, priorizar, crear listas, hacer seguimiento, resumir solicitudes o mejorar productividad. Reformula tu pregunta hacia tareas y te ayudo.';
}
function buildSystemPrompt(profile, tasks = []) {
  const normalized = normalizeProfile(profile);
  const taskContext = buildTaskContext(tasks);

  return [
    'Eres TaskFlow AI, un asistente de tareas para una aplicacion web de productividad.',
    'Tu alcance es estrictamente gestion de tareas. Si el usuario pide informacion fuera de organizacion, planificacion, seguimiento, productividad, listas, recordatorios, proyectos o actividades, rechaza la solicitud con una frase breve y redirige hacia tareas.',
    'No respondas preguntas de medicina, leyes, finanzas, politica, videojuegos, cocina, relaciones u otros temas que no ayuden a gestionar tareas.',
    'Responde siempre en espanol claro, natural y util.',
    'Ayudas a crear, dividir, priorizar, resumir, reprogramar y dar seguimiento a tareas y proyectos.',
    'Mantienes el contexto de la conversacion y haces preguntas cortas cuando falte informacion clave.',
    `Tipo de usuario: ${normalized.level}.`,
    `Uso principal del aplicativo: ${normalized.platform}.`,
    `Areas de enfoque: ${normalized.genres.join(', ')}.`,
    'Adapta la profundidad: principiante = paso a paso, medio = practico y priorizado, pro = directo, optimizado y tecnico.',
    'Evita inventar fechas, responsables o datos no dados; si faltan detalles, pregunta por prioridad, plazo o contexto.',
    taskContext,
  ].join('\n');
}

function buildTaskContext(tasks = []) {
  if (!tasks.length) {
    return 'Tareas guardadas del usuario: no hay tareas registradas todavia.';
  }

  const lines = tasks.slice(0, 12).map((task, index) => {
    const status = task.status || (task.completed ? 'completada' : 'pendiente');
    const due = [task.dueDate, task.dueTime].filter(Boolean).join(' ') || 'sin fecha';
    const notes = task.notes ? ` Notas: ${task.notes}.` : '';

    return `${index + 1}. ${task.title} | estado: ${status} | prioridad: ${task.priority || 'media'} | categoria: ${task.category || 'General'} | fecha limite: ${due}. ${task.description || ''}${notes}`;
  });

  return [
    'Tareas guardadas del usuario en Firestore:',
    ...lines,
    'Usa estas tareas como contexto real. Si el usuario pide organizar, priorizar, resumir, listar pendientes o sugerir siguientes pasos, basa la respuesta en estas tareas guardadas.',
  ].join('\n');
}

function normalizeChatRole(role) {
  return role === 'assistant' ? 'assistant' : 'user';
}

async function generateAiAssistantResponse(content, profile, contextMessages, tasks = []) {
  try {
    if (aiProvider === 'gemini') {
      return await generateGeminiAssistantResponse(content, profile, contextMessages, tasks);
    }

    if (!openai) {
      const error = new Error('OPENAI_API_KEY is not configured');
      error.status = 500;
      error.publicMessage = 'Falta configurar OPENAI_API_KEY en el backend.';
      throw error;
    }

    const messages = [
      { role: 'system', content: buildSystemPrompt(profile, tasks) },
      ...contextMessages.map((message) => ({
        role: normalizeChatRole(message.role),
        content: message.content,
      })),
      { role: 'user', content },
    ];

    const completion = await openai.chat.completions.create({
      model: openaiModel,
      messages,
      temperature: 0.7,
      max_tokens: 650,
    });

    return completion.choices?.[0]?.message?.content?.trim() ||
      buildAssistantResponse(content, profile, contextMessages, tasks);
  } catch (error) {
    console.warn('AI provider unavailable, using local fallback:', {
      provider: aiProvider,
      model: aiProvider === 'gemini' ? geminiModel : openaiModel,
      status: error?.status,
      message: error?.publicMessage || error?.message,
    });

    const reason = buildAiFallbackReason(error);
    return `${buildAssistantResponse(content, profile, contextMessages, tasks)}\n\nNota: ${reason} Use una respuesta local de respaldo para que el chat siga funcionando.`;
  }
}

function buildAiFallbackReason(error) {
  const message = `${error?.publicMessage || error?.message || ''}`.toLowerCase();

  if (error?.status === 429 || message.includes('quota') || message.includes('rate limit')) {
    return 'el proveedor de IA rechazo la peticion por cuota o limite de uso.';
  }

  if (error?.status === 503 || message.includes('high demand') || message.includes('overloaded')) {
    return 'el modelo de IA esta con alta demanda temporal.';
  }

  if (message.includes('api_key') || message.includes('api key') || message.includes('falta configurar')) {
    return 'falta configurar una clave valida del proveedor de IA.';
  }

  return 'no pude conectar con el proveedor de IA en este momento.';
}

function toGeminiRole(role) {
  return role === 'assistant' ? 'model' : 'user';
}

async function generateGeminiAssistantResponse(content, profile, contextMessages, tasks = []) {
  if (!googleApiKey || googleApiKey.includes('your_')) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.status = 500;
    error.publicMessage = 'Falta configurar GEMINI_API_KEY o GOOGLE_API_KEY en el backend.';
    throw error;
  }

  const contents = [
    ...contextMessages.map((message) => ({
      role: toGeminiRole(message.role),
      parts: [{ text: message.content }],
    })),
    {
      role: 'user',
      parts: [{ text: content }],
    },
  ];
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemPrompt(profile, tasks) }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || 'Gemini request failed');
    error.status = response.status;
    error.publicMessage = data.error?.message || 'Gemini no pudo generar la respuesta.';
    throw error;
  }

  return data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim() || buildAssistantResponse(content, profile, contextMessages);
}

const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:3000',
  'http://localhost:4201',
  'https://asistente-ai-ur0o.onrender.com',
  'https://asistente-ai-ur0o.onrender.com/',
  'https://asistente-ai-ur0o.onrender.com/*',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-user-id'],
}));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-id');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }

  next();
});
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'asistente-ai-backend', message: 'Backend activo' });
});

app.get('/covers/:id.svg', (req, res) => {
  const id = req.params.id.replace('.svg', '');
  const item =
    fullGameCatalog.find((game) => game.id === id) ||
    trends.find((trend) => trend.id === id) ||
    { title: 'TaskFlow AI', tag: 'Tareas', genre: 'Catalogo' };
  const subtitle = item.tag || item.genre || 'Tareas';
  const accent = item.accent || coverAccents[id] || '#00f2ff';

  res.type('image/svg+xml').send(renderCover(item.title, subtitle, accent));
});

app.get('/health', async (_req, res) => {
  try {
    await db.collection('_health').limit(1).get();
    res.json({ ok: true, database: 'firestore' });
  } catch (error) {
    console.warn(`[health] Firestore no disponible: ${error.message}`);
    res.status(200).json({
      ok: true,
      database: 'firestore-unavailable',
      message: 'Backend activo, pero Firestore no respondió',
    });
  }
});

app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = sortByTimestampDesc(await getUserDocs('tasks', getUserId(req)));

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

app.get('/dashboard', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const [tasks, messages, profiles] = await Promise.all([
      getUserDocs('tasks', userId),
      getUserDocs('messages', userId),
      getUserDocs('profiles', userId),
    ]);

    const completedTasks = tasks.filter((task) => task.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    const profile = await getActiveProfile(userId);

    res.json({
      tasksTotal: tasks.length,
      completedTasks,
      pendingTasks,
      messagesTotal: messages.length,
      profilesTotal: profiles.length,
      syncStatus: 'OK',
      profile,
      recommendations: recommendationsForProfile(profile),
      trends: trends.map(withCover),
      tips: tipsForProfile(profile),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/hardware', (_req, res) => {
  const now = new Date();

  res.json({
    cpuTemp: 54,
    gpuLoad: 82,
    memoryLoad: 61,
    driver: 'NVIDIA v552.12',
    updateAvailable: true,
    checkedAt: now.toISOString(),
  });
});

app.get('/recommendations', async (req, res, next) => {
  try {
    const profile = await getActiveProfile(getUserId(req));
    res.json(recommendationsForProfile(profile));
  } catch (error) {
    next(error);
  }
});

app.get('/trends', (_req, res) => {
  res.json(trends.map(withCover));
});

app.get('/tips', async (req, res, next) => {
  try {
    const profile = await getActiveProfile(getUserId(req));
    res.json(tipsForProfile(profile));
  } catch (error) {
    next(error);
  }
});

app.post('/tasks', async (req, res, next) => {
  try {
    const {
      title,
      description = '',
      priority = 'media',
      category = 'General',
      dueDate = '',
      dueTime = '',
      status = 'pendiente',
      notes = '',
    } = req.body;
    const userId = getUserId(req);

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required' });
    }

    const docRef = await db.collection('tasks').add({
      title: title.trim(),
      description,
      priority,
      category,
      dueDate,
      dueTime,
      status,
      notes,
      userId,
      completed: status === 'completada',
      createdAt: new Date(),
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    next(error);
  }
});

app.patch('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const taskDoc = await db.collection('tasks').doc(id).get();

    if (!taskDoc.exists || taskDoc.data().userId !== userId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const allowed = ['title', 'description', 'priority', 'category', 'dueDate', 'dueTime', 'status', 'notes', 'completed'];
    const changes = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key)),
    );

    if (!Object.keys(changes).length) {
      return res.status(400).json({ error: 'No valid task fields provided' });
    }

    if (changes.status === 'completada') {
      changes.completed = true;
    } else if (changes.status && changes.status !== 'completada') {
      changes.completed = false;
    } else if (typeof changes.completed === 'boolean') {
      changes.status = changes.completed ? 'completada' : 'pendiente';
    }

    changes.updatedAt = new Date();
    await db.collection('tasks').doc(id).update(changes);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const docRef = db.collection('tasks').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== userId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/profiles', async (req, res, next) => {
  try {
    const { callsign, email, rank, level, genres = [], platform = 'Tareas academicas' } = req.body;
    const userId = getUserId(req);

    if (!callsign || !email) {
      return res.status(400).json({ error: 'callsign and email are required' });
    }

    const docRef = await db.collection('profiles').add({
      callsign,
      email,
      rank: rank || level || 'principiante',
      level: level || rank || 'principiante',
      genres,
      platform,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    next(error);
  }
});

app.get('/profile', async (req, res, next) => {
  try {
    res.json(await getActiveProfile(getUserId(req)));
  } catch (error) {
    next(error);
  }
});

app.put('/profile', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const profile = normalizeProfile(req.body);
    const profiles = sortByTimestampDesc(await getUserDocs('profiles', userId));
    const now = new Date();

    if (!profiles.length) {
      const docRef = await db.collection('profiles').add({
        ...profile,
        rank: profile.level,
        userId,
        createdAt: now,
        updatedAt: now,
      });

      return res.status(201).json({ id: docRef.id, ...profile });
    }

    const doc = profiles[0];
    await db.collection('profiles').doc(doc.id).update({
      ...profile,
      rank: profile.level,
      userId,
      updatedAt: now,
    });

    res.json({ id: doc.id, ...profile });
  } catch (error) {
    next(error);
  }
});

async function deleteAccountHandler(req, res, next) {
  try {
    const userId = getUserId(req);

    if (!userId || userId === 'anonymous') {
      return res.status(400).json({ error: 'Missing authenticated user' });
    }

    await deleteUserData(userId);

    try {
      await admin.auth().deleteUser(userId);
    } catch (error) {
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-uid') {
        console.warn('Cuenta no encontrada en Firebase Auth, pero se borraron los datos locales.', error?.code);
      } else {
        console.warn('No se pudo borrar la cuenta en Firebase Auth; se conservará la eliminación local.', error?.message || error);
      }
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

app.delete('/profile', deleteAccountHandler);
app.delete('/account', deleteAccountHandler);

app.get('/profiles', async (req, res, next) => {
  try {
    const profiles = sortByTimestampDesc(await getUserDocs('profiles', getUserId(req))).slice(0, 20);

    res.json(profiles);
  } catch (error) {
    next(error);
  }
});

app.post('/sessions', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email is required' });
    }

    const docRef = await db.collection('sessions').add({
      email,
      mode: 'visual-login',
      createdAt: new Date(),
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    next(error);
  }
});

function buildConversationTitle(content = '') {
  const clean = content.trim().replace(/\s+/g, ' ');
  return clean.length > 42 ? `${clean.slice(0, 42)}...` : clean || 'Nuevo chat de tareas';
}

function timestampValue(timestamp) {
  if (!timestamp) {
    return 0;
  }

  if (typeof timestamp.toMillis === 'function') {
    return timestamp.toMillis();
  }

  const seconds = timestamp._seconds ?? timestamp.seconds ?? 0;
  const nanos = timestamp._nanoseconds ?? timestamp.nanoseconds ?? 0;
  return (seconds * 1000) + Math.floor(nanos / 1000000);
}

async function createConversation(userId = 'anonymous', title = 'Nuevo chat de tareas') {
  const now = new Date();
  const docRef = await db.collection('conversations').add({
    title,
    userId,
    createdAt: now,
    updatedAt: now,
    messagesCount: 0,
  });

  return { id: docRef.id, title, userId, createdAt: now, updatedAt: now, messagesCount: 0 };
}

async function getOrCreateLatestConversation(userId = 'anonymous') {
  const conversations = sortByTimestampDesc(await getUserDocs('conversations', userId), 'updatedAt');

  if (conversations.length) {
    return conversations[0];
  }

  return createConversation(userId);
}

async function createMessagesForConversation(conversationId, content, userId = 'anonymous') {
  const conversationRef = db.collection('conversations').doc(conversationId);
  const conversationDoc = await conversationRef.get();

  if (!conversationDoc.exists || conversationDoc.data().userId !== userId) {
    const error = new Error('Conversation not found');
    error.status = 404;
    error.publicMessage = 'No encontre ese chat. Crea uno nuevo para continuar.';
    throw error;
  }

  const batch = db.batch();
  const userMessage = db.collection('messages').doc();
  const assistantMessage = db.collection('messages').doc();
  const now = new Date();
  const [profile, contextSnapshot, tasks] = await Promise.all([
    getActiveProfile(userId),
    db.collection('messages')
      .where('conversationId', '==', conversationId)
      .limit(30)
      .get(),
    getUserDocs('tasks', userId),
  ]);
  const contextMessages = contextSnapshot.docs
    .map((doc) => doc.data())
    .filter((message) => message.userId === userId)
    .sort((a, b) => timestampValue(a.createdAt) - timestampValue(b.createdAt))
    .slice(-8);
  const taskContext = sortByTimestampDesc(tasks, 'updatedAt').slice(0, 12);
  const assistantContent = isTaskRelated(content)
    ? await generateAiAssistantResponse(content, profile, contextMessages, taskContext)
    : buildTaskOnlyRejection();
  const currentConversation = conversationDoc.data();
  const nextTitle = currentConversation.title === 'Nuevo chat de tareas'
    ? buildConversationTitle(content)
    : currentConversation.title;

  batch.set(userMessage, {
    conversationId,
    userId,
    role: 'user',
    content,
    profileSnapshot: profile,
    createdAt: now,
  });
  batch.set(assistantMessage, {
    conversationId,
    userId,
    role: 'assistant',
    content: assistantContent,
    profileSnapshot: profile,
    createdAt: new Date(now.getTime() + 1),
  });
  batch.update(conversationRef, {
    title: nextTitle,
    updatedAt: new Date(now.getTime() + 2),
    messagesCount: (currentConversation.messagesCount || 0) + 2,
    lastMessage: content,
  });

  await batch.commit();

  return {
    conversationId,
    userMessageId: userMessage.id,
    assistantMessageId: assistantMessage.id,
    response: assistantContent,
  };
}

app.get('/conversations', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const conversations = sortByTimestampDesc(await getUserDocs('conversations', userId), 'updatedAt').slice(0, 30);

    if (!conversations.length) {
      return res.json([await createConversation(userId)]);
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

app.post('/conversations', async (req, res, next) => {
  try {
    const conversation = await createConversation(getUserId(req), req.body?.title || 'Nuevo chat de tareas');
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
});

app.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const conversationDoc = await db.collection('conversations').doc(req.params.id).get();

    if (!conversationDoc.exists || conversationDoc.data().userId !== userId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const snapshot = await db.collection('messages').where('conversationId', '==', req.params.id).limit(80).get();
    const messages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((message) => message.userId === userId)
      .sort((a, b) => timestampValue(a.createdAt) - timestampValue(b.createdAt));

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

app.post('/conversations/:id/messages', async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required' });
    }

    res.status(201).json(await createMessagesForConversation(req.params.id, content, getUserId(req)));
  } catch (error) {
    next(error);
  }
});

app.delete('/conversations/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const conversationRef = db.collection('conversations').doc(req.params.id);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists || conversationDoc.data().userId !== userId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const snapshot = await db.collection('messages').where('conversationId', '==', req.params.id).limit(100).get();
    const batch = db.batch();

    snapshot.docs
      .filter((doc) => doc.data().userId === userId)
      .forEach((doc) => batch.delete(doc.ref));
    batch.delete(conversationRef);
    await batch.commit();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/messages', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const conversation = await getOrCreateLatestConversation(userId);
    const snapshot = await db.collection('messages').where('conversationId', '==', conversation.id).limit(80).get();
    const messages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((message) => message.userId === userId)
      .sort((a, b) => timestampValue(a.createdAt) - timestampValue(b.createdAt));

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

app.delete('/messages', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const conversation = await getOrCreateLatestConversation(userId);
    const snapshot = await db.collection('messages').limit(100).get();
    const batch = db.batch();

    snapshot.docs
      .filter((doc) => doc.data().userId === userId && (!doc.data().conversationId || doc.data().conversationId === conversation.id))
      .forEach((doc) => batch.delete(doc.ref));
    batch.update(db.collection('conversations').doc(conversation.id), {
      messagesCount: 0,
      lastMessage: '',
      updatedAt: new Date(),
    });
    await batch.commit();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/messages', async (req, res, next) => {
  try {
    const { content } = req.body;
    const userId = getUserId(req);

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required' });
    }

    const conversation = await getOrCreateLatestConversation(userId);
    res.status(201).json(await createMessagesForConversation(conversation.id, content, userId));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.status && Number.isInteger(error.status) ? error.status : 500;
  res.status(status).json({ error: error.publicMessage || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
