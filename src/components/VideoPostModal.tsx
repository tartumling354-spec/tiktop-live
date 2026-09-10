import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Music,
  Sparkles,
  Check,
  Play,
  Pause,
  RotateCw,
  Film,
  Tag,
  Eye,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { PostVideo, VideoFilter, UserProfile } from '../types';
import { SAMPLE_AUDIO_TRACKS, SAMPLE_VIDEO_PRESETS } from '../data/mockData';

interface VideoPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostSuccess: (newVideo: PostVideo) => void;
  userProfile?: UserProfile;
}

const POPULAR_HASHTAGS = [
  '#TikTopNepal',
  '#Nepal',
  '#Foryou',
  '#Trending',
  '#Viral',
  '#Dance',
  '#Music',
  '#Comedy',
  '#Kathmandu',
];

export const VideoPostModal: React.FC<VideoPostModalProps> = ({
  isOpen,
  onClose,
  onPostSuccess,
  userProfile,
}) => {
  // Mode: 'upload' | 'record' | 'preset'
  const [sourceMode, setSourceMode] = useState<'upload' | 'record' | 'preset'>('upload');

  // Video source data
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Video metadata
  const [caption, setCaption] = useState<string>('');
  const [selectedSound, setSelectedSound] = useState<string>(SAMPLE_AUDIO_TRACKS[0].name);
  const [selectedFilter, setSelectedFilter] = useState<VideoFilter>('none');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [postProgress, setPostProgress] = useState<number>(0);

  // Refs
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const liveCameraRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or cleanup
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetForm();
    }
  }, [isOpen]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle camera stream when recording mode is active
  useEffect(() => {
    if (isOpen && sourceMode === 'record') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, sourceMode, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: true,
        });
        mediaStreamRef.current = stream;
        if (liveCameraRef.current) {
          liveCameraRef.current.srcObject = stream;
          liveCameraRef.current.play().catch(() => {});
        }
      } else {
        setCameraError('Camera not supported in this browser. Please use Upload or Preset videos.');
      }
    } catch (err: any) {
      console.warn('Camera permission or device error:', err);
      setCameraError('Unable to access camera. You can still upload a video file or pick a trending preset!');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    } else {
      // Start recording
      recordedChunksRef.current = [];
      setRecordSeconds(0);

      const stream = mediaStreamRef.current;
      if (!stream) {
        alert('Camera stream not ready. Please check camera permissions or upload a video.');
        return;
      }

      try {
        const options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9' };
        let recorder: MediaRecorder;
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          recorder = new MediaRecorder(stream, options);
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          recorder = new MediaRecorder(stream, { mimeType: 'video/mp4' });
        } else {
          recorder = new MediaRecorder(stream);
        }

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          stopCamera();
          setSourceMode('upload'); // Switch to preview
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);

        timerIntervalRef.current = window.setInterval(() => {
          setRecordSeconds((prev) => {
            if (prev >= 60) {
              // 60 seconds limit
              toggleRecording();
              return 60;
            }
            return prev + 1;
          });
        }, 1000);
      } catch (e: any) {
        console.error('MediaRecorder error:', e);
        alert('MediaRecorder could not start: ' + e.message);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  };

  const handleSelectPreset = (presetUrl: string, presetTitle: string) => {
    setVideoUrl(presetUrl);
    setCaption((prev) => (prev ? prev : `${presetTitle} ✨ #Viral #TikTopNepal`));
    setSourceMode('upload');
  };

  const handleAddHashtag = (tag: string) => {
    if (!caption.includes(tag)) {
      setCaption((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const resetForm = () => {
    setVideoUrl('');
    setVideoFile(null);
    setCaption('');
    setSelectedSound(SAMPLE_AUDIO_TRACKS[0].name);
    setSelectedFilter('none');
    setSourceMode('upload');
    setIsRecording(false);
    setRecordSeconds(0);
    setIsPosting(false);
    setPostProgress(0);
  };

  const handlePost = () => {
    if (!videoUrl) {
      alert('कृपया पहिले भिडियो रेकर्ड गर्नुहोस् वा छनोट गर्नुहोस्! (Please upload or record a video first!)');
      return;
    }

    setIsPosting(true);
    setPostProgress(10);

    // Simulate progress
    const interval = setInterval(() => {
      setPostProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setPostProgress(100);

      // Create new video object
      const newVideo: PostVideo = {
        id: `post-${Date.now()}`,
        authorName: userProfile?.name || 'TikTop Creator (You)',
        authorHandle: userProfile?.handle || '@creator_np',
        authorAvatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        videoUrl: videoUrl,
        caption: caption.trim() || 'My new video post on TikTop! ✨ #TikTopNepal #Viral',
        soundTitle: selectedSound,
        likesCount: 1,
        commentsCount: 0,
        sharesCount: 0,
        isLiked: true,
        createdAt: 'Just now',
        tags: caption.match(/#[a-zA-Z0-9_]+/g) || ['#TikTopNepal', '#Viral'],
        filter: selectedFilter,
      };

      // Save to localStorage
      try {
        const stored = localStorage.getItem('tiktop_posted_videos');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(newVideo);
        localStorage.setItem('tiktop_posted_videos', JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to persist video in localStorage:', e);
      }

      setTimeout(() => {
        setIsPosting(false);
        onPostSuccess(newVideo);
        onClose();
        resetForm();
      }, 400);
    }, 900);
  };

  if (!isOpen) return null;

  // Filter styles
  const getFilterStyle = (filter: VideoFilter): string => {
    switch (filter) {
      case 'beauty':
        return 'brightness(1.08) contrast(1.05) saturate(1.18)';
      case 'warm':
        return 'sepia(0.25) saturate(1.25) contrast(1.05)';
      case 'cool':
        return 'hue-rotate(185deg) saturate(1.1)';
      case 'vintage':
        return 'sepia(0.5) contrast(1.15) brightness(0.95)';
      case 'vibrant':
        return 'saturate(1.6) contrast(1.1)';
      default:
        return 'none';
    }
  };

  return (
    <div
      id="video-post-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        id="video-post-modal-content"
        className="w-full max-w-lg bg-neutral-900 border border-white/10 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 sticky top-0 bg-neutral-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md">
              <Film size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Post Video</span>
                <span className="text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                  भिडियो पोस्ट
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">Share your creative video clip with followers</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-post-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Source Picker Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 mb-4">
          <button
            type="button"
            id="tab-source-upload"
            onClick={() => setSourceMode('upload')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              sourceMode === 'upload'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload size={14} />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            id="tab-source-record"
            onClick={() => setSourceMode('record')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              sourceMode === 'record'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Camera size={14} />
            <span>Camera Record</span>
          </button>

          <button
            type="button"
            id="tab-source-preset"
            onClick={() => setSourceMode('preset')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              sourceMode === 'preset'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Trending Clips</span>
          </button>
        </div>

        {/* 1. Camera Record Mode */}
        {sourceMode === 'record' && (
          <div className="relative aspect-[9/14] w-full max-h-72 rounded-2xl overflow-hidden bg-black border border-white/15 mb-4 flex flex-col items-center justify-center">
            {cameraError ? (
              <div className="p-4 text-center">
                <AlertCircle size={32} className="text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-neutral-300 mb-3">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setSourceMode('upload')}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-xs font-semibold text-white"
                >
                  Upload Video File Instead
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={liveCameraRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ filter: getFilterStyle(selectedFilter) }}
                  className="w-full h-full object-cover"
                />

                {/* Camera Top Controls */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <div className="bg-black/60 backdrop-blur px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-neutral-400'}`} />
                    <span>00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                    className="p-1.5 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-all"
                    title="Flip Camera"
                  >
                    <RotateCw size={15} />
                  </button>
                </div>

                {/* Record Trigger Button */}
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center">
                  <button
                    type="button"
                    id="btn-toggle-record-video"
                    onClick={toggleRecording}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all p-1 border-2 ${
                      isRecording ? 'border-white bg-rose-600/30' : 'border-rose-500 bg-black/50'
                    }`}
                  >
                    <div
                      className={`transition-all ${
                        isRecording
                          ? 'w-6 h-6 rounded-md bg-rose-500 animate-pulse'
                          : 'w-10 h-10 rounded-full bg-rose-600 shadow-lg shadow-rose-600/50'
                      }`}
                    />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 2. Trending Preset Selector Mode */}
        {sourceMode === 'preset' && (
          <div className="mb-4">
            <span className="text-xs font-semibold text-neutral-300 mb-2 block">
              Pick a trending video clip to post:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {SAMPLE_VIDEO_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  id={`preset-${preset.id}`}
                  onClick={() => handleSelectPreset(preset.url, preset.title)}
                  className={`group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border transition-all ${
                    videoUrl === preset.url
                      ? 'border-rose-500 ring-2 ring-rose-500'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img
                    src={preset.thumbnail}
                    alt={preset.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-xs font-bold text-white block truncate">{preset.title}</span>
                    <div className="flex gap-1 mt-0.5">
                      {preset.tags.map((t) => (
                        <span key={t} className="text-[9px] text-neutral-300">#{t}</span>
                      ))}
                    </div>
                  </div>
                  {videoUrl === preset.url && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Upload File Mode or Video Preview */}
        {sourceMode === 'upload' && (
          <div className="mb-4">
            {videoUrl ? (
              <div className="relative aspect-[9/13] w-full max-h-64 rounded-2xl overflow-hidden bg-black border border-white/20 mx-auto group">
                <video
                  ref={videoPreviewRef}
                  src={videoUrl}
                  playsInline
                  loop
                  autoPlay
                  muted
                  style={{ filter: getFilterStyle(selectedFilter) }}
                  className="w-full h-full object-cover"
                />

                {/* Play/Pause Overlay */}
                <button
                  type="button"
                  onClick={() => {
                    if (videoPreviewRef.current) {
                      if (isPlaying) {
                        videoPreviewRef.current.pause();
                        setIsPlaying(false);
                      } else {
                        videoPreviewRef.current.play();
                        setIsPlaying(true);
                      }
                    }
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all text-white"
                >
                  {!isPlaying && (
                    <div className="w-12 h-12 rounded-full bg-rose-600/90 flex items-center justify-center shadow-lg">
                      <Play size={24} className="ml-1" />
                    </div>
                  )}
                </button>

                {/* Change video action */}
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text-[11px] font-semibold text-white hover:bg-black/90 border border-white/20"
                  >
                    Change Video
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-rose-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white/5 hover:bg-rose-500/5 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 group-hover:scale-110 flex items-center justify-center mx-auto mb-3 transition-transform">
                  <Upload size={26} />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Select video from device</h4>
                <p className="text-xs text-neutral-400 mb-3">MP4, WebM, MOV up to 100MB</p>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 text-xs font-semibold text-white shadow-md group-hover:bg-rose-500"
                >
                  Browse Files
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Caption & Description */}
        <div className="space-y-1.5 mb-3.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Tag size={13} className="text-rose-400" />
              <span>Caption & Hashtags (क्याप्सन)</span>
            </span>
            <span className="text-[10px] text-neutral-400">{caption.length}/150</span>
          </label>
          <textarea
            id="input-video-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 150))}
            placeholder="Describe your video, tag friends or trending topics... #TikTopNepal"
            rows={2}
            className="w-full bg-white/5 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
          />

          {/* Quick Hashtags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {POPULAR_HASHTAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddHashtag(tag)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-300 border border-white/10 whitespace-nowrap transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Soundtrack / Music Track Selector */}
        <div className="space-y-1.5 mb-3.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Music size={13} className="text-indigo-400" />
            <span>Sound / Audio Track</span>
          </label>
          <select
            id="select-video-sound"
            value={selectedSound}
            onChange={(e) => setSelectedSound(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-colors"
          >
            {SAMPLE_AUDIO_TRACKS.map((track) => (
              <option key={track.id} value={track.name} className="bg-neutral-900 text-white">
                {track.name}
              </option>
            ))}
          </select>
        </div>

        {/* Video Filter Selector */}
        <div className="space-y-1.5 mb-4">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            <span>Visual Filter</span>
          </label>
          <div className="grid grid-cols-6 gap-1.5 text-center">
            {(['none', 'beauty', 'warm', 'cool', 'vintage', 'vibrant'] as VideoFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFilter(f)}
                className={`py-1.5 rounded-lg text-[10px] capitalize font-medium transition-all ${
                  selectedFilter === f
                    ? 'bg-rose-600 text-white font-bold shadow'
                    : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy setting */}
        <div className="flex items-center justify-between py-2 border-t border-white/10 mb-4 text-xs">
          <span className="text-neutral-400 flex items-center gap-1.5">
            <Eye size={13} className="text-emerald-400" />
            <span>Who can watch</span>
          </span>
          <div className="flex gap-2">
            {(['public', 'friends', 'private'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrivacy(p)}
                className={`px-2 py-0.5 rounded-md text-[11px] capitalize transition-colors ${
                  privacy === p
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Post Button & Progress */}
        {isPosting ? (
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-rose-500" />
                <span>Posting video to TikTop feed...</span>
              </span>
              <span className="font-mono font-bold text-rose-400">{postProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-200"
                style={{ width: `${postProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            id="btn-submit-post-video"
            onClick={handlePost}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-lg shadow-rose-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            <span>Post Video Now (भिडियो पोस्ट गर्नुहोस्)</span>
          </button>
        )}
      </div>
    </div>
  );
};
