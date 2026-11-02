import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { ToolbarRoot } from './components/Toolbar/Toolbar.styles';

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
  /* Breathing room between the toolbar and the timeline card. */
  margin-left: 8px;
`;

export const ResizeHandleHorizontal = styled.div`
  width: 100%;
  height: 8px;
  background: #000;
  cursor: ns-resize;
  flex-shrink: 0;
  touch-action: none;
`;

export const ResizeHandleVertical = styled.div`
  width: 8px;
  height: 100%;
  background: #000;
  cursor: ew-resize;
  flex-shrink: 0;
  touch-action: none;
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

  @media (max-width: 768px) {
    gap: 10px;
    overflow-x: auto;
  }
`;

export const StatusItem = styled.span`
  font-size: 10px;
  color: var(--text-muted);

  @media (max-width: 768px) {
    white-space: nowrap;
    flex-shrink: 0;
  }
`;

export const StatusDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  margin-right: 4px;
`;

// ---------------------------------------------------------------------------
// Mobile (max-width: 768px). Everything above stays exactly as-is on desktop;
// the rules below only reflow the layout on narrow screens. Multitrack
// timeline (V1/V2/V3 rows) is preserved — rows keep their order and heights.
// ---------------------------------------------------------------------------

/** Program-only monitors on mobile; Source and Effects stay mounted but hidden. */
export const MonitorsRow = css`
  @media (max-width: 768px) {
    flex-direction: column;

    & > [data-monitor='source'] {
      display: none;
    }

    & > [data-monitor='program'] {
      width: 100% !important;
      height: 100%;
      min-height: 0;
    }

    /* Effects lives in the top row on desktop; on mobile it would steal
       the Program monitor's space, so it stays hidden here. */
    & > [data-monitor='effects'] {
      display: none;
    }

    & ${ResizeHandleVertical} {
      display: none;
    }
  }
`;

/** Bottom reflow: project / timeline / toolbar last, scrollable. */
export const BottomAreaMobile = css`
  @media (max-width: 768px) {
    flex-direction: column;
    overflow-y: auto;
    /* Fixed toolbar overlaps the tail: keep it reachable. */
    padding-bottom: 52px;

    & > ${BottomProject} {
      width: 100% !important;
      height: 140px;
      flex: none;
      order: 1;
    }

    & > ${ResizeHandleVertical} {
      display: none;
    }

    & > ${ToolbarRoot} {
      order: 3;
    }

    & > ${BottomRight} {
      flex-direction: column;
      flex: none;
      order: 2;
      /* Desktop-only toolbar gap does not apply to the stacked column. */
      margin-left: 0;

      & ${TimelineArea} {
        width: 100% !important;
        height: 340px;
        flex: none;
      }
    }
  }
`;
