/**
 * Test-only router helpers with the react-router-dom shape (MemoryRouter,
 * BrowserRouter, Routes, Route) implemented over TanStack Router memory history.
 * Production code uses @/lib/router-compat and the file-based route tree.
 */
import { Children, isValidElement, useMemo, type ReactElement, type ReactNode } from "react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";

interface RouteProps {
  path?: string;
  index?: boolean;
  element?: ReactNode;
}

export function Route(_props: RouteProps): null {
  return null;
}

export function Routes(_props: { children?: ReactNode }) {
  return <Outlet />;
}

function collectRoutes(node: ReactNode, out: RouteProps[] = []): RouteProps[] {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<RouteProps & { children?: ReactNode }>;
    if (el.type === Route) {
      out.push(el.props);
      return;
    }
    if (el.props && "children" in el.props) collectRoutes(el.props.children, out);
  });
  return out;
}

function toTanstackPath(path: string | undefined, index?: boolean): string {
  if (index || !path || path === "/") return "/";
  return (
    "/" +
    path
      .replace(/^\//, "")
      .split("/")
      .map((seg) => (seg === "*" ? "$" : seg.startsWith(":") ? `$${seg.slice(1)}` : seg))
      .join("/")
  );
}

export function MemoryRouter({
  initialEntries = ["/"],
  children,
}: {
  initialEntries?: string[];
  children?: ReactNode;
}) {
  const router = useMemo(() => {
    const declared = collectRoutes(children);
    const rootRoute = createRootRoute({ component: () => <>{children}</> });
    const childRoutes = declared.map((r) =>
      createRoute({
        getParentRoute: () => rootRoute,
        path: toTanstackPath(r.path, r.index),
        component: () => <>{r.element}</>,
      }),
    );
    if (!declared.some((r) => r.path === "*")) {
      childRoutes.push(createRoute({ getParentRoute: () => rootRoute, path: "$", component: () => null }));
    }
    if (!declared.some((r) => r.index || r.path === "/" || !r.path)) {
      childRoutes.push(createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => null }));
    }
    return createRouter({
      routeTree: rootRoute.addChildren(childRoutes),
      history: createMemoryHistory({ initialEntries }),
    });
    // Router is built once per mount, like react-router's MemoryRouter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <RouterProvider router={router} />;
}

export function BrowserRouter({ children }: { children?: ReactNode }) {
  const initial = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
  return <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>;
}
