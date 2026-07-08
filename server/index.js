import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { db, dbPathInfo, uploadsPath } from './db.js';
import { hashPassword, checkPassword, createSession, requireAuth, publicUser } from './auth.js';
import { seedDatabase } from './seed.js';

seedDatabase();

process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');

const app = express();
const PORT = process.env.PORT || 8090;
const upload = multer({ dest: uploadsPath(), limits: { fileSize: 8 * 1024 * 1024 } });

app.use(express.json());
app.use('/uploads', express.static(uploadsPath()));

const OCCASIONS = ['Office', 'Date Night', 'Wedding Guest', 'Festive', 'Travel', 'Gym', 'WFH', 'Party'];
const SUGGESTED_SHOES = {
  Office: 'nude block heels', 'Date Night': 'strappy heels', 'Wedding Guest': 'strappy heels',
  Festive: 'juttis', Travel: 'white sneakers', Gym: 'training shoes', WFH: 'slides', Party: 'strappy heels',
};

// ---------- health ----------

app.get('/api/health', (req, res) => {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r) => r.name);
    const counts = {};
    for (const t of ['users', 'closet_items', 'outfits', 'influencers', 'looks', 'products', 'gap_items', 'chat_messages']) {
      if (tables.includes(t)) counts[t] = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
    }
    res.json({ status: 'ok', db: { path: dbPathInfo(), readable: true, tables, rowCounts: counts }, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------- auth ----------

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ status: 'error', message: 'Name, email and password are required' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(400).json({ status: 'error', message: 'An account with this email already exists' });

    const result = db
      .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
      .run(email.toLowerCase(), hashPassword(password), name);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = createSession(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email || '').toLowerCase());
  if (!user || !checkPassword(password, user.password_hash)) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }
  const token = createSession(user.id);
  res.json({ token, user: publicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json(publicUser(req.user)));

// ---------- onboarding ----------

app.post('/api/onboarding/step', requireAuth, (req, res) => {
  const { step, data } = req.body;
  const u = req.user;
  if (step === 1) db.prepare('UPDATE users SET style_tags = ? WHERE id = ?').run(JSON.stringify(data.styleTags || []), u.id);
  if (step === 2) db.prepare('UPDATE users SET budget = ? WHERE id = ?').run(data.budget || null, u.id);
  if (step === 3) db.prepare('UPDATE users SET platforms = ? WHERE id = ?').run(JSON.stringify(data.platforms || []), u.id);
  if (step === 4) {
    db.prepare('UPDATE users SET skin_tone = ?, undertone = ?, makeup_vibe = ? WHERE id = ?').run(
      data.skinTone || null, data.undertone || null, JSON.stringify(data.makeupVibe || []), u.id
    );
  }
  if (step === 5) db.prepare('UPDATE users SET declutter_notes = ? WHERE id = ?').run(data.declutterNotes || null, u.id);

  const nextStep = step === 6 ? 6 : step + 1;
  const onboarded = step === 6 ? 1 : 0;
  db.prepare('UPDATE users SET onboarding_step = ?, onboarded = ? WHERE id = ?').run(nextStep, onboarded, u.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(u.id);
  res.json(publicUser(updated));
});

// ---------- closet ----------

function itemToJson(item) {
  return { ...item, occasion_tags: JSON.parse(item.occasion_tags || '[]'), costPerWear: item.times_worn > 0 ? Math.round(item.price / item.times_worn) : item.price };
}

app.get('/api/closet', requireAuth, (req, res) => {
  const { category, occasion, q } = req.query;
  let items = db.prepare('SELECT * FROM closet_items WHERE user_id = ? ORDER BY date_added DESC').all(req.user.id).map(itemToJson);
  if (category && category !== 'All') items = items.filter((i) => i.category === category);
  if (occasion) items = items.filter((i) => i.occasion_tags.includes(occasion));
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter((i) => [i.category, i.color_name, i.fabric, i.brand, i.vibe].some((f) => (f || '').toLowerCase().includes(needle)));
  }
  res.json({ items, total: db.prepare('SELECT COUNT(*) AS c FROM closet_items WHERE user_id = ?').get(req.user.id).c });
});

app.get('/api/closet/:id', requireAuth, (req, res) => {
  const item = db.prepare('SELECT * FROM closet_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ status: 'error', message: 'Item not found' });
  res.json(itemToJson(item));
});

app.patch('/api/closet/:id/wear', requireAuth, (req, res) => {
  db.prepare('UPDATE closet_items SET times_worn = times_worn + 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ status: 'ok' });
});

const VIBE_POOL = ['Date Night', 'Office', 'Party', 'Festive', 'Travel'];
const FABRIC_POOL = ['Satin', 'Cotton', 'Denim', 'Linen', 'Crepe', 'Wool'];
const CATEGORY_POOL = ['Top', 'Bottom', 'Dress', 'Shoes', 'Bag', 'Outerwear'];

async function analyzeImage(filePath) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const fs = await import('node:fs');
      const imageData = fs.readFileSync(filePath).toString('base64');
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageData } },
              { type: 'text', text: 'Identify this clothing item. Reply ONLY with compact JSON: {"category":"Top|Bottom|Dress|Shoes|Bag|Outerwear","color_name":"...","color_hex":"#rrggbb","fabric":"...","vibe":"..."}' },
            ],
          }],
        }),
      });
      const json = await resp.json();
      const text = json.content?.[0]?.text || '{}';
      const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      if (parsed.category) return parsed;
    } catch (err) {
      // fall through to mock
    }
  }
  const seed = filePath.length;
  return {
    category: CATEGORY_POOL[seed % CATEGORY_POOL.length],
    color_name: 'Fuchsia pink',
    color_hex: '#ff1f7a',
    fabric: FABRIC_POOL[seed % FABRIC_POOL.length],
    vibe: VIBE_POOL[seed % VIBE_POOL.length],
  };
}

