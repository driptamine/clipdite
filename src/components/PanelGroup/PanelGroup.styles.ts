import { css } from '@linaria/core';
import { styled } from '@linaria/react';

export const ResizableContainer = styled.div`
  display: flex;
  overflow: hidden;
  position: relative;
`;

export const ResizableContainerHorizontal = css`
  flex-direction: row;
  height: 100%;
`;

export const ResizableContainerVertical = css`
  flex-direction: column;
  width: 100%;
`;

export const PanelChild = styled.div`
  overflow: hidden;
  min-width: 0;
  min-height: 0;
`;

export const Divider = styled.div`
  flex-shrink: 0;
  background: var(--border-subtle);
  position: relative;
  z-index: 5;

  &:hover {
    background: var(--bg-clip-video);
  }
`;

export const DividerHorizontal = css`
  width: 100%;
  height: 4px;
  cursor: ns-resize;
`;

export const DividerVertical = css`
  width: 4px;
  height: 100%;
  cursor: ew-resize;
`;

export const DividerDragging = css`
  background: var(--bg-clip-video);
`;
