import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

interface SortableQuestionWrapperProps {
  id: string;
  children: (handlers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listeners: any;
    setActivatorNodeRef: (node: HTMLElement | null) => void;
  }) => React.ReactNode;
}

export const SortableQuestionWrapper: React.FC<
  SortableQuestionWrapperProps
> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ listeners, setActivatorNodeRef })}
    </div>
  );
};
