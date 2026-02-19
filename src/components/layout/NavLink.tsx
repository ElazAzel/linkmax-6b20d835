'use client';

import Link, { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/utils';

interface NavLinkCompatProps extends LinkProps {
  className?: string | ((props: { isActive: boolean }) => string);
  activeClassName?: string;
  children: React.ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, href, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);

    const computedClassName = typeof className === 'function'
      ? className({ isActive })
      : cn(className, isActive && activeClassName);

    return (
      <Link
        ref={ref}
        href={href}
        className={computedClassName}
        {...(props as any)}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
