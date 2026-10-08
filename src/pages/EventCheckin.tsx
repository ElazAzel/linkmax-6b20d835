/**
 * EventCheckin - public, token-protected door scanner.
 * Anyone holding the organizer's staff link can check tickets in for that
 * single event without signing in. No other data is exposed.
 */
import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useParams } from '@/lib/router-compat';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Camera from 'lucide-react/dist/esm/icons/camera';
import CameraOff from 'lucide-react/dist/esm/icons/camera-off';
import Flashlight from 'lucide-react/dist/esm/icons/flashlight';
import FlashlightOff from 'lucide-react/dist/esm/icons/flashlight-off';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import QrCode from 'lucide-react/dist/esm/icons/qr-code';
import Users from 'lucide-react/dist/esm/icons/users';
import Clock from 'lucide-react/dist/esm/icons/clock';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { ScreenErrorBoundary } from '@/components/dashboard-v2/common/ScreenErrorBoundary';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import {
  fetchCheckinContext,
  checkinTicketByToken,
  extractTicketCode,
  type CheckinEventContext,
} from '@/services/event-checkin';

interface ScanRow {
  ticketCode: string;
  attendeeName: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

export const EventCheckin = memo(function EventCheckin() {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();

  const [context, setContext] = useState<CheckinEventContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalidLink, setInvalidLink] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanRow[]>([]);
  const [checkedIn, setCheckedIn] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const isMountedRef = useRef(true);
  const processingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load event context from the staff link
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!token) {
        setInvalidLink(true);
        setLoading(false);
        return;
      }

      const result = await fetchCheckinContext(token, i18n.language);
      if (cancelled) return;

