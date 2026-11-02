import { css } from '@linaria/core';
import { styled } from '@linaria/react';

export const trackContentClassName = css`
  flex: 1;
  position: relative;
  overflow: hidden;

  &:hover {
    background: rgba(255, 255, 255, 0.01);
  }

  @media (max-width: 768px) {
    flex: none;
    width: var(--tl-w, 100%);
  }
`;

export const Panel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-panel);
  overflow: hidden;
  /* ArtCraft-style card: grey/white hairline outline, soft corners. */
  /* 0.5px = exactly 1 physical pixel on Retina; stays perfectly thin
     at 100% page zoom (1px would render as a fat 2px line there). */
  border: 0.5px solid var(--border-color);
  border-radius: 8px;
`;

export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  /* Actions sit right next to the title, at the left edge. */
  justify-content: flex-start;
  gap: 10px;
  height: var(--header-height);
  background: var(--bg-panel-header);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 8px;
  flex-shrink: 0;
`;

export const PanelTitle = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
`;

export const PanelActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

export const PanelActionBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 3px;
  color: var(--text-muted);
  font-size: 14px;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  & svg {
    width: 14px;
    height: 14px;
  }
`;

export const TimelineBody = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

export const TrackHeaders = styled.div`
  width: 120px;
  flex-shrink: 0;
  background: var(--bg-panel-header);
  border-right: 1px solid var(--border-subtle);
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 768px) {
    max-width: 38vw;
  }
`;

// Drag handle between the headers column and the tracks.
export const TrackHeadersHandle = styled.div`
  width: 4px;
  flex-shrink: 0;
  cursor: ew-resize;
  background: transparent;
  touch-action: none;

  &:hover {
    background: var(--bg-clip-video);
  }
`;

// Matches TimeRuler (24px + 1px border) so header rows sit exactly
// level with their track rows.
export const TrackHeadersSpacer = styled.div`
  height: 25px;
  flex-shrink: 0;
  background: var(--bg-panel-header);
  border-bottom: 1px solid var(--border-subtle);
`;

export const TrackHeader = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  height: var(--track-height);
  padding: 0 4px;
  gap: 2px;
  border-bottom: 1px solid var(--border-subtle);

  @media (max-width: 768px) {
    overflow: hidden;
  }
`;

// Drag the bottom edge of a header to resize that track's row height.
export const TrackHeightHandle = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 6px;
  cursor: ns-resize;
  z-index: 5;
  touch-action: none;

  &:hover {
    background: var(--bg-clip-video);
  }

  @media (max-width: 768px) {
    height: 12px;
  }
`;

export const TrackHeaderAudio = css`
  border-top: 2px solid var(--border-color);
`;

export const TrackHeaderDropTarget = css`
  background: rgba(37, 99, 235, 0.1);
`;

export const TrackName = styled.span`
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 24px;
  text-align: center;
  font-weight: 500;

  @media (max-width: 768px) {
    min-width: 0;
    overflow: hidden;
  }
`;

export const TrackBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 2px;
  color: var(--text-muted);
  font-size: 9px;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  & svg {
    width: 12px;
    height: 12px;
  }
`;

export const TrackBtnActive = css`
  color: var(--text-accent);
`;

// The Snap toggle in the panel header when snapping is on.
export const PanelActionBtnActive = css`
  color: var(--text-accent);
  background: var(--bg-hover);
`;

// Vertical guide shown while a drag/trim is magnet-snapped to an edge.
export const SnapGuide = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--text-accent);
  box-shadow: 0 0 6px rgba(96, 165, 250, 0.6);
  z-index: 18;
  pointer-events: none;
`;

export const AddTrackBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 28px;
  color: var(--text-muted);
  font-size: 11px;
  border-top: 1px solid var(--border-subtle);

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
`;

export const TimelineTracksContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const TimeRuler = styled.div`
  height: 24px;
  background: var(--bg-panel-header);
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  /* Click-to-seek stays, but the I-beam text cursor makes no sense here. */
  cursor: default;
  user-select: none;

  @media (max-width: 768px) {
    display: none;
  }
`;

// Mobile-only duplicate ruler living INSIDE the scrollable tracks area:
// it scrolls horizontally together with the clips (sticky on top),
// so markers never drift apart from the content.
export const MobileRuler = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    position: sticky;
    top: 0;
    z-index: 6;
    height: 24px;
    flex-shrink: 0;
    background: var(--bg-panel-header);
    border-bottom: 1px solid var(--border-subtle);
    overflow: hidden;
    cursor: default;
    user-select: none;
  }
`;

