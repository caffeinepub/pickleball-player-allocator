import React from 'react';
import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import ProfileView from './pages/ProfileView';
import CreateSession from './pages/CreateSession';
import JoinSession from './pages/JoinSession';
import HostSessionDashboard from './pages/HostSessionDashboard';
import PlayerSessionView from './pages/PlayerSessionView';
import PublicProfile from './pages/PublicProfile';
import GameHistory from './pages/GameHistory';
import MessagesInbox from './pages/MessagesInbox';
import ConversationThread from './pages/ConversationThread';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

const profileSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile-setup',
  component: ProfileSetup,
});

const profileViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfileView,
});

const createSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: CreateSession,
});

const joinSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/join',
  component: JoinSession,
});

const hostDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/host/$sessionId',
  component: HostSessionDashboard,
});

const playerSessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/session/$sessionId',
  component: PlayerSessionView,
});

const publicProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/player/$principal',
  component: PublicProfile,
});

const gameHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: GameHistory,
});

const messagesInboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: MessagesInbox,
});

const conversationThreadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages/$principal',
  component: ConversationThread,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  profileSetupRoute,
  profileViewRoute,
  createSessionRoute,
  joinSessionRoute,
  hostDashboardRoute,
  playerSessionRoute,
  publicProfileRoute,
  gameHistoryRoute,
  messagesInboxRoute,
  conversationThreadRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
