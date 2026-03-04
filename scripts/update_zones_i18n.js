import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '../src/i18n/locales');

const zonesEN = {
  "dashboard": {
    "trendPlus12": "+12% from last month",
    "loadMore": "Load More",
    "conversion": "Conversion",
    "averageCheck": "Average Check",
    "cycleTime": "Cycle Time"
  },
  "contacts": {
    "title": "Contacts",
    "company": "Company",
    "position": "Position",
    "address": "Address",
    "generalNotes": "General Notes",
    "tags": "Tags",
    "phone": "Phone",
    "email": "Email",
    "noNotes": "No activities recorded yet",
    "addNotePlaceholder": "Write a note...",
    "noDeals": "No deals linked",
    "noTasks": "No tasks linked",
    "pipeline": "Pipeline",
    "openTasks": "Open tasks",
    "confirmDelete": "Delete contact?",
    "deleteWarning": "This will permanently delete {{name}}. Linked deals and tasks won't be deleted.",
    "updated": "Contact updated",
    "deleted": "Contact deleted"
  },
  "deals": {
    "title": "Deals",
    "value": "Value",
    "stage": "Stage",
    "nextStep": "Next step",
    "won": "Won",
    "lost": "Lost",
    "open": "Open",
    "markedWon": "Deal marked as won!",
    "markedLost": "Deal marked as lost",
    "moveNext": "Move next",
    "win": "Won",
    "lose": "Lost",
    "lostReason": "Reason for losing",
    "lostReasonPlaceholder": "Price...",
    "confirmLost": "Confirm Lost",
    "linkedContact": "Linked Contact",
    "addNote": "Add a note...",
    "activities": "Activity",
    "noActivities": "No activities yet",
    "noTasks": "No tasks linked",
    "addProduct": "Add product",
    "selectProduct": "Select Product",
    "selectPlaceholder": "Select...",
    "qty": "Qty",
    "add": "Add",
    "cancel": "Cancel"
  },
  "tasks": {
    "title": "Tasks",
    "due": "Due:",
    "contact": "Contact",
    "deal": "Deal"
  },
  "invoices": {
    "title": "Invoices",
    "items": "Products",
    "total": "Total",
    "noContact": "No contact"
  },
  "settings": {
    "roles": {
      "owner": "Owner",
      "admin": "Admin",
      "member": "Member",
      "viewer": "Viewer"
    },
    "emailLabel": "Email"
  }
};

const zonesRU = {
  "dashboard": {
    "trendPlus12": "+12% к прошлому месяцу",
    "loadMore": "Загрузить ещё",
    "conversion": "Конверсия",
    "averageCheck": "Средний чек",
    "cycleTime": "Цикл сделки"
  },
  "contacts": {
    "title": "Контакты",
    "company": "Компания",
    "position": "Должность",
    "address": "Адрес",
    "generalNotes": "Общие заметки",
    "tags": "Теги",
    "phone": "Телефон",
    "email": "Email",
    "noNotes": "Нет записанных активностей",
    "addNotePlaceholder": "Написать заметку...",
    "noDeals": "Нет привязанных сделок",
    "noTasks": "Нет привязанных задач",
    "pipeline": "В работе",
    "openTasks": "Открытые задачи",
    "confirmDelete": "Удалить контакт?",
    "deleteWarning": "Это навсегда удалит контакт {{name}}. Связанные сделки и задачи останутся.",
    "updated": "Контакт обновлён",
    "deleted": "Контакт удалён"
  },
  "deals": {
    "title": "Сделки",
    "value": "Сумма",
    "stage": "Стадия",
    "nextStep": "Следующий шаг",
    "won": "Выиграна",
    "lost": "Проиграна",
    "open": "Открыта",
    "markedWon": "Сделка выиграна!",
    "markedLost": "Сделка проиграна",
    "moveNext": "На след. стадию",
    "win": "Выиграли",
    "lose": "Проиграли",
    "lostReason": "Причина проигрыша",
    "lostReasonPlaceholder": "Дорого...",
    "confirmLost": "Подтвердить проигрыш",
    "linkedContact": "Связанный контакт",
    "addNote": "Добавить заметку...",
    "activities": "Активность",
    "noActivities": "Пока нет активности",
    "noTasks": "Нет привязанных задач",
    "addProduct": "Добавить продукт",
    "selectProduct": "Выберите продукт",
    "selectPlaceholder": "Выбрать...",
    "qty": "Кол-во",
    "add": "Добавить",
    "cancel": "Отмена"
  },
  "tasks": {
    "title": "Задачи",
    "due": "Срок:",
    "contact": "Контакт",
    "deal": "Сделка"
  },
  "invoices": {
    "title": "Инвойсы",
    "items": "Позиции",
    "total": "Итого",
    "noContact": "Нет контакта"
  },
  "settings": {
    "roles": {
      "owner": "Владелец",
      "admin": "Админ",
      "member": "Участник",
      "viewer": "Наблюдатель"
    },
    "emailLabel": "Email"
  }
};

