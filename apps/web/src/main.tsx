import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './pages';
import './styles.css';

class SafeErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="safe-error"><span className="eyebrow">CASE FILE ERROR</span><h1>This file could not be opened.</h1><p>Your case data has not been changed. Return to your archive and try again.</p><a className="button primary" href="/cases">Return to case files</a></main>;
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><SafeErrorBoundary><BrowserRouter><App /></BrowserRouter></SafeErrorBoundary></React.StrictMode>);
