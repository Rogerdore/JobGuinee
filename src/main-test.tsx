// Test minimal pour identifier le problème
import { createRoot } from 'react-dom/client';

function TestApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'green' }}>✅ React fonctionne !</h1>
      <p>Si vous voyez ce message, React démarre correctement.</p>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<TestApp />);
