import { useState, useCallback, useRef } from 'react';
import { cx } from '@linaria/core';
import {
  ResizableContainer,
  ResizableContainerHorizontal,
  ResizableContainerVertical,
  PanelChild,
  Divider,
  DividerHorizontal,
  DividerVertical,
  DividerDragging,
} from './PanelGroup.styles';

interface PanelGroupProps {
  direction: 'horizontal' | 'vertical';
  children: React.ReactNode[];
  defaultSizes?: number[];
  minSizes?: number[];
}

export default function PanelGroup({ direction, children, defaultSizes, minSizes }: PanelGroupProps) {
  const isHorizontal = direction === 'horizontal';
  const childArray = Array.isArray(children) ? children : [children];

  const [sizes, setSizes] = useState<number[]>(() => {
    if (defaultSizes) return defaultSizes;
    const equal = 100 / childArray.length;
    return childArray.map(() => equal);
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingIndex(index);

    const startPos = isHorizontal ? e.clientX : e.clientY;
    const containerSize = isHorizontal
      ? containerRef.current?.clientWidth || 1
      : containerRef.current?.clientHeight || 1;
    const startSizes = [...sizes];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
      const delta = ((currentPos - startPos) / containerSize) * 100;

      const min1 = minSizes?.[index] ? (minSizes[index] / containerSize) * 100 : 5;
      const min2 = minSizes?.[index + 1] ? (minSizes[index + 1] / containerSize) * 100 : 5;

      const newSizes = [...startSizes];
      newSizes[index] = Math.max(min1, Math.min(100 - min2, startSizes[index] + delta));
      newSizes[index + 1] = Math.max(min2, startSizes[index + 1] - delta);

      setSizes(newSizes);
    };

    const handleMouseUp = () => {
      setDraggingIndex(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isHorizontal, sizes, minSizes]);

  return (
    <ResizableContainer
      ref={containerRef}
      className={cx(
        isHorizontal ? ResizableContainerHorizontal : ResizableContainerVertical,
      )}
    >
      {childArray.map((child, i) => (
        <div key={i} style={{ display: 'contents' }}>
          <PanelChild
            style={
              isHorizontal
                ? { width: `${sizes[i]}%`, height: '100%' }
                : { height: `${sizes[i]}%`, width: '100%' }
            }
          >
            {child}
          </PanelChild>
          {i < childArray.length - 1 && (
            <Divider
              className={cx(
                isHorizontal ? DividerVertical : DividerHorizontal,
                draggingIndex === i && DividerDragging,
              )}
              onMouseDown={(e) => handleMouseDown(i, e)}
            />
          )}
        </div>
      ))}
    </ResizableContainer>
  );
}
