'use client';

import { useRef, useEffect, useState } from 'react';
import { calculateScanRegion, type ScanRegion } from '@/lib/scanner';

interface DebugInfo {
  frameMs: number;
  cropSrc: string;
  hashInputSrc: string;
}

interface CameraViewProps {
  scanning: boolean;
  debug?: boolean;
  onFrame: (video: HTMLVideoElement, scanRegion: ScanRegion) => void;
  onDebugInfo?: (info: DebugInfo) => void;
}

export default function CameraView({ scanning, debug, onFrame, onDebugInfo }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/stop camera
  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          'Camera not available. Try http://localhost:3000 or run: npm run dev -- --experimental-https'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        // Check torch support
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as Record<string, unknown> | undefined;
        setTorchSupported(caps?.torch === true);

        setCameraReady(true);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        if (err instanceof DOMException && err.name === 'NotAllowedError') {
          setError('Camera access denied. Allow camera access in browser settings, then reload.');
        } else {
          setError(`Camera error: ${detail}`);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      setTorchOn(false);
      setTorchSupported(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraReady(false);
    };
  }, [scanning]);

  // Toggle torch
  useEffect(() => {
    if (!cameraReady || !streamRef.current || !torchSupported) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    track.applyConstraints({ advanced: [{ torch: torchOn } as MediaTrackConstraintSet] }).catch(() => {});
  }, [torchOn, cameraReady, torchSupported]);

  // Draw overlay
  useEffect(() => {
    if (!cameraReady || !videoRef.current || !overlayCanvasRef.current) return;

    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;

    const drawOverlay = () => {
      if (!video.videoWidth || !video.videoHeight || !video.clientWidth || !video.clientHeight) return;

      overlay.width = video.clientWidth;
      overlay.height = video.clientHeight;
      const ctx = overlay.getContext('2d')!;

      const scaleX = video.clientWidth / video.videoWidth;
      const scaleY = video.clientHeight / video.videoHeight;
      const region = calculateScanRegion(video.videoWidth, video.videoHeight);

      const sX = region.scanX * scaleX;
      const sY = region.scanY * scaleY;
      const sW = region.scanW * scaleX;
      const sH = region.scanH * scaleY;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, overlay.width, overlay.height);
      ctx.clearRect(sX, sY, sW, sH);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sX, sY, sW, sH);

      const cornerLen = 25;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#22c55e';
      const corners = [
        [sX, sY, 1, 1], [sX + sW, sY, -1, 1],
        [sX, sY + sH, 1, -1], [sX + sW, sY + sH, -1, -1],
      ];
      for (const [cx, cy, dx, dy] of corners) {
        ctx.beginPath();
        ctx.moveTo(cx, cy + cornerLen * dy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + cornerLen * dx, cy);
        ctx.stroke();
      }
    };

    const retryInterval = setInterval(drawOverlay, 200);
    const resizeObserver = new ResizeObserver(drawOverlay);
    resizeObserver.observe(video);
    return () => {
      clearInterval(retryInterval);
      resizeObserver.disconnect();
    };
  }, [cameraReady]);

  // Frame capture loop
  useEffect(() => {
    if (!scanning || !cameraReady || !videoRef.current) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    const video = videoRef.current;

    intervalRef.current = setInterval(() => {
      if (video.readyState < video.HAVE_CURRENT_DATA) return;

      const t0 = performance.now();
      const region = calculateScanRegion(video.videoWidth, video.videoHeight);
      onFrame(video, region);
      const frameMs = performance.now() - t0;

      if (debug && onDebugInfo) {
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 250;
        previewCanvas.height = Math.round(250 * (region.scanH / region.scanW));
        const pCtx = previewCanvas.getContext('2d')!;
        pCtx.drawImage(video, region.scanX, region.scanY, region.scanW, region.scanH, 0, 0, previewCanvas.width, previewCanvas.height);

        const hashCanvas = document.createElement('canvas');
        hashCanvas.width = 224;
        hashCanvas.height = 224;
        const hCtx = hashCanvas.getContext('2d')!;
        hCtx.drawImage(video, region.scanX, region.scanY, region.scanW, region.scanH, 0, 0, 224, 224);

        onDebugInfo({
          frameMs: Math.round(frameMs * 10) / 10,
          cropSrc: previewCanvas.toDataURL('image/jpeg', 0.7),
          hashInputSrc: hashCanvas.toDataURL('image/jpeg', 0.7),
        });
      }
    }, 200);

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [scanning, cameraReady, onFrame, debug, onDebugInfo]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-900 rounded-lg p-8 text-center">
        <div>
          <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p className="text-red-400 text-lg font-medium mb-2">Camera Access Required</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full block"
        playsInline
        muted
        style={{ minHeight: 300 }}
      />
      {cameraReady && (
        <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      )}
      {torchSupported && (
        <button
          onClick={() => setTorchOn(v => !v)}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
            torchOn ? 'bg-yellow-400 text-black' : 'bg-black/50 text-white'
          }`}
          title={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
        >
          <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </button>
      )}
    </div>
  );
}
