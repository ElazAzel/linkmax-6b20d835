import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';

type ScannerReader = Pick<BrowserMultiFormatReader, 'scan'>;

function waitForMetadata(video: HTMLVideoElement, signal: AbortSignal): Promise<void> {
  if (video.readyState >= 1) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata', loaded);
      video.removeEventListener('error', failed);
      signal.removeEventListener('abort', aborted);
      if (error) reject(error); else resolve();
    };
    const loaded = () => finish();
    const failed = () => finish(new Error('Camera video failed to load'));
    const aborted = () => finish(new DOMException('Camera stopped', 'AbortError'));
    const timer = setTimeout(() => finish(new Error('Camera video metadata timed out')), 5000);
    video.addEventListener('loadedmetadata', loaded);
    video.addEventListener('error', failed);
    signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) aborted();
  });
}

/** Owns exactly one camera startup/scan loop; stopped asynchronous work cannot revive it. */
export class ScannerCamera {
  stream: MediaStream | null = null;
  private session: AbortController | null = null;
  private video: HTMLVideoElement | null = null;
  private controls: IScannerControls | null = null;

  constructor(private readonly reader: ScannerReader = new BrowserMultiFormatReader()) {}

  stop(): void {
    this.session?.abort();
    this.session = null;
    try { this.controls?.stop(); } finally {
      this.controls = null;
      this.stream?.getTracks().forEach(track => track.stop());
      this.stream = null;
      if (this.video) this.video.srcObject = null;
      this.video = null;
    }
  }

  async start(video: HTMLVideoElement, onCode: (code: string) => void): Promise<boolean> {
    if (this.session) return false;
    const session = new AbortController();
    this.session = session;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (session.signal.aborted) {
        stream.getTracks().forEach(track => track.stop());
        return false;
      }
      this.stream = stream;
      this.video = video;
      video.srcObject = stream;
      await waitForMetadata(video, session.signal);
      if (session.signal.aborted) return false;
      await video.play();
      if (session.signal.aborted) return false;
      // decodeFromVideoElement would call play() again on this already-playing video.
      this.controls = this.reader.scan(video, result => {
        if (!session.signal.aborted && result) onCode(result.getText());
      });
      return true;
    } catch (error) {
      if (session.signal.aborted) return false;
      this.stop();
      throw error;
    }
  }
}
