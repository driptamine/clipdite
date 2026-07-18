import { useRef, useCallback } from 'react';
import { cx } from '@linaria/core';
import { useEditorStore } from '../../store/editorStore';
import { formatDuration } from '../../utils/time';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelActions,
  PanelActionBtn,
  PanelContent,
  MediaGrid,
  MediaItem,
  MediaItemSelected,
  MediaThumbnail,
  MediaIcon,
  MediaName,
  MediaDuration,
  ImportZone,
  ImportIcon,
  ImportText,
  ImportSubtext,
} from './ProjectPanel.styles';

export default function ProjectPanel() {
  const { mediaItems, selectedMediaId, selectMediaItem, addMediaItem, setDragMediaId } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');

      if (!isVideo && !isAudio && !isImage) continue;

      const url = URL.createObjectURL(file);

      if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          addMediaItem({
            name: file.name,
            type: 'video',
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            url,
            source: 'upload',
          });
        };
        video.src = url;
      } else if (isAudio) {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
          addMediaItem({
            name: file.name,
            type: 'audio',
            duration: audio.duration,
            url,
            source: 'upload',
          });
        };
        audio.src = url;
      } else {
        addMediaItem({
          name: file.name,
          type: 'image',
          duration: 5,
          url,
          source: 'upload',
        });
      }
    }
  }, [addMediaItem]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('application/clipdite-media', itemId);
    e.dataTransfer.effectAllowed = 'copy';
    setDragMediaId(itemId);

    const target = e.currentTarget as HTMLElement;
    const ghost = target.cloneNode(true) as HTMLElement;
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.opacity = '0.8';
    ghost.style.width = `${target.offsetWidth}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, target.offsetWidth / 2, 20);
    requestAnimationFrame(() => {
      document.body.removeChild(ghost);
    });
  }, [setDragMediaId]);

  const handleDragEnd = useCallback(() => {
    setDragMediaId(null);
  }, [setDragMediaId]);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Project</PanelTitle>
        <PanelActions>
          <PanelActionBtn
            title="Import Media"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </PanelActionBtn>
        </PanelActions>
      </PanelHeader>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {mediaItems.length === 0 ? (
        <ImportZone
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <ImportIcon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </ImportIcon>
          <ImportText>Import media to start</ImportText>
          <ImportSubtext>Drag & drop or click to browse</ImportSubtext>
        </ImportZone>
      ) : (
        <PanelContent
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <MediaGrid>
            {mediaItems.map((item) => (
              <MediaItem
                key={item.id}
                className={cx(selectedMediaId === item.id && MediaItemSelected)}
                onClick={() => selectMediaItem(item.id)}
                onDoubleClick={() => selectMediaItem(item.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
              >
                <MediaThumbnail>
                  {item.url && item.type === 'image' ? (
                    <img src={item.url} alt={item.name} />
                  ) : item.type === 'video' ? (
                    <MediaIcon>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 4l16 8-16 8V4z" />
                      </svg>
                    </MediaIcon>
                  ) : (
                    <MediaIcon>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM21 16c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />
                      </svg>
                    </MediaIcon>
                  )}
                </MediaThumbnail>
                <MediaName>{item.name}</MediaName>
                <MediaDuration>{formatDuration(item.duration)}</MediaDuration>
              </MediaItem>
            ))}
          </MediaGrid>
        </PanelContent>
      )}
    </Panel>
  );
}
