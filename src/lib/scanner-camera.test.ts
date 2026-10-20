import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScannerCamera } from './scanner-camera';

function setup() {
  const trackStop = vi.fn();
  const stream = { getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream;
  const getUserMedia = vi.fn().mockResolvedValue(stream);
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
  const video = document.createElement('video');
  Object.defineProperty(video, 'readyState', { value: 1, configurable: true });
  const play = vi.spyOn(video, 'play').mockResolvedValue();
  const scanStop = vi.fn();
  const scan = vi.fn().mockReturnValue({ stop: scanStop });
  return { camera: new ScannerCamera({ scan }), video, stream, getUserMedia, play, scan, scanStop, trackStop };
}

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('ScannerCamera lifecycle', () => {
  it('plays once and starts one decoding loop despite repeated starts', async () => {
    const s = setup();
    const pending = s.camera.start(s.video, vi.fn());
    expect(await s.camera.start(s.video, vi.fn())).toBe(false);
    expect(await pending).toBe(true);
    expect(s.getUserMedia).toHaveBeenCalledTimes(1);
    expect(s.play).toHaveBeenCalledTimes(1);
    expect(s.scan).toHaveBeenCalledTimes(1);
    s.camera.stop();
    expect(s.scanStop).toHaveBeenCalledOnce();
    expect(s.trackStop).toHaveBeenCalledOnce();
    expect(s.video.srcObject).toBeNull();
  });

  it('releases late permission results after stopping without affecting a new session', async () => {
    const s = setup();
    let resolve!: (stream: MediaStream) => void;
    s.getUserMedia.mockReturnValueOnce(new Promise<MediaStream>(done => { resolve = done; }));
    const old = s.camera.start(s.video, vi.fn());
    s.camera.stop();
    const newStop = vi.fn();
    const newer = { getTracks: () => [{ stop: newStop }] } as unknown as MediaStream;
    s.getUserMedia.mockResolvedValueOnce(newer);
    expect(await s.camera.start(s.video, vi.fn())).toBe(true);
    resolve(s.stream);
    expect(await old).toBe(false);
    expect(s.trackStop).toHaveBeenCalledOnce();
    expect(newStop).not.toHaveBeenCalled();
    expect(s.video.srcObject).toBe(newer);
    s.camera.stop();
  });

  it('cancels metadata listeners and timeout immediately on stop', async () => {
    vi.useFakeTimers();
    const s = setup();
    Object.defineProperty(s.video, 'readyState', { value: 0 });
    const remove = vi.spyOn(s.video, 'removeEventListener');
    const pending = s.camera.start(s.video, vi.fn());
    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(1);
    s.camera.stop();
    expect(await pending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith('loadedmetadata', expect.any(Function));
    expect(s.play).not.toHaveBeenCalled();
    expect(s.scan).not.toHaveBeenCalled();
  });

  it('clears metadata timer on readiness and never scans a stopped play promise', async () => {
    vi.useFakeTimers();
    const s = setup();
    Object.defineProperty(s.video, 'readyState', { value: 0 });
    let finishPlay!: () => void;
    s.play.mockReturnValue(new Promise<void>(done => { finishPlay = done; }));
    const pending = s.camera.start(s.video, vi.fn());
    await Promise.resolve();
    s.video.dispatchEvent(new Event('loadedmetadata'));
    await Promise.resolve();
    expect(vi.getTimerCount()).toBe(0);
    s.camera.stop();
    finishPlay();
    expect(await pending).toBe(false);
    expect(s.scan).not.toHaveBeenCalled();
  });

  it('releases the camera when playback fails and allows retry', async () => {
    const s = setup();
    s.play.mockRejectedValueOnce(new Error('play failed'));
    await expect(s.camera.start(s.video, vi.fn())).rejects.toThrow('play failed');
    expect(s.trackStop).toHaveBeenCalledOnce();
    expect(s.video.srcObject).toBeNull();
    expect(await s.camera.start(s.video, vi.fn())).toBe(true);
    s.camera.stop();
  });

  it('releases stalled metadata instead of starting decoding on an unready video', async () => {
    vi.useFakeTimers();
    const s = setup();
    Object.defineProperty(s.video, 'readyState', { value: 0 });
    const pending = s.camera.start(s.video, vi.fn());
    const rejected = expect(pending).rejects.toThrow('metadata timed out');
    await vi.advanceTimersByTimeAsync(5000);
    await rejected;
    expect(s.trackStop).toHaveBeenCalledOnce();
    expect(s.scan).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(s.video.srcObject).toBeNull();
  });
});
