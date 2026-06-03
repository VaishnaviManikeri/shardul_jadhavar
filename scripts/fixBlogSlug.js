/**
 * run-once migration: fix the broken slug index on the blogs collection
 *
 * Usage (run from your backend root where server.js lives):
 *   node scripts/fixBlogSlug.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// ── Auto-detect .env location ────────────────────────────────────────────────
// Tries the directory you run the script from, then one level up (monorepo case)
const envCandidates = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env'),
];
const envPath = envCandidates.find(fs.existsSync);
if (envPath) {
  require('dotenv').config({ path: envPath });
  console.log(`ℹ️  Loaded .env from: ${envPath}`);
} else {
  console.warn('⚠️  No .env file found — relying on existing process.env');
}

// ── Auto-detect the MongoDB URI env variable name ────────────────────────────
const MONGO_KEY_CANDIDATES = [
  'MONGO_URI', 'MONGODB_URI', 'DATABASE_URL', 'DB_URI',
  'MONGO_URL', 'MONGODB_URL', 'CONNECTION_STRING',
];
const mongoKey = MONGO_KEY_CANDIDATES.find((k) => process.env[k]);
const mongoUri = mongoKey ? process.env[mongoKey] : undefined;

if (!mongoUri) {
  console.error(
    '❌  Could not find a MongoDB URI in your environment.\n' +
    '    Tried these variable names: ' + MONGO_KEY_CANDIDATES.join(', ') + '\n' +
    '    To fix: run the script with the URI directly:\n' +
    '      MONGO_URI="mongodb+srv://..." node scripts/fixBlogSlug.js'
  );
  process.exit(1);
}
console.log(`ℹ️  Using env key: ${mongoKey}`);

// ── Slug generator (same logic as Blog.js model) ─────────────────────────────
const generateSlug = (title = '', id = '') => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
  return `${base}-${String(id).slice(-6)}-${Date.now()}`;
};

// ── Migration ─────────────────────────────────────────────────────────────────
async function migrate() {
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const collection = mongoose.connection.db.collection('blogs');

  // Step 1 — drop the old broken index
  try {
    await collection.dropIndex('slug_1');
    console.log('✅ Dropped old slug_1 index');
  } catch (err) {
    if (err.codeName === 'IndexNotFound' || err.code === 27) {
      console.log('ℹ️  slug_1 index not found — already clean, skipping drop');
    } else {
      // Non-fatal — log and continue
      console.warn('⚠️  Could not drop slug_1 index:', err.message);
    }
  }

  // Step 2 — backfill slugs on documents missing them
  const docs = await collection
    .find({ $or: [{ slug: null }, { slug: '' }, { slug: { $exists: false } }] })
    .toArray();
  console.log(`Found ${docs.length} document(s) with missing slug`);

  for (const doc of docs) {
    const slug = generateSlug(doc.title || 'blog', doc._id);
    await collection.updateOne({ _id: doc._id }, { $set: { slug } });
    console.log(`  ✔ "${doc.title}" → ${slug}`);
  }

  console.log('\n✅ Migration complete — you can now create blogs without duplicate key errors.');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});