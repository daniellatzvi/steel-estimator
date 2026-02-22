import React, { useState } from 'react';

export default function SettingsView({ settings, setSettings }) {
  const [saved, setSaved] = useState(false);

  const update = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="settings-view">
      <div className="section-label" style={{ marginBottom: 24 }}>Configuration</div>

      <div className="settings-section">
        <h2>Company</h2>
        <div className="field">
          <label>Company Name (shown in header)</label>
          <input
            type="text"
            value={settings.companyName || ''}
            onChange={e => update('companyName', e.target.value)}
            placeholder="Your Shop Name"
          />
        </div>
      </div>

      <div className="settings-section">
        <h2>Material Rates</h2>
        <div className="field-row">
          <div className="field">
            <label>Material Rate ($ per lb)</label>
            <input
              type="number"
              step="0.01"
              value={settings.materialRatePerLb || ''}
              onChange={e => update('materialRatePerLb', e.target.value)}
              placeholder="e.g. 0.85"
            />
            <span className="field-hint">Your cost to buy steel per pound delivered to shop</span>
          </div>
          <div className="field">
            <label>Markup (%)</label>
            <input
              type="number"
              step="1"
              value={settings.markup || ''}
              onChange={e => update('markup', e.target.value)}
              placeholder="e.g. 20"
            />
            <span className="field-hint">Applied to total (material + labor) for final bid price</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>Labor Rates</h2>
        <div className="field-row">
          <div className="field">
            <label>Labor Rate ($ per hour)</label>
            <input
              type="number"
              step="1"
              value={settings.laborRatePerHour || ''}
              onChange={e => update('laborRatePerHour', e.target.value)}
              placeholder="e.g. 75"
            />
            <span className="field-hint">Fully loaded shop labor rate — wages + burden + overhead</span>
          </div>
        </div>

        <div style={{ marginTop: 20, marginBottom: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Hours per ton by work type — ask your foreman
        </div>

        <div className="field-row">
          <div className="field">
            <label>Structural Steel (hrs/ton)</label>
            <input
              type="number"
              step="0.5"
              value={settings.hoursPerTonStructural || ''}
              onChange={e => update('hoursPerTonStructural', e.target.value)}
              placeholder="e.g. 40"
            />
            <span className="field-hint">Beams, columns, HSS, angles — standard fab and erection prep</span>
          </div>
          <div className="field">
            <label>Misc Steel (hrs/ton)</label>
            <input
              type="number"
              step="0.5"
              value={settings.hoursPerTonMisc || ''}
              onChange={e => update('hoursPerTonMisc', e.target.value)}
              placeholder="e.g. 80"
            />
            <span className="field-hint">Stairs, handrail, grating, ladders — more complex, more hours</span>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Plate Work (hrs/ton)</label>
            <input
              type="number"
              step="0.5"
              value={settings.hoursPerTonPlate || ''}
              onChange={e => update('hoursPerTonPlate', e.target.value)}
              placeholder="e.g. 60"
            />
            <span className="field-hint">Plates, base plates, gussets — layout, cutting, drilling</span>
          </div>
        </div>
      </div>

      <button className="btn btn-accent" onClick={handleSave}>
        Save Settings
      </button>
      <div className={`settings-save-msg ${saved ? 'visible' : ''}`}>
        ✓ Settings saved
      </div>

      <div style={{ marginTop: 40, padding: 16, background: 'var(--surface)', borderLeft: '3px solid var(--border2)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>
          Note on Hours Per Ton
        </div>
        <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          These are your shop's actual production rates — how many hours it takes your crew to fabricate and prepare one ton of steel for each type of work.
          Every shop is different. Your foreman's gut number is more accurate than any industry average.
          Start with his estimate, then track actuals job by job and refine over time.
        </p>
      </div>
    </div>
  );
}
