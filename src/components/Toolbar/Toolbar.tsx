import { cx } from '@linaria/core';
import { useEditorStore } from '../../store/editorStore';
import { runTimelineExport } from '../../utils/exportVideo';
import {
  ToolbarRoot,
  ToolGroup,
  ToolSeparator,
  ToolButton,
  ToolButtonActive,
  ZoomControls,
  ZoomButton,
  ZoomLevel,
  ExportButton,
  ToolbarMobile,
  ToolGroupMobile,
  ToolSeparatorMobile,
  ZoomControlsMobile,
} from './Toolbar.styles';

interface ToolbarProps {
  /** Mobile-only: folder icon that toggles the collapsible project panel. */
  showProjectToggle?: boolean;
  projectOpen?: boolean;
  onToggleProject?: () => void;
}

export default function Toolbar({ showProjectToggle = false, projectOpen = false, onToggleProject }: ToolbarProps) {
  const { zoom, setZoom, exportStatus, activeTool, setActiveTool } = useEditorStore();
  const isExporting = exportStatus.phase === 'working';

  return (
    <ToolbarRoot className={ToolbarMobile}>
      {showProjectToggle && (
        <ToolButton
          className={cx(projectOpen && ToolButtonActive)}
          title="Project Panel"
          onClick={onToggleProject}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        </ToolButton>
      )}
      <ToolGroup className={ToolGroupMobile}>
        <ToolButton
          className={cx(activeTool === 'selection' && ToolButtonActive)}
          title="Selection Tool (V)"
          onClick={() => setActiveTool('selection')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </ToolButton>
        <ToolButton title="Ripple Edit Tool (B)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8l4 4-4 4M6 8l-4 4 4 4" />
          </svg>
        </ToolButton>
        <ToolButton title="Rolling Edit Tool (N)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
          </svg>
        </ToolButton>
        <ToolButton
          className={cx(activeTool === 'razor' && ToolButtonActive)}
          title="Razor Tool (C)"
          onClick={() => setActiveTool(activeTool === 'razor' ? 'selection' : 'razor')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </ToolButton>
      </ToolGroup>

      <ToolSeparator className={ToolSeparatorMobile} />

      <ToolGroup className={ToolGroupMobile}>
        <ToolButton title="Slip Tool (Y)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M8 6v12M16 6v12M3 12h18" />
          </svg>
        </ToolButton>
        <ToolButton title="Slide Tool (U)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M12 6v12M7 9l-3 3 3 3M17 9l3 3-3 3" />
          </svg>
        </ToolButton>
        <ToolButton title="Pen Tool (P)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          </svg>
        </ToolButton>
        <ToolButton title="Hand Tool (H)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 11V6a2 2 0 00-4 0v1M14 10V4a2 2 0 00-4 0v6M10 10V5a2 2 0 00-4 0v9a8 8 0 0016 0v-5a2 2 0 00-4 0" />
          </svg>
        </ToolButton>
        <ToolButton title="Zoom Tool (Z)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </ToolButton>
      </ToolGroup>

      <ExportButton
        onClick={() => void runTimelineExport()}
        disabled={isExporting}
        title={isExporting ? `Exporting ${exportStatus.progress}%` : 'Export selected clip as MP4 (MediaBunny)'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
      </ExportButton>

      <ZoomControls className={ZoomControlsMobile}>
        <ZoomButton onClick={() => setZoom(zoom - 0.25)} title="Zoom Out">−</ZoomButton>
        <ZoomLevel>{Math.round(zoom * 100)}%</ZoomLevel>
        <ZoomButton onClick={() => setZoom(zoom + 0.25)} title="Zoom In">+</ZoomButton>
      </ZoomControls>
    </ToolbarRoot>
  );
}
