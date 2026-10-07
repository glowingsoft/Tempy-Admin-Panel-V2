import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { AuthSplitLayout } from 'src/layouts/auth-split';
import { AuthCenteredLayout } from 'src/layouts/auth-centered';

import { CONFIG } from 'src/config-global';

import { SplashScreen } from 'src/components/loading-screen';

import { GuestGuard } from 'src/auth/guard';


const Jwt = {
  SignInPage: lazy(() => import('src/pages/auth/jwt/sign-in')),
  AdminSignInPage: lazy(() => import('src/pages/auth/jwt/admin-sign-in')),
  SignUpPage: lazy(() => import('src/pages/auth/jwt/sign-up')),
  VerifyEmailPage: lazy(() => import('src/pages/auth/jwt/verify-email')),
  ForgetPasswordPage: lazy(() => import('src/pages/auth/jwt/forget-password')),
  AdminForgetPasswordPage: lazy(() => import('src/pages/auth/jwt/admin-forget-password')),
  VerifyPasswordPage: lazy(() => import('src/pages/auth/jwt/verify-password')),
  ResetPasswordPage: lazy(() => import('src/pages/auth/jwt/reset-password')),
};

const authJwt = {
  path: '',
  children: [
    {
      path: 'sign-in/admin',
      element: (
        <GuestGuard>
          <AuthCenteredLayout contentWidth="480px" hideHeader compact>
            <Jwt.AdminSignInPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'sign-in',
      element: (
        <GuestGuard>
          <AuthCenteredLayout contentWidth="480px" hideHeader compact>
            <Jwt.SignInPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'sign-up',
      element: (
        <GuestGuard>
          <AuthCenteredLayout contentWidth="900px" hideHeader>
            <Jwt.SignUpPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'verify-email',
      element: (
        <GuestGuard>
          <AuthCenteredLayout contentWidth="480px" hideHeader compact>
            <Jwt.VerifyEmailPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'forget-password/admin',
      element: (
        <GuestGuard>
          <AuthSplitLayout
            section={{
              title: 'Change password',
              subtitle:
                'We will send an OTP to the admin email so you can set a new password.',
              titleVariant: 'h4',
              contentGap: 1.5,
              imgUrl: `${CONFIG.site.basePath}/assets/illustrations/illustration-forgot-password.webp`,
              imgSx: {
                maxWidth: '100%',
                width: 1,
                aspectRatio: 'auto',
                mt: 0.5,
              },
              sx: {
                px: 2.5,
                pb: 2,
                maxWidth: 520,
              },
              hideMethods: true,
            }}
          >
            <Jwt.AdminForgetPasswordPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'forget-password',
      element: (
        <GuestGuard>
          <AuthSplitLayout
            section={{
              title: 'Forgot password?',
              subtitle:
                "Please enter the email address associated with your account and we'll email you a link to reset your password.",
              titleVariant: 'h4',
              contentGap: 1.5,
              imgUrl: `${CONFIG.site.basePath}/assets/illustrations/illustration-forgot-password.webp`,
              imgSx: {
                maxWidth: '100%',
                width: 1,
                aspectRatio: 'auto',
                mt: 0.5,
              },
              sx: {
                px: 2.5,
                pb: 2,
                maxWidth: 520,
              },
              hideMethods: true,
            }}
          >
            <Jwt.ForgetPasswordPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'verify-password',
      element: (
        <GuestGuard>
          <AuthCenteredLayout contentWidth="480px" hideHeader compact>
            <Jwt.VerifyPasswordPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'reset-password',
      element: (
        <GuestGuard>
          <AuthSplitLayout
            section={{
              title: 'Reset your password',
              subtitle: 'Create a strong new password and confirm it to securely access your account.',
              titleVariant: 'h4',
              contentGap: 2,
              imgUrl: `${CONFIG.site.basePath}/assets/illustrations/illustration-reset-password.webp`,
              imgSx: {
                maxWidth: '100%',
                width: 1,
                aspectRatio: 'auto',
              },
              sx: {
                px: 2.5,
                pb: 2,
                maxWidth: 520,
              },
              hideMethods: true,
            }}
          >
            <Jwt.ResetPasswordPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
  ],
};


const Amplify = {
  SignInPage: lazy(() => import('src/pages/auth/amplify/sign-in')),
  SignUpPage: lazy(() => import('src/pages/auth/amplify/sign-up')),
  VerifyPage: lazy(() => import('src/pages/auth/amplify/verify')),
  UpdatePasswordPage: lazy(() => import('src/pages/auth/amplify/update-password')),
  ResetPasswordPage: lazy(() => import('src/pages/auth/amplify/reset-password')),
};

const authAmplify = {
  path: 'amplify',
  children: [
    {
      path: 'sign-in',
      element: (
        <GuestGuard>
          <AuthSplitLayout section={{ title: 'Hi, Welcome back' }}>
            <Amplify.SignInPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'sign-up',
      element: (
        <GuestGuard>
          <AuthSplitLayout>
            <Amplify.SignUpPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'verify',
      element: (
        <AuthSplitLayout>
          <Amplify.VerifyPage />
        </AuthSplitLayout>
      ),
    },
    {
      path: 'reset-password',
      element: (
        <AuthSplitLayout>
          <Amplify.ResetPasswordPage />
        </AuthSplitLayout>
      ),
    },
    {
      path: 'update-password',
      element: (
        <AuthSplitLayout>
          <Amplify.UpdatePasswordPage />
        </AuthSplitLayout>
      ),
    },
  ],
};


const Firebase = {
  SignInPage: lazy(() => import('src/pages/auth/firebase/sign-in')),
  SignUpPage: lazy(() => import('src/pages/auth/firebase/sign-up')),
  VerifyPage: lazy(() => import('src/pages/auth/firebase/verify')),
  ResetPasswordPage: lazy(() => import('src/pages/auth/firebase/reset-password')),
};

const authFirebase = {
  path: 'firebase',
  children: [
    {
      path: 'sign-in',
      element: (
        <GuestGuard>
          <AuthSplitLayout section={{ title: 'Hi, Welcome back' }}>
            <Firebase.SignInPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'sign-up',
      element: (
        <GuestGuard>
          <AuthSplitLayout>
            <Firebase.SignUpPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'verify',
      element: (
        <AuthSplitLayout>
          <Firebase.VerifyPage />
        </AuthSplitLayout>
      ),
    },
    {
      path: 'reset-password',
      element: (
        <AuthSplitLayout>
          <Firebase.ResetPasswordPage />
        </AuthSplitLayout>
      ),
    },
  ],
};


const Auth0 = {
  SignInPage: lazy(() => import('src/pages/auth/auth0/sign-in')),
  CallbackPage: lazy(() => import('src/pages/auth/auth0/callback')),
};

const authAuth0 = {
  path: 'auth0',
  children: [
    {
      path: 'sign-in',
      element: (
        <GuestGuard>
          <AuthSplitLayout section={{ title: 'Hi, Welcome back' }}>
            <Auth0.SignInPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'callback',
      element: (
        <GuestGuard>
          <Auth0.CallbackPage />
        </GuestGuard>
      ),
    },
  ],
};


const Supabase = {
  SignInPage: lazy(() => import('src/pages/auth/supabase/sign-in')),
  SignUpPage: lazy(() => import('src/pages/auth/supabase/sign-up')),
  VerifyPage: lazy(() => import('src/pages/auth/supabase/verify')),
  UpdatePasswordPage: lazy(() => import('src/pages/auth/supabase/update-password')),
  ResetPasswordPage: lazy(() => import('src/pages/auth/supabase/reset-password')),
};

const authSupabase = {
  path: 'supabase',
  children: [
    {
      path: 'sign-in',
      element: (
        <GuestGuard>
          <AuthSplitLayout section={{ title: 'Hi, Welcome back' }}>
            <Supabase.SignInPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'sign-up',
      element: (
        <GuestGuard>
          <AuthSplitLayout>
            <Supabase.SignUpPage />
          </AuthSplitLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'verify',
      element: (
        <AuthSplitLayout>
          <Supabase.VerifyPage />
        </AuthSplitLayout>
      ),
    },
    {
      path: 'reset-password',
      element: (
        <AuthSplitLayout>
          <Supabase.ResetPasswordPage />
        </AuthSplitLayout>
      ),
    },
    {
      path: 'update-password',
      element: (
        <AuthSplitLayout>
          <Supabase.UpdatePasswordPage />
        </AuthSplitLayout>
      ),
    },
  ],
};


export const authRoutes = [
  {
    path: 'auth',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [authJwt, authAmplify, authFirebase, authAuth0, authSupabase],
  },
];
