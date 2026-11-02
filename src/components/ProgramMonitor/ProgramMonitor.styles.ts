import { css } from '@linaria/core';
import { styled } from '@linaria/react';

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
  justify-content: space-between;
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

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  & svg {
    width: 14px;
    height: 14px;
  }
`;

export const PreviewArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0c;
  position: relative;
  overflow: hidden;
  min-height: 0;
`;

export const PreviewCanvas = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

export const TimecodeOverlay = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 1px;
`;

export const ResolutionInfo = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 3px;
`;

export const EmptyPreview = styled.div`
  color: var(--text-muted);
  font-size: 12px;
`;

export const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
  background: var(--bg-panel-header);
  border-top: 1px solid var(--border-subtle);
  padding: 0 8px;
  flex-shrink: 0;
`;

export const TimecodeDisplay = styled.span`
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text-accent);
  letter-spacing: 0.5px;
  min-width: 90px;
`;

export const TransportControls = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 auto;
`;

export const ControlBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 3px;
  color: var(--text-secondary);

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  & svg {
    width: 14px;
    height: 14px;
  }
`;

export const ControlBtnPlay = css`
  width: 32px;
  height: 32px;
  color: var(--text-primary);

  &:hover {
    background: var(--bg-clip-video);
    color: white;
  }

  & svg {
    width: 16px;
    height: 16px;
  }
`;

export const ControlBtnActive = css`
  background: rgba(37, 99, 235, 0.3);
  color: var(--text-accent);
`;

export const DurationDisplay = styled.span`
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  min-width: 90px;
  text-align: right;
`;

export const Scrubber = styled.div`
  width: 100%;
  position: relative;
  height: 6px;
  background: var(--bg-dark);
  cursor: pointer;
  flex-shrink: 0;
  border-top: 1px solid var(--border-subtle);
`;

export const ScrubberProgress = styled.div`
  height: 100%;
  background: var(--bg-clip-video);
  position: relative;
`;

export const ScrubberHandle = styled.div`
  position: absolute;
  right: -4px;
  top: -3px;
  width: 8px;
  height: 12px;
  background: var(--bg-clip-video);
  border-radius: 2px;
  cursor: grab;
`;
