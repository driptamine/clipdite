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

export const MixerContent = styled.div`
  flex: 1;
  display: flex;
  padding: 8px;
  gap: 8px;
  overflow-x: auto;
`;

export const Channel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  flex: 1;
  gap: 4px;
`;

export const ChannelName = styled.div`
  font-size: 10px;
  color: var(--text-secondary);
  text-align: center;
  font-weight: 500;
`;

export const FaderTrack = styled.div`
  flex: 1;
  width: 24px;
  background: var(--bg-dark);
  border-radius: 3px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

export const FaderLevel = styled.div`
  width: 100%;
  background: linear-gradient(to top, #10b981 0%, #f59e0b 70%, #ef4444 100%);
  border-radius: 3px;
  transition: height 0.1s;
`;

export const FaderKnob = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 12px;
  background: var(--bg-panel-header);
  border: 1px solid var(--text-muted);
  border-radius: 2px;
  cursor: ns-resize;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const FaderKnobLine = styled.div`
  width: 12px;
  height: 1px;
  background: var(--text-muted);
`;

export const FaderValue = styled.div`
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  text-align: center;
`;

export const MeterContainer = styled.div`
  display: flex;
  gap: 2px;
  height: 60px;
`;

export const MeterChannel = styled.div`
  width: 8px;
  background: var(--bg-dark);
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
`;

export const MeterFill = styled.div`
  width: 100%;
  background: linear-gradient(to top, #10b981 0%, #f59e0b 70%, #ef4444 100%);
  transition: height 0.05s;
`;

export const ChannelButtons = styled.div`
  display: flex;
  gap: 2px;
`;

export const ChannelBtn = styled.button`
  width: 20px;
  height: 16px;
  font-size: 8px;
  border-radius: 2px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
`;

export const ChannelBtnActive = css`
  color: var(--text-accent);
`;

export const MasterSection = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  border-left: 1px solid var(--border-color);
  padding-left: 8px;
  gap: 4px;
`;
