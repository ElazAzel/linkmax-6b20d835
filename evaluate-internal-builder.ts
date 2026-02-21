import { generateBlocksFromTemplate } from './src/lib/blocks/internal-builder';

const mockTemplate = [
    { type: 'profile', id: 'template-profile' },
    { type: 'text', id: 'template-text', content: '' },
    { type: 'catalog', id: 'template-catalog', title: 'Services', items: [] },
    { type: 'messenger', id: 'template-messenger', title: 'Let\'s talk', messengers: [] },
    { type: 'socials', id: 'template-socials', title: 'Follow me', platforms: [] }
];

const mockUserInput = {
    name: 'Иван Иванов',
    bio: 'Профессиональный дизайнер',
    contacts: '+7 777 123 45 67, test@mail.ru, тг: @ivan_design',
    services: 'Ремонт квартир - 15000 тг\nДизайн интерьера: 50 000 руб\nКонсультация - бесплатно',
    socials: 'inst: @ivan, https://tiktok.com/@ivandesign, youtube',
    mediaLinks: 'https://portfolio.com'
};

console.log('Testing with advanced NLP-like extractors:');
const generated1 = generateBlocksFromTemplate(mockTemplate, mockUserInput);
console.log(JSON.stringify(generated1, null, 2));

console.log('\n----------------------------------------\n');

console.log('Testing with empty template (should create smart fallbacks):');
const generated2 = generateBlocksFromTemplate([], mockUserInput);
console.log(JSON.stringify(generated2, null, 2));
