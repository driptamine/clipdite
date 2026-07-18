import { css } from '@linaria/core';
import { styled } from '@linaria/react';

export const MenubarRoot = styled.div`
  display: flex;
  align-items: center;
  height: var(--menubar-height);
  background: var(--bg-panel-header);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 8px;
  gap: 0;
  user-select: none;
  flex-shrink: 0;
`;

export const MenuItem = styled.div`
  padding: 3px 8px;
  border-radius: 3px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  position: relative;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
`;

export const MenuItemActive = css`
  background: var(--bg-active);
  color: var(--text-primary);
`;

export const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 0;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
`;

export const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--bg-clip-video);
    color: white;
  }
`;

export const DropdownSeparator = styled.div`
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
`;

export const Shortcut = styled.span`
  color: var(--text-muted);
  font-size: 11px;
  margin-left: 24px;

  ${DropdownItem}:hover & {
    color: rgba(255, 255, 255, 0.7);
  }
`;
