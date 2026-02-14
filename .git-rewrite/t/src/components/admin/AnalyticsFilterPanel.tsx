import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

export interface AnalyticsFilters {
  devices: string[];
  sources: string[];
  pages: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

interface AnalyticsFilterPanelProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  availableDevices?: string[];
  availableSources?: string[];
  availablePages?: string[];
}

const DEFAULT_DEVICES = ['desktop', 'mobile', 'tablet', 'unknown'];
const DEFAULT_SOURCES = ['direct', 'social', 'search', 'referral', 'other'];

export function AnalyticsFilterPanel({
  filters,
  onFiltersChange,
  availableDevices = DEFAULT_DEVICES,
  availableSources = DEFAULT_SOURCES,
  availablePages = [],
}: AnalyticsFilterPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleDeviceToggle = useCallback((device: string) => {
    const newDevices = filters.devices.includes(device)
      ? filters.devices.filter(d => d !== device)
      : [...filters.devices, device];
    
    onFiltersChange({
      ...filters,
      devices: newDevices,
    });
  }, [filters, onFiltersChange]);

  const handleSourceToggle = useCallback((source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source];
    
    onFiltersChange({
      ...filters,
      sources: newSources,
    });
  }, [filters, onFiltersChange]);

  const handlePageSelect = useCallback((page: string) => {
    const newPages = filters.pages.includes(page)
      ? filters.pages.filter(p => p !== page)
      : [...filters.pages, page];
    
    onFiltersChange({
      ...filters,
      pages: newPages,
    });
  }, [filters, onFiltersChange]);

  const handleClearAll = useCallback(() => {
    onFiltersChange({
      devices: [],
      sources: [],
      pages: [],
      dateRange: undefined,
    });
  }, [onFiltersChange]);

  const activeFiltersCount = useMemo(
    () => filters.devices.length + filters.sources.length + filters.pages.length,
    [filters]
  );

  const allDevicesSelected = useMemo(
    () => availableDevices.length > 0 && filters.devices.length === availableDevices.length,
    [filters.devices, availableDevices]
  );

  const allSourcesSelected = useMemo(
    () => availableSources.length > 0 && filters.sources.length === availableSources.length,
    [filters.sources, availableSources]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Фильтры</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Фильтры аналитики</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs"
              >
                Очистить
              </Button>
            )}
          </div>

          {/* Devices Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Устройства</label>
              <span className="text-xs text-muted-foreground">
                {filters.devices.length}/{availableDevices.length}
              </span>
            </div>
            <div className="space-y-1">
              {availableDevices.map((device) => (
                <div key={device} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`device-${device}`}
                    checked={filters.devices.includes(device)}
                    onChange={() => handleDeviceToggle(device)}
                    className="rounded"
                  />
                  <label
                    htmlFor={`device-${device}`}
                    className="text-sm cursor-pointer capitalize"
                  >
                    {device}
                  </label>
                </div>
              ))}
            </div>
            {availableDevices.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs mt-1"
                onClick={() => {
                  onFiltersChange({
                    ...filters,
                    devices: allDevicesSelected ? [] : [...availableDevices],
                  });
                }}
              >
                {allDevicesSelected ? 'Снять все' : 'Выбрать все'}
              </Button>
            )}
          </div>

          {/* Sources Filter */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Источники трафика</label>
              <span className="text-xs text-muted-foreground">
                {filters.sources.length}/{availableSources.length}
              </span>
            </div>
            <div className="space-y-1">
              {availableSources.map((source) => (
                <div key={source} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`source-${source}`}
                    checked={filters.sources.includes(source)}
                    onChange={() => handleSourceToggle(source)}
                    className="rounded"
                  />
                  <label
                    htmlFor={`source-${source}`}
                    className="text-sm cursor-pointer capitalize"
                  >
                    {source}
                  </label>
                </div>
              ))}
            </div>
            {availableSources.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs mt-1"
                onClick={() => {
                  onFiltersChange({
                    ...filters,
                    sources: allSourcesSelected ? [] : [...availableSources],
                  });
                }}
              >
                {allSourcesSelected ? 'Снять все' : 'Выбрать все'}
              </Button>
            )}
          </div>

          {/* Pages Filter */}
          {availablePages.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Страницы</label>
                <span className="text-xs text-muted-foreground">
                  {filters.pages.length}/{availablePages.length}
                </span>
              </div>
              <Select>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Выберите страницу..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePages.slice(0, 10).map((page) => (
                    <SelectItem
                      key={page}
                      value={page}
                      onClick={() => handlePageSelect(page)}
                    >
                      <div className="flex items-center gap-2">
                        {filters.pages.includes(page) && (
                          <div className="h-4 w-4 rounded border-2 border-primary bg-primary" />
                        )}
                        {page}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.pages.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.pages.map((page) => (
                    <Badge
                      key={page}
                      variant="outline"
                      className="gap-1 text-xs"
                    >
                      {page}
                      <button
                        onClick={() => handlePageSelect(page)}
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Активные фильтры:</p>
              <div className="flex flex-wrap gap-1">
                {filters.devices.map((d) => (
                  <Badge key={`d-${d}`} variant="secondary" className="text-xs">
                    {d}
                  </Badge>
                ))}
                {filters.sources.map((s) => (
                  <Badge key={`s-${s}`} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
                {filters.pages.map((p) => (
                  <Badge key={`p-${p}`} variant="secondary" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
