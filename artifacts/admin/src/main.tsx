import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// Route all API calls through the same origin's /api path
setBaseUrl('');

createRoot(document.getElementById('root')!).render(<App />);