export const TimeMarker = styled.div`
  position: absolute;
  top: 0;
  white-space: nowrap;
  font-size: 9px;
  line-height: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  /* Center the text on its tick, like the lines below it. */
  transform: translateX(-50%);
  /* Text labels: no I-beam / selection cursor over the ruler. */
  cursor: default;
  user-select: none;
`;

// Tick lines for the ruler are painted as repeating-linear-gradient
// backgrounds on this layer (period set inline per zoom level) instead
// of DOM boxes — gradient repeats are mathematically even, while
// individually positioned 1px boxes snap to whole CSS px and jitter.
export const RulerTicks = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  pointer-events: none;
`;

export const TracksArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;

  @media (max-width: 768px) {
    overflow-x: auto;
  }
`;

export const TrackRow = styled.div`
  display: flex;
  height: var(--track-height);
  border-bottom: 1px solid var(--border-subtle);
  position: relative;

  @media (max-width: 768px) {
    width: var(--tl-w, 100%);
  }
`;

export const TrackRowAudio = css`
  border-top: 2px solid var(--border-color);
`;

export const TrackContent = css`
  flex: 1;
  position: relative;
  overflow: hidden;

  &:hover {
    background: rgba(255, 255, 255, 0.01);
  }
`;

export const TrackRowDropTarget = css`
  background: rgba(37, 99, 235, 0.08) !important;

  & ${TrackContent} {
    outline: 1px dashed rgba(37, 99, 235, 0.4);
    outline-offset: -1px;
  }
`;

export const Clip = styled.div`
  position: absolute;
  top: 3px;
  bottom: 3px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid transparent;
  transition: border-color 0.1s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

export const ClipSelected = css`
  border-color: white;
  box-shadow: 0 0 0 1px white;
`;

export const ClipVideo = css`
  background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
`;

export const ClipAudio = css`
  background: linear-gradient(180deg, #059669 0%, #047857 100%);
`;

export const ClipInner = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 6px;
  gap: 4px;
  position: relative;
`;

export const ClipName = styled.span`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
`;

// Title strip pinned to the top of the clip, above the filmstrip,
// with the clip name inside (Premiere-style clip header).
export const ClipTitle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 15px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  background: #1e40af;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px 4px 0 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
`;

export const ClipHandle = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 2;
  touch-action: none;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 768px) {
    width: 12px;
  }
`;

export const ClipHandleLeft = css`
  left: 0;
  border-radius: 4px 0 0 4px;
`;

export const ClipHandleRight = css`
  right: 0;
  border-radius: 0 4px 4px 0;
`;

export const Playhead = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: var(--playhead-width);
  background: var(--bg-playhead);
  z-index: 10;
  pointer-events: none;
`;

export const PlayheadTop = styled.div`
  position: absolute;
  top: 0;
  left: -5px;
  width: 12px;
  height: 12px;
  background: var(--bg-playhead);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  z-index: 11;
  pointer-events: auto;
  cursor: ew-resize;
`;

export const Skimmer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.5);
  z-index: 9;
  pointer-events: none;
`;

export const SkimmerTimeTag = styled.div`
  position: absolute;
  top: 2px;
  left: 5px;
  font-size: 10px;
  line-height: 1.4;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.75);
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
`;

export const SilenceTrack = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: 10px;
  opacity: 0.3;
`;

const dropPulseKeyframes = css`
  @keyframes dropPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }
`;

export const ClipDropGhost = css`
  opacity: 0.5;
  border: 2px dashed rgba(255, 255, 255, 0.6) !important;
  box-shadow: 0 0 12px rgba(37, 99, 235, 0.3);
  pointer-events: none;
  animation: dropPulse 1s ease-in-out infinite;

  ${dropPulseKeyframes}
`;

export const MarqueeBox = styled.div`
  position: absolute;
  border: 1px solid rgba(59, 130, 246, 0.9);
  background: rgba(59, 130, 246, 0.15);
  z-index: 20;
  pointer-events: none;
`;

export const DropIndicatorLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--bg-playhead);
  z-index: 15;
  pointer-events: none;
  box-shadow: 0 0 6px rgba(229, 62, 62, 0.5);

  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -3px;
    width: 8px;
    height: 8px;
    background: var(--bg-playhead);
    border-radius: 50%;
  }
`;

export const ClipIcon = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0.7;

  & svg {
    width: 10px;
    height: 10px;
  }
`;
