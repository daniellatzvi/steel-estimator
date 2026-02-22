import React, { useState, useEffect } from 'react';
import UploadView from './components/UploadView.jsx';
import EstimateView from './components/EstimateView.jsx';
import SettingsView from './components/SettingsView.jsx';
import Header from './components/Header.jsx';
import './styles.css';

const DEFAULT_SETTINGS = {
  materialRatePerLb: '',
  laborRatePerHour: '',
  hoursPerTonStructural: '',
  hoursPerTonMisc: '',
  hoursPerTonPlate: '',
  markup: '',
  companyName: 'Steel Estimator',
};

export default function App() {
  const [view, setView] = useState('upload'); // upload | estimate | settings
  const [members, setMembers] = useState([]);
  const [jobName, setJobName] = useState('');
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('steelEstimatorSettings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  useEffect(() => {
    localStorage.setItem('steelEstimatorSettings', JSON.stringify(settings));
  }, [settings]);

  const handleExtracted = (extractedMembers, name) => {
    setMembers(extractedMembers);
    setJobName(name || 'Untitled Job');
    setView('estimate');
  };

  const handleNewJob = () => {
    setMembers([]);
    setJobName('');
    setView('upload');
  };

  return (
    <div className="app">
      <Header 
        view={view} 
        setView={setView} 
        onNewJob={handleNewJob}
        companyName={settings.companyName}
      />
      <main className="main">
        {view === 'upload' && (
          <UploadView onExtracted={handleExtracted} />
        )}
        {view === 'estimate' && (
          <EstimateView 
            members={members} 
            setMembers={setMembers}
            jobName={jobName}
            setJobName={setJobName}
            settings={settings}
            onNewJob={handleNewJob}
          />
        )}
        {view === 'settings' && (
          <SettingsView settings={settings} setSettings={setSettings} />
        )}
      </main>
    </div>
  );
}
