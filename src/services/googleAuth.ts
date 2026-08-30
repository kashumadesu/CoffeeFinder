// ============================================================
// Google OAuth 2.0 Authentication Service (Expo WebBrowser + Token Fetch)
// ============================================================

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GOOGLE_OAUTH_CLIENT_ID } from '@env';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  verified_email?: boolean;
}

export async function promptGoogleSignIn(): Promise<{
  profile: GoogleUserProfile | null;
  error: string | null;
}> {
  try {
    const clientId =
      GOOGLE_OAUTH_CLIENT_ID ||
      '185738448271-olo77q223uvloh3ct9u2m3fhj39h19si.apps.googleusercontent.com';

    const redirectUri = AuthSession.makeRedirectUri();

    // Google OAuth 2.0 implicit token flow
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&prompt=select_account`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      // Parse access_token from hash fragment
      const hashPart = result.url.split('#')[1] || result.url.split('?')[1] || '';
      const params = new URLSearchParams(hashPart);
      const accessToken = params.get('access_token');

      if (accessToken) {
        // Fetch user profile from Google UserInfo API
        const userResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (userResponse.ok) {
          const profile: GoogleUserProfile = await userResponse.json();
          return { profile, error: null };
        }
      }

      return { profile: null, error: 'Could not retrieve Google profile' };
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { profile: null, error: 'Cancelled by user' };
    }

    return { profile: null, error: 'Google Sign-In failed' };
  } catch (err: any) {
    return { profile: null, error: err.message || 'OAuth error' };
  }
}
