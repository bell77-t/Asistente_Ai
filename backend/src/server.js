require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { db } = require('./firebase');

const app = express();
const port = process.env.PORT || 3000;

const gameCatalog = [
  {
    id: 'valorant',
    title: 'Valorant',
    genres: ['FPS'],
    platforms: ['PC'],
    level: ['medio', 'pro'],
    tag: 'Aim Focus',
    note: 'Ideal si buscas mejorar precision, utilidad por rondas y comunicacion tactica.',
  },
  {
    id: 'elden-ring',
    title: 'Elden Ring',
    genres: ['RPG'],
    platforms: ['PC', 'consola'],
    level: ['medio', 'pro'],
    tag: 'Build Craft',
    note: 'Perfecto para progresion, exploracion y dominar mecanicas de combate.',
  },
  {
    id: 'league-of-legends',
    title: 'League of Legends',
    genres: ['MOBA'],
    platforms: ['PC'],
    level: ['principiante', 'medio', 'pro'],
    tag: 'Meta Pick',
    note: 'Buena opcion para estrategia, roles claros y aprendizaje por partidas.',
  },
  {
    id: 'genshin-impact',
    title: 'Genshin Impact',
    genres: ['RPG'],
    platforms: ['PC', 'consola', 'movil'],
    level: ['principiante', 'medio'],
    tag: 'Casual RPG',
    note: 'Recomendado para exploracion, coleccion y progreso diario flexible.',
  },
  {
    id: 'call-of-duty-mobile',
    title: 'Call of Duty Mobile',
    genres: ['FPS'],
    platforms: ['movil'],
    level: ['principiante', 'medio', 'pro'],
    tag: 'Mobile FPS',
    note: 'Accion rapida con progresion clara y modos competitivos accesibles.',
  },
  {
    id: 'baldurs-gate-3',
    title: 'Baldur’s Gate 3',
    genres: ['RPG'],
    platforms: ['PC', 'consola'],
    level: ['principiante', 'medio', 'pro'],
    tag: 'Story Rich',
    note: 'Gran eleccion si te gusta tomar decisiones, lore y builds de personajes.',
  },
];

const trends = [
  { id: 'marathon', title: 'Marathon', genre: 'FPS', signal: 'Extraccion tactica en tendencia' },
  { id: 'hades-2', title: 'Hades II', genre: 'Roguelike', signal: 'Runs cortas y alto replay value' },
  { id: 'monster-hunter-wilds', title: 'Monster Hunter Wilds', genre: 'Action RPG', signal: 'Cooperativo y progresion de equipo' },
  { id: 'fortnite', title: 'Fortnite', genre: 'Battle Royale', signal: 'Eventos y temporadas activas' },
];

const gamingTips = {
  principiante: [
    'Juega primero 20 minutos en modo entrenamiento para aprender controles antes de ranked.',
    'Elige un solo rol o personaje por sesion para crear memoria muscular.',
  ],
  medio: [
    'Revisa una repeticion corta y apunta un error repetido antes de volver a jugar.',
    'Ajusta sensibilidad o keybinds de uno en uno para saber que cambio ayuda.',
  ],
  pro: [
    'Define objetivos por bloque: aim, macro, economia o toma de decisiones, no todo a la vez.',
    'Analiza patrones del rival y prepara una respuesta antes de que empiece la siguiente ronda.',
  ],
};

const extraGameCatalog = [
  { id: 'apex-legends', title: 'Apex Legends', genres: ['FPS'], platforms: ['PC', 'consola'], level: ['medio', 'pro'], tag: 'Squad Play', note: 'Buen fit si te gusta movimiento rapido, roles y comunicacion.', accent: '#ff7a1a' },
  { id: 'minecraft', title: 'Minecraft', genres: ['Sandbox', 'Strategy'], platforms: ['PC', 'consola', 'movil'], level: ['principiante', 'medio', 'pro'], tag: 'Creative Loop', note: 'Ideal para creatividad, supervivencia y proyectos cooperativos.', accent: '#62b84e' },
  { id: 'rocket-league', title: 'Rocket League', genres: ['Sports'], platforms: ['PC', 'consola'], level: ['principiante', 'medio', 'pro'], tag: 'Mechanical Skill', note: 'Perfecto para sesiones cortas con mejora mecanica constante.', accent: '#2da9ff' },
  { id: 'clash-royale', title: 'Clash Royale', genres: ['Strategy'], platforms: ['movil'], level: ['principiante', 'medio', 'pro'], tag: 'Mobile Strategy', note: 'Recomendado para estrategia rapida y control de recursos.', accent: '#3f7cff' },
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
  const genres = Array.isArray(profile.genres) && profile.genres.length ? profile.genres : ['FPS', 'RPG'];

  return {
    callsign: profile.callsign || 'Commander',
    email: profile.email || 'player@levelup.ai',
    level: ['principiante', 'medio', 'pro'].includes(normalizedLevel) ? normalizedLevel : 'principiante',
    genres,
    platform: profile.platform || 'PC',
  };
}

