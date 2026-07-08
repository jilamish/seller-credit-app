import { db } from './db.js';
import { hashPassword } from './auth.js';

const CLOSET_ITEMS = [
  { category: 'Top', color_name: 'Fuchsia pink', color_hex: '#ff1f7a', fabric: 'Satin', vibe: 'Date Night', occasion_tags: ['Date Night', 'Party'], brand: 'Zara', price: 1960, times_worn: 6, care: 'Hand wash cold · do not tumble dry · cool iron inside-out.' },
  { category: 'Bottom', color_name: 'Black', color_hex: '#1c1418', fabric: 'Crepe', vibe: 'Old Money', occasion_tags: ['Date Night', 'Office', 'Party'], brand: 'H&M', price: 2199, times_worn: 9, care: 'Dry clean only.' },
  { category: 'Top', color_name: 'White', color_hex: '#e9edf5', fabric: 'Cotton', vibe: 'Minimalist', occasion_tags: ['Office', 'WFH'], brand: 'Uniqlo', price: 1499, times_worn: 14, care: 'Machine wash cold, tumble dry low.' },
  { category: 'Bottom', color_name: 'Navy', color_hex: '#3a3f4d', fabric: 'Wool blend', vibe: 'Old Money', occasion_tags: ['Office'], brand: 'Marks & Spencer', price: 2899, times_worn: 11, care: 'Dry clean recommended.' },
  { category: 'Outerwear', color_name: 'Camel', color_hex: '#cf9d4f', fabric: 'Wool', vibe: 'Old Money', occasion_tags: ['Office', 'Travel'], brand: 'Mango', price: 4999, times_worn: 5, care: 'Dry clean only.' },
  { category: 'Top', color_name: 'Beige', color_hex: '#d9c3b0', fabric: 'Linen', vibe: 'Minimalist', occasion_tags: ['Office', 'WFH', 'Travel'], brand: 'COS', price: 1799, times_worn: 7, care: 'Machine wash cold.' },
  { category: 'Shoes', color_name: 'Nude blush', color_hex: '#f6e6ea', fabric: 'Leather', vibe: 'Glam', occasion_tags: ['Date Night', 'Party', 'Wedding Guest'], brand: 'Charles & Keith', price: 2499, times_worn: 4, care: 'Wipe clean, store with shoe trees.' },
  { category: 'Bag', color_name: 'Gold', color_hex: '#e8dcc6', fabric: 'Vegan leather', vibe: 'Glam', occasion_tags: ['Date Night', 'Party', 'Wedding Guest'], brand: 'Steve Madden', price: 3299, times_worn: 3, care: 'Spot clean only.' },
  { category: 'Dress', color_name: 'Plum', color_hex: '#7a2b4e', fabric: 'Satin', vibe: 'Glam', occasion_tags: ['Wedding Guest', 'Festive', 'Party'], brand: 'Mohey', price: 4599, times_worn: 2, care: 'Dry clean only.' },
  { category: 'Shoes', color_name: 'Charcoal', color_hex: '#3a3f4d', fabric: 'Suede', vibe: 'Streetwear', occasion_tags: ['Office', 'WFH'], brand: 'Bata', price: 1999, times_worn: 18, care: 'Brush clean, avoid water.' },
  { category: 'Top', color_name: 'Sage green', color_hex: '#b7d8c9', fabric: 'Cotton', vibe: 'Boho', occasion_tags: ['Travel', 'WFH'], brand: 'FabIndia', price: 1299, times_worn: 6, care: 'Hand wash cold.' },
  { category: 'Bottom', color_name: 'Denim blue', color_hex: '#8592b0', fabric: 'Denim', vibe: 'Streetwear', occasion_tags: ['Travel', 'Party', 'WFH'], brand: "Levi's", price: 3499, times_worn: 22, care: 'Machine wash cold, inside out.' },
  { category: 'Top', color_name: 'Black', color_hex: '#1c1418', fabric: 'Jersey', vibe: 'Minimalist', occasion_tags: ['Gym', 'WFH'], brand: 'Decathlon', price: 899, times_worn: 25, care: 'Machine wash warm.' },
  { category: 'Bottom', color_name: 'Charcoal', color_hex: '#3a3f4d', fabric: 'Spandex', vibe: 'Minimalist', occasion_tags: ['Gym'], brand: 'Nike', price: 2299, times_worn: 20, care: 'Machine wash cold.' },
  { category: 'Shoes', color_name: 'White', color_hex: '#e9edf5', fabric: 'Mesh', vibe: 'Streetwear', occasion_tags: ['Gym', 'Travel'], brand: 'Adidas', price: 4499, times_worn: 30, care: 'Wipe clean, air dry.' },
  { category: 'Dress', color_name: 'Gold', color_hex: '#e8dcc6', fabric: 'Sequin', vibe: 'Glam', occasion_tags: ['Festive', 'Party'], brand: 'Global Desi', price: 3899, times_worn: 3, care: 'Dry clean only.' },
  { category: 'Bag', color_name: 'Black', color_hex: '#1c1418', fabric: 'Leather', vibe: 'Old Money', occasion_tags: ['Office', 'Date Night'], brand: 'Caprese', price: 2799, times_worn: 15, care: 'Condition leather monthly.' },
  { category: 'Top', color_name: 'Lavender', color_hex: '#d9c3f0', fabric: 'Chiffon', vibe: 'Boho', occasion_tags: ['Date Night', 'Festive'], brand: 'Vero Moda', price: 1699, times_worn: 5, care: 'Hand wash cold.' },
  { category: 'Bottom', color_name: 'Cream', color_hex: '#f2d9b8', fabric: 'Cotton blend', vibe: 'Old Money', occasion_tags: ['Wedding Guest', 'Festive'], brand: 'Biba', price: 2199, times_worn: 4, care: 'Dry clean recommended.' },
  { category: 'Outerwear', color_name: 'Black', color_hex: '#1c1418', fabric: 'Leather', vibe: 'Streetwear', occasion_tags: ['Party', 'Travel'], brand: 'ONLY', price: 5499, times_worn: 8, care: 'Leather conditioner every 3 months.' },
];

