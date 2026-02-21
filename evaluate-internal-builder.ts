import { generateBlocksFromTemplate } from './src/lib/blocks/internal-builder';

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
    const anim = (b as any).nameAnimation ? `[Anim: ${(b as any).nameAnimation}]` : '';
    const size = (b as any).blockSize ? `[Size: ${(b as any).blockSize}]` : '[Size: default]';

    if (b.type === 'scratch') details = `(Gift: ${(b as any).content})`;
    if (b.type === 'profile') details = `${anim}`;
    if (b.type === 'button') details = `(CTA URL: ${(b as any).url})`;
    if (b.type === 'map') details = `(Address: ${(b as any).address})`;
    if (b.type === 'video') details = `(Video URL: ${(b as any).url})`;
    if (b.type === 'text') details = `(Starts with: ${(b as any).content.slice(0, 30)}...)`;

    return `${b.type} ${size} ${details}`;
});

console.log('\nGENERATED STRUCTURE RHYTHM:');
summary.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log('\n----------------------------------------\n');
