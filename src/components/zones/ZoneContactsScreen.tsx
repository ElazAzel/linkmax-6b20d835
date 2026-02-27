/**
 * ZoneContactsScreen - Contact management for zones with CRM features
 */
import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Upload from 'lucide-react/dist/esm/icons/upload';
import X from 'lucide-react/dist/esm/icons/x';
import { toast } from 'sonner';
import type { ZoneContact } from '@/types/zones';
import { ContactDetailSheet } from './contacts/ContactDetailSheet';
import { ContactImportDialog } from './contacts/ContactImportDialog';

interface ZoneContactsScreenProps {
  zoneId: string;
}

export const ZoneContactsScreen = memo(function ZoneContactsScreen({ zoneId }: ZoneContactsScreenProps) {
  const { t } = useTranslation();
  const { contacts, loading, createContact, updateContact, deleteContact, bulkImport } = useZoneContacts(zoneId);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ZoneContact | null>(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', telegram_username: '', tags: '' });

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    contacts.forEach(c => (c.tags || []).forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase());
      const matchTag = !activeTag || (c.tags || []).includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [contacts, search, activeTag]);

  const handleCreate = async () => {
    if (!newContact.name.trim()) return;
    try {
      await createContact({
        name: newContact.name,
        phone: newContact.phone || null,
        email: newContact.email || null,
        telegram_username: newContact.telegram_username || null,
        tags: newContact.tags ? newContact.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      } as any);
      setCreateOpen(false);
      setNewContact({ name: '', phone: '', email: '', telegram_username: '', tags: '' });
      toast.success(t('zones.contacts.created', 'Contact created'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Keep selectedContact in sync
  const currentSelected = useMemo(() => {
    if (!selectedContact) return null;
    return contacts.find(c => c.id === selectedContact.id) || selectedContact;
  }, [selectedContact, contacts]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('zones.contacts.title', 'Contacts')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1" />
            {t('zones.contacts.import', 'Import')}
          </Button>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t('zones.contacts.add', 'Add')}
          </Button>
        </div>
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

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {activeTag && (
            <Badge variant="default" className="cursor-pointer gap-1" onClick={() => setActiveTag(null)}>
              {activeTag}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {allTags.filter(t => t !== activeTag).map(tag => (
            <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setActiveTag(tag)}>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-3">
        <Badge variant="outline" className="text-sm py-1 px-3">
          {contacts.length} {t('zones.contacts.total', 'total')}
        </Badge>
        {activeTag && (
          <Badge variant="outline" className="text-sm py-1 px-3 text-primary">
            {filtered.length} {t('zones.contacts.matching', 'matching')}
          </Badge>
        )}
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
            <Card
              key={contact.id}
              className="hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => setSelectedContact(contact)}
            >
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
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {contact.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5">{tag}</Badge>
                    ))}
                    {contact.tags.length > 2 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5">+{contact.tags.length - 2}</Badge>
                    )}
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
            <DialogDescription className="sr-only">
              {t('zones.contacts.addDescription', 'Create a new contact in this zone by providing their details')}
            </DialogDescription>
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
            <div className="space-y-2">
              <Label>{t('zones.contacts.tags', 'Tags')}</Label>
              <Input value={newContact.tags} onChange={e => setNewContact(p => ({ ...p, tags: e.target.value }))} placeholder="VIP, partner" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleCreate} disabled={!newContact.name.trim()}>{t('common.create', 'Create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Detail Sheet */}
      <ContactDetailSheet
        contact={currentSelected}
        zoneId={zoneId}
        open={!!selectedContact}
        onOpenChange={open => !open && setSelectedContact(null)}
        onUpdateContact={updateContact}
        onDeleteContact={deleteContact}
      />

      {/* Import Dialog */}
      <ContactImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={bulkImport}
      />
    </div>
  );
});

export default ZoneContactsScreen;
