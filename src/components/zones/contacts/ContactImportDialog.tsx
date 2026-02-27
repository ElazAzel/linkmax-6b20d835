/**
 * ContactImportDialog - CSV/Excel import for contacts
 */
import { memo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Upload from 'lucide-react/dist/esm/icons/upload';
import FileSpreadsheet from 'lucide-react/dist/esm/icons/file-spreadsheet';
import { toast } from 'sonner';
import type { ZoneContact } from '@/types/zones';

interface ContactImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (contacts: Partial<ZoneContact>[]) => Promise<void>;
}

interface ParsedRow {
  name: string;
  phone: string;
  email: string;
  telegram_username: string;
  tags: string;
}

export const ContactImportDialog = memo(function ContactImportDialog({
  open,
  onOpenChange,
  onImport,
}: ContactImportDialogProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(/[,;\t]/).map(h => h.trim().replace(/"/g, ''));

    const nameIdx = headers.findIndex(h => ['name', 'имя', 'название', 'контакт'].includes(h));
    const phoneIdx = headers.findIndex(h => ['phone', 'телефон', 'номер'].includes(h));
    const emailIdx = headers.findIndex(h => ['email', 'почта', 'e-mail'].includes(h));
    const tgIdx = headers.findIndex(h => ['telegram', 'tg', 'телеграм', 'telegram_username'].includes(h));
    const tagsIdx = headers.findIndex(h => ['tags', 'теги', 'метки'].includes(h));

    if (nameIdx === -1) return [];

    return lines.slice(1).map(line => {
      const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        name: cols[nameIdx] || '',
        phone: phoneIdx >= 0 ? cols[phoneIdx] || '' : '',
        email: emailIdx >= 0 ? cols[emailIdx] || '' : '',
        telegram_username: tgIdx >= 0 ? cols[tgIdx]?.replace('@', '') || '' : '',
        tags: tagsIdx >= 0 ? cols[tagsIdx] || '' : '',
      };
    }).filter(r => r.name.trim());
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      const text = await file.text();
      setRows(parseCSV(text));
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const buffer = await file.arrayBuffer();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet || sheet.rowCount < 2) {
          toast.error(t('zones.contacts.emptyFile', 'File is empty'));
          return;
        }

        const headerRow = sheet.getRow(1);
        const headers = (headerRow.values as any[]).slice(1).map((v: any) => String(v || '').toLowerCase().trim());

        const nameIdx = headers.findIndex(h => ['name', 'имя', 'название', 'контакт'].includes(h));
        const phoneIdx = headers.findIndex(h => ['phone', 'телефон', 'номер'].includes(h));
        const emailIdx = headers.findIndex(h => ['email', 'почта', 'e-mail'].includes(h));
        const tgIdx = headers.findIndex(h => ['telegram', 'tg', 'телеграм'].includes(h));
        const tagsIdx = headers.findIndex(h => ['tags', 'теги', 'метки'].includes(h));

        if (nameIdx === -1) {
          toast.error(t('zones.contacts.noNameColumn', 'No "name" column found'));
          return;
        }

        const parsed: ParsedRow[] = [];
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const vals = (row.values as any[]).slice(1);
          const name = String(vals[nameIdx] || '').trim();
          if (!name) return;
          parsed.push({
            name,
            phone: phoneIdx >= 0 ? String(vals[phoneIdx] || '').trim() : '',
            email: emailIdx >= 0 ? String(vals[emailIdx] || '').trim() : '',
            telegram_username: tgIdx >= 0 ? String(vals[tgIdx] || '').replace('@', '').trim() : '',
            tags: tagsIdx >= 0 ? String(vals[tagsIdx] || '').trim() : '',
          });
        });
        setRows(parsed);
      } catch (err) {
        toast.error(t('zones.contacts.parseError', 'Failed to parse file'));
      }
    } else {
      toast.error(t('zones.contacts.unsupportedFormat', 'Use CSV or XLSX files'));
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const contacts: Partial<ZoneContact>[] = rows.map(r => ({
        name: r.name,
        phone: r.phone || null,
        email: r.email || null,
        telegram_username: r.telegram_username || null,
        tags: r.tags ? r.tags.split(/[,;]/).map(t => t.trim()).filter(Boolean) : [],
      }));
      await onImport(contacts);
      toast.success(t('zones.contacts.imported', '{{count}} contacts imported', { count: contacts.length }));
      setRows([]);
      setFileName('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {t('zones.contacts.import', 'Import Contacts')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('zones.contacts.importDescription', 'Upload a CSV or Excel file to import contacts into your zone')}
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{t('zones.contacts.uploadFile', 'Upload CSV or Excel file')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('zones.contacts.requiredColumns', 'Required column: name. Optional: phone, email, telegram, tags')}
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{fileName}</Badge>
              <Badge>{rows.length} {t('zones.contacts.rows', 'rows')}</Badge>
            </div>
            <ScrollArea className="h-48 border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2">{t('zones.contacts.name', 'Name')}</th>
                    <th className="text-left p-2">{t('zones.contacts.phone', 'Phone')}</th>
                    <th className="text-left p-2">{t('zones.contacts.email', 'Email')}</th>
                    <th className="text-left p-2">TG</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2 text-muted-foreground">{r.phone}</td>
                      <td className="p-2 text-muted-foreground">{r.email}</td>
                      <td className="p-2 text-muted-foreground">{r.telegram_username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && (
                <p className="text-xs text-center text-muted-foreground py-2">
                  ...{t('zones.contacts.andMore', 'and {{count}} more', { count: rows.length - 50 })}
                </p>
              )}
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { setRows([]); setFileName(''); onOpenChange(false); }}>
            {t('common.cancel', 'Cancel')}
          </Button>
          {rows.length > 0 && (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? t('zones.contacts.importing', 'Importing...') : t('zones.contacts.importButton', 'Import {{count}}', { count: rows.length })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
