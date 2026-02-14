/**
 * next/link compatibility shim for Vite
 * Maps Next.js Link (href prop) to react-router-dom Link (to prop)
 */
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface NextLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children?: React.ReactNode;
  prefetch?: boolean;
}

const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(
  ({ href, prefetch, ...props }, ref) => {
    return React.createElement(RouterLink, { to: href, ref, ...props });
  }
);

Link.displayName = 'Link';
export default Link;
