/**
 * ZoneContactsScreen - Contact management for zones
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import { toast } from 'sonner';

interface ZoneContactsScreenProps {
  zoneId: string;
}

export const ZoneContactsScreen = memo(function ZoneContactsScreen({ zoneId }: ZoneContactsScreenProps) {
  const { t } = useTranslation();
  const { contacts, loading, createContact } = useZoneContacts(zoneId);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', telegram_username: '' });

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newContact.name.trim()) return;
    try {
      await createContact({
        name: newContact.name,
        phone: newContact.phone || null,
        email: newContact.email || null,
        telegram_username: newContact.telegram_username || null,
      } as any);
      setCreateOpen(false);
      setNewContact({ name: '', phone: '', email: '', telegram_username: '' });
      toast.success(t('zones.contacts.created', 'Contact created'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('zones.contacts.title', 'Contacts')}</h1>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t('zones.contacts.add', 'Add')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('zones.contacts.search', 'Search contacts...')}
          className="pl-9"
        />
      </div>

      {/* Contacts List */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {contacts.length === 0
              ? t('zones.contacts.empty', 'No contacts yet')
              : t('zones.contacts.noResults', 'No matching contacts')}
          </div>
        ) : (
          filtered.map(contact => (
            <Card key={contact.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{contact.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {contact.phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phone}</span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>
                    )}
                    {contact.telegram_username && (
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />@{contact.telegram_username}</span>
                    )}
                  </div>
                </div>
                {contact.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {contact.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5">{tag}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.contacts.add', 'Add Contact')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('zones.contacts.name', 'Name')} *</Label>
              <Input value={newContact.name} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('zones.contacts.phone', 'Phone')}</Label>
              <Input value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('zones.contacts.email', 'Email')}</Label>
              <Input value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Telegram</Label>
              <Input value={newContact.telegram_username} onChange={e => setNewContact(p => ({ ...p, telegram_username: e.target.value }))} placeholder="@username" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleCreate} disabled={!newContact.name.trim()}>{t('common.create', 'Create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default ZoneContactsScreen;
