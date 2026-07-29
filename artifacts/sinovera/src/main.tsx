import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// Route API calls to the /api artifact service
setBaseUrl('');

createRoot(document.getElementById('root')!).render(<App />);
