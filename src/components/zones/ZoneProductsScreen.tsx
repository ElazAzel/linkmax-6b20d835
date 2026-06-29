/**
 * ZoneProductsScreen - Product catalog management for Business Zone
 */
import { memo, useState, useMemo, useCallback } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneProducts } from '@/hooks/zones/useZoneProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Package from 'lucide-react/dist/esm/icons/package';
import { toast } from 'sonner';
import type { ZoneProduct } from '@/types/zones';

interface Props {
  zoneId: string;
}

const emptyForm = {
  name: '',
  description: '',
  unit_price: '',
  currency: 'KZT',
  unit: 'шт',
  is_active: true,
};

export const ZoneProductsScreen = memo(function ZoneProductsScreen({ zoneId }: Props) {
  const { t } = useTranslation();
  const { products, loading, createProduct, updateProduct, deleteProduct } = useZoneProducts(zoneId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ZoneProduct | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteProductId, setPendingDeleteProductId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }, [products, search]);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, name: e.target.value }));
  }, []);

  const handleDescriptionChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, description: e.target.value }));
  }, []);

  const handlePriceChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, unit_price: e.target.value }));
  }, []);

  const handleCurrencyChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, currency: e.target.value }));
  }, []);

  const handleUnitChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, unit: e.target.value }));
  }, []);

  const handleActiveChange = useCallback((v: boolean) => {
    setForm(f => ({ ...f, is_active: v }));
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const openEdit = useCallback((p: ZoneProduct) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description || '',
      unit_price: String(p.unit_price),
      currency: p.currency,
      unit: p.unit,
      is_active: p.is_active,
    });
    setDialogOpen(true);
  }, []);

  const openCreate = useCallback(() => {
    setEditingProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const handleCardClick = useCallback((e: MouseEvent<HTMLElement>) => {
    const productId = e.currentTarget.dataset.productId;
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) openEdit(product);
    }
  }, [products, openEdit]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t('zone.products.nameRequired', 'Введите название'));
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        unit_price: Number(form.unit_price) || 0,
        currency: form.currency,
        unit: form.unit,
        is_active: form.is_active,
      };
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success(t('zone.products.updated', 'Продукт обновлён'));
      } else {
        await createProduct(payload);
        toast.success(t('zone.products.created', 'Продукт создан'));
      }
      setDialogOpen(false);
    } catch {
      toast.error(t('common.error', 'Ошибка'));
    }
  };

  const handleDelete = useCallback((id: string) => {
    setPendingDeleteProductId(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteClick = useCallback((e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const productId = e.currentTarget.dataset.productId;
    if (productId) handleDelete(productId);
  }, [handleDelete]);

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteProductId) return;
    try {
      await deleteProduct(pendingDeleteProductId);
      toast.success(t('zone.products.deleted', 'Продукт удалён'));
    } catch {
      toast.error(t('common.error', 'Ошибка'));
    } finally {
      setDeleteConfirmOpen(false);
      setPendingDeleteProductId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 sticky top-0 bg-background/80 backdrop-blur-md z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-lg font-bold">{t('zone.products.title', 'Каталог продуктов')}</h1>
          <Badge variant="secondary" className="text-xs">{products.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t('common.search', 'Поиск...')}
              value={search}
              onChange={handleSearchChange}
              className="pl-8 h-8 w-48 text-xs"
            />
          </div>
          <Button size="sm" onClick={openCreate} className="h-8 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" />
            {t('zone.products.add', 'Добавить')}
          </Button>
        </div>
      </div>

      {/* Product list */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">{t('zone.products.empty', 'Нет продуктов')}</p>
            <p className="text-xs mt-1">{t('zone.products.emptyHint', 'Добавьте первый продукт в каталог')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(product => (
              <Card
                key={product.id}
                data-product-id={product.id}
                className="bg-background/40 backdrop-blur-sm border-border/40 hover:border-primary/20 transition-all cursor-pointer"
                onClick={handleCardClick}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-muted/30 shrink-0">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{product.name}</p>
                        {!product.is_active && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">{t('zone.products.inactive', 'Неактивен')}</Badge>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-[11px] text-muted-foreground truncate">{product.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {new Intl.NumberFormat('ru-KZ').format(product.unit_price)} {product.currency === 'KZT' ? '₸' : product.currency}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('zone.products.per', 'за')} {product.unit}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive/60 hover:text-destructive"
                      data-product-id={product.id}
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct
                ? t('zone.products.edit', 'Редактировать продукт')
                : t('zone.products.create', 'Новый продукт')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">{t('zone.products.name', 'Название')}</Label>
              <Input
                value={form.name}
                onChange={handleNameChange}
                placeholder={t('zone.products.namePlaceholder', 'Например: Консультация 1 час')}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{t('zone.products.description', 'Описание')}</Label>
              <Textarea
                value={form.description}
                onChange={handleDescriptionChange}
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{t('zone.products.price', 'Цена')}</Label>
                <Input
                  type="number"
                  value={form.unit_price}
                  onChange={handlePriceChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">{t('zone.products.currency', 'Валюта')}</Label>
                <Input
                  value={form.currency}
                  onChange={handleCurrencyChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">{t('zone.products.unit', 'Единица')}</Label>
                <Input
                  value={form.unit}
                  onChange={handleUnitChange}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={handleActiveChange}
              />
              <Label className="text-xs">{t('zone.products.active', 'Активен')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {t('common.cancel', 'Отмена')}
            </Button>
            <Button onClick={handleSave}>
              {editingProduct ? t('common.save', 'Сохранить') : t('zone.products.add', 'Добавить')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('zone.products.confirmDelete', 'Удалить продукт?')}</AlertDialogTitle>
            <AlertDialogDescription>{t('zone.products.confirmDeleteDesc', 'Это действие нельзя отменить.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Отмена')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>{t('common.delete', 'Удалить')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
