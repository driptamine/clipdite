import { css } from '@linaria/core';
import { styled } from '@linaria/react';

export const Panel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-panel);
  overflow: hidden;
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

export const PreviewContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 12px;
`;

export const TimecodeBar = styled.div`
  display: flex;
  align-items: center;
  height: var(--timecode-height);
  background: var(--bg-panel-header);
  border-top: 1px solid var(--border-subtle);
  padding: 0 8px;
  gap: 8px;
  flex-shrink: 0;
`;

export const Timecode = styled.span`
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-accent);
  letter-spacing: 0.5px;
`;

export const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 auto;
`;

export const ControlBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
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
  width: 30px;
  height: 30px;
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

export const NoMediaMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 4px;
`;

export const NoMediaIcon = styled.div`
  & svg {
    width: 40px;
    height: 40px;
    opacity: 0.3;
  }
`;
