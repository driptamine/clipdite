import { useEditorStore } from '../../store/editorStore';
import { frameToTimecode } from '../../utils/time';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelActions,
  PanelActionBtn,
  PreviewArea,
  PreviewContent,
  TimecodeBar,
  Timecode,
  Controls,
  ControlBtn,
  ControlBtnPlay,
  NoMediaMessage,
  NoMediaIcon,
} from './SourceMonitor.styles';

export default function SourceMonitor() {
  const { selectedMediaId, mediaItems, playback } = useEditorStore();
  const selectedMedia = mediaItems.find((m) => m.id === selectedMediaId);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Source</PanelTitle>
        <PanelActions>
          <PanelActionBtn title="Mark In">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v16M4 12h12" />
            </svg>
          </PanelActionBtn>
          <PanelActionBtn title="Mark Out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 4v16M20 12H8" />
            </svg>
          </PanelActionBtn>
        </PanelActions>
      </PanelHeader>

      <PreviewArea>
        {selectedMedia && selectedMedia.url ? (
          <PreviewContent>
            {selectedMedia.type === 'video' ? (
              <video
                src={selectedMedia.url}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                muted
              />
            ) : selectedMedia.type === 'image' ? (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <NoMediaMessage>
                <NoMediaIcon>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </NoMediaIcon>
                <span>Audio: {selectedMedia.name}</span>
              </NoMediaMessage>
            )}
          </PreviewContent>
        ) : (
          <NoMediaMessage>
            <NoMediaIcon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M10 9l5 3-5 3V9z" />
              </svg>
            </NoMediaIcon>
            <span>Select a clip to preview</span>
          </NoMediaMessage>
        )}
      </PreviewArea>

      <TimecodeBar>
        <Timecode>{frameToTimecode(playback.currentFrame, playback.fps)}</Timecode>
        <Controls>
          <ControlBtn title="Previous Frame">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 20L9 12l10-8v16zM5 19V5" />
            </svg>
          </ControlBtn>
          <ControlBtn className={ControlBtnPlay} title="Play">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </ControlBtn>
          <ControlBtn title="Next Frame">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 4l10 8-10 8V4zM19 5v14" />
            </svg>
          </ControlBtn>
        </Controls>
      </TimecodeBar>
    </Panel>
  );
}
