'use client';

import { Link, LinkProps, useLocation } from 'react-router-dom';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/utils';

interface NavLinkCompatProps extends Omit<LinkProps, 'to' | 'className'> {
  href: string;
  className?: string | ((props: { isActive: boolean }) => string);
  activeClassName?: string;
  children: React.ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, href, ...props }, ref) => {
    const location = useLocation();
    const pathname = location.pathname;
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);

    const computedClassName = typeof className === 'function'
      ? className({ isActive })
      : cn(className, isActive && activeClassName);

    return (
      <Link
        ref={ref}
        to={href}
        className={computedClassName}
        {...(props as any)}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
