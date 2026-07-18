import { useCallback, useRef, useMemo, useState } from 'react';
import { cx } from '@linaria/core';
import { useEditorStore } from '../../store/editorStore';
import { frameToTimecode } from '../../utils/time';
import {
  trackContentClassName,
  Panel,
  PanelHeader,
  PanelTitle,
  PanelActions,
  PanelActionBtn,
  TimelineBody,
  TrackHeaders,
  TrackHeader,
  TrackHeaderAudio,
  TrackHeaderDropTarget,
  TrackName,
  TrackBtn,
  TrackBtnActive,
  AddTrackBtn,
  TimelineTracksContainer,
  TimeRuler,
  TimeMarker,
  TimeMarkerLine,
  TimeMarkerLineLong,
  TracksArea,
  TrackRow,
  TrackRowAudio,
  TrackContent,
  TrackRowDropTarget,
  Clip,
  ClipSelected,
  ClipVideo,
  ClipAudio,
  ClipInner,
  ClipName,
  ClipHandle,
  ClipHandleLeft,
  ClipHandleRight,
  Playhead,
  PlayheadTop,
  SilenceTrack,
  ClipDropGhost,
  DropIndicatorLine,
  ClipIcon,
} from './Timeline.styles';

interface DropIndicator {
  trackIndex: number;
  frame: number;
  leftPx: number;
  widthPx: number;
  mediaType: 'video' | 'audio' | 'image';
  mediaName: string;
  mediaDuration: number;
}

