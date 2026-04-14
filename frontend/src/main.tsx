import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/** * 1. Blueprint base styles (must come before our overrides) 
 */
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import 'flag-icons/css/flag-icons.min.css';

/** * 2. Our style manager 
 */
import './styles/index.css';

import App from './App.tsx'
import './i18n';

/** * 3. CORRECTED IMPORTS
 * We now import the Providers from their new specific files.
 */
import { ThemeProvider } from './contexts/ThemeProvider.tsx';
import { AuthProvider } from './contexts/AuthProvider.tsx';

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)