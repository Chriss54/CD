import 'dotenv/config';
import db from '../src/lib/db';
import { extractPlainText } from '../src/lib/tiptap-utils';

async function backfillPlainText() {
  console.log('Starting plainText backfill...');

  // Get all posts without plainText
  const posts = await db.post.findMany({
    where: { plainText: null },
    select: { id: true, content: true },
  });

  console.log(`Found ${posts.length} posts to backfill`);

  let updated = 0;
  for (const post of posts) {
    const plainText = extractPlainText(post.content);
    await db.post.update({
      where: { id: post.id },
      data: { plainText },
    });
    updated++;
    if (updated % 100 === 0) {
      console.log(`Updated ${updated}/${posts.length} posts`);
    }
  }

  console.log(`Backfill complete. Updated ${updated} posts.`);
}

backfillPlainText()
  .catch(console.error)
  .finally(() => db.$disconnect());
