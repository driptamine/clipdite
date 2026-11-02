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
  gap: 4px;
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

export const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
`;

export const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
  padding: 8px;
`;

export const MediaItem = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  border-radius: 4px;
  cursor: grab;
  border: 2px solid transparent;
  transition: all 0.1s;

  &:active {
    cursor: grabbing;
  }

  &:hover {
    background: var(--bg-hover);
  }
`;

// Revealed on hover; removing an item also strips its timeline clips.
export const MediaItemDelete = styled.button`
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.1s, background 0.1s, color 0.1s;
  z-index: 2;

  & svg {
    width: 11px;
    height: 11px;
  }

  ${MediaItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: rgba(229, 62, 62, 0.2);
    color: var(--bg-playhead);
  }
`;


export const MediaItemSelected = css`
  background: var(--bg-selection);
  border-color: var(--bg-clip-video);
`;

export const MediaThumbnail = styled.div`
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--bg-dark);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  overflow: hidden;

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const MediaIcon = styled.div`
  color: var(--text-muted);

  & svg {
    width: 24px;
    height: 24px;
  }
`;

export const MediaName = styled.div`
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MediaDuration = styled.div`
  font-size: 9px;
  color: var(--text-muted);
  font-family: var(--font-mono);
`;

export const ImportZone = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  border: 2px dashed var(--border-color);
  border-radius: 6px;
  margin: 12px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--bg-clip-video);
    color: var(--text-secondary);
    background: rgba(37, 99, 235, 0.05);
  }
`;

export const ImportIcon = styled.div`
  & svg {
    width: 32px;
    height: 32px;
    margin-bottom: 8px;
  }
`;

export const ImportText = styled.div`
  font-size: 12px;
  margin-bottom: 2px;
`;

export const ImportSubtext = styled.div`
  font-size: 10px;
  color: var(--text-muted);
`;
