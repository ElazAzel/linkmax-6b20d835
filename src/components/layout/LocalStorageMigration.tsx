import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Upload, X } from 'lucide-react';
import { savePage } from '@/services/database';
import { toast } from 'sonner';
import type { PageData } from '@/types/page';

const STORAGE_KEY = 'linkmax_page_data';
const MIGRATION_DONE_KEY = 'linkmax_migration_done';

interface LocalStorageMigrationProps {
  userId: string;
  onMigrated: () => void;
}

export function LocalStorageMigration({ userId, onMigrated }: LocalStorageMigrationProps) {
  const [localData, setLocalData] = useState<PageData | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if migration was already done
    const migrationDone = localStorage.getItem(MIGRATION_DONE_KEY);
    if (migrationDone) return;

    // Check for local storage data
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored) as PageData;
        setLocalData(data);
        setShow(true);
      } catch (e) {
        console.error('Failed to parse local storage data:', e);
      }
    }
  }, []);

  const handleMigrate = async () => {
    if (!localData) return;
    
    setMigrating(true);
    const { error } = await savePage(localData, userId);
    
    if (error) {
      console.error('Migration error:', error);
      toast.error('Failed to migrate your data');
      setMigrating(false);
      return;
    }
    
    // Mark migration as done
    localStorage.setItem(MIGRATION_DONE_KEY, 'true');
    localStorage.removeItem(STORAGE_KEY);
    
    toast.success('Your page has been migrated to the cloud!');
    setShow(false);
    onMigrated();
  };

  const handleDismiss = () => {
    localStorage.setItem(MIGRATION_DONE_KEY, 'true');
    setShow(false);
  };

  if (!show || !localData) return null;

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            <CardTitle>Migrate Your Data</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          We found your local page data. Migrate it to the cloud to sync across devices!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <strong>{localData.blocks.length}</strong> blocks found
          </div>
          <Button onClick={handleMigrate} disabled={migrating} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            {migrating ? 'Migrating...' : 'Migrate to Cloud'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
