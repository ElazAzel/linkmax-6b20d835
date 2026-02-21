import { generateBlocksFromTemplate } from './src/lib/blocks/internal-builder';

const mockTemplate = [
    { type: 'profile', id: 'tmpl-profile' }
];

const mockUserInput = {
    name: 'Иван Иванов',
    bio: 'Консультирую стартапы. Записаться на сессию можно тут: https://calendly.com/ivan',
    contacts: '+7 777 123 45 67\nг. Алматы, пр. Абая 10, оф. 204\ntest@mail.ru',
    services: 'Архитектурный аудит\nРазработка стратегии\nОбучение команды',
    socials: 'inst: @ivan, youtube',
    mediaLinks: 'https://youtube.com/watch?v=dQw4w9WgXcQ, https://i.imgur.com/example.jpg, https://my-portfolio.com'
};

console.log('Testing with advanced NLP-like extractors (CTA, Map, Media, Text List, Separators):');
const generated = generateBlocksFromTemplate(mockTemplate, mockUserInput);

// To avoid printing huge JSON strings, we'll map to just types and key fields to verify structure
const summary = generated.map(b => {
    let details = '';
    if (b.type === 'button') details = `(CTA URL: ${(b as any).url})`;
    if (b.type === 'map') details = `(Address: ${(b as any).address})`;
    if (b.type === 'video') details = `(Video URL: ${(b as any).url})`;
    if (b.type === 'image') details = `(Image URL: ${(b as any).url})`;
    if (b.type === 'text') details = `(Starts with: ${(b as any).content.slice(0, 30)}...)`;

    return `${b.type} ${details}`;
});

console.log('\nGENERATED STRUCTURE RHYTHM:');
summary.forEach((line, i) => console.log(`${i + 1}. ${line}`));

console.log('\n----------------------------------------\n');
