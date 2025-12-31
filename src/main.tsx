import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateEnvOnStartup } from './utils/envValidator';

validateEnvOnStartup();

createRoot(document.getElementById('root')!).render(
  <App />
);
