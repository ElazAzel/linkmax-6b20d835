import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Upload from 'lucide-react/dist/esm/icons/upload';
import FileJson from 'lucide-react/dist/esm/icons/file-json';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { useLanguageUpload, type ValidationResult } from '@/hooks/useLanguageUpload';
import { toast } from 'sonner';

interface LanguageUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function LanguageUploadDialog({ open, onOpenChange, onSuccess }: LanguageUploadDialogProps) {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [languageCode, setLanguageCode] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [uploadedData, setUploadedData] = useState<Record<string, unknown> | null>(null);

    const { uploading, validationResult, uploadLanguageFile, applyLanguage, setValidationResult } = useLanguageUpload();

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0];
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                setSelectedFile(file);

                // Try to extract language code from filename
                const match = file.name.match(/^([a-z]{2})\.json$/i);
                if (match) {
                    setLanguageCode(match[1].toLowerCase());
                }
            } else {
                toast.error(t('pleaseSelectJsonFile'));
            }
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const file = files[0];
            setSelectedFile(file);

            const match = file.name.match(/^([a-z]{2})\.json$/i);
            if (match) {
                setLanguageCode(match[1].toLowerCase());
            }
        }
    }, []);

    const handleValidate = useCallback(async () => {
        if (!selectedFile || !languageCode) {
            toast.error(t('selectFileAndLanguageCode'));
            return;
        }

        const result = await uploadLanguageFile(selectedFile, languageCode, false);

        if (result) {
            // Parse file to save data for later
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target?.result as string);
                    setUploadedData(json);
                } catch (error) {
                    console.error('Parse error:', error);
                }
            };
            reader.readAsText(selectedFile);
        }
    }, [selectedFile, languageCode, uploadLanguageFile]);

    const handleApply = useCallback(async () => {
        if (!uploadedData || !languageCode) {
            toast.error(t('validateFirst'));
            return;
        }

        const success = await applyLanguage(languageCode, uploadedData);

        if (success) {
            handleClose();
            onSuccess?.();
        }
    }, [uploadedData, languageCode, applyLanguage, onSuccess]);

    const handleClose = useCallback(() => {
        setSelectedFile(null);
        setLanguageCode('');
        setUploadedData(null);
        setValidationResult(null);
        onOpenChange(false);
    }, [onOpenChange, setValidationResult]);

    const getValidationStatusIcon = (validation: ValidationResult) => {
        if (validation.valid && validation.warnings.length === 0) {
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        } else if (validation.valid && validation.warnings.length > 0) {
            return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        } else {
            return <XCircle className="h-5 w-5 text-red-500" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        {t('uploadLanguageFile')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('uploadJsonDescription')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Language Code Input */}
                    <div className="space-y-2">
                        <Label>{t('languageCode2Letters')}</Label>
                        <Input
                            value={languageCode}
                            onChange={(e) => setLanguageCode(e.target.value.toLowerCase().slice(0, 2))}
                            placeholder="ru, en, kk, de..."
                            maxLength={2}
                            className="uppercase"
                            disabled={uploading}
                        />
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`
              border-2 border-dashed rounded-lg p-8 transition-all
              ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
              ${selectedFile ? 'bg-muted/50' : ''}
            `}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={uploading}
                        />

                        {!selectedFile ? (
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center gap-3 cursor-pointer"
                            >
                                <FileJson className="h-12 w-12 text-muted-foreground" />
                                <div className="text-center">
                                    <p className="text-sm font-medium">
                                        {t('dragJsonFile')} <span className="text-primary">{t('selectFile')}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t('maxFileSize')}
                                    </p>
                                </div>
                            </label>
                        ) : (
                            <div className="flex items-center gap-3">
                                <FileJson className="h-8 w-8 text-primary" />
                                <div className="flex-1">
                                    <p className="font-medium">{selectedFile.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(selectedFile.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedFile(null)}
                                    disabled={uploading}
                                >
                                    {t('remove')}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Validation Progress */}
                    {uploading && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">{t('validation')}...</span>
                            </div>
                            <Progress value={undefined} className="w-full" />
                        </div>
                    )}

                    {/* Validation Results */}
                    {validationResult && (
                        <Card className="p-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    {getValidationStatusIcon(validationResult)}
                                    <h3 className="font-semibold">
                                        {validationResult.valid ? t('validationPassed') : t('validationFailed')}
                                    </h3>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <div className="text-center p-2 bg-muted rounded">
                                        <div className="text-2xl font-bold">{validationResult.stats.totalKeys}</div>
                                        <div className="text-xs text-muted-foreground">{t('totalKeys')}</div>
                                    </div>
                                    <div className="text-center p-2 bg-muted rounded">
                                        <div className={`text-2xl font-bold ${validationResult.stats.missingKeys > 0 ? 'text-yellow-500' : ''}`}>
                                            {validationResult.stats.missingKeys}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{t('missing')}</div>
                                    </div>
                                    <div className="text-center p-2 bg-muted rounded">
                                        <div className={`text-2xl font-bold ${validationResult.stats.extraKeys > 0 ? 'text-blue-500' : ''}`}>
                                            {validationResult.stats.extraKeys}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{t('extra')}</div>
                                    </div>
                                    <div className="text-center p-2 bg-muted rounded">
                                        <div className={`text-2xl font-bold ${validationResult.stats.emptyValues > 0 ? 'text-red-500' : ''}`}>
                                            {validationResult.stats.emptyValues}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{t('empty')}</div>
                                    </div>
                                </div>

                                {/* Errors and Warnings */}
                                <ScrollArea className="max-h-[200px]">
                                    <div className="space-y-2">
                                        {validationResult.errors.length > 0 && (
                                            <Alert variant="destructive">
                                                <AlertDescription>
                                                    <div className="font-semibold mb-1">{t('errors')} ({validationResult.errors.length}):</div>
                                                    <ul className="text-sm space-y-1">
                                                        {validationResult.errors.slice(0, 10).map((err, i) => (
                                                            <li key={i}>
                                                                <code className="text-xs bg-background/50 px-1 rounded">{err.key}</code>: {err.issue}
                                                            </li>
                                                        ))}
                                                        {validationResult.errors.length > 10 && (
                                                            <li className="text-muted-foreground">
                                                                {t('andMoreErrors', { count: validationResult.errors.length - 10 })}
                                                            </li>
                                                        )}
                                                    </ul>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {validationResult.warnings.length > 0 && validationResult.errors.length === 0 && (
                                            <Alert>
                                                <AlertDescription>
                                                    <div className="font-semibold mb-1">{t('warnings')} ({validationResult.warnings.length}):</div>
                                                    <ul className="text-sm space-y-1">
                                                        {validationResult.warnings.slice(0, 10).map((warn, i) => (
                                                            <li key={i}>
                                                                <code className="text-xs bg-background/50 px-1 rounded">{warn.key}</code>: {warn.issue}
                                                            </li>
                                                        ))}
                                                        {validationResult.warnings.length > 10 && (
                                                            <li className="text-muted-foreground">
                                                                {t('andMoreWarnings', { count: validationResult.warnings.length - 10 })}
                                                            </li>
                                                        )}
                                                    </ul>
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </Card>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={uploading}>
                        {t('cancel')}
                    </Button>

                    {!validationResult && (
                        <Button onClick={handleValidate} disabled={!selectedFile || !languageCode || uploading}>
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('checking')}...
                                </>
                            ) : (
                                t('check')
                            )}
                        </Button>
                    )}

                    {validationResult && validationResult.valid && (
                        <Button onClick={handleApply} disabled={uploading}>
                            {uploading ? (
                                <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('applying')}...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {t('apply')}
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
