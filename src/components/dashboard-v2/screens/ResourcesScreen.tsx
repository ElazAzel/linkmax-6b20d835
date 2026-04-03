import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneResources, ZoneResource } from '@/hooks/zones/useZoneResources';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Package, 
  Plus, 
  Settings2, 
  Trash2, 
  Box, 
  Monitor, 
  Armchair, 
  MoreVertical,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ResourcesScreenProps {
  zoneId: string;
}

export const ResourcesScreen = ({ zoneId }: ResourcesScreenProps) => {
  const { t } = useTranslation();
  const { resources, loading, fetchResources, upsertResource, deleteResource } = useZoneResources(zoneId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Partial<ZoneResource> | null>(null);
  const [formData, setFormData] = useState<Partial<ZoneResource>>({
    name: '',
    type: 'room',
    capacity: 1,
    is_active: true,
  });

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleOpenDialog = (resource?: ZoneResource) => {
    if (resource) {
      setEditingResource(resource);
      setFormData(resource);
    } else {
      setEditingResource(null);
      setFormData({
        name: '',
        type: 'room',
        capacity: 1,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error(t('resources.error.nameRequired', 'Name is required'));
      return;
    }

    const success = await upsertResource(formData);
    if (success) {
      setIsDialogOpen(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'room': return <Box className="h-5 w-5" />;
      case 'equipment': return <Monitor className="h-5 w-5" />;
      case 'other': return <Package className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gradient tracking-tight">
            {t('resources.title', 'Resources Management')}
          </h1>
          <p className="text-muted-foreground mt-1 max-w-lg">
            {t('resources.subtitle', 'Manage physical spaces, equipment, and shared assets to prevent booking conflicts.')}
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 h-11 px-6 group"
        >
          <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          {t('resources.add', 'Add Resource')}
        </Button>
      </div>

      {loading && resources.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-3xl glass-card animate-pulse" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <Card className="glass-card border-dashed border-2 border-white/10 bg-transparent py-20 text-center">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-2">
              <Package className="h-10 w-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold">{t('resources.empty.title', 'No resources yet')}</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              {t('resources.empty.desc', 'Add your first room or equipment to start tracking availability.')}
            </p>
            <Button variant="outline" onClick={() => handleOpenDialog()} className="mt-4 rounded-xl">
              {t('resources.addFirst', 'Create first resource')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {resources.map((resource) => (
              <motion.div
                key={resource.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-transparent rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <Card className="glass-card relative overflow-hidden h-full flex flex-col border-white/10 rounded-[1.8rem] transition-all duration-300 group-hover:border-primary/30">
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-2xl ${resource.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-white/10"
                          onClick={() => handleOpenDialog(resource)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-destructive/10 text-destructive/60 hover:text-destructive"
                          onClick={() => deleteResource(resource.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-black text-xl tracking-tight group-hover:text-primary transition-colors">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {resource.description || t('resources.noDescription', 'No description provided')}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          {t('resources.type', 'Type')}
                        </span>
                        <span className="text-sm font-medium capitalize">
                          {t(`resources.types.${resource.type}`, resource.type)}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-white/5" />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          {t('resources.capacity', 'Capacity')}
                        </span>
                        <span className="text-sm font-medium">
                          {resource.capacity} {t('resources.units', 'bkgs')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter border ${
                        resource.is_active 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-muted/50 text-muted-foreground border-white/5'
                      }`}>
                        {resource.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md glass-card-heavy border-white/10 rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              {editingResource ? t('resources.edit', 'Edit Resource') : t('resources.add', 'New Resource')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold ml-1">{t('resources.form.name', 'Resource Name')}</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. VIP Room 1, Tattoo Chair A"
                className="glass-input rounded-2xl h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold ml-1">{t('resources.form.type', 'Type')}</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val: any) => setFormData(prev => ({ ...prev, type: val }))}
                >
                  <SelectTrigger className="glass-input rounded-2xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card-heavy border-white/10">
                    <SelectItem value="room">{t('resources.types.room', 'Room')}</SelectItem>
                    <SelectItem value="equipment">{t('resources.types.equipment', 'Equipment')}</SelectItem>
                    <SelectItem value="other">{t('resources.types.other', 'Other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold ml-1">{t('resources.form.capacity', 'Max Capacity')}</Label>
                <Input 
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                  className="glass-input rounded-2xl h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold ml-1">{t('resources.form.description', 'Description')}</Label>
              <Textarea 
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('resources.form.descPlaceholder', 'Optional details...')}
                className="glass-input rounded-2xl resize-none h-24 pt-3"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/5 border border-white/5">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">{t('resources.form.isActive', 'Available for booking')}</Label>
                <p className="text-[10px] text-muted-foreground tracking-tight">
                  {t('resources.form.isActiveDesc', 'When disabled, this resource won\'t be used for auto-assignment.')}
                </p>
              </div>
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(val) => setFormData(prev => ({ ...prev, is_active: val }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl h-11 px-6"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              onClick={handleSave}
              className="rounded-xl bg-primary h-11 px-8 shadow-lg shadow-primary/20"
            >
              {t('common.save', 'Save Resource')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