      if (!result.ok) {
        setInvalidLink(true);
      } else {
        setContext(result.context);
        setCheckedIn(result.context.stats.checkedIn);
      }
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token, i18n.language]);

  const processScan = useCallback(
    async (scanned: string) => {
      if (!token || processingRef.current) return;

      const code = extractTicketCode(scanned);
      if (!code) return;
      if (recentScans.some((s) => s.ticketCode === code)) return;

      processingRef.current = true;
      setProcessing(true);

      const result = await checkinTicketByToken(token, code);

      let row: ScanRow;
      if (result.ok) {
        setCheckedIn(result.checkedIn);
        row = {
          ticketCode: code,
          attendeeName: result.attendeeName || code,
          success: true,
          message: t('events.checkinOk', 'Билет принят'),
          timestamp: new Date(),
        };
        toast.success(result.attendeeName || t('events.checkinOk', 'Билет принят'));
        navigator.vibrate?.([100, 50, 100]);
      } else {
        const messages: Record<string, string> = {
          invalid_token: t('events.checkinLinkInvalid', 'Ссылка больше не действует'),
          invalid_ticket: t('events.checkinBadCode', 'Неверный код билета'),
          not_found: t('events.checkinNotFound', 'Билет не найден для этого события'),
          already_used: t('events.checkinAlreadyUsed', 'Билет уже использован'),
          cancelled: t('events.checkinCancelled', 'Билет отменён'),
          unknown: t('events.checkinError', 'Не удалось проверить билет'),
        };
        const message = messages[result.code] ?? messages.unknown;
        row = {
          ticketCode: code,
          attendeeName: result.attendeeName || code,
          success: false,
          message,
          timestamp: new Date(),
        };
        toast.error(message);
        navigator.vibrate?.(300);
        if (result.code === 'invalid_token') {
          setInvalidLink(true);
        }
      }

      setRecentScans((prev) => [row, ...prev.slice(0, 9)]);
      setManualCode('');
      processingRef.current = false;
      setProcessing(false);
    },
    [token, recentScans, t],
  );

  const stopCamera = useCallback(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {
        logger.warn('[Checkin] Error stopping controls:', { data: e });
      }
      controlsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
    setCameraReady(false);
    setTorchOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();

    try {
      setCameraError(null);

      if (!videoRef.current) {
        setCameraError(t('events.cameraError', 'Не удалось запустить камеру'));
        setManualMode(true);
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (permError) {
        if (permError instanceof DOMException) {
          if (permError.name === 'NotAllowedError') {
            setCameraError(
              t('events.cameraPermissionDenied', 'Разрешите доступ к камере в настройках браузера'),
            );
          } else if (permError.name === 'NotFoundError') {
            setCameraError(t('events.noCameraFound', 'Камера не найдена на устройстве'));
          } else if (permError.name === 'NotReadableError') {
            setCameraError(t('events.cameraInUse', 'Камера используется другим приложением'));
          } else {
            setCameraError(t('events.cameraError', 'Не удалось запустить камеру'));
          }
        } else {
          setCameraError(t('events.cameraError', 'Не удалось запустить камеру'));
        }
        setManualMode(true);
        return;
      }

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await new Promise<void>((resolve) => {
        const video = videoRef.current;
        if (!video) {
          resolve();
          return;
        }
        const done = () => {
          video.removeEventListener('loadedmetadata', done);
          resolve();
        };
        video.addEventListener('loadedmetadata', done);
        setTimeout(done, 3000);
      });

      try {
        await videoRef.current.play();
      } catch (playError) {
        logger.warn('[Checkin] Video play error:', { data: { error: playError } });
      }

      if (!isMountedRef.current) {
        stopCamera();
        return;
      }

      setCameraReady(true);
      setScanning(true);

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      controlsRef.current = await readerRef.current.decodeFromVideoElement(
        videoRef.current,
        (result) => {
          if (result) {
            processScan(result.getText());
          }
        },
      );
    } catch (error) {
      logger.error('[Checkin] Camera error:', error);
      setCameraError(t('events.cameraError', 'Не удалось запустить камеру'));
      setManualMode(true);
    }
  }, [t, processScan, stopCamera]);

  useEffect(() => stopCamera, [stopCamera]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] });
      setTorchOn(!torchOn);
    } catch {
      toast.error(t('events.torchError', 'Фонарик не поддерживается'));
    }
  }, [torchOn, t]);

  // Auto-start the camera once the link is validated
  useEffect(() => {
    if (loading || invalidLink || !context || manualMode) return;

    const timer = setTimeout(() => {
      if (isMountedRef.current && !scanning) {
        startCamera();
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, invalidLink, context, manualMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (invalidLink || !context) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center max-w-sm">
          <div className="h-20 w-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">
            {t('events.checkinLinkInvalidTitle', 'Ссылка недействительна')}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t(
              'events.checkinLinkInvalidHint',
              'Попросите организатора прислать новую ссылку для проверки билетов.',
            )}
          </p>
        </div>
      </div>
    );
  }

  const startsAt = context.event.startAt ? new Date(context.event.startAt) : null;

  return (
    <ScreenErrorBoundary screenName="EventCheckin">
      <StaticSEOHead
        title={t('events.checkinStaffMode', 'Проверка билетов на входе')}
        description={t('events.checkinStaffMode', 'Проверка билетов на входе')}
        canonical={typeof window !== 'undefined' ? window.location.href : ''}
        currentLanguage={i18n.language}
        indexable={false}
      />
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b safe-area-top">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold truncate leading-tight">{context.event.title}</h1>
                <p className="text-xs text-muted-foreground truncate">
                  {t('events.checkinStaffMode', 'Проверка билетов на входе')}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0 gap-1 font-mono">
                <Users className="h-3.5 w-3.5" />
                {checkedIn} / {context.stats.total}
              </Badge>
            </div>

            {(startsAt || context.event.locationValue) && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {startsAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {startsAt.toLocaleString(i18n.language, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
                {context.event.locationValue && (
                  <span className="inline-flex items-center gap-1 truncate max-w-[60%]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{context.event.locationValue}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 flex flex-col p-4 gap-4">
          {!manualMode ? (
            <div className="relative aspect-square max-w-sm mx-auto w-full rounded-2xl overflow-hidden bg-black">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />

              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-center text-primary-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">{t('events.startingCamera', 'Запуск камеры...')}</p>
                  </div>
                </div>
              )}

              {cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-primary rounded-2xl" />
                </div>
              )}

              {cameraReady && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full" onClick={toggleTorch}>
                    {torchOn ? <FlashlightOff className="h-5 w-5" /> : <Flashlight className="h-5 w-5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-12 w-12 rounded-full"
                    onClick={() => {
                      stopCamera();
                      setManualMode(true);
                    }}
                  >
                    <CameraOff className="h-5 w-5" />
                  </Button>
                </div>
              )}

              {processing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
                </div>
              )}
            </div>
          ) : (
            <Card className="p-6 space-y-4">
              <div className="text-center">
                <QrCode className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h2 className="font-bold text-lg">{t('events.manualEntry', 'Ручной ввод')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('events.enterTicketCode', 'Введите код билета')}
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualCode.trim() && !processing) {
                      e.preventDefault();
                      processScan(manualCode);
                    }
                  }}
                  placeholder="XXXXXX"
                  className="font-mono text-center text-lg uppercase"
                  maxLength={32}
                  disabled={processing}
                />
                <Button onClick={() => processScan(manualCode)} disabled={!manualCode.trim() || processing}>
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>

              {cameraError && (
                <div className="text-center text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {cameraError}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setManualMode(false);
                  setCameraError(null);
                  startCamera();
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                {t('events.useCamera', 'Камера')}
              </Button>
            </Card>
          )}

          <div className="flex-1 min-h-0">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('events.recentScans', 'Последние сканы')}
            </h3>

            <ScrollArea className="h-64">
              {recentScans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t('events.noScansYet', 'Отсканированные билеты появятся здесь')}
                </div>
              ) : (
                <div className="space-y-2">
                  {recentScans.map((scan, idx) => (
                    <Card
                      key={`${scan.ticketCode}-${idx}`}
                      className={
                        scan.success
                          ? 'p-3 flex items-center gap-3 border-emerald-500/30 bg-emerald-500/5'
                          : 'p-3 flex items-center gap-3 border-destructive/30 bg-destructive/5'
                      }
                    >
                      <div
                        className={
                          scan.success
                            ? 'h-8 w-8 rounded-full flex items-center justify-center bg-emerald-500/20'
                            : 'h-8 w-8 rounded-full flex items-center justify-center bg-destructive/20'
                        }
                      >
                        {scan.success ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{scan.attendeeName}</div>
                        <div className="text-xs text-muted-foreground">{scan.message}</div>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {scan.ticketCode}
                      </Badge>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </ScreenErrorBoundary>
  );
});

export default EventCheckin;
