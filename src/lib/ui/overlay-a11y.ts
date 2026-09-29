import { Children, isValidElement, type ElementType, type ReactNode } from 'react';

/** True when `children` (at any depth) contains an element of `targetType`. */
export function hasChildType(children: ReactNode, targetType: ElementType): boolean {
  return Children.toArray(children).some((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return false;
    return child.type === targetType || hasChildType(child.props.children, targetType);
  });
}

/**
 * Radix warns when dialog-like content has neither a Description nor an
 * explicit aria-describedby. Passing `aria-describedby={undefined}` is the
 * documented opt-out for content that is self-explanatory.
 */
export function describedByFallback(
  children: ReactNode,
  descriptionType: ElementType,
  describedBy: string | undefined,
): { 'aria-describedby'?: undefined } {
  return !hasChildType(children, descriptionType) && describedBy === undefined ? { 'aria-describedby': undefined } : {};
}
