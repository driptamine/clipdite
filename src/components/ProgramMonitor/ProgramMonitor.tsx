import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cx } from '@linaria/core';
import { useEditorStore } from '../../store/editorStore';
import { frameToTimecode } from '../../utils/time';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelActions,
  PanelActionBtn,
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
  const scrubberRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

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
    const frame = playback.currentFrame;
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
  }, [tracks, playback.currentFrame, mediaLookup]);

  // Source-time offset (seconds) of the playhead inside the active clip.
  const sourceOffset = activeVideo
    ? Math.min(
        Math.max(0, (playback.currentFrame - activeVideo.clip.startFrame + activeVideo.clip.inPoint) / playback.fps),
        Math.max(0, activeVideo.media.duration - 0.05),
      )
    : 0;

  // Seek the video element whenever the playhead moves (pause, step, scrub,
  // clip change) and correct drift while playing.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo || activeVideo.media.type !== 'video') return;
    if (!Number.isFinite(sourceOffset)) return;
    if (video.readyState < 1) return;
    const drift = Math.abs(video.currentTime - sourceOffset);
    if (!playback.isPlaying || drift > 0.35) {
      try { video.currentTime = sourceOffset; } catch { /* seek while loading */ }
    }
  }, [playback.currentFrame, playback.isPlaying, activeVideo, sourceOffset]);

  // Space (or the transport button) toggles real video playback.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo || activeVideo.media.type !== 'video') return;
    if (playback.isPlaying) {
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
      video.pause();
    }
  }, [playback.isPlaying, activeVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = 1;
  }, [activeVideo?.media.id]);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Program</PanelTitle>
        <PanelActions>
          <PanelActionBtn title="Loop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 2l4 4-4 4" />
              <path d="M3 11V9a4 4 0 014-4h14" />
              <path d="M7 22l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
          </PanelActionBtn>
          <PanelActionBtn title="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </PanelActionBtn>
        </PanelActions>
      </PanelHeader>

      <PreviewArea>
        <PreviewCanvas>
          <TimecodeOverlay>
            {frameToTimecode(playback.currentFrame, playback.fps)}
          </TimecodeOverlay>
          <ResolutionInfo>
            {project.width} × {project.height}
          </ResolutionInfo>
          {totalClips === 0 ? (
            <EmptyPreview>Drop clips on the timeline to preview</EmptyPreview>
          ) : activeVideo && activeVideo.media.type === 'video' ? (
            <video
              key={activeVideo.media.id}
              ref={videoRef}
              src={activeVideo.media.url}
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              muted={playback.volume === 0 || audioBlocked}
              playsInline
              preload="auto"
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
          {frameToTimecode(playback.currentFrame, playback.fps)}
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
