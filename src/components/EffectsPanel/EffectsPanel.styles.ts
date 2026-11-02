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

export const PanelTabs = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
`;

export const PanelTab = styled.div`
  padding: 5px 12px;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;

  &:hover {
    color: var(--text-secondary);
  }
`;

export const PanelTabActive = css`
  color: var(--text-primary);
  border-bottom-color: var(--bg-clip-video);
`;

export const SearchBar = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
`;

export const SearchInput = styled.input`
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 4px 8px;
  color: var(--text-primary);
  font-size: 11px;
  outline: none;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--bg-clip-video);
  }
`;

export const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
`;

export const EffectCategory = styled.div`
  margin-bottom: 2px;
`;

export const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;

  &:hover {
    background: var(--bg-hover);
  }
`;

export const CategoryArrow = styled.span`
  font-size: 8px;
  color: var(--text-muted);
  transition: transform 0.15s;
`;

export const CategoryArrowOpen = css`
  transform: rotate(90deg);
`;

export const EffectItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 20px;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 2px;
  margin: 0 4px;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
`;

export const EffectIcon = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
`;

export const EffectIconVideo = css`
  background: rgba(86, 81, 167, 0.25);
  color: #8f89db;
`;

export const EffectIconAudio = css`
  background: rgba(5, 150, 105, 0.2);
  color: #34d399;
`;

export const EffectIconColor = css`
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: 11px;
  gap: 4px;

  & svg {
    width: 28px;
    height: 28px;
    opacity: 0.3;
    margin-bottom: 4px;
  }
`;

export const PropertiesSection = styled.div`
  padding: 8px;
`;

export const PropertyRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
`;

export const PropertyLabel = styled.span`
  font-size: 11px;
  color: var(--text-secondary);
`;

export const PropertyValue = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
`;

export const PropertySlider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: 80px;
  height: 3px;
  background: var(--bg-active);
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--text-accent);
    cursor: pointer;
  }
`;
