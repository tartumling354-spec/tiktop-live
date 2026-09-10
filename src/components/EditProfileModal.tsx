import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Check, User, AtSign, FileText, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { AVATAR_PRESETS } from '../data/mockData';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [name, setName] = useState<string>(profile.name);
  const [handle, setHandle] = useState<string>(profile.handle);
  const [bio, setBio] = useState<string>(profile.bio);
  const [avatar, setAvatar] = useState<string>(profile.avatar);

  // Camera snap states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync state whenever modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setHandle(profile.handle);
      setBio(profile.bio);
      setAvatar(profile.avatar);
      setErrorMessage(null);
      setIsCameraActive(false);
      setCameraError(null);
    }
  }, [isOpen, profile]);

  // Clean up camera stream on unmount or when camera turns off
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  // Handle local image file upload (manual or drag-drop)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('कृपया मान्य फोटो फाइल (JPG, PNG, WebP) छान्नुहोस्।');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('फोटो ८ MB भन्दा सानो हुनुपर्छ।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setAvatar(e.target.result);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('फोटो लोड गर्न सकिएन, अर्को प्रयास गर्नुहोस्।');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Live camera selfie capture
  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      console.error('Camera capture error:', err);
      setCameraError('क्यामेरा खोल्न सकिएन। कृपया क्यामेरा अनुमति जाँच गर्नुहोस्।');
      setIsCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const handleCaptureSelfie = () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror horizontally for natural selfie experience
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setAvatar(dataUrl);
        setErrorMessage(null);
      }
    } catch (err) {
      console.error('Failed to capture photo:', err);
      setErrorMessage('फोटो क्याप्चर गर्न असफल भयो।');
    } finally {
      handleStopCamera();
    }
  };

  // Submit and save updated profile
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('कृपया तपाईंको नाम लेख्नुहोस्।');
      return;
    }

    if (trimmedName.length > 40) {
      setErrorMessage('नाम ४० अक्षरभन्दा कम हुनुपर्छ।');
      return;
    }

    let formattedHandle = handle.trim();
    if (!formattedHandle) {
      formattedHandle = '@user';
    } else if (!formattedHandle.startsWith('@')) {
      formattedHandle = `@${formattedHandle}`;
    }

    onSave({
      name: trimmedName,
      handle: formattedHandle,
      bio: bio.trim(),
      avatar: avatar || profile.avatar,
    });

    handleStopCamera();
    onClose();
  };

  return (
    <div
      id="edit-profile-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={() => {
        handleStopCamera();
        onClose();
      }}
    >
      <div
        id="edit-profile-modal-content"
        className="w-full max-w-lg bg-neutral-900 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl text-white my-auto animate-scale-up max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/25">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold">Edit Profile (प्रोफाइल सम्पादन)</h3>
              <p className="text-[11px] text-neutral-400">Update your photo, display name, and bio</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-edit-profile"
            onClick={() => {
              handleStopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-white/20">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. PHOTO EDITING SECTION */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 flex flex-col items-center text-center">
            <span className="text-xs font-semibold text-neutral-300 mb-3 flex items-center gap-1.5 self-start">
              <Camera size={14} className="text-rose-400" />
              <span>Profile Photo (प्रोफाइल फोटो)</span>
            </span>

            {/* Avatar Preview with Camera Overlay */}
            <div className="relative group mb-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-rose-500 shadow-xl bg-neutral-800 ring-4 ring-rose-500/20">
                <img
                  src={avatar}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Quick overlay change button */}
              <button
                type="button"
                id="btn-avatar-quick-upload"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer backdrop-blur-xs text-white"
                title="Upload new photo"
              >
                <Camera size={22} className="text-rose-400 mb-0.5" />
                <span className="text-[9px] font-bold">Change</span>
              </button>
            </div>

            {/* In-Modal Webcam Capture Stream View */}
            {isCameraActive && (
              <div className="w-full my-3 p-3 rounded-2xl bg-neutral-900 border border-rose-500/40 animate-fade-in flex flex-col items-center">
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-rose-500 shadow-xl bg-black mb-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-snap-profile-selfie"
                    onClick={handleCaptureSelfie}
                    className="py-1.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                  >
                    <Camera size={14} />
                    <span>Snap Photo (क्लिक गर्नुहोस्)</span>
                  </button>
                  <button
                    type="button"
                    id="btn-cancel-profile-camera"
                    onClick={handleStopCamera}
                    className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="text-[11px] text-rose-400 mt-1 mb-2">{cameraError}</p>
            )}

            {/* Photo Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              {/* File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                id="input-file-profile-avatar"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                id="btn-upload-profile-photo"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Upload size={14} className="text-pink-400" />
                <span>Upload from Device (ग्यालरीबाट)</span>
              </button>

              {/* Camera Snap Button */}
              {!isCameraActive && (
                <button
                  type="button"
                  id="btn-open-profile-camera"
                  onClick={handleStartCamera}
                  className="py-2 px-3.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Camera size={14} />
                  <span>Take Selfie (क्यामेरा)</span>
                </button>
              )}
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full py-2.5 px-3 rounded-xl border border-dashed transition-all cursor-pointer text-center text-[11px] ${
                isDragging
                  ? 'border-rose-400 bg-rose-500/10 text-rose-200'
                  : 'border-white/15 hover:border-white/30 text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <span>वा फोटो यहाँ तानेर छाड्नुहोस् (Drag & Drop image here)</span>
            </div>

            {/* Ready Preset Avatars */}
            <div className="w-full mt-4 pt-3 border-t border-white/10 text-left">
              <span className="text-[11px] font-semibold text-neutral-400 mb-2 block flex items-center gap-1">
                <Sparkles size={12} className="text-amber-400" />
                <span>Or pick an avatar preset (वा तयार अवतार रोज्नुहोस्):</span>
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = avatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      id={`btn-preset-avatar-${preset.id}`}
                      onClick={() => {
                        setAvatar(preset.url);
                        setErrorMessage(null);
                        handleStopCamera();
                      }}
                      className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all p-0.5 active:scale-90 ${
                        isSelected
                          ? 'border-rose-500 ring-2 ring-rose-500/50 scale-105'
                          : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-full"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-rose-600/40 flex items-center justify-center">
                          <Check size={14} className="text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. NAME INPUT */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="input-profile-name" className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <User size={13} className="text-rose-400" />
                <span>Full Display Name (पूरा नाम)</span>
              </label>
              <span className="text-[10px] text-neutral-500">{name.length}/40</span>
            </div>
            <input
              type="text"
              id="input-profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TikTop Live Creator"
              maxLength={40}
              className="w-full bg-neutral-950/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
              required
            />
          </div>

          {/* 3. USERNAME / HANDLE INPUT */}
          <div className="space-y-1.5">
            <label htmlFor="input-profile-handle" className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <AtSign size={13} className="text-indigo-400" />
              <span>Username / Handle (ह्यान्डल)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="input-profile-handle"
                value={handle}
                onChange={(e) => {
                  let val = e.target.value;
                  if (!val.startsWith('@') && val.length > 0) {
                    val = `@${val}`;
                  }
                  setHandle(val);
                }}
                placeholder="@username"
                maxLength={30}
                className="w-full bg-neutral-950/70 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* 4. BIO TEXTAREA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="input-profile-bio" className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <FileText size={13} className="text-sky-400" />
                <span>Bio / Description (बायो / विवरण)</span>
              </label>
              <span className="text-[10px] text-neutral-500">{bio.length}/160</span>
            </div>
            <textarea
              id="input-profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your viewers and fans about yourself..."
              rows={3}
              maxLength={160}
              className="w-full bg-neutral-950/70 border border-white/15 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              id="btn-cancel-edit-profile"
              onClick={() => {
                handleStopCamera();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 font-bold text-xs transition-colors"
            >
              Cancel (रद्द गर्नुहोस्)
            </button>

            <button
              type="submit"
              id="btn-save-profile-changes"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 font-bold text-xs text-white shadow-lg shadow-rose-600/30 transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              <span>Save Profile (सुरक्षित गर्नुहोस्)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
