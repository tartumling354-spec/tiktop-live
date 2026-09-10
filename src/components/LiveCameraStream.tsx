import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { VideoFilter } from '../types';

interface LiveCameraStreamProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  facingMode: 'user' | 'environment';
  filter: VideoFilter;
  onToggleFacingMode: () => void;
  streamerName?: string;
  isHost?: boolean;
  isMiniBox?: boolean;
}

export const LiveCameraStream: React.FC<LiveCameraStreamProps> = ({
  isCameraOn,
  isMicOn,
  facingMode,
  filter,
  onToggleFacingMode,
  streamerName = 'You',
  isHost = true,
  isMiniBox = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [useVirtualFeed, setUseVirtualFeed] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera safely
  useEffect(() => {
    let isMounted = true;

    async function setupCamera() {
      if (!isCameraOn) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setStreamActive(false);
        return;
      }

      try {
        setMediaError(null);
        // Clean up previous stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: isMicOn,
          });

          if (!isMounted) {
            mediaStream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            await videoRef.current.play().catch(() => {
              // Auto-play was prevented; ignore or handled
            });
          }
          setStreamActive(true);
          setUseVirtualFeed(false);
        } else {
          // Browser does not support media devices; fallback to virtual live studio
          setUseVirtualFeed(true);
          setStreamActive(true);
        }
      } catch (err: any) {
        console.warn('Camera access unavailable or denied, activating Live Studio Virtual Feed:', err?.message || err);
        if (isMounted) {
          // DO NOT navigate away or throw! Instead, gracefully activate high-fidelity virtual streamer feed
          setUseVirtualFeed(true);
          setStreamActive(true);
          setMediaError('Physical camera in sandbox/device restricted. High-Definition Virtual Studio feed is active!');
        }
      }
    }

    setupCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOn, facingMode]);

  // Audio track mute toggle
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn]);

  // Virtual animated canvas feed fallback when real camera is restricted
  useEffect(() => {
    if (!useVirtualFeed || !isCameraOn) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const renderVirtualFeed = () => {
      time += 0.03;
      const width = canvas.width;
      const height = canvas.height;

      // Studio background gradient
      const grad = ctx.createRadialGradient(
        width / 2 + Math.sin(time * 0.5) * 60,
        height * 0.4 + Math.cos(time * 0.5) * 40,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7
      );
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Studio light rays
      ctx.save();
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 5; i++) {
        const rayAngle = time * 0.2 + (i * Math.PI) / 2.5;
        ctx.beginPath();
        ctx.moveTo(width / 2, -50);
        ctx.lineTo(width / 2 + Math.cos(rayAngle) * 400, height);
        ctx.lineTo(width / 2 + Math.cos(rayAngle + 0.3) * 400, height);
        ctx.closePath();
        ctx.fillStyle = '#6366f1';
        ctx.fill();
      }
      ctx.restore();

      // Audio waveform rings
      if (isMicOn) {
        ctx.save();
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.lineWidth = 3;
        for (let r = 1; r <= 3; r++) {
          const radius = 100 + r * 30 + Math.sin(time * 3 + r) * 12;
          ctx.beginPath();
          ctx.arc(width / 2, height * 0.42, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Studio Streamer Avatar
      const bobbing = Math.sin(time * 1.8) * 8;
      const headY = height * 0.4 + bobbing;

      // Glow behind head
      ctx.save();
      const glow = ctx.createRadialGradient(width / 2, headY, 10, width / 2, headY, 110);
      glow.addColorStop(0, 'rgba(244, 63, 94, 0.5)');
      glow.addColorStop(1, 'rgba(244, 63, 94, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(width / 2, headY, 110, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Shoulders / Torso
      ctx.save();
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.ellipse(width / 2, headY + 140, 130, 80, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Face
      ctx.save();
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(width / 2, headY, 55, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#1e293b';
      const eyeBlink = Math.sin(time * 4) > 0.96 ? 1 : 7;
      ctx.beginPath();
      ctx.ellipse(width / 2 - 18, headY - 5, 5, eyeBlink, 0, 0, Math.PI * 2);
      ctx.ellipse(width / 2 + 18, headY - 5, 5, eyeBlink, 0, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width / 2, headY + 10, 18, 0.2, Math.PI - 0.2, false);
      ctx.stroke();

      // Hair
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(width / 2, headY - 15, 60, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Streamer Name Pill
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.roundRect(width / 2 - 80, headY + 70, 160, 32, 16);
      ctx.fill();
      ctx.font = '600 14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${streamerName} 🔴 LIVE`, width / 2, headY + 86);
      ctx.restore();

      animId = requestAnimationFrame(renderVirtualFeed);
    };

    renderVirtualFeed();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [useVirtualFeed, isCameraOn, isMicOn, streamerName]);

  // CSS Filter map
  const getFilterStyle = (): string => {
    switch (filter) {
      case 'beauty':
        return 'brightness(1.08) contrast(1.05) saturate(1.15) blur(0.2px)';
      case 'warm':
        return 'sepia(0.25) saturate(1.3) brightness(1.04)';
      case 'cool':
        return 'hue-rotate(180deg) saturate(0.9) brightness(1.05)';
      case 'vintage':
        return 'sepia(0.4) contrast(1.15) brightness(0.95)';
      case 'vibrant':
        return 'saturate(1.6) contrast(1.1)';
      default:
        return 'none';
    }
  };

  return (
    <div id="live-camera-container" className="relative w-full h-full bg-neutral-950 overflow-hidden select-none">
      {/* Real Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          filter: getFilterStyle(),
          transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          streamActive && !useVirtualFeed && isCameraOn ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
        }`}
      />

      {/* Virtual Live Canvas Feed */}
      <canvas
        ref={canvasRef}
        width={720}
        height={1280}
        style={{ filter: getFilterStyle() }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          useVirtualFeed && isCameraOn ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
        }`}
      />

      {/* Camera Off State */}
      {!isCameraOn && (
        <div id="camera-off-placeholder" className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-neutral-400">
          {isMiniBox ? (
            <div className="flex flex-col items-center justify-center gap-1">
              <CameraOff size={18} className="text-neutral-500" />
              <span className="text-[9px] text-neutral-500">Video Off</span>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-neutral-500 shadow-inner">
                <CameraOff size={36} />
              </div>
              <p className="text-sm font-medium text-neutral-300">Camera is turned off</p>
              <p className="text-xs text-neutral-500 mt-1">Tap camera icon below to turn on</p>
            </>
          )}
        </div>
      )}

      {/* Notification if using HD Virtual Studio Feed (Fullscreen only) */}
      {!isMiniBox && mediaError && isCameraOn && (
        <div
          id="virtual-studio-badge"
          className="absolute top-20 left-4 right-4 z-20 bg-black/75 backdrop-blur-md border border-white/15 px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-amber-300 shadow-lg animate-fade-in"
        >
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
          <span className="flex-1 font-medium">{mediaError}</span>
        </div>
      )}

      {/* Active Filter Indicator Badge (Fullscreen only) */}
      {!isMiniBox && filter !== 'none' && (
        <div
          id="active-filter-badge"
          className="absolute top-20 right-4 z-20 bg-rose-500/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider"
        >
          <Sparkles size={12} />
          {filter}
        </div>
      )}

      {/* Flip Camera overlay button for quick access (Fullscreen only) */}
      {!isMiniBox && isHost && isCameraOn && !useVirtualFeed && (
        <button
          type="button"
          id="btn-flip-camera-quick"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFacingMode();
          }}
          className="absolute top-20 left-4 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/20 transition-all active:scale-95"
          title="Flip Camera"
        >
          <RefreshCw size={18} />
        </button>
      )}
    </div>
  );
};
