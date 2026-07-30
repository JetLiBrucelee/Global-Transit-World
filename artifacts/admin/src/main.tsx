import { createRoot } from 'react-dom/client';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';

import App from './App';

import './index.css';

const TOKEN_KEY = 'stg_admin_token';

// Route all API calls through the same origin's /api path
setBaseUrl('');

// Attach the admin session token as a Bearer header on every API request
setAuthTokenGetter(() => localStorage.getItem(TOKEN_KEY));

createRoot(document.getElementById('root')!).render(<App />);
