📚 OAuth 2.0 Server - Frontend Dokumentácia
🌐 Base URLs
text
Development: http://localhost:8000/api/auth
Production:  https://tvoj-backend.vercel.app/api/auth
🎯 Čo je hotové na backende
✅ Implementované OAuth 2.0 Endpoints
Authorization Endpoint - generuje authorization codes

Token Endpoint - vymieňa code za access token

UserInfo Endpoint - vracia user data s OAuth tokenom

Client Management - OAuth clients v Django admin

🔐 Podporované Grant Types
Authorization Code Flow (pre webové aplikácie)

PKCE (voliteľné, pre mobilné apps)

📋 API Endpoints pre Frontend
1. 🔑 OAuth Authorization Flow
Krok 1: Presmeruj používateľa na autorizáciu
javascript
// Frontend - redirect na OAuth server
const clientId = 'test-client-123';
const redirectUri = encodeURIComponent('http://localhost:3000/auth/callback');
const state = 'random_state_string'; // Pre security
const scope = 'read profile';

const authUrl = `http://localhost:8000/api/auth/oauth/authorize/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=${scope}`;

// Presmeruj používateľa
window.location.href = authUrl;
Krok 2: Zachyť callback a vymeň code za token
javascript
// Callback handler (na /auth/callback route)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// Vymeň code za access token
const tokenResponse = await fetch('http://localhost:8000/api/auth/oauth/token/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: 'test-client-123',
        client_secret: 'test-secret-456', // V produkcii použij env variable
        code: code,
        redirect_uri: 'http://localhost:3000/auth/callback'
    })
});

const tokenData = await tokenResponse.json();
// tokenData: { access_token, token_type, expires_in, refresh_token, scope }
2. 👤 User Info Endpoint
javascript
// Získaj user info s OAuth tokenom
const userResponse = await fetch('http://localhost:8000/api/auth/oauth/userinfo/', {
    headers: {
        'Authorization': `Bearer ${oauthAccessToken}`
    }
});

const userData = await userResponse.json();
// userData: { id, email, first_name, last_name, avatar, oauth_provider, phone, created_at }
3. 🔄 Token Management
javascript
// Refresh token (ak access token expiroval)
const refreshResponse = await fetch('http://localhost:8000/api/auth/token/refresh/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        refresh: refreshToken
    })
});

const newTokens = await refreshResponse.json();
// newTokens: { access: new_access_token }
💻 Kompletný Frontend Príklad (React/Next.js)
1. OAuth Login Komponent
javascript
// components/OAuthLoginButton.js
import { useState } from 'react';

const OAuthLoginButton = () => {
    const [loading, setLoading] = useState(false);

    const handleOAuthLogin = () => {
        setLoading(true);
        
        const clientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || 'test-client-123';
        const redirectUri = encodeURIComponent(`${window.location.origin}/auth/callback`);
        const state = Math.random().toString(36).substring(2); // Random state
        const scope = 'read profile';

        const authUrl = `http://localhost:8000/api/auth/oauth/authorize/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=${scope}`;
        
        // Ulož state do localStorage pre verification
        localStorage.setItem('oauth_state', state);
        
        window.location.href = authUrl;
    };

    return (
        <button 
            onClick={handleOAuthLogin} 
            disabled={loading}
            className="oauth-login-btn"
        >
            {loading ? 'Connecting...' : 'Login with OAuth'}
        </button>
    );
};

