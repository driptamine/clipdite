import { styled } from '@linaria/react';

export const App = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-darkest);
`;

export const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const TopPanels = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
`;

export const TopLeft = styled.div`
  flex: none;
  min-width: 200px;
  overflow: hidden;
`;

export const TopRight = styled.div`
  flex: none;
  min-width: 200px;
  overflow: hidden;
`;

export const BottomArea = styled.div`
  height: 45%;
  min-height: 150px;
  display: flex;
  overflow: hidden;
`;

export const TimelineArea = styled.div`
  flex: none;
  min-width: 300px;
  overflow: hidden;
`;

export const BottomSidebar = styled.div`
  width: 280px;
  min-width: 200px;
  flex-shrink: 0;
`;

export const BottomProject = styled.div`
  flex: none;
  min-width: 160px;
  overflow: hidden;
`;

export const BottomRight = styled.div`
  flex: 1;
  display: flex;
  min-width: 0;
  overflow: hidden;
`;

export const ResizeHandleHorizontal = styled.div`
  width: 100%;
  height: 4px;
  background: var(--border-subtle);
  cursor: ns-resize;
  flex-shrink: 0;

  &:hover {
    background: var(--bg-clip-video);
  }
`;

export const ResizeHandleVertical = styled.div`
  width: 4px;
  height: 100%;
  background: var(--border-subtle);
  cursor: ew-resize;
  flex-shrink: 0;

  &:hover {
    background: var(--bg-clip-video);
  }
`;

export const StatusBar = styled.div`
  display: flex;
  align-items: center;
  height: 22px;
  background: var(--bg-panel-header);
  border-top: 1px solid var(--border-subtle);
  padding: 0 8px;
  gap: 16px;
  flex-shrink: 0;
`;

export const StatusItem = styled.span`
  font-size: 10px;
  color: var(--text-muted);
`;

export const StatusDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  margin-right: 4px;
`;