const zonesKK = {
  "dashboard": {
    "trendPlus12": "Өткен аймен салыстырғанда +12%",
    "loadMore": "Көбірек жүктеу",
    "conversion": "Конверсия",
    "averageCheck": "Орташа чек",
    "cycleTime": "Мәміле циклі"
  },
  "contacts": {
    "title": "Контактілер",
    "company": "Компания",
    "position": "Лауазымы",
    "address": "Мекенжайы",
    "generalNotes": "Жалпы жазбалар",
    "tags": "Тегтер",
    "phone": "Телефон",
    "email": "Email",
    "noNotes": "Әзірге белсенділік жоқ",
    "addNotePlaceholder": "Жазба қосу...",
    "noDeals": "Байланысқан мәмілелер жоқ",
    "noTasks": "Байланысқан тапсырмалар жоқ",
    "pipeline": "Жұмыста",
    "openTasks": "Ашық тапсырмалар",
    "confirmDelete": "Контактіні өшіру?",
    "deleteWarning": "Бұл {{name}} контактісін толықтай өшіреді. Байланысқан мәмілелер мен тапсырмалар сақталады.",
    "updated": "Контакт жаңартылды",
    "deleted": "Контакт өшірілді"
  },
  "deals": {
    "title": "Мәмілелер",
    "value": "Сомасы",
    "stage": "Кезеңі",
    "nextStep": "Келесі қадам",
    "won": "Ұтып алдық",
    "lost": "Ұтылдық",
    "open": "Ашық",
    "markedWon": "Мәміле сәтті аяқталды!",
    "markedLost": "Мәміле сәтсіз аяқталды",
    "moveNext": "Келесі кезеңге",
    "win": "Ұту",
    "lose": "Ұтылу",
    "lostReason": "Ұтылу себебі",
    "lostReasonPlaceholder": "Қымбат...",
    "confirmLost": "Ұтылуды растау",
    "linkedContact": "Байланысқан контакт",
    "addNote": "Жазба қосу...",
    "activities": "Белсенділік",
    "noActivities": "Әзірге белсенділік жоқ",
    "noTasks": "Байланысқан тапсырмалар жоқ",
    "addProduct": "Өнімді қосу",
    "selectProduct": "Өнімді таңдаңыз",
    "selectPlaceholder": "Таңдау...",
    "qty": "Саны",
    "add": "Қосу",
    "cancel": "Болдырмау"
  },
  "tasks": {
    "title": "Тапсырмалар",
    "due": "Мерзімі:",
    "contact": "Контакт",
    "deal": "Мәміле"
  },
  "invoices": {
    "title": "Шоттар",
    "items": "Позициялар",
    "total": "Барлығы",
    "noContact": "Контакт жоқ"
  },
  "settings": {
    "roles": {
      "owner": "Иесі",
      "admin": "Әкімші",
      "member": "Қатысушы",
      "viewer": "Бақылаушы"
    },
    "emailLabel": "Email"
  }
};

function updateFile(filename, newZones) {
  const filepath = path.join(localesDir, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`File not found: ${filepath}`);
    return;
  }
  const content = fs.readFileSync(filepath, 'utf8');
  let data = JSON.parse(content);
  data['zones'] = newZones;
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${filename}`);
}

updateFile('en.json', zonesEN);
updateFile('ru.json', zonesRU);
updateFile('kk.json', zonesKK);

console.log("Done updating i18n.");
