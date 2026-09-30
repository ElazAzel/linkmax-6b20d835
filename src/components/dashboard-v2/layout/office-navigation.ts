import Home from 'lucide-react/dist/esm/icons/home';
import Contact from 'lucide-react/dist/esm/icons/contact';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Layers from 'lucide-react/dist/esm/icons/layers';
import PenTool from 'lucide-react/dist/esm/icons/pen-tool';

export const OFFICE_TABS = [
  { id: 'home', icon: Home, labelKey: 'digitalOffice.navigation.home', defaultLabel: 'Сегодня', path: '/dashboard/home' },
  { id: 'clients', icon: Contact, labelKey: 'digitalOffice.navigation.clients', defaultLabel: 'Клиенты', path: '/dashboard/clients' },
  { id: 'calendar', icon: Calendar, labelKey: 'digitalOffice.navigation.calendar', defaultLabel: 'Календарь', path: '/dashboard/calendar' },
  { id: 'offers', icon: Layers, labelKey: 'digitalOffice.navigation.offers', defaultLabel: 'Предложения', path: '/dashboard/offers' },
  { id: 'editor', icon: PenTool, labelKey: 'digitalOffice.navigation.editor', defaultLabel: 'Моя страница', path: '/dashboard/home?tab=editor' },
];