const INFLUENCERS = [
  { handle: '@komalpandeyofficial', name: 'Komal Pandey', gradient: 'linear-gradient(150deg,#ff9ac2,#ff1f7a)' },
  { handle: '@masoomminawala', name: 'Masoom Minawala', gradient: 'linear-gradient(150deg,#d9c3f0,#8e6bc0)' },
  { handle: '@sejalkumar', name: 'Sejal Kumar', gradient: 'linear-gradient(150deg,#e8dcc6,#cf9d4f)' },
  { handle: '@aashnashroff', name: 'Aashna Shroff', gradient: 'linear-gradient(150deg,#b7d8c9,#4f8f76)' },
];

const LOOKS = [
  { influencer: 0, title: 'Satin slip midi', gradient: 'linear-gradient(150deg,#ff9ac2,#ff1f7a)', items: ['Satin slip dress', 'Gold hoops', 'Strappy heels'], price: 1299, platform: 'Myntra', trending: 1 },
  { influencer: 1, title: 'Soft power blazer set', gradient: 'linear-gradient(150deg,#d9c3f0,#8e6bc0)', items: ['Lavender blazer', 'White tee', 'Trousers'], price: 2199, platform: 'Ajio', trending: 0 },
  { influencer: 2, title: 'Gold hoop stack', gradient: 'linear-gradient(150deg,#e8dcc6,#cf9d4f)', items: ['Gold hoops', 'Layered necklace'], price: 499, platform: 'Meesho', trending: 1 },
  { influencer: 3, title: 'Festive gold drape', gradient: 'linear-gradient(150deg,#b7d8c9,#4f8f76)', items: ['Gold sequin dress', 'Nude heels'], price: 3899, platform: 'Myntra', trending: 0 },
];

const PRODUCTS = [
  { name: 'Bronze eye', brand: 'MARS', price: 399, category: 'makeup', color_hex: '#b5654a', undertone: 'Warm', premium: 0 },
  { name: 'Berry lip', brand: 'Sugar', price: 599, category: 'makeup', color_hex: '#9c3b52', undertone: 'Warm', premium: 0 },
  { name: 'Gold highlight', brand: 'Lakmé', price: 450, category: 'makeup', color_hex: '#cf9d4f', undertone: 'Warm', premium: 0 },
  { name: 'Rose eye', brand: 'MARS', price: 399, category: 'makeup', color_hex: '#c98fa0', undertone: 'Cool', premium: 0 },
  { name: 'Mauve lip', brand: 'Sugar', price: 549, category: 'makeup', color_hex: '#8a5468', undertone: 'Cool', premium: 0 },
  { name: 'Silver highlight', brand: 'Lakmé', price: 450, category: 'makeup', color_hex: '#dcdce6', undertone: 'Cool', premium: 0 },
  { name: 'Fuchsia Fever', brand: 'Faces Canada', price: 299, category: 'nail', color_hex: '#ff1f7a', undertone: null, premium: 0 },
  { name: 'Plum Noir', brand: 'Nykaa', price: 250, category: 'nail', color_hex: '#7a2b4e', undertone: null, premium: 0 },
  { name: 'Champagne Kiss', brand: 'Sephora', price: 525, category: 'nail', color_hex: '#e7d7b0', undertone: null, premium: 1 },
];

