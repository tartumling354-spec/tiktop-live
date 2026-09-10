import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  Check
} from 'lucide-react';
import { PostVideo } from '../types';

interface VideoFeedCardProps {
  video: PostVideo;
  onLikeToggle?: (videoId: string, isLiked: boolean) => void;
}

interface CommentItem {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
}

export const VideoFeedCard: React.FC<VideoFeedCardProps> = ({ video, onLikeToggle }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isLiked, setIsLiked] = useState<boolean>(video.isLiked || false);
  const [likesCount, setLikesCount] = useState<number>(video.likesCount);
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [showHeartAnim, setShowHeartAnim] = useState<boolean>(false);

  // Comment Modal state
  const [showComments, setShowComments] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const [commentsList, setCommentsList] = useState<CommentItem[]>([
    {
      id: 'c1',
      user: 'Pooja Vibes',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      text: 'Dammi bro! 🔥 Kasto ramro video!',
      time: '1h ago',
    },
    {
      id: 'c2',
      user: 'Bipin_07',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      text: 'Next video kaile aauchha? Love from Pokhara ❤️',
      time: '35m ago',
    },
  ]);

  // Share feedback
  const [shareToast, setShareToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-play ONLY when video card is in the visible viewport (IntersectionObserver)
  useEffect(() => {
    const videoEl = videoRef.current;
    const containerEl = containerRef.current;
    if (!videoEl || !containerEl) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              videoEl
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => {
                  videoEl.muted = true;
                  setIsMuted(true);
                  videoEl.play().catch(() => {});
                });
            } else {
              videoEl.pause();
              setIsPlaying(false);
            }
          });
        },
        { threshold: [0, 0.5, 0.9] }
      );

      observer.observe(containerEl);
      return () => {
        observer.disconnect();
      };
    } else {
      // Fallback
      videoEl
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [video.videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (nextLiked) {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }
    if (onLikeToggle) {
      onLikeToggle(video.id, nextLiked);
    }
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
      if (onLikeToggle) onLikeToggle(video.id, true);
    } else {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShareToast('Link copied to clipboard! 🔗');
    setTimeout(() => setShareToast(null), 2000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newC: CommentItem = {
      id: `c-${Date.now()}`,
      user: 'You',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text: commentText.trim(),
      time: 'Just now',
    };
    setCommentsList([newC, ...commentsList]);
    setCommentText('');
  };

  // Filter styles
  const getFilterStyle = (filter?: string): string => {
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
      ref={containerRef}
      id={`video-post-card-${video.id}`}
      className="relative w-full aspect-[9/16] max-h-[580px] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl mb-6 select-none group"
      onClick={togglePlay}
      onDoubleClick={handleDoubleTap}
    >
      {/* Background Video Element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        preload="metadata"
        playsInline
        loop
        muted={isMuted}
        style={{ filter: getFilterStyle(video.filter) }}
        className="w-full h-full object-cover"
      />

      {/* Top Gradient & Sound Info */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

      {/* Play/Pause icon badge on toggle */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/90 border border-white/20 shadow-xl">
            <Play size={32} className="ml-1 fill-white" />
          </div>
        </div>
      )}

      {/* Double-Tap Floating Heart Animation */}
      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-ping">
          <Heart size={80} className="fill-rose-500 text-rose-500 drop-shadow-2xl" />
        </div>
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
          <Check size={14} className="text-emerald-400" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Top Bar: Mute Button & Time */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-medium text-white/90 border border-white/10">
          <Sparkles size={11} className="text-rose-400" />
          <span>{video.createdAt}</span>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70 transition-all border border-white/15"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Right Action Bar (TikTok Style) */}
      <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-3.5 z-10">
        {/* Author Avatar with Follow (+) */}
        <div className="relative">
          <img
            src={video.authorAvatar}
            alt={video.authorName}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full border-2 border-rose-500 object-cover shadow-lg"
          />
          {!isFollowed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFollowed(true);
              }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow"
              title="Follow"
            >
              +
            </button>
          )}
        </div>

        {/* Like Button */}
        <button
          type="button"
          onClick={handleLike}
          className="flex flex-col items-center transition-transform active:scale-75"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isLiked ? 'bg-rose-600/30 text-rose-500' : 'bg-black/40 text-white hover:text-rose-400'
            }`}
          >
            <Heart size={22} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow mt-0.5">
            {likesCount > 999 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(true);
          }}
          className="flex flex-col items-center transition-transform active:scale-75"
        >
          <div className="w-10 h-10 rounded-full bg-black/40 text-white hover:text-indigo-400 flex items-center justify-center">
            <MessageCircle size={22} />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow mt-0.5">
            {commentsList.length}
          </span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-col items-center transition-transform active:scale-75"
        >
          <div className="w-10 h-10 rounded-full bg-black/40 text-white hover:text-emerald-400 flex items-center justify-center">
            <Share2 size={22} />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow mt-0.5">
            {video.sharesCount || 12}
          </span>
        </button>

        {/* Spinning Vinyl Sound Disc */}
        <div className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center text-white/80 animate-spin" style={{ animationDuration: '4s' }}>
          <Music size={14} className="text-rose-400" />
        </div>
      </div>

      {/* Bottom Information (Author, Caption, Sound) */}
      <div className="absolute bottom-3 left-3 right-16 z-10 text-white pointer-events-none">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold drop-shadow hover:underline cursor-pointer">
              {video.authorName}
            </span>
            <span className="text-[10px] text-neutral-300 drop-shadow">
              {video.authorHandle}
            </span>
            {isFollowed && (
              <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-semibold text-rose-300">
                Following
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-100 font-medium line-clamp-2 drop-shadow mb-2 leading-relaxed">
            {video.caption}
          </p>

          {/* Sound badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-200/90 drop-shadow">
            <Music size={12} className="text-rose-400 animate-pulse" />
            <span className="truncate max-w-[200px] font-mono">{video.soundTitle}</span>
          </div>
        </div>
      </div>

      {/* Comment Drawer Modal */}
      {showComments && (
        <div
          className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex flex-col justify-end pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-white">
              Comments ({commentsList.length})
            </span>
            <button
              type="button"
              onClick={() => setShowComments(false)}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Comment list */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 max-h-60">
            {commentsList.map((c) => (
              <div key={c.id} className="flex items-start gap-2 text-xs">
                <img
                  src={c.avatar}
                  alt={c.user}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover border border-white/20 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{c.user}</span>
                    <span className="text-[10px] text-neutral-500">{c.time}</span>
                  </div>
                  <p className="text-neutral-300 mt-0.5">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={handleAddComment}
            className="p-2.5 border-t border-white/10 flex items-center gap-2 bg-neutral-900"
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment... (कमेन्ट गर्नुहोस्)"
              className="flex-1 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              className="p-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50"
              disabled={!commentText.trim()}
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
