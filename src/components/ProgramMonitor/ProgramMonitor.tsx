import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cx } from '@linaria/core';
import { useEditorStore } from '../../store/editorStore';
import type { MediaItem, TimelineClip } from '../../types';
import { frameToTimecode } from '../../utils/time';
import {
  Panel,
  PreviewArea,
  PreviewCanvas,
  TimecodeOverlay,
  ResolutionInfo,
  EmptyPreview,
  ControlsBar,
  TimecodeDisplay,
  TransportControls,
  ControlBtn,
  ControlBtnPlay,
  ControlBtnActive,
  DurationDisplay,
  Scrubber,
  ScrubberProgress,
  ScrubberHandle,
} from './ProgramMonitor.styles';

export default function ProgramMonitor() {
  const { playback, togglePlay, stopPlayback, stepFrame, setCurrentFrame, project, tracks, mediaItems } = useEditorStore();
  const proxyUrls = useEditorStore((s) => s.proxyUrls);
  const skimmerActive = useEditorStore((s) => s.skimmer && !playback.isPlaying && s.skimmerFrame !== null);
  const skimmerOnly = useEditorStore((s) => s.skimmerFrame);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  // Skimmer: while hovering the timeline with the tool enabled (and
  // playback paused) the Program monitor previews the hovered frame
  // without moving the playhead.
  const displayFrame =
    skimmerActive && skimmerOnly !== null ? skimmerOnly : playback.currentFrame;

  const handleScrub = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentFrame(Math.round(ratio * playback.durationInFrames));
  }, [playback.durationInFrames, setCurrentFrame]);

  const progress = playback.durationInFrames > 0
    ? (playback.currentFrame / playback.durationInFrames) * 100
    : 0;

  const totalClips = tracks.reduce((acc, t) => acc + t.clips.length, 0);

  const mediaLookup = useMemo(() => {
    const map = new Map<string, typeof mediaItems[0]>();
    for (const item of mediaItems) map.set(item.id, item);
    return map;
  }, [mediaItems]);

  // Topmost visible video clip under the playhead (highest track index wins).
  const activeVideo = useMemo(() => {
    const frame = displayFrame;
    let best: { clip: (typeof tracks)[number]['clips'][number]; trackIndex: number } | null = null;
    for (const track of tracks) {
      if (track.type !== 'video' || !track.visible) continue;
      for (const clip of track.clips) {
        if (frame >= clip.startFrame && frame < clip.startFrame + clip.durationInFrames) {
          if (!best || track.index > best.trackIndex) best = { clip, trackIndex: track.index };
        }
      }
    }
    if (!best) return null;
    const media = mediaLookup.get(best.clip.mediaId);
    if (!media?.url) return null;
    return { clip: best.clip, media };
  }, [tracks, displayFrame, mediaLookup]);

  // Source-time offset (seconds) of the playhead inside the active clip.
  const sourceOffset = activeVideo
    ? Math.min(
        Math.max(0, (displayFrame - activeVideo.clip.startFrame + activeVideo.clip.inPoint) / playback.fps),
        Math.max(0, activeVideo.media.duration - 0.05),
      )
    : 0;

  // Lightweight 480p proxy when ready (same duration — timeline math
  // unchanged), original file otherwise.
  const proxyUrl = activeVideo ? proxyUrls[activeVideo.media.id] : undefined;
  const playbackSrc = activeVideo?.media.url ? (proxyUrl ?? activeVideo.media.url) : undefined;

  // Adopt a fresh source only while paused or when the clip itself changes.
  // A proxy finishing mid-playback would otherwise remount the element and
  // replay it from 0 while the playhead runs on — on slow phones that looks
  // like the video looping a few seconds in.
  const srcLockRef = useRef<{ src: string | undefined; mediaId: string | null }>({ src: undefined, mediaId: null });
  if (!playback.isPlaying || activeVideo?.media.id !== srcLockRef.current.mediaId) {
    srcLockRef.current = { src: playbackSrc, mediaId: activeVideo?.media.id ?? null };
  }
  const lockedSrc = srcLockRef.current.src;

  // Buffering stall handling (weak mobile decoders): the wall-clock playhead
  // keeps running while a starving <video> stands still, so seconds run away
  // from the picture. Pause the clock on stall, resume when fed.
  const stallPauseRef = useRef(false);
  const playStartRef = useRef(0);
  const lastVideoElRef = useRef<HTMLVideoElement | null>(null);
  const lastResyncSeekRef = useRef(0);
  const handleWaiting = useCallback(() => {
    const st = useEditorStore.getState();
    if (!st.playback.isPlaying || stallPauseRef.current) return;
    const now = performance.now();
    if (now - playStartRef.current < 1500) return; // first frames still loading
    if (now - lastResyncSeekRef.current < 800) return; // our own seek, not a stall
    stallPauseRef.current = true;
    st.setPlayback({ isPlaying: false });
  }, []);
  const handleCanPlay = useCallback(() => {
    if (!stallPauseRef.current) return;
    stallPauseRef.current = false;
    const st = useEditorStore.getState();
    if (!st.playback.isPlaying) st.setPlayback({ isPlaying: true });
  }, []);

  // Seek the video element while paused (step, scrub, clip change).
  // While playing the element is left alone: repeated currentTime writes
  // stall the audio track on mobile browsers.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo || activeVideo.media.type !== 'video') return;
    if (playback.isPlaying) return;
    if (!Number.isFinite(sourceOffset)) return;
    if (video.readyState < 1) return;
    try { video.currentTime = sourceOffset; } catch { /* seek while loading */ }
  }, [displayFrame, playback.isPlaying, activeVideo, sourceOffset, lockedSrc]);

  // While playing, resync only after a huge jump (e.g. tab switch).
  // Throttled and skipped on a starving decoder: hammering currentTime on a
  // struggling phone makes the stall worse instead of fixing it.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo || activeVideo.media.type !== 'video') return;
    if (!playback.isPlaying) return;
    if (video.readyState < 2 || !Number.isFinite(sourceOffset)) return;
    if (Math.abs(video.currentTime - sourceOffset) > 2) {
      const now = performance.now();
      if (now - lastResyncSeekRef.current < 1000) return;
      lastResyncSeekRef.current = now;
      try { video.currentTime = sourceOffset; } catch { /* ignore */ }
    }
  }, [playback.currentFrame, playback.isPlaying, activeVideo, sourceOffset, lockedSrc]);

  // Space (or the transport button) toggles real video playback.
  // wasPlayingRef aligns the frame once on (re)start, then hands off.
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo || activeVideo.media.type !== 'video') return;
    if (video !== lastVideoElRef.current) {
      // Fresh element (clip change / source swap): give first frames a grace
      // period before the stall detector may pause the clock.
      lastVideoElRef.current = video;
      playStartRef.current = performance.now();
    }
    if (playback.isPlaying) {
      if (!wasPlayingRef.current && video.readyState >= 1 && Number.isFinite(sourceOffset)) {
        playStartRef.current = performance.now();
        try { video.currentTime = sourceOffset; } catch { /* seek while loading */ }
      }
      wasPlayingRef.current = true;
      const attempt = video.play();
      if (attempt) {
        attempt.catch(() => {
          // Autoplay policy blocked sound: fall back to muted playback.
          setAudioBlocked(true);
          video.muted = true;
          video.play().catch(() => undefined);
        });
      }
    } else {
      wasPlayingRef.current = false;
      video.pause();
    }
  }, [playback.isPlaying, activeVideo, sourceOffset, lockedSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = 1;
  }, [activeVideo?.media.id]);

  // ---- Timeline audio (MP3 clips on A1/A2/..., linked audio mates) ----
  // The <video> element above carries embedded sound only for its own
  // picture. Standalone audio clips need their own elements, otherwise
  // an MP3 on an audio track is visible but silent.
  const activeVideoClipId = activeVideo?.clip.id ?? null;
  const activeAudios = useMemo(() => {
    const list: { clip: TimelineClip; media: MediaItem; offset: number }[] = [];
    for (const track of tracks) {
      if (track.type !== 'audio' || track.muted) continue;
      for (const clip of track.clips) {
        if (playback.currentFrame < clip.startFrame || playback.currentFrame >= clip.startFrame + clip.durationInFrames) continue;
        // A linked mate duplicates its video's embedded sound while that
        // video is on screen — play the mate only when its video is away,
        // so the pair never doubles up.
        if (clip.linkedClipId && clip.linkedClipId === activeVideoClipId) continue;
        const media = mediaLookup.get(clip.mediaId);
        if (!media?.url) continue;
        list.push({
          clip,
          media,
          offset: Math.max(0, (playback.currentFrame - clip.startFrame + clip.inPoint) / playback.fps),
        });
      }
    }
    return list;
  }, [tracks, playback.currentFrame, playback.fps, mediaLookup, activeVideoClipId]);

  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  useEffect(() => {
    const live = new Set<string>();
    for (const a of activeAudios) {
      live.add(a.clip.id);
      const el = audioRefs.current.get(a.clip.id);
      if (!el) continue;
      if (Math.abs(el.currentTime - a.offset) > 0.3) {
        try {
          el.currentTime = a.offset;
        } catch {
          // Not seekable yet — the next tick retries.
        }
      }
      const dbGain = Math.pow(10, (a.clip.volume || 0) / 20);
      try {
        el.volume = Math.min(1, Math.max(0, playback.volume * dbGain));
      } catch {
        // Out-of-range volume on some engines — keep the previous level.
      }
      el.muted = playback.volume === 0 || audioBlocked;
      el.playbackRate = 1;
      if (playback.isPlaying) {
        const attempt = el.play();
        if (attempt) {
          attempt.catch(() => {
            // Same autoplay policy as video: fall back to muted playback.
            setAudioBlocked(true);
            el.muted = true;
            el.play().catch(() => undefined);
          });
        }
      } else {
        el.pause();
      }
    }
    for (const [id, el] of audioRefs.current) {
      if (!live.has(id)) {
        el.pause();
        audioRefs.current.delete(id);
      }
    }
  }, [playback.isPlaying, playback.volume, audioBlocked, activeAudios]);

  return (
    <Panel>
      {/* Headerless by design: every pixel goes to the preview image. */}

      {activeAudios.map((a) => (
        <audio
          key={a.clip.id}
          ref={(el) => {
            if (el) audioRefs.current.set(a.clip.id, el);
            else audioRefs.current.delete(a.clip.id);
          }}
          src={a.media.url}
          preload="auto"
          style={{ display: 'none' }}
        />
      ))}

      <PreviewArea>
        <PreviewCanvas>
          <TimecodeOverlay>
            {frameToTimecode(displayFrame, playback.fps)}
          </TimecodeOverlay>
          <ResolutionInfo>
            {proxyUrl ? 'PROXY · ' : ''}{project.width} × {project.height}
          </ResolutionInfo>
          {totalClips === 0 ? (
            <EmptyPreview>Drop clips on the timeline to preview</EmptyPreview>
          ) : activeVideo && activeVideo.media.type === 'video' ? (
            <video
              key={lockedSrc}
              ref={videoRef}
              src={lockedSrc}
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              muted={playback.volume === 0 || audioBlocked}
              playsInline
              preload="auto"
              onWaiting={handleWaiting}
              onCanPlay={handleCanPlay}
            />
          ) : activeVideo && activeVideo.media.type === 'image' ? (
            <img
              src={activeVideo.media.url}
              alt={activeVideo.media.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            />
          ) : (
            <EmptyPreview>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 60, height: 60, opacity: 0.2, marginBottom: 8 }}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M10 9l5 3-5 3V9z" />
              </svg>
              <div>No clip under playhead</div>
            </EmptyPreview>
          )}
        </PreviewCanvas>
      </PreviewArea>

      <Scrubber
        ref={scrubberRef}
        onClick={handleScrub}
      >
        <ScrubberProgress style={{ width: `${progress}%` }}>
          <ScrubberHandle />
        </ScrubberProgress>
      </Scrubber>

      <ControlsBar>
        <TimecodeDisplay>
          {frameToTimecode(displayFrame, playback.fps)}
        </TimecodeDisplay>

        <TransportControls>
          <ControlBtn onClick={stopPlayback} title="Stop">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </ControlBtn>
          <ControlBtn onClick={() => stepFrame(-1)} title="Previous Frame (←)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="19,20 9,12 19,4" fill="currentColor" />
              <line x1="5" y1="4" x2="5" y2="20" />
            </svg>
          </ControlBtn>
          <ControlBtn onClick={() => setCurrentFrame(Math.max(0, playback.currentFrame - playback.fps * 5))} title="Back 5 Seconds">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1,4 1,10 7,10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          </ControlBtn>
          <ControlBtn
            className={cx(ControlBtnPlay, playback.isPlaying && ControlBtnActive)}
            onClick={togglePlay}
            title="Play/Pause (Space)"
          >
            {playback.isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </ControlBtn>
          <ControlBtn onClick={() => setCurrentFrame(playback.currentFrame + playback.fps * 5)} title="Forward 5 Seconds">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23,4 23,10 17,10" />
              <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" />
            </svg>
          </ControlBtn>
          <ControlBtn onClick={() => stepFrame(1)} title="Next Frame (→)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5,4 15,12 5,20" fill="currentColor" />
              <line x1="19" y1="4" x2="19" y2="20" />
            </svg>
          </ControlBtn>
        </TransportControls>

        <DurationDisplay>
          {frameToTimecode(playback.durationInFrames, playback.fps)}
        </DurationDisplay>
      </ControlsBar>
    </Panel>
  );
}
