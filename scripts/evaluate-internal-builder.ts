/**
 * One-off script to evaluate internal block builder. Run from project root:
 * npx tsx scripts/evaluate-internal-builder.ts
 * or: node --loader ts-node/esm scripts/evaluate-internal-builder.ts
 */
import { generateBlocksFromTemplate } from '../src/lib/blocks/internal-builder';

const mockTemplate = [
    { type: 'profile', id: 'tmpl-profile' }
];

const mockUserInput = {
    name: 'Иван Иванов',
    bio: 'Креативный дизайн и маркетинг. Приходите ко мне за идеями.',
    contacts: '+7 777 123 45 67\nг. Алматы, пр. Абая 10, оф. 204\ntest@mail.ru',
    services: 'Архитектурный аудит\nРазработка стратегии\nОбучение команды. Скидка 15% на первый звонок!',
    socials: 'inst: @ivan, youtube',
    mediaLinks: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
};

console.log('Testing with Gamification (Scratch, Typing Animation) and Responsive Grid (blockSize):');
const generated = generateBlocksFromTemplate(mockTemplate, mockUserInput);

const summary = generated.map(b => {
    let details = '';
    const anim = (b as Record<string, unknown>).nameAnimation ? `[Anim: ${(b as Record<string, unknown>).nameAnimation}]` : '';
    const size = (b as Record<string, unknown>).blockSize ? `[Size: ${(b as Record<string, unknown>).blockSize}]` : '[Size: default]';

    if (b.type === 'scratch') details = `(Gift: ${(b as Record<string, unknown>).content})`;
    if (b.type === 'profile') details = `${anim}`;
    if (b.type === 'button') details = `(CTA URL: ${(b as Record<string, unknown>).url})`;
    if (b.type === 'map') details = `(Address: ${(b as Record<string, unknown>).address})`;
    if (b.type === 'video') details = `(Video URL: ${(b as Record<string, unknown>).url})`;
    if (b.type === 'text') details = `(Starts with: ${((b as Record<string, unknown>).content as string)?.slice(0, 30)}...)`;

    return `${b.type} ${size} ${details}`;
});

console.log('\nGENERATED STRUCTURE RHYTHM:');
summary.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log('\n----------------------------------------\n');