async function getActiveProfile() {
  const snapshot = await db.collection('profiles').orderBy('createdAt', 'desc').limit(1).get();
  const doc = snapshot.docs[0];

  if (!doc) {
    return normalizeProfile();
  }

  return {
    id: doc.id,
    ...normalizeProfile(doc.data()),
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
    <text x="50" y="348" fill="${accent}" font-family="Arial, sans-serif" font-size="18" font-weight="800" letter-spacing="4">LEVELUP AI CATALOG</text>
  </svg>`;
}

function tipsForProfile(profile) {
  return gamingTips[normalizeProfile(profile).level] || gamingTips.principiante;
}

function buildAssistantResponse(content, profile, contextMessages) {
  const normalized = normalizeProfile(profile);
  const lower = content.toLowerCase();
  const contextHint = contextMessages.length
    ? `Tomo en cuenta lo que ya hablamos (${contextMessages.length} mensajes recientes). `
    : '';
  const levelHint = {
    principiante: 'Te lo explico simple y paso a paso.',
    medio: 'Te doy una respuesta practica con prioridades claras.',
    pro: 'Voy directo a optimizacion, toma de decisiones y eficiencia.',
  }[normalized.level];

  if (lower.includes('recomienda') || lower.includes('juego') || lower.includes('gust')) {
    const picks = recommendationsForProfile(normalized).map((game) => game.title).join(', ');
    return `${contextHint}${levelHint} Por tu perfil (${normalized.level}, ${normalized.platform}, ${normalized.genres.join('/')}) te recomiendo: ${picks}. Si quieres, dime si prefieres competitivo, historia o casual y ajusto la lista.`;
  }

  if (lower.includes('lore') || lower.includes('historia')) {
    return `${contextHint}${levelHint} Para lore, separa la historia en: facciones, conflicto principal y motivacion del personaje. Dime el juego especifico y te hago un resumen sin spoilers o con spoilers, como prefieras.`;
  }

  if (lower.includes('mecanica') || lower.includes('build') || lower.includes('guia') || lower.includes('tip')) {
    const tip = tipsForProfile(normalized)[0];
    return `${contextHint}${levelHint} Tip principal: ${tip} Para una guia mas precisa necesito el juego, tu rol/personaje y que parte se te complica.`;
  }

  return `${contextHint}${levelHint} Puedo ayudarte con guias, tips, lore, mecanicas y recomendaciones. Segun tu perfil (${normalized.genres.join('/')} en ${normalized.platform}), empezaria por definir objetivo: mejorar rendimiento, elegir juego nuevo o entender una mecanica concreta.`;
}

app.use(cors());
app.use(express.json());

app.get('/covers/:id.svg', (req, res) => {
  const id = req.params.id.replace('.svg', '');
  const item =
    fullGameCatalog.find((game) => game.id === id) ||
    trends.find((trend) => trend.id === id) ||
    { title: 'LevelUp AI', tag: 'Gaming', genre: 'Catalog' };
  const subtitle = item.tag || item.genre || 'Gaming';
  const accent = item.accent || coverAccents[id] || '#00f2ff';

  res.type('image/svg+xml').send(renderCover(item.title, subtitle, accent));
});

app.get('/health', async (_req, res, next) => {
  try {
    await db.collection('_health').limit(1).get();
    res.json({ ok: true, database: 'firestore' });
  } catch (error) {
    next(error);
  }
});

app.get('/tasks', async (_req, res, next) => {
  try {
    const snapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get();
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

app.get('/dashboard', async (_req, res, next) => {
  try {
    const [tasksSnapshot, messagesSnapshot, profilesSnapshot] = await Promise.all([
      db.collection('tasks').get(),
      db.collection('messages').get(),
      db.collection('profiles').get(),
    ]);

    const tasks = tasksSnapshot.docs.map((doc) => doc.data());
    const completedTasks = tasks.filter((task) => task.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    const profile = await getActiveProfile();

    res.json({
      tasksTotal: tasks.length,
      completedTasks,
      pendingTasks,
      messagesTotal: messagesSnapshot.size,
      profilesTotal: profilesSnapshot.size,
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

app.get('/recommendations', async (_req, res, next) => {
  try {
    const profile = await getActiveProfile();
    res.json(recommendationsForProfile(profile));
  } catch (error) {
    next(error);
  }
});

app.get('/trends', (_req, res) => {
  res.json(trends.map(withCover));
});

app.get('/tips', async (_req, res, next) => {
  try {
    const profile = await getActiveProfile();
    res.json(tipsForProfile(profile));
  } catch (error) {
    next(error);
  }
});

app.post('/tasks', async (req, res, next) => {
  try {
    const { title, description = '' } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required' });
    }

    const docRef = await db.collection('tasks').add({
      title,
      description,
      completed: false,
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
    const allowed = ['title', 'description', 'completed'];
    const changes = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key)),
    );

    if (!Object.keys(changes).length) {
      return res.status(400).json({ error: 'No valid task fields provided' });
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
    await db.collection('tasks').doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/profiles', async (req, res, next) => {
  try {
    const { callsign, email, rank, level, genres = [], platform = 'PC' } = req.body;

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
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ id: docRef.id });
  } catch (error) {
    next(error);
  }
});

app.get('/profile', async (_req, res, next) => {
  try {
    res.json(await getActiveProfile());
  } catch (error) {
    next(error);
  }
});

app.put('/profile', async (req, res, next) => {
  try {
    const profile = normalizeProfile(req.body);
    const snapshot = await db.collection('profiles').orderBy('createdAt', 'desc').limit(1).get();
    const now = new Date();

    if (snapshot.empty) {
      const docRef = await db.collection('profiles').add({
        ...profile,
        rank: profile.level,
        createdAt: now,
        updatedAt: now,
      });

      return res.status(201).json({ id: docRef.id, ...profile });
    }

    const doc = snapshot.docs[0];
    await doc.ref.update({
      ...profile,
      rank: profile.level,
      updatedAt: now,
    });

    res.json({ id: doc.id, ...profile });
  } catch (error) {
    next(error);
  }
});

app.get('/profiles', async (_req, res, next) => {
  try {
    const snapshot = await db.collection('profiles').orderBy('createdAt', 'desc').limit(20).get();
    const profiles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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

app.get('/messages', async (_req, res, next) => {
  try {
    const snapshot = await db.collection('messages').orderBy('createdAt', 'asc').limit(50).get();
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(messages);
  } catch (error) {
    next(error);
  }
});

app.delete('/messages', async (_req, res, next) => {
  try {
    const snapshot = await db.collection('messages').limit(100).get();
    const batch = db.batch();

    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/messages', async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required' });
    }

    const batch = db.batch();
    const userMessage = db.collection('messages').doc();
    const assistantMessage = db.collection('messages').doc();
    const now = new Date();
    const [profile, contextSnapshot] = await Promise.all([
      getActiveProfile(),
      db.collection('messages').orderBy('createdAt', 'desc').limit(8).get(),
    ]);
    const contextMessages = contextSnapshot.docs.map((doc) => doc.data()).reverse();
    const assistantContent = buildAssistantResponse(content, profile, contextMessages);

    batch.set(userMessage, {
      role: 'user',
      content,
      profileSnapshot: profile,
      createdAt: now,
    });
    batch.set(assistantMessage, {
      role: 'assistant',
      content: assistantContent,
      profileSnapshot: profile,
      createdAt: new Date(now.getTime() + 1),
    });

    await batch.commit();

    res.status(201).json({
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      response: assistantContent,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
