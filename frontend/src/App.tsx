import React from 'react';
import AppRouter from './router/AppRouter';

/**
 * App — root component.
 * All logic has been moved to pages/ and contexts/.
 * This component only mounts the router.
 */
const App: React.FC = () => <AppRouter />;

export default App;