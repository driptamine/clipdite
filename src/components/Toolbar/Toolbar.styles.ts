import { css } from '@linaria/core';
import { styled } from '@linaria/react';

export const ToolbarRoot = styled.div`
  display: flex;
  align-items: center;
  height: 36px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 8px;
  gap: 2px;
  flex-shrink: 0;
`;

export const ToolGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 0 4px;
`;

export const ToolSeparator = styled.div`
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 4px;
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

export const ProjectName = styled.span`
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
  padding-right: 8px;
`;

export const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
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
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 36px;
  text-align: center;
`;
