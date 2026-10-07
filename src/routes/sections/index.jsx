import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import { SplashScreen } from 'src/components/loading-screen';

import { adminDashboardRoutes } from './admin-dashboard';
import { authRoutes } from './auth';
import { authDemoRoutes } from './auth-demo';
import { componentsRoutes } from './components';
import { dashboardRoutes } from './dashboard';
import { mainRoutes } from './main';


const HomePage = lazy(() => import('src/pages/home'));
const TempyAboutPage = lazy(() => import('src/pages/legal/about-us'));
const TempyPrivacyPage = lazy(() => import('src/pages/legal/privacy'));
const TempyTermsPage = lazy(() => import('src/pages/legal/terms'));
const TempyFaqsPage = lazy(() => import('src/pages/legal/faqs'));

export function Router() {
  return useRoutes([
    {
      path: '/',
      element: (
        <Suspense fallback={<SplashScreen />}>
          <HomePage />
        </Suspense>
      ),
    },
    {
      path: 'about-us',
      element: (
        <Suspense fallback={<SplashScreen />}>
          <TempyAboutPage />
        </Suspense>
      ),
    },
    {
      path: 'privacy-policy',
      element: (
        <Suspense fallback={<SplashScreen />}>
          <TempyPrivacyPage />
        </Suspense>
      ),
    },
    {
      path: 'terms-of-service',
      element: (
        <Suspense fallback={<SplashScreen />}>
          <TempyTermsPage />
        </Suspense>
      ),
    },
    {
      path: 'faqs',
      element: (
        <Suspense fallback={<SplashScreen />}>
          <TempyFaqsPage />
        </Suspense>
      ),
    },

    ...authRoutes,
    
    ...authDemoRoutes,

    ...dashboardRoutes,

    ...adminDashboardRoutes,

    ...mainRoutes,

    ...componentsRoutes,

    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
