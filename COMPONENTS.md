# Компоненты Clipdite

## Верхнеуровневые компоненты (`src/components/`)

| Компонент | Файл | Назначение |
|---|---|---|
| `App` | `src/App.tsx` | Корень: раскладка панелей, часы плейбэка, Space/стрелки/⌘S, восстановление сессии |
| `Menubar` | `Menubar/Menubar.tsx` | Верхнее меню: File (New/Save/Import/Export), Edit, Clip, Sequence, Window, Help |
| `Toolbar` | `Toolbar/Toolbar.tsx` | Инструменты монтажа, имя проекта, кнопка Export (MediaBunny), зум |
| `ProjectPanel` | `ProjectPanel/ProjectPanel.tsx` | Медиатека: импорт (проба через MediaBunny, байты в IndexedDB), drag на таймлайн |
| `SourceMonitor` | `SourceMonitor/SourceMonitor.tsx` | Превью выбранного исходника, собственные Play/Pause/покадрово |
| `ProgramMonitor` | `ProgramMonitor/ProgramMonitor.tsx` | Превью программы: видео клипа под плейхедом, скраббер, транспорт |
| `Timeline` | `Timeline/Timeline.tsx` | Дорожки, клипы, линейка, плейхед, ховер-линия |
| `ClipFilmstrip` | `Timeline/ClipFilmstrip.tsx` | Кадры сегмента внутри видеоклипа |
| `ClipWavestrip` | `Timeline/ClipWavestrip.tsx` | Waveform сегмента внутри аудиоклипа |
| `EffectsPanel` | `EffectsPanel/EffectsPanel.tsx` | Каталог эффектов + свойства выбранного клипа |
| `AudioMixer` | `AudioMixer/AudioMixer.tsx` | Каналы аудиодорожек и мастер-громкость |
| `PanelGroup` | `PanelGroup/PanelGroup.tsx` | Группировка панелей в раскладке |

## Плейхед

- `Playhead` — красная вертикальная линия позиции воспроизведения (`Timeline.styles.ts`). Позиция: `playback.currentFrame / framesPerPixel`.
- `PlayheadTop` — треугольный маркер сверху плейхеда.

## Вертикальные линии таймлайна

| Элемент | Файл | Вид и смысл |
|---|---|---|
| `Playhead` | `Timeline/Timeline.styles.ts` | Красная линия текущей позиции (ширина `--playhead-width`, поверх клипов, `pointer-events: none`) |
| `HoverIndicator` | `Timeline/Timeline.styles.ts` | Белая полупрозрачная линия 1px за курсором + тег `HoverTimeTag` с таймкодом (ММ:СС:Кадр) |
| `TimeMarkerLine` / `TimeMarkerLineLong` | `Timeline/Timeline.styles.ts` | Деления линейки времени (короткие/длинные каждые 10 сек) |
| `DropIndicatorLine` | `Timeline/Timeline.styles.ts` | Линия места дропа при перетаскивании медиа/клипа |

## Остальные элементы таймлайна (`Timeline.styles.ts`)

Каркас: `Panel`, `PanelHeader`, `PanelTitle`, `PanelActions`, `PanelActionBtn`, `TimelineBody`,
`TimelineTracksContainer`, `TimeRuler`, `TimeMarker`, `TracksArea`.
Дорожки: `TrackHeaders`, `TrackHeader`, `TrackHeaderAudio`, `TrackHeaderDropTarget`,
`TrackName`, `TrackBtn`, `TrackBtnActive` (mute/lock/visibility), `AddTrackBtn`,
`TrackRow`, `TrackRowAudio`, `TrackRowDropTarget`, `TrackContent` (`trackContentClassName`).
Клипы: `Clip`, `ClipSelected`, `ClipVideo`, `ClipAudio`, `ClipInner`, `ClipName`,
`ClipTitle` (шапка сверху, имя внутри), `ClipIcon`, `ClipHandle`/`Left`/`Right` (трим перетаскиванием),
`TrackHeightHandle` (высота дорожки за низ заголовка),
`ClipDropGhost` (призрак при дропе), `SilenceTrack` («No clips»).

## Состояние и утилиты

Стор `src/store/editorStore.ts` (`useEditorStore`): медиа
(`addMediaItem`, `importMediaItem`, `setMediaUrl`, `setMediaHasAudio`, `removeMediaItem`, `selectMediaItem`),
клипы (`addClipToTrack`, `addClipPair` (видео+звук, `linkedClipId`), `removeClip`, `selectClip`,
`selectClips`/`selectedClipIds` (рамка), `splitClip`, `moveClip`, `moveClips` (группой),
`trimClip`, `duplicateClip`,
`activeTool`/`setActiveTool` — `selection` | `razor`),
`updateClipEffect`, `addEffectToClip`, `removeEffectFromClip`), дорожки
(`addTrack`, `removeTrack`, `toggleMuteTrack`, `toggleLockTrack`, `toggleVisibilityTrack`, `renameTrack`),
плейбэк (`setPlayback`, `togglePlay`, `stopPlayback`, `stepFrame`, `setCurrentFrame`),
раскладка (`layout`/`setLayout` — `topHeight`, `monitorsSplit`, `timelineSplit`,
`headersWidth`, `bottomLeft` (низ: проект слева, тулбар центр, таймлайн справа), сохраняется),
проект/сессия (`hydrate`, `setHydrated`, `setProjectName`, `newProject`, `markSaved`,
`requestImport`, `exportStatus`/`setExportStatus`).

Утилиты `src/utils/`: `mediaProbe.ts` (`probeMediaFile` — MediaBunny),
`exportVideo.ts` (`collectExportCandidates`, `exportClipToMp4`, `runTimelineExport`, `downloadBlob` — MediaBunny),
`mediaStorage.ts` (`saveFileBlob`, `loadFileBlob`, `deleteFileBlob`, `clearFileBlobs` — IndexedDB),
`persist.ts` (`loadSnapshot`, `saveNow`, `hydrateFromStorage`, `ensureHydrated`, `startPersisting` — localStorage),
`time.ts` (`frameToTimecode`, `timecodeToFrame`, `formatDuration`, `generateColor`),
`filmstrip.ts` (`getFilmstrip`, `stripForRange` — раскадровка клипов),
`waveform.ts` (`getWaveform`, `peaksForRange` — waveform аудиоклипов).
Типы: `src/types/index.ts` (`MediaItem`, `TimelineClip`, `Track`, `Effect`, `PlaybackState`, `ProjectState`).
