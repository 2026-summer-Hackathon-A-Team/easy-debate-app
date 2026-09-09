import { prisma } from './prisma.js';

/** モラル違反カテゴリ */
const categories = [
  { id: 1, category: '対戦中のモラル違反' },
  { id: 2, category: 'お礼でのモラル違反' },
  { id: 3, category: '2連続チャットなし' },
  { id: 4, category: '離脱' },
];

const main = async (): Promise<void> => {
  for (const c of categories) {
    // 既に存在する場合は更新、なければ作成（本番でも安全に実行できる）
    await prisma.moralViolationCategory.upsert({
      where: { id: c.id },
      update: { category: c.category },
      create: c,
    });
  }
  console.log('moral_violation_category seeded');
};

await main();
await prisma.$disconnect();
