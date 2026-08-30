// ============================================================
// Facebook Login Service (Expo WebBrowser + Graph API v19.0)
// ============================================================

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { FACEBOOK_APP_ID } from '@env';

WebBrowser.maybeCompleteAuthSession();

export interface FacebookUserProfile {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
      width?: number;
      height?: number;
    };
  };
}

export async function promptFacebookSignIn(): Promise<{
  profile: FacebookUserProfile | null;
  error: string | null;
}> {
  try {
    const appId = FACEBOOK_APP_ID || '1385277280436694';
    const redirectUri = AuthSession.makeRedirectUri();

    // Facebook OAuth 2.0 Dialog URL
    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent('public_profile,email')}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      // Parse access_token from hash fragment or query
      const hashPart = result.url.split('#')[1] || result.url.split('?')[1] || '';
      const params = new URLSearchParams(hashPart);
      const accessToken = params.get('access_token');

      if (accessToken) {
        // Fetch user profile from Facebook Graph API
        const profileRes = await fetch(
          `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`,
        );

        if (profileRes.ok) {
          const profile: FacebookUserProfile = await profileRes.json();
          return { profile, error: null };
        }
      }

      return { profile: null, error: 'Could not retrieve Facebook profile' };
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { profile: null, error: 'Cancelled by user' };
    }

    return { profile: null, error: 'Facebook Login failed' };
  } catch (err: any) {
    return { profile: null, error: err.message || 'Facebook OAuth error' };
  }
}
