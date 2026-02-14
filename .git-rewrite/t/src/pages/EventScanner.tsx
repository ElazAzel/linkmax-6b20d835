/**
 * EventScanner - Mobile-first QR code scanner for event check-in
 * Pro-only feature with camera access, torch toggle, recent scans
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  Check,
  X,
  Loader2,
  QrCode,
  User,
  Clock,
  AlertTriangle,
  Crown,
  Keyboard,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru, kk, enUS } from 'date-fns/locale';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import { logger } from '@/lib/logger';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

interface ScanResult {
  ticketCode: string;
  attendeeName: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

interface EventInfo {
  id: string;
  title: string;
  totalRegistrations: number;
  checkedIn: number;
}

export default function EventScanner() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus();

  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const isMountedRef = useRef(true);

  const locale = i18n.language === 'ru' ? ru : i18n.language === 'kk' ? kk : enUS;

  // Fetch event info
  useEffect(() => {
    const fetchEventInfo = async () => {
      if (!user || !eventId) return;

      try {
        const { data: event, error } = await supabase
          .from('events')
          .select('id, title_i18n_json, owner_id')
          .eq('id', eventId)
          .eq('owner_id', user.id)
          .single();

        if (error || !event) {
          toast.error(t('events.notFound', 'Событие не найдено'));
          navigate('/dashboard');
          return;
        }

        // Get registration stats
        const { data: registrations } = await supabase
          .from('event_registrations')
          .select('id, event_tickets(status)')
          .eq('event_id', eventId)
          .eq('status', 'confirmed');

        const total = registrations?.length || 0;
        const checkedIn = registrations?.filter(r =>
          r.event_tickets?.some((t: { status: string }) => t.status === 'used')
        ).length || 0;

        setEventInfo({
          id: event.id,
          title: (event.title_i18n_json as Record<string, string>)?.[i18n.language] ||
            (event.title_i18n_json as Record<string, string>)?.ru || 'Event',
          totalRegistrations: total,
          checkedIn,
        });
      } catch (error) {
        logger.error('Error fetching event:', error, { context: 'EventScanner' });
        toast.error(t('events.fetchError', 'Ошибка загрузки'));
      } finally {
        setLoading(false);
      }
    };

    fetchEventInfo();
  }, [user, eventId, navigate, t, i18n.language]);

  // Check in a ticket
  const checkInTicket = useCallback(async (ticketCode: string): Promise<ScanResult> => {
    if (!eventId || !user) {
      return {
        ticketCode,
        attendeeName: '',
        success: false,
        message: t('events.scanError', 'Ошибка сканирования'),
        timestamp: new Date(),
      };
    }

    try {
      // Find the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('event_tickets')
        .select(`
          id, 
          status, 
          ticket_code,
          registration:event_registrations!inner(
            id,
            attendee_name,
            event_id,
            owner_id
          )
        `)
        .eq('ticket_code', ticketCode.toUpperCase())
        .single();

      if (ticketError || !ticket) {
        return {
          ticketCode,
          attendeeName: '',
          success: false,
          message: t('events.ticketNotFound', 'Билет не найден'),
          timestamp: new Date(),
        };
      }

      const registration = ticket.registration as {
        id: string;
        attendee_name: string;
        event_id: string;
        owner_id: string;
      };

      // Verify event and owner
      if (registration.event_id !== eventId) {
        return {
          ticketCode,
          attendeeName: registration.attendee_name,
          success: false,
          message: t('events.wrongEvent', 'Билет для другого события'),
          timestamp: new Date(),
        };
      }

      if (registration.owner_id !== user.id) {
        return {
          ticketCode,
          attendeeName: registration.attendee_name,
          success: false,
          message: t('events.notAuthorized', 'Нет доступа'),
          timestamp: new Date(),
        };
      }

      // Check if already used
      if (ticket.status === 'used') {
        return {
          ticketCode,
          attendeeName: registration.attendee_name,
          success: false,
          message: t('events.alreadyUsed', 'Билет уже использован'),
          timestamp: new Date(),
        };
      }

      if (ticket.status === 'cancelled') {
        return {
          ticketCode,
          attendeeName: registration.attendee_name,
          success: false,
          message: t('events.ticketCancelled', 'Билет отменен'),
          timestamp: new Date(),
        };
      }

      // Mark as used
      const { error: updateError } = await supabase
        .from('event_tickets')
        .update({
          status: 'used',
          checked_in_at: new Date().toISOString()
        })
        .eq('id', ticket.id);

      if (updateError) {
        return {
          ticketCode,
          attendeeName: registration.attendee_name,
          success: false,
          message: t('events.updateError', 'Ошибка отметки'),
          timestamp: new Date(),
        };
      }

      // Update stats
      setEventInfo(prev => prev ? { ...prev, checkedIn: prev.checkedIn + 1 } : prev);

      return {
        ticketCode,
        attendeeName: registration.attendee_name,
        success: true,
        message: t('events.checkInSuccess', 'Успешно отмечен!'),
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Check-in error:', error, { context: 'EventScanner' });
      return {
        ticketCode,
        attendeeName: '',
        success: false,
        message: t('events.scanError', 'Ошибка сканирования'),
        timestamp: new Date(),
      };
    }
  }, [eventId, user, t]);

  // Process scan result
  const processScan = useCallback(async (code: string) => {
    if (processing || !code.trim()) return;

    // Check if already scanned recently
    if (recentScans.some(s => s.ticketCode === code.toUpperCase())) {
      return;
    }

    setProcessing(true);
    const result = await checkInTicket(code.trim());
    setRecentScans(prev => [result, ...prev.slice(0, 9)]);

    if (result.success) {
      toast.success(`✓ ${result.attendeeName}`);
      // Vibrate on success
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } else {
      toast.error(result.message);
      if (navigator.vibrate) {
        navigator.vibrate(300);
      }
    }

    setProcessing(false);
    setManualCode('');
  }, [processing, recentScans, checkInTicket]);

  // Stop camera and cleanup
  const stopCamera = useCallback(() => {
    logger.debug('[Scanner] Stopping camera...');

    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {
        logger.warn('[Scanner] Error stopping controls:', e);
      }
      controlsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
    setCameraReady(false);
    setTorchOn(false);
  }, []);

  // Start camera with QR reader
  const startCamera = useCallback(async () => {
    logger.debug('[Scanner] Starting camera...');

    // Cleanup any existing camera first
    stopCamera();

    try {
      setCameraError(null);

      // Check if we have a video element
      if (!videoRef.current) {
        logger.error('[Scanner] Video element not found');
        setCameraError(t('events.cameraError', 'Не удалось запустить камеру'));
        setManualMode(true);
        return;
      }

      // Step 1: Request camera permission explicitly
      logger.debug('[Scanner] Requesting camera permission...');
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (permError) {
        logger.error('[Scanner] Permission error:', permError);

        if (permError instanceof DOMException) {
          if (permError.name === 'NotAllowedError') {
            setCameraError(t('events.cameraPermissionDenied', 'Разрешите доступ к камере в настройках браузера'));
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
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      logger.debug('[Scanner] Got camera stream, attaching to video...');
      streamRef.current = stream;

      // Step 2: Attach stream to video element
      videoRef.current.srcObject = stream;

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current!;

        const onLoadedMetadata = () => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          resolve();
        };

        const onError = (e: Event) => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          reject(new Error('Video element error'));
        };

        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('error', onError);

        // Timeout fallback
        setTimeout(() => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          resolve(); // Continue anyway
        }, 3000);
      });

      // Step 3: Play the video
      logger.debug('[Scanner] Playing video...');
      try {
        await videoRef.current.play();
      } catch (playError) {
        logger.warn('[Scanner] Video play error (may be fine):', { data: { error: playError } });
      }

      if (!isMountedRef.current) {
        stopCamera();
        return;
      }

      setCameraReady(true);
      setScanning(true);
      logger.debug('[Scanner] Camera is ready and streaming');

      // Step 4: Initialize QR code reader
      logger.debug('[Scanner] Initializing QR reader...');
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      // Step 5: Start decoding from the video element
      const controls = await readerRef.current.decodeFromVideoElement(
        videoRef.current,
        (result, error) => {
          if (result) {
            const code = result.getText();
            logger.debug('[Scanner] QR Code detected:', { data: { code } });
            processScan(code);
          }
          // Errors during scanning are normal (no QR in frame), ignore them
        }
      );

      controlsRef.current = controls;
      logger.debug('[Scanner] QR reader started successfully');

    } catch (error) {
      logger.error('[Scanner] Camera error:', error);
      setCameraError(t('events.cameraError', 'Не удалось запустить камеру'));
      setManualMode(true);
    }
  }, [t, processScan, stopCamera]);

  // Toggle torch
  const toggleTorch = useCallback(async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn } as MediaTrackConstraintSet]
        });
        setTorchOn(!torchOn);
      } catch {
        toast.error(t('events.torchError', 'Фонарик не поддерживается'));
      }
    }
  }, [torchOn, t]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Auto-start camera when conditions are met
  useEffect(() => {
    if (!loading && !premiumLoading && isPremium && eventInfo && !manualMode) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (isMountedRef.current && !scanning) {
          startCamera();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [loading, premiumLoading, isPremium, eventInfo, manualMode]);

  // Premium gate
  if (!premiumLoading && !isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center max-w-sm">
          <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/30">
            <Crown className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-3">{t('events.scannerProOnly', 'QR-сканер в Pro')}</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {t('events.scannerProDescription', 'Отмечайте гостей по QR-кодам на входе')}
          </p>
          <Button
            size="lg"
            className="h-14 px-8 rounded-2xl text-base font-bold shadow-xl shadow-primary/30"
            onClick={openPremiumPurchase}
          >
            <Crown className="h-5 w-5 mr-2" />
            {t('crm.upgradeToPremium', 'Получить Premium')}
          </Button>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back', 'Назад')}
          </Button>
        </div>
      </div>
    );
  }

  if (loading || premiumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b safe-area-top">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center flex-1">
            <h1 className="font-bold truncate">{eventInfo?.title}</h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{eventInfo?.checkedIn || 0} / {eventInfo?.totalRegistrations || 0}</span>
            </div>
          </div>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* Camera view or manual input */}
        {!manualMode ? (
          <div className="relative aspect-square max-w-sm mx-auto w-full rounded-2xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Loading state */}
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">{t('events.startingCamera', 'Запуск камеры...')}</p>
                </div>
              </div>
            )}

            {/* Scan overlay */}
            {cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary rounded-2xl" />
              </div>
            )}

            {/* Camera controls */}
            {cameraReady && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-12 w-12 rounded-full"
                  onClick={toggleTorch}
                >
                  {torchOn ? <FlashlightOff className="h-5 w-5" /> : <Flashlight className="h-5 w-5" />}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
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
                <Loader2 className="h-8 w-8 animate-spin text-white" />
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
                placeholder="XXXXXX"
                className="font-mono text-center text-lg uppercase"
                maxLength={12}
                disabled={processing}
              />
              <Button
                onClick={() => processScan(manualCode)}
                disabled={!manualCode.trim() || processing}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>

            {cameraError && (
              <div className="text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                {cameraError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setManualMode(false);
                  setCameraError(null);
                  startCamera();
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                {t('events.useCamera', 'Камера')}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled
              >
                <Keyboard className="h-4 w-4 mr-2" />
                {t('events.manual', 'Вручную')}
              </Button>
            </div>
          </Card>
        )}

        {/* Recent scans */}
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
                    className={`p-3 flex items-center gap-3 ${scan.success
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                      }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${scan.success ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                      {scan.success
                        ? <Check className="h-4 w-4 text-green-500" />
                        : <X className="h-4 w-4 text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {scan.attendeeName || scan.ticketCode}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {scan.message}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
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
  );
}
