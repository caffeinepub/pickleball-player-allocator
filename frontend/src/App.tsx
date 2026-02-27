import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateSession from './pages/CreateSession';
import JoinSession from './pages/JoinSession';
import HostSessionDashboard from './pages/HostSessionDashboard';
import PlayerSessionView from './pages/PlayerSessionView';
import ProfileSetup from './pages/ProfileSetup';
import ProfileView from './pages/ProfileView';
import PublicProfile from './pages/PublicProfile';
import GameHistory from './pages/GameHistory';
import MessagesInbox from './pages/MessagesInbox';
import ConversationThread from './pages/ConversationThread';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

// Routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

const createSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create-session',
  component: CreateSession,
});

const joinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/join',
  component: JoinSession,
});

const hostSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/host/$sessionId',
  component: HostSessionDashboard,
});

const playerSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session/$sessionId',
  component: PlayerSessionView,
});

const profileSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile-setup',
  component: ProfileSetup,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfileView,
});

const publicProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/player/$principalId',
  component: PublicProfile,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: GameHistory,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: MessagesInbox,
});

const conversationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages/$principalId',
  component: ConversationThread,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  createSessionRoute,
  joinRoute,
  hostSessionRoute,
  playerSessionRoute,
  profileSetupRoute,
  profileRoute,
  publicProfileRoute,
  historyRoute,
  messagesRoute,
  conversationRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