const GAP_ITEMS = [
  { name: 'Black tailored trousers', category: 'Bottom', color_hex: '#1c1418', occasion_tags: ['Office', 'Date Night', 'Party'], meesho: 849, myntra: 1299, ajio: 1099 },
  { name: 'Nude block heels', category: 'Shoes', color_hex: '#f6e6ea', occasion_tags: ['Office', 'Date Night', 'Wedding Guest'], meesho: 999, myntra: 1599, ajio: 1349 },
  { name: 'Strappy sandals', category: 'Shoes', color_hex: '#e8dcc6', occasion_tags: ['Party', 'Festive', 'Date Night'], meesho: 799, myntra: 1299, ajio: 1049 },
];

export function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount === 0) {
    const result = db
      .prepare(
        `INSERT INTO users (email, password_hash, name, style_tags, budget, platforms, skin_tone, undertone, makeup_vibe, declutter_notes, onboarding_step, onboarded)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 6, 1)`
      )
      .run(
        'demo@fairygodrobe.app',
        hashPassword('demo1234'),
        'Ananya',
        JSON.stringify(['Minimalist', 'Old Money', 'Glam']),
        15000,
        JSON.stringify(['Myntra', 'Meesho', 'Ajio']),
        '#e6b98f',
        'Warm',
        JSON.stringify(['Natural', 'No-makeup-makeup']),
        'Donating anything unworn for 12+ months.'
      );
    const userId = result.lastInsertRowid;

    const insertItem = db.prepare(
      `INSERT INTO closet_items (user_id, category, color_name, color_hex, fabric, vibe, occasion_tags, brand, price, times_worn, care_instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const item of CLOSET_ITEMS) {
      insertItem.run(
        userId,
        item.category,
        item.color_name,
        item.color_hex,
        item.fabric,
        item.vibe,
        JSON.stringify(item.occasion_tags),
        item.brand,
        item.price,
        item.times_worn,
        item.care
      );
    }

    db.prepare(
      `INSERT INTO notifications (user_id, icon, title, body) VALUES (?, ?, ?, ?)`
    ).run(userId, '✨', "Priya just posted a look you'd love 💕", "92% of it is already in your closet — tap to recreate.");
    db.prepare(
      `INSERT INTO notifications (user_id, icon, title, body) VALUES (?, ?, ?, ?)`
    ).run(userId, '🔥', 'Trending today: satin slip dresses', '6 shoppable picks under ₹1,500 →');
  }

  const influencerCount = db.prepare('SELECT COUNT(*) AS c FROM influencers').get().c;
  if (influencerCount === 0) {
    const insertInfluencer = db.prepare('INSERT INTO influencers (handle, name, gradient) VALUES (?, ?, ?)');
    const ids = INFLUENCERS.map((i) => insertInfluencer.run(i.handle, i.name, i.gradient).lastInsertRowid);

    const insertLook = db.prepare(
      `INSERT INTO looks (influencer_id, title, gradient, item_descriptions, price, platform, trending) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const look of LOOKS) {
      insertLook.run(ids[look.influencer], look.title, look.gradient, JSON.stringify(look.items), look.price, look.platform, look.trending);
    }

    const demoUser = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();
    if (demoUser) {
      const follow = db.prepare('INSERT OR IGNORE INTO user_follows (user_id, influencer_id) VALUES (?, ?)');
      follow.run(demoUser.id, ids[0]);
      follow.run(demoUser.id, ids[2]);
    }
  }

  const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (productCount === 0) {
    const insertProduct = db.prepare(
      `INSERT INTO products (name, brand, price, category, color_hex, undertone, premium) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const p of PRODUCTS) insertProduct.run(p.name, p.brand, p.price, p.category, p.color_hex, p.undertone, p.premium);
  }

  const gapCount = db.prepare('SELECT COUNT(*) AS c FROM gap_items').get().c;
  if (gapCount === 0) {
    const insertGap = db.prepare(
      `INSERT INTO gap_items (name, category, color_hex, occasion_tags, price_meesho, price_myntra, price_ajio) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const g of GAP_ITEMS) insertGap.run(g.name, g.category, g.color_hex, JSON.stringify(g.occasion_tags), g.meesho, g.myntra, g.ajio);
  }
}
