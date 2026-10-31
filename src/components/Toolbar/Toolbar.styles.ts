import { css } from '@linaria/core';
import { styled } from '@linaria/react';

export const ToolbarRoot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 52px;
  height: 100%;
  flex-shrink: 0;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-subtle);
  padding: 8px 0;
  gap: 6px;
`;

export const ToolGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 4px 0;
`;

export const ToolSeparator = styled.div`
  width: 20px;
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
`;

export const ToolButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  color: var(--text-secondary);
  transition: all 0.1s;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  & svg {
    width: 16px;
    height: 16px;
  }
`;

export const ToolButtonActive = css`
  background: var(--bg-clip-video);
  color: white;

  &:hover {
    background: #3b82f6;
    color: white;
  }
`;

export const ZoomControls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: auto;
`;

export const ZoomButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 3px;
  color: var(--text-secondary);
  font-size: 14px;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
`;

export const ZoomLevel = styled.span`
  font-size: 10px;
  color: var(--text-secondary);
  min-width: 36px;
  text-align: center;
`;

export const ExportButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: var(--bg-clip-video);
  color: white;

  &:hover:not(:disabled) {
    background: #3b82f6;
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  & svg {
    width: 16px;
    height: 16px;
  }
`;