app.post('/api/closet/analyze', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No photo uploaded' });
    const tags = await analyzeImage(req.file.path);
    const goesWith = db
      .prepare('SELECT * FROM closet_items WHERE user_id = ?')
      .all(req.user.id)
      .filter((i) => JSON.parse(i.occasion_tags || '[]').includes(tags.vibe)).length;

    res.json({
      imagePath: `/uploads/${path.basename(req.file.path)}`,
      suggested: { ...tags, occasion_tags: [tags.vibe] },
      goesWith,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/closet', requireAuth, (req, res) => {
  try {
    const { imagePath, category, color_name, color_hex, fabric, vibe, occasion_tags, brand, price, care_instructions } = req.body;
    const result = db
      .prepare(
        `INSERT INTO closet_items (user_id, image_path, category, color_name, color_hex, fabric, vibe, occasion_tags, brand, price, care_instructions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(req.user.id, imagePath || null, category, color_name, color_hex || '#cf9d4f', fabric, vibe, JSON.stringify(occasion_tags || []), brand || null, Number(price) || 0, care_instructions || null);
    res.status(201).json(itemToJson(db.prepare('SELECT * FROM closet_items WHERE id = ?').get(result.lastInsertRowid)));
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------- weather ----------

app.get('/api/weather', async (req, res) => {
  try {
    const resp = await fetch('https://api.open-meteo.com/v1/forecast?latitude=19.076&longitude=72.877&current=temperature_2m,relative_humidity_2m,weather_code');
    const json = await resp.json();
    const temp = Math.round(json.current?.temperature_2m ?? 30);
    const humidity = json.current?.relative_humidity_2m ?? 60;
    const tip = humidity > 65 ? 'humid — breathable picks first.' : temp > 32 ? 'hot — go light & loose.' : 'pleasant — anything works today.';
    res.json({ city: 'Mumbai', temp, humidity, tip });
  } catch (err) {
    res.json({ city: 'Mumbai', temp: 31, humidity: 70, tip: 'humid — breathable picks first.' });
  }
});

// ---------- occasion / outfit generation ----------

function outfitSlots(items, occasion) {
  const matches = items.filter((i) => JSON.parse(i.occasion_tags || '[]').includes(occasion));
  return {
    tops: matches.filter((i) => i.category === 'Top'),
    bottoms: matches.filter((i) => i.category === 'Bottom'),
    dresses: matches.filter((i) => i.category === 'Dress'),
    shoes: matches.filter((i) => i.category === 'Shoes'),
    bags: matches.filter((i) => i.category === 'Bag'),
    outerwear: matches.filter((i) => i.category === 'Outerwear'),
  };
}

function buildOutfitCombos(items, occasion) {
  const slots = outfitSlots(items, occasion);
  const combos = [];
  const NAMES = ['Crisp & classic', 'Soft power', 'Effortless edit', 'Golden hour', 'Main character'];

  slots.dresses.slice(0, 2).forEach((dress, idx) => {
    const shoe = slots.shoes[idx % Math.max(slots.shoes.length, 1)];
    const bag = slots.bags[idx % Math.max(slots.bags.length, 1)];
    const parts = { Dress: dress, Shoes: shoe, Bag: bag };
    combos.push(buildCombo(parts, occasion, NAMES[combos.length % NAMES.length]));
  });

  slots.tops.slice(0, 2).forEach((top, idx) => {
    const bottom = slots.bottoms[idx % Math.max(slots.bottoms.length, 1)];
    const shoe = slots.shoes[idx % Math.max(slots.shoes.length, 1)];
    const bag = slots.bags[idx % Math.max(slots.bags.length, 1)];
    const parts = { Top: top, Bottom: bottom, Shoes: shoe, Bag: bag };
    combos.push(buildCombo(parts, occasion, NAMES[combos.length % NAMES.length]));
  });

  return combos.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

function buildCombo(parts, occasion, name) {
  const slotNames = Object.keys(parts);
  const filled = slotNames.filter((k) => parts[k]);
  const missingSlot = slotNames.find((k) => !parts[k]);
  const matchScore = Math.round((filled.length / slotNames.length) * 100);
  return {
    name,
    occasion,
    items: filled.map((k) => ({ slot: k, ...itemToJson(parts[k]) })),
    matchScore,
    missingItem: missingSlot ? (SUGGESTED_SHOES[occasion] && missingSlot === 'Shoes' ? SUGGESTED_SHOES[occasion] : `a ${missingSlot.toLowerCase()}`) : null,
  };
}

app.get('/api/occasions', (req, res) => res.json(OCCASIONS));

app.get('/api/occasions/:occasion/outfits', requireAuth, (req, res) => {
  const items = db.prepare('SELECT * FROM closet_items WHERE user_id = ?').all(req.user.id);
  const combos = buildOutfitCombos(items, req.params.occasion);
  res.json(combos);
});

app.post('/api/outfits', requireAuth, (req, res) => {
  const { name, occasion, itemIds, matchScore, missingItem } = req.body;
  const result = db
    .prepare('INSERT INTO outfits (user_id, name, occasion, item_ids, match_score, missing_item, saved) VALUES (?, ?, ?, ?, ?, ?, 1)')
    .run(req.user.id, name, occasion, JSON.stringify(itemIds || []), matchScore || 0, missingItem || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/outfits/:id', requireAuth, (req, res) => {
  const outfit = db.prepare('SELECT * FROM outfits WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!outfit) return res.status(404).json({ status: 'error', message: 'Outfit not found' });
  const itemIds = JSON.parse(outfit.item_ids || '[]');
  const items = itemIds.map((id) => itemToJson(db.prepare('SELECT * FROM closet_items WHERE id = ?').get(id))).filter(Boolean);
  res.json({ ...outfit, items });
});

app.post('/api/outfits/:id/wear', requireAuth, (req, res) => {
  const outfit = db.prepare('SELECT * FROM outfits WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!outfit) return res.status(404).json({ status: 'error', message: 'Outfit not found' });
  const itemIds = JSON.parse(outfit.item_ids || '[]');
  const bump = db.prepare('UPDATE closet_items SET times_worn = times_worn + 1 WHERE id = ?');
  itemIds.forEach((id) => bump.run(id));
  db.prepare("UPDATE outfits SET worn_at = datetime('now') WHERE id = ?").run(outfit.id);
  res.json({ status: 'ok' });
});

// ---------- beauty pairing ----------

app.get('/api/outfits/:id/makeup', requireAuth, (req, res) => {
  const outfit = db.prepare('SELECT * FROM outfits WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!outfit) return res.status(404).json({ status: 'error', message: 'Outfit not found' });
  const undertone = req.user.undertone || 'Warm';
  const products = db.prepare('SELECT * FROM products WHERE category = ? AND (undertone = ? OR undertone IS NULL) LIMIT 3').all('makeup', undertone);
  const style = undertone === 'Warm' ? 'Soft glam, warm bronze' : undertone === 'Cool' ? 'Soft glam, cool mauve' : 'Soft glam, neutral rose';
  res.json({
    style,
    description: `Dewy base, ${undertone === 'Warm' ? 'bronze smoked liner, a your-lips-but-better berry' : 'rose-taupe liner, a your-lips-but-better mauve'}. Made for your ${undertone.toLowerCase()} undertone.`,
    products,
  });
});

app.get('/api/outfits/:id/nails', requireAuth, (req, res) => {
  const outfit = db.prepare('SELECT * FROM outfits WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!outfit) return res.status(404).json({ status: 'error', message: 'Outfit not found' });
  const products = db.prepare('SELECT * FROM products WHERE category = ? ORDER BY premium ASC LIMIT 3').all('nail');
  res.json({ products });
});

// ---------- influencers ----------

app.get('/api/influencers', requireAuth, (req, res) => {
  const { q } = req.query;
  let list = db.prepare('SELECT * FROM influencers').all();
  if (q) list = list.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()) || i.handle.toLowerCase().includes(q.toLowerCase()));
  const follows = new Set(db.prepare('SELECT influencer_id FROM user_follows WHERE user_id = ?').all(req.user.id).map((r) => r.influencer_id));
  res.json(list.map((i) => ({ ...i, following: follows.has(i.id) })));
});

app.post('/api/influencers/:id/follow', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT 1 FROM user_follows WHERE user_id = ? AND influencer_id = ?').get(req.user.id, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM user_follows WHERE user_id = ? AND influencer_id = ?').run(req.user.id, req.params.id);
    res.json({ following: false });
  } else {
    db.prepare('INSERT INTO user_follows (user_id, influencer_id) VALUES (?, ?)').run(req.user.id, req.params.id);
    res.json({ following: true });
  }
});

function matchAgainstCloset(descriptions, closetItems) {
  const haystacks = closetItems.map((i) => `${i.category} ${i.color_name} ${i.fabric} ${i.vibe} ${i.brand}`.toLowerCase());
  return descriptions.map((desc) => {
    const words = desc.toLowerCase().split(/\s+/);
    const owned = closetItems.find((i, idx) => words.some((w) => w.length > 3 && haystacks[idx].includes(w)));
    return { description: desc, owned: !!owned, ownedItem: owned ? itemToJson(owned) : null };
  });
}

app.get('/api/feed', requireAuth, (req, res) => {
  const followedIds = db.prepare('SELECT influencer_id FROM user_follows WHERE user_id = ?').all(req.user.id).map((r) => r.influencer_id);
  const closetItems = db.prepare('SELECT * FROM closet_items WHERE user_id = ?').all(req.user.id);
  const looks = followedIds.length
    ? db.prepare(`SELECT l.*, i.handle, i.name AS influencer_name FROM looks l JOIN influencers i ON i.id = l.influencer_id WHERE l.influencer_id IN (${followedIds.map(() => '?').join(',')})`).all(...followedIds)
    : [];

  const scored = looks.map((look) => {
    const descs = JSON.parse(look.item_descriptions || '[]');
    const matched = matchAgainstCloset(descs, closetItems);
    const ownedCount = matched.filter((m) => m.owned).length;
    const score = descs.length ? Math.max(35, Math.round((ownedCount / descs.length) * 100)) : 50;
    return { ...look, item_descriptions: descs, matchScore: score };
  });

  res.json(scored);
});

app.get('/api/looks/:id/recreate', requireAuth, (req, res) => {
  const look = db.prepare('SELECT l.*, i.handle, i.name AS influencer_name FROM looks l JOIN influencers i ON i.id = l.influencer_id WHERE l.id = ?').get(req.params.id);
  if (!look) return res.status(404).json({ status: 'error', message: 'Look not found' });
  const closetItems = db.prepare('SELECT * FROM closet_items WHERE user_id = ?').all(req.user.id);
  const descs = JSON.parse(look.item_descriptions || '[]');
  const matched = matchAgainstCloset(descs, closetItems);
  res.json({ ...look, item_descriptions: descs, pieces: matched, ownedCount: matched.filter((m) => m.owned).length, totalCount: matched.length });
});

app.get('/api/trending', requireAuth, (req, res) => {
  const looks = db.prepare('SELECT l.*, i.handle FROM looks l JOIN influencers i ON i.id = l.influencer_id WHERE l.trending = 1').all();
  res.json(looks.map((l) => ({ ...l, item_descriptions: JSON.parse(l.item_descriptions || '[]') })));
});

app.get('/api/notifications', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id));
});

// ---------- gap analysis ----------

function candidateImpact(closetItems, gapItem) {
  const tags = JSON.parse(gapItem.occasion_tags || '[]');
  const complementaryCategories = { Top: ['Bottom', 'Shoes', 'Bag'], Bottom: ['Top', 'Shoes', 'Bag'], Shoes: ['Top', 'Bottom', 'Bag'], Bag: ['Top', 'Bottom', 'Shoes'], Dress: ['Shoes', 'Bag'], Outerwear: ['Top', 'Bottom'] };
  const needed = complementaryCategories[gapItem.category] || [];
  let count = 0;
  for (const tag of tags) {
    for (const item of closetItems) {
      if (needed.includes(item.category) && JSON.parse(item.occasion_tags || '[]').includes(tag)) count++;
    }
  }
  return count;
}

app.get('/api/gap', requireAuth, (req, res) => {
  const closetItems = db.prepare('SELECT * FROM closet_items WHERE user_id = ?').all(req.user.id);
  const gapItems = db.prepare('SELECT * FROM gap_items').all();
  const scored = gapItems.map((g) => ({ ...g, occasion_tags: JSON.parse(g.occasion_tags || '[]'), unlocked: candidateImpact(closetItems, g) }));
  scored.sort((a, b) => b.unlocked - a.unlocked);
  res.json(scored[0] || null);
});

app.get('/api/gap/:id/price', requireAuth, (req, res) => {
  const gapItem = db.prepare('SELECT * FROM gap_items WHERE id = ?').get(req.params.id);
  if (!gapItem) return res.status(404).json({ status: 'error', message: 'Item not found' });
  const options = [
    { platform: 'Meesho', price: gapItem.price_meesho, delivery: '3 days' },
    { platform: 'Ajio', price: gapItem.price_ajio, delivery: '2 days' },
    { platform: 'Myntra', price: gapItem.price_myntra, delivery: '4 days' },
  ].sort((a, b) => a.price - b.price);
  const savings = options[options.length - 1].price - options[0].price;
  res.json({ item: { ...gapItem, occasion_tags: JSON.parse(gapItem.occasion_tags || '[]') }, options, best: options[0], savings });
});

app.post('/api/gap/:id/purchase', requireAuth, (req, res) => {
  const gapItem = db.prepare('SELECT * FROM gap_items WHERE id = ?').get(req.params.id);
  if (!gapItem) return res.status(404).json({ status: 'error', message: 'Item not found' });

  const result = db
    .prepare(`INSERT INTO closet_items (user_id, category, color_name, color_hex, fabric, vibe, occasion_tags, brand, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(req.user.id, gapItem.category, gapItem.name, gapItem.color_hex, 'Blend', 'Versatile', gapItem.occasion_tags, 'Meesho', gapItem.price_meesho);

  const closetItems = db.prepare('SELECT * FROM closet_items WHERE user_id = ?').all(req.user.id);
  const tags = JSON.parse(gapItem.occasion_tags || '[]');
  const unlockedOutfits = tags.flatMap((occ) => buildOutfitCombos(closetItems, occ).filter((c) => c.matchScore === 100)).slice(0, 6);

  res.status(201).json({ status: 'ok', newItemId: result.lastInsertRowid, unlockedOutfits });
});

// ---------- chat ----------

function occasionFromMessage(message) {
  const m = message.toLowerCase();
  if (/(dinner|date|rooftop|romantic)/.test(m)) return 'Date Night';
  if (/(office|work|meeting)/.test(m)) return 'Office';
  if (/(wedding|shaadi)/.test(m)) return 'Wedding Guest';
  if (/(festive|diwali|puja|navratri)/.test(m)) return 'Festive';
  if (/(travel|trip|flight|vacation)/.test(m)) return 'Travel';
  if (/(gym|workout|yoga)/.test(m)) return 'Gym';
  if (/(home|wfh|lounge)/.test(m)) return 'WFH';
  if (/(party|club|night out)/.test(m)) return 'Party';
  return null;
}

function describeItem(item) {
  return `your ${item.color_name.toLowerCase()} ${item.fabric ? item.fabric.toLowerCase() + ' ' : ''}${item.category.toLowerCase()}`;
}

async function generateChatReply(user, message, closetItems) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const closetSummary = closetItems.map((i) => `${i.category}: ${i.color_name} ${i.fabric || ''} (${JSON.parse(i.occasion_tags || '[]').join(', ')})`).join('\n');
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 250,
          system: `You are "Your Fairy Godmother", a warm, witty personal stylist. Speak in short, stylish sentences with light emoji. The user's closet:\n${closetSummary}\n\nAlways reference specific real items from their closet by description when recommending outfits. Never invent items not in the list.`,
          messages: [{ role: 'user', content: message }],
        }),
      });
      const json = await resp.json();
      const text = json.content?.[0]?.text;
      if (text) return text;
    } catch (err) {
      // fall through to rule-based
    }
  }

  const occasion = occasionFromMessage(message);
  if (occasion) {
    const combos = buildOutfitCombos(closetItems, occasion);
    if (combos.length && combos[0].items.length) {
      const names = combos[0].items.map((i) => describeItem(i));
      const joined = names.length > 1 ? names.slice(0, -1).join(', ') + ' with ' + names[names.length - 1] : names[0];
      return `For ${occasion.toLowerCase()}, try ${joined}. ${combos[0].missingItem ? `You're just missing ${combos[0].missingItem} to complete it. ✨` : "It's a full look already in your closet. ✨"}`;
    }
    return `I don't have quite enough in your closet tagged for ${occasion.toLowerCase()} yet — add a few pieces and I'll style it in seconds. 💫`;
  }

  const favorites = [...closetItems].sort((a, b) => b.times_worn - a.times_worn).slice(0, 2);
  if (favorites.length) {
    return `Tell me the occasion and I'll build the look! In the meantime, ${describeItem(favorites[0])} is one of your most-worn pieces — always a safe, stylish bet. 💕`;
  }
  return "Add a few pieces to your closet and I'll start styling you immediately! 💫";
}

app.get('/api/chat', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC').all(req.user.id));
});

app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ status: 'error', message: 'Message required' });

    db.prepare("INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'user', ?)").run(req.user.id, message);
    const closetItems = db.prepare('SELECT * FROM closet_items WHERE user_id = ?').all(req.user.id);
    const reply = await generateChatReply(req.user, message, closetItems);
    db.prepare("INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'assistant', ?)").run(req.user.id, reply);

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use(express.static(clientDist));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Unhandled route error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
