/**
 * run-once migration: fix the broken slug index on the blogs collection
 *
 * Usage:
 *   node scripts/fixBlogSlug.js
 *
 * What it does:
 *   1. Drops the old unique non-sparse slug_1 index (the one causing E11000).
 *   2. Assigns a unique slug to every existing blog that has none.
 *   3. The new sparse unique index in Blog.js takes over from here.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const generateSlug = (title = '', id = '') => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
  // Use the document _id as the suffix so it's guaranteed unique
  return `${base}-${String(id).slice(-6)}-${Date.now()}`;
};

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('blogs');

  // ── Step 1: drop the old broken index ────────────────────────────────────
  try {
    await collection.dropIndex('slug_1');
    console.log('✅ Dropped old slug_1 index');
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('ℹ️  slug_1 index not found — skipping drop');
    } else {
      console.error('Error dropping index:', err.message);
    }
  }

  // ── Step 2: backfill slugs on documents that have none ───────────────────
  const docs = await collection.find({ slug: { $in: [null, ''] } }).toArray();
  console.log(`Found ${docs.length} document(s) with missing slug`);

  for (const doc of docs) {
    const slug = generateSlug(doc.title || 'blog', doc._id);
    await collection.updateOne({ _id: doc._id }, { $set: { slug } });
    console.log(`  Updated: "${doc.title}" → slug: ${slug}`);
  }

  console.log('✅ Migration complete');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});