export default OAuthLoginButton;
2. Callback Handler
javascript
// pages/auth/callback.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const OAuthCallback = () => {
    const router = useRouter();
    const [status, setStatus] = useState('Processing...');
    const { code, state } = router.query;

    useEffect(() => {
        const handleCallback = async () => {
            if (!code) {
                setStatus('Error: No authorization code received');
                return;
            }

            // Verify state parameter
            const savedState = localStorage.getItem('oauth_state');
            if (state !== savedState) {
                setStatus('Error: State parameter mismatch');
                return;
            }

            try {
                setStatus('Exchanging code for token...');

                // Exchange code for token
                const tokenResponse = await fetch('http://localhost:8000/api/auth/oauth/token/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        grant_type: 'authorization_code',
                        client_id: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || 'test-client-123',
                        client_secret: process.env.NEXT_PUBLIC_OAUTH_CLIENT_SECRET || 'test-secret-456',
                        code: code,
                        redirect_uri: `${window.location.origin}/auth/callback`
                    })
                });

                if (!tokenResponse.ok) {
                    throw new Error(`Token exchange failed: ${tokenResponse.status}`);
                }

                const tokenData = await tokenResponse.json();
                
                setStatus('Getting user info...');

                // Get user info
                const userResponse = await fetch('http://localhost:8000/api/auth/oauth/userinfo/', {
                    headers: {
                        'Authorization': `Bearer ${tokenData.access_token}`
                    }
                });

                if (!userResponse.ok) {
                    throw new Error('Failed to get user info');
                }

                const userData = await userResponse.json();

                // Save to localStorage/context
                localStorage.setItem('oauth_access_token', tokenData.access_token);
                localStorage.setItem('oauth_refresh_token', tokenData.refresh_token);
                localStorage.setItem('user', JSON.stringify(userData));

                // Cleanup
                localStorage.removeItem('oauth_state');

                setStatus('Login successful! Redirecting...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1000);

            } catch (error) {
                console.error('OAuth error:', error);
                setStatus(`Error: ${error.message}`);
            }
        };

        if (code && state) {
            handleCallback();
        }
    }, [code, state, router]);

    return (
        <div className="callback-container">
            <h2>OAuth Callback</h2>
            <p>{status}</p>
        </div>
    );
};

export default OAuthCallback;
3. API Client s OAuth Support
javascript
// lib/oauthApi.js
class OAuthApiClient {
    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/auth';
    }

    async request(endpoint, options = {}) {
        const token = localStorage.getItem('oauth_access_token');
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        let response = await fetch(`${this.baseURL}${endpoint}`, config);

        // Auto-refresh token on 401
        if (response.status === 401) {
            const newToken = await this.refreshToken();
            if (newToken) {
                config.headers.Authorization = `Bearer ${newToken}`;
                response = await fetch(`${this.baseURL}${endpoint}`, config);
            }
        }

        return response;
    }

    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('oauth_refresh_token');
            const response = await fetch(`${this.baseURL}/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('oauth_access_token', data.access);
                return data.access;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
        }
        return null;
    }

    async getUserInfo() {
        const response = await this.request('/oauth/userinfo/');
        return response.json();
    }

    logout() {
        localStorage.removeItem('oauth_access_token');
        localStorage.removeItem('oauth_refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
}

export const oauthApi = new OAuthApiClient();
4. Auth Context
javascript
// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { oauthApi } from '../lib/oauthApi';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('oauth_access_token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                try {
                    // Verify token is still valid
                    await oauthApi.getUserInfo();
                    setUser(JSON.parse(savedUser));
                } catch (error) {
                    console.error('Token invalid:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = (userData, tokens) => {
        setUser(userData);
        localStorage.setItem('oauth_access_token', tokens.access_token);
        localStorage.setItem('oauth_refresh_token', tokens.refresh_token);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('oauth_access_token');
        localStorage.removeItem('oauth_refresh_token');
        localStorage.removeItem('user');
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
🌍 Environment Variables pre Frontend
env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/auth
NEXT_PUBLIC_OAUTH_CLIENT_ID=test-client-123
NEXT_PUBLIC_OAUTH_CLIENT_SECRET=test-secret-456

# .env.production
NEXT_PUBLIC_API_URL=https://tvoj-backend.vercel.app/api/auth
NEXT_PUBLIC_OAUTH_CLIENT_ID=production-client-id
NEXT_PUBLIC_OAUTH_CLIENT_SECRET=production-client-secret
🚀 Rýchly Štart
Nastav environment variables

Použi OAuthLoginButton komponent

Vytvor /auth/callback route

Zabal appku v AuthProvider

javascript
// _app.js
import { AuthProvider } from '../context/AuthContext';

function MyApp({ Component, pageProps }) {
    return (
        <AuthProvider>
            <Component {...pageProps} />
        </AuthProvider>
    );
}

export default MyApp;
🐛 Riešenie problémov
Bežné chyby:

invalid_grant - Code expiroval alebo bol už použitý

invalid_client - Nesprávne client credentials

access_denied - User zamietol autorizáciu

state_mismatch - Security chyba, zlé state parameter

OAuth flow je teraz pripravený pre frontend integráciu! 🎉
