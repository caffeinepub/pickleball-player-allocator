import React from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

import { Home } from './pages/Home';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import ProfileView from './pages/ProfileView';
import CreateSession from './pages/CreateSession';
import { JoinSession } from './pages/JoinSession';
import HostSessionDashboard from './pages/HostSessionDashboard';
import PlayerSessionView from './pages/PlayerSessionView';
import { getAuthChoice } from './pages/Login';

const AUTH_CHOICE_KEY = 'pickleball_auth_choice';

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-center" />
    </>
  ),
});

// Login route (no guard)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

// Guard: redirect to /login if no auth choice made this session
function requireAuthChoice() {
  if (!sessionStorage.getItem(AUTH_CHOICE_KEY)) {
    throw redirect({ to: '/login' });
  }
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: requireAuthChoice,
  component: Home,
});

const profileSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/setup',
  beforeLoad: requireAuthChoice,
  component: ProfileSetup,
});

const profileViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/view',
  beforeLoad: requireAuthChoice,
  component: ProfileView,
});

const createSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session/create',
  beforeLoad: requireAuthChoice,
  component: CreateSession,
});

const joinSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session/join',
  beforeLoad: requireAuthChoice,
  component: JoinSession,
});

const hostSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session/$sessionId/host',
  beforeLoad: requireAuthChoice,
  component: HostSessionDashboard,
});

const playerSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session/$sessionId/player',
  beforeLoad: requireAuthChoice,
  component: PlayerSessionView,
});

// Route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  profileSetupRoute,
  profileViewRoute,
  createSessionRoute,
  joinSessionRoute,
  hostSessionRoute,
  playerSessionRoute,
]);

// Router
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
