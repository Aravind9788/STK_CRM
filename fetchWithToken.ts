// fetchWithAuth.ts
import { getTokens, storeTokens, clearTokens } from "./authStorage";
import { SERVER_URL } from './config';
import { NavigationProp } from '@react-navigation/native';

let navigationRef: NavigationProp<any> | null = null;

export const setNavigationRef = (navigation: NavigationProp<any>) => {
  navigationRef = navigation;
};

export const fetchWithToken = async (url: string, options: any = {}): Promise<Response> => {
  try {
    let { access, refresh } = await getTokens();
    
    // Handle case where no tokens exist
    if (!access && !refresh) {
      if (navigationRef) {
        navigationRef.navigate('Login');
      }
      throw new Error('No authentication tokens available');
    }

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    };

    let response = await fetch(url, { ...options, headers });

    // Handle token refresh if 401 and we have a refresh token
    if (response.status === 401 && refresh) {
      try {
        const refreshResponse = await fetch(`${SERVER_URL}/auth/token/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
        });

        if (refreshResponse.ok) {
          const { access_token, refresh_token } = await refreshResponse.json();
          await storeTokens(access_token, refresh_token);
          
          // Retry original request with new token
          return fetchWithToken(url, options);
        } else {
          // Refresh failed - clear tokens and redirect to auth
          await clearTokens();
          if (navigationRef) {
            navigationRef.navigate('Login');
          }
          throw new Error('Session expired. Please log in again.');
        }
      } catch (error) {
        await clearTokens();
        if (navigationRef) {
          navigationRef.navigate('Login');
        }
        throw error;
      }
    }

    // Handle other unauthorized cases
    if (response.status === 401) {
      await clearTokens();
      if (navigationRef) {
        navigationRef.navigate('Login');
      }
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

