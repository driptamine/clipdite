import { useState, useRef, useEffect, useMemo } from 'react';
import { cx } from '@linaria/core';
import { useEditorStore } from '../../store/editorStore';
import { saveNow } from '../../utils/persist';
import { clearFileBlobs } from '../../utils/mediaStorage';
import { runTimelineExport } from '../../utils/exportVideo';
import {
  MenubarRoot,
  MenuItem,
  MenuItemActive,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  Shortcut,
} from './Menubar.styles';

interface MenuItemData {
  label: string;
  items?: { label: string; shortcut?: string; action?: () => void; separator?: boolean }[];
}

export default function Menubar() {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const menubarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menubarRef.current && !menubarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuData: MenuItemData[] = useMemo(() => {
    const { requestImport, newProject, markSaved, setExportStatus } =
      useEditorStore.getState();
    return [
      {
        label: 'File',
        items: [
          {
            label: 'New Project',
            shortcut: '⌘N',
            action: () => {
              newProject();
              clearFileBlobs().catch(() => undefined);
              saveNow();
              markSaved();
              setExportStatus({ phase: 'idle', progress: 0, message: '' });
            },
          },
          { label: 'Open Project...', shortcut: '⌘O' },
          {
            label: 'Save',
            shortcut: '⌘S',
            action: () => {
              saveNow();
              markSaved();
            },
          },
          { label: 'Save As...', shortcut: '⌘⇧S' },
          { separator: true, label: '' },
          {
            label: 'Import Media...',
            shortcut: '⌘I',
            action: () => requestImport(),
          },
          {
            label: 'Export Media...',
            shortcut: '⌘M',
            action: () => void runTimelineExport(),
          },
        ],
      },
      {
        label: 'Edit',
        items: [
          {
            label: 'Undo',
            shortcut: '⌘Z',
            action: () => useEditorStore.getState().undo(),
          },
          {
            label: 'Redo',
            shortcut: '⌘⇧Z',
            action: () => useEditorStore.getState().redo(),
          },
          { separator: true, label: '' },
          { label: 'Cut', shortcut: '⌘X' },
          { label: 'Copy', shortcut: '⌘C' },
          { label: 'Paste', shortcut: '⌘V' },
          { label: 'Delete', shortcut: 'Del' },
          { separator: true, label: '' },
          { label: 'Select All', shortcut: '⌘A' },
          { label: 'Find...', shortcut: '⌘F' },
        ],
      },
      {
        label: 'Clip',
        items: [
          { label: 'Split Clip', shortcut: '⌘K' },
          { label: 'Ripple Delete', shortcut: '⇧Del' },
          { separator: true, label: '' },
          { label: 'Enable', shortcut: '⇧E' },
          { label: 'Unlink', shortcut: '⌘L' },
          { separator: true, label: '' },
          { label: 'Speed/Duration...', shortcut: '⌘R' },
        ],
      },
      {
        label: 'Sequence',
        items: [
          { label: 'Render Effects', shortcut: 'Enter' },
          { separator: true, label: '' },
          { label: 'Add Tracks...' },
          { label: 'Delete Tracks...' },
          { separator: true, label: '' },
          { label: 'Sequence Settings...' },
        ],
      },
      {
        label: 'Window',
        items: [
          { label: 'Workspaces' },
          { separator: true, label: '' },
          { label: 'Project' },
          { label: 'Source' },
          { label: 'Program' },
          { label: 'Timeline' },
          { label: 'Effects' },
        ],
      },
      {
        label: 'Help',
        items: [
          { label: 'VideoEdit Pro Help', shortcut: 'F1' },
          { separator: true, label: '' },
          { label: 'About VideoEdit Pro' },
        ],
      },
    ];
  }, []);

  return (
    <MenubarRoot ref={menubarRef}>
      {menuData.map((menu, i) => (
        <MenuItem
          key={menu.label}
          className={cx(openMenu === i && MenuItemActive)}
          onMouseDown={() => setOpenMenu(openMenu === i ? null : i)}
          onMouseEnter={() => openMenu !== null && setOpenMenu(i)}
        >
          {menu.label}
          {openMenu === i && menu.items && (
            <Dropdown>
              {menu.items.map((item, j) =>
                item.separator ? (
                  <DropdownSeparator key={j} />
                ) : (
                  <DropdownItem
                    key={j}
                    onClick={() => {
                      item.action?.();
                      setOpenMenu(null);
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <Shortcut>{item.shortcut}</Shortcut>}
                  </DropdownItem>
                )
              )}
            </Dropdown>
          )}
        </MenuItem>
      ))}
    </MenubarRoot>
  );
}