export default function Timeline() {
  const {
    tracks, playback, zoom, selectedClipId, mediaItems,
    setCurrentFrame, selectClip,
    toggleMuteTrack, toggleLockTrack, toggleVisibilityTrack,
    addTrack, setZoom, addClipToTrack, setDragMediaId,
    moveClip,
  } = useEditorStore();

  const tracksAreaRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [hoveredTrackIndex, setHoveredTrackIndex] = useState<number | null>(null);

  const mediaLookup = useMemo(() => {
    const map = new Map<string, typeof mediaItems[0]>();
    for (const item of mediaItems) map.set(item.id, item);
    return map;
  }, [mediaItems]);

  const framesPerPixel = useMemo(() => {
    return Math.max(1, 4 / zoom);
  }, [zoom]);

  const totalFrames = playback.durationInFrames;

  const timeMarkers = useMemo(() => {
    const markers: { frame: number; label: string; major: boolean }[] = [];
    const framesPerSecond = playback.fps;
    let step = framesPerSecond;

    if (zoom < 0.3) step = framesPerSecond * 10;
    else if (zoom < 0.7) step = framesPerSecond * 5;
    else if (zoom < 1.5) step = framesPerSecond;
    else if (zoom < 3) step = Math.round(framesPerSecond / 2);
    else step = Math.round(framesPerSecond / 4);

    for (let f = 0; f < totalFrames; f += step) {
      const isMajor = f % (framesPerSecond * 10) === 0;
      markers.push({
        frame: f,
        label: frameToTimecode(f, playback.fps).substring(3),
        major: isMajor,
      });
    }
    return markers;
  }, [totalFrames, playback.fps, zoom]);

  const playheadLeft = playback.currentFrame / framesPerPixel;

  const getFrameFromX = useCallback((clientX: number, trackContentEl: HTMLElement | null) => {
    if (!trackContentEl) return 0;
    const rect = trackContentEl.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.round(x * framesPerPixel));
  }, [framesPerPixel]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tracksAreaRef.current) return;
    const rect = tracksAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + tracksAreaRef.current.scrollLeft;
    const frame = Math.max(0, Math.round(x * framesPerPixel));
    setCurrentFrame(frame);
  }, [framesPerPixel, setCurrentFrame]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(zoom + delta);
    }
  }, [zoom, setZoom]);

  const handleClipDragStart = useCallback((e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    selectClip(clipId);
  }, [selectClip]);

  const handleTrackDragOver = useCallback((e: React.DragEvent, trackIndex: number) => {
    const hasMedia = [...e.dataTransfer.types].includes('application/clipdite-media');
    if (!hasMedia) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const track = tracks[trackIndex];
    if (!track || track.locked) return;

    const trackContent = (e.currentTarget as HTMLElement).querySelector(`.${trackContentClassName}`) as HTMLElement | null;
    if (!trackContent) return;

    const frame = getFrameFromX(e.clientX, trackContent);
    const leftPx = (frame / framesPerPixel);

    const currentDragMediaId = useEditorStore.getState().dragMediaId;
    if (!currentDragMediaId) return;

    const media = mediaLookup.get(currentDragMediaId);
    if (!media) return;

    const isMediaVideo = media.type === 'video' || media.type === 'image';
    const isMediaAudio = media.type === 'audio';
    const isTrackVideo = track.type === 'video';
    const isTrackAudio = track.type === 'audio';

    if ((isMediaVideo && isTrackAudio) || (isMediaAudio && isTrackVideo)) {
      const compatibleTrack = tracks.find(
        (t) => !t.locked && t.type === (isMediaVideo ? 'video' : 'audio')
      );
      if (compatibleTrack) {
        setHoveredTrackIndex(compatibleTrack.index);
      } else {
        setHoveredTrackIndex(null);
      }
      setDropIndicator(null);
      return;
    }

    const durationFrames = Math.round(media.duration * playback.fps);

    setHoveredTrackIndex(trackIndex);
    setDropIndicator({
      trackIndex,
      frame,
      leftPx,
      widthPx: Math.max(20, durationFrames / framesPerPixel),
      mediaType: media.type,
      mediaName: media.name,
      mediaDuration: media.duration,
    });
  }, [tracks, framesPerPixel, playback.fps, mediaLookup, getFrameFromX]);

  const handleTrackDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as HTMLElement | null;
    const current = e.currentTarget as HTMLElement;
    if (related && current.contains(related)) return;
    setDropIndicator(null);
    setHoveredTrackIndex(null);
  }, []);

  const handleClipDragStartOnTimeline = useCallback((e: React.DragEvent, clipId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/clipdite-timeline-clip', clipId);
    e.dataTransfer.effectAllowed = 'move';
    selectClip(clipId);
  }, [selectClip]);

  const handleClipDropOnTimeline = useCallback((e: React.DragEvent, targetTrackIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropIndicator(null);
    setHoveredTrackIndex(null);

    const clipId = e.dataTransfer.getData('application/clipdite-timeline-clip');
    if (clipId) {
      const trackContent = (e.currentTarget as HTMLElement).querySelector(`.${trackContentClassName}`) as HTMLElement | null;
      const frame = getFrameFromX(e.clientX, trackContent);
      moveClip(clipId, frame, targetTrackIndex);
      return;
    }

    const mediaId = e.dataTransfer.getData('application/clipdite-media');
    if (!mediaId) return;
    const media = mediaLookup.get(mediaId);
    if (!media) return;

    const track = tracks[targetTrackIndex];
    if (!track || track.locked) return;

    const trackContent = (e.currentTarget as HTMLElement).querySelector(`.${trackContentClassName}`) as HTMLElement | null;
    const frame = getFrameFromX(e.clientX, trackContent);
    const durationFrames = Math.round(media.duration * playback.fps);

    addClipToTrack({
      mediaId: media.id,
      trackIndex: track.index,
      startFrame: frame,
      durationInFrames: durationFrames,
      inPoint: 0,
      outPoint: durationFrames,
      effects: [],
      opacity: 100,
      volume: 0,
    });

    setDragMediaId(null);
  }, [mediaLookup, tracks, playback.fps, addClipToTrack, moveClip, setDragMediaId, getFrameFromX]);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Timeline</PanelTitle>
        <PanelActions>
          <PanelActionBtn
            title="Add Video Track"
            onClick={() => addTrack('video')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </PanelActionBtn>
          <PanelActionBtn title="Snap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 3L3 21M3 3l18 18" />
            </svg>
          </PanelActionBtn>
        </PanelActions>
      </PanelHeader>

      <TimelineBody>
        <TrackHeaders>
          {tracks.map((track) => (
            <TrackHeader
              key={track.id}
              className={cx(
                track.type === 'audio' && TrackHeaderAudio,
                hoveredTrackIndex === track.index && TrackHeaderDropTarget,
              )}
            >
              <TrackName>{track.name}</TrackName>
              {track.type === 'video' && (
                <TrackBtn
                  className={cx(!track.visible && TrackBtnActive)}
                  onClick={() => toggleVisibilityTrack(track.index)}
                  title={track.visible ? 'Hide Track' : 'Show Track'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {track.visible ? (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    )}
                  </svg>
                </TrackBtn>
              )}
              <TrackBtn
                className={cx(track.muted && TrackBtnActive)}
                onClick={() => toggleMuteTrack(track.index)}
                title={track.muted ? 'Unmute' : 'Mute'}
              >
                {track.muted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                  </svg>
                )}
              </TrackBtn>
              <TrackBtn
                className={cx(track.locked && TrackBtnActive)}
                onClick={() => toggleLockTrack(track.index)}
                title={track.locked ? 'Unlock' : 'Lock'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {track.locked ? (
                    <>
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </>
                  ) : (
                    <>
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 019.9-1" />
                    </>
                  )}
                </svg>
              </TrackBtn>
            </TrackHeader>
          ))}
          <AddTrackBtn onClick={() => addTrack('audio')}>
            + Add Track
          </AddTrackBtn>
        </TrackHeaders>

        <TimelineTracksContainer>
          <TimeRuler ref={rulerRef}>
            {timeMarkers.map((marker, i) => (
              <TimeMarker
                key={i}
                style={{ left: `${(marker.frame / framesPerPixel)}px` }}
              >
                <span>{marker.label}</span>
                <TimeMarkerLine
                  className={cx(marker.major && TimeMarkerLineLong)}
                />
              </TimeMarker>
            ))}
          </TimeRuler>

          <TracksArea
            ref={tracksAreaRef}
            onClick={handleTimelineClick}
            onWheel={handleWheel}
          >
            {tracks.map((track) => (
              <TrackRow
                key={track.id}
                className={cx(
                  track.type === 'audio' && TrackRowAudio,
                  hoveredTrackIndex === track.index && TrackRowDropTarget,
                )}
                onDragOver={(e) => handleTrackDragOver(e, track.index)}
                onDragLeave={handleTrackDragLeave}
                onDrop={(e) => handleClipDropOnTimeline(e, track.index)}
              >
                <div className={`${TrackContent} ${trackContentClassName}`}>
                  {track.clips.length === 0 && dropIndicator?.trackIndex !== track.index && (
                    <SilenceTrack>No clips</SilenceTrack>
                  )}
                  {track.clips.map((clip) => {
                    const left = clip.startFrame / framesPerPixel;
                    const width = clip.durationInFrames / framesPerPixel;
                    const media = mediaLookup.get(clip.mediaId);
                    const clipName = media ? media.name : clip.mediaId.substring(0, 8);
                    return (
                      <Clip
                        key={clip.id}
                        className={cx(
                          track.type === 'video' ? ClipVideo : ClipAudio,
                          selectedClipId === clip.id && ClipSelected,
                        )}
                        style={{ left: `${left}px`, width: `${Math.max(20, width)}px` }}
                        onClick={(e) => handleClipDragStart(e, clip.id)}
                        draggable
                        onDragStart={(e) => handleClipDragStartOnTimeline(e, clip.id)}
                      >
                        <ClipHandle className={cx(ClipHandleLeft)} />
                        <ClipInner>
                          {media && (media.type === 'video' || media.type === 'image') && (
                            <ClipIcon>
                              <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </ClipIcon>
                          )}
                          {media && media.type === 'audio' && (
                            <ClipIcon>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                                <path d="M9 18V5l12-2v13" />
                              </svg>
                            </ClipIcon>
                          )}
                          <ClipName>{clipName}</ClipName>
                        </ClipInner>
                        <ClipHandle className={cx(ClipHandleRight)} />
                      </Clip>
                    );
                  })}

                  {dropIndicator && dropIndicator.trackIndex === track.index && (
                    <div
                      className={cx(
                        ClipDropGhost,
                        dropIndicator.mediaType === 'audio' ? ClipAudio : ClipVideo,
                      )}
                      style={{
                        left: `${dropIndicator.leftPx}px`,
                        width: `${dropIndicator.widthPx}px`,
                      }}
                    >
                      <ClipInner>
                        <ClipName>{dropIndicator.mediaName}</ClipName>
                      </ClipInner>
                    </div>
                  )}

                  {dropIndicator && dropIndicator.trackIndex === track.index && (
                    <DropIndicatorLine
                      style={{ left: `${dropIndicator.leftPx}px` }}
                    />
                  )}
                </div>
              </TrackRow>
            ))}

            <Playhead style={{ left: `${playheadLeft}px` }}>
              <PlayheadTop />
            </Playhead>
          </TracksArea>
        </TimelineTracksContainer>
      </TimelineBody>
    </Panel>
  );
}
