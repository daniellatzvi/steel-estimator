import React, { useState, useMemo } from 'react';
import { calcTotalWeight, getLbsPerFt } from '../data/aisc.js';

const CATEGORIES = ['Structural', 'Misc', 'Plate', 'Connection'];

const newMember = () => ({
  id: Math.random().toString(36).slice(2),
  mark: '',
  description: '',
  section: '',
  category: 'Structural',
  quantity: 1,
  length_ft: '',
  notes: '',
});

function CategoryBadge({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`cat-badge ${value?.toLowerCase()}`}
      style={{ cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'var(--mono)', fontSize: 10 }}
    >
      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

function autoCategory(section, description) {
  const s = (section || '').toUpperCase();
  const d = (description || '').toUpperCase();
  if (s.startsWith('PL') || d.includes('PLATE')) return 'Plate';
  if (d.includes('BOLT') || d.includes('SHEAR') || d.includes('CLIP') || d.includes('EMBED')) return 'Connection';
  if (d.includes('STAIR') || d.includes('HANDRAIL') || d.includes('GRATING') || d.includes('LADDER') || d.includes('MISC')) return 'Misc';
  return 'Structural';
}

export default function EstimateView({ members: initialMembers, setMembers: setParentMembers, jobName, setJobName, settings, onNewJob }) {
  const [rows, setRows] = useState(() =>
    (initialMembers || []).map(m => ({
      id: Math.random().toString(36).slice(2),
      mark: m.mark || '',
      description: m.description || '',
      section: m.section || '',
      category: m.category || autoCategory(m.section, m.description),
      quantity: m.quantity || 1,
      length_ft: m.length_ft || '',
      notes: m.notes || '',
    }))
  );

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      // Auto-set category when section or description changes
      if (field === 'section' || field === 'description') {
        updated.category = autoCategory(
          field === 'section' ? value : r.section,
          field === 'description' ? value : r.description
        );
      }
      return updated;
    }));
  };

  const deleteRow = (id) => setRows(prev => prev.filter(r => r.id !== id));
  const addRow = () => setRows(prev => [...prev, newMember()]);

  const hasRates = settings.materialRatePerLb || settings.laborRatePerHour;

  const rowsWithCalc = useMemo(() => rows.map(r => {
    const qty = parseInt(r.quantity) || 0;
    const len = parseFloat(r.length_ft) || 0;
    const totalWeight = r.section && qty && len ? calcTotalWeight(r.section, qty, len) : null;
    const lbsPerFt = r.section ? getLbsPerFt(r.section) : null;
    const unknownSection = r.section && lbsPerFt === null && !r.section.toUpperCase().startsWith('PL');

    let materialCost = null;
    let laborCost = null;
    let totalCost = null;

    if (totalWeight && settings.materialRatePerLb) {
      materialCost = totalWeight * parseFloat(settings.materialRatePerLb);
    }

    if (totalWeight && settings.laborRatePerHour) {
      const cat = r.category?.toLowerCase();
      const hoursKey = cat === 'plate' ? 'hoursPerTonPlate' : cat === 'misc' ? 'hoursPerTonMisc' : 'hoursPerTonStructural';
      const hpt = parseFloat(settings[hoursKey]);
      if (hpt) {
        laborCost = (totalWeight / 2000) * hpt * parseFloat(settings.laborRatePerHour);
      }
    }

    if (materialCost !== null || laborCost !== null) {
      totalCost = (materialCost || 0) + (laborCost || 0);
    }

    return { ...r, totalWeight, lbsPerFt, unknownSection, materialCost, laborCost, totalCost };
  }), [rows, settings]);

  const totals = useMemo(() => {
    const totalWeight = rowsWithCalc.reduce((s, r) => s + (r.totalWeight || 0), 0);
    const totalCost = rowsWithCalc.reduce((s, r) => s + (r.totalCost || 0), 0);
    const materialCost = rowsWithCalc.reduce((s, r) => s + (r.materialCost || 0), 0);
    const laborCost = rowsWithCalc.reduce((s, r) => s + (r.laborCost || 0), 0);
    const unknownCount = rowsWithCalc.filter(r => r.unknownSection).length;
    const markup = parseFloat(settings.markup) || 0;
    const markupAmount = totalCost * (markup / 100);
    const grandTotal = totalCost + markupAmount;
    return { totalWeight, totalCost, materialCost, laborCost, unknownCount, markupAmount, grandTotal };
  }, [rowsWithCalc, settings]);

  const fmt = (n) => n === null || isNaN(n) ? '--' : n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const fmtMoney = (n) => n === null || isNaN(n) || n === 0 ? '--' : '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const fmtWeight = (n) => n === null || isNaN(n) || n === 0 ? '--' : n.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' lbs';

  const handlePrint = () => window.print();

  return (
    <div className="estimate-view">
      <div className="estimate-header">
        <div>
          <div className="section-label">Job Estimate</div>
          <input
            className="job-title-input"
            value={jobName}
            onChange={e => setJobName(e.target.value)}
            placeholder="Job Name"
          />
        </div>
        <div className="estimate-actions">
          <button className="btn btn-sm" onClick={handlePrint}>Print</button>
          <button className="btn btn-sm" onClick={onNewJob}>+ New Job</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Total Weight</div>
          <div className={`summary-value ${totals.totalWeight ? '' : 'inactive'}`}>
            {totals.totalWeight ? fmt(totals.totalWeight) : '--'}
          </div>
          <div className="summary-sub">{totals.totalWeight ? (totals.totalWeight / 2000).toFixed(2) + ' tons' : 'lbs'}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Material Cost</div>
          <div className={`summary-value ${totals.materialCost ? 'accent' : 'inactive'}`}>
            {totals.materialCost ? fmtMoney(totals.materialCost) : '--'}
          </div>
          <div className="summary-sub">{settings.materialRatePerLb ? `@ $${settings.materialRatePerLb}/lb` : 'Set rate in Settings'}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Labor Cost</div>
          <div className={`summary-value ${totals.laborCost ? 'accent' : 'inactive'}`}>
            {totals.laborCost ? fmtMoney(totals.laborCost) : '--'}
          </div>
          <div className="summary-sub">{settings.laborRatePerHour ? `@ $${settings.laborRatePerHour}/hr` : 'Set rate in Settings'}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Subtotal</div>
          <div className={`summary-value ${totals.totalCost ? '' : 'inactive'}`}>
            {totals.totalCost ? fmtMoney(totals.totalCost) : '--'}
          </div>
          <div className="summary-sub">Before markup</div>
        </div>
        {settings.markup && (
          <div className="summary-card">
            <div className="summary-label">Grand Total ({settings.markup}% markup)</div>
            <div className="summary-value green">
              {fmtMoney(totals.grandTotal)}
            </div>
            <div className="summary-sub">+ {fmtMoney(totals.markupAmount)} markup</div>
          </div>
        )}
      </div>

      {totals.unknownCount > 0 && (
        <div className="alert warning" style={{ marginBottom: 16 }}>
          {totals.unknownCount} section{totals.unknownCount > 1 ? 's' : ''} not found in AISC table — weight shown as unknown.
          Check the section designation spelling or enter the lbs/ft manually.
        </div>
      )}

      {!hasRates && (
        <div className="alert info" style={{ marginBottom: 16 }}>
          Weights are calculating. Add your material and labor rates in Settings to see costs.
        </div>
      )}

      {/* Member table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mark</th>
              <th>Description</th>
              <th>Section</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Length (ft)</th>
              <th>Lbs/ft</th>
              <th>Total Weight</th>
              <th>Mat. Cost</th>
              <th>Labor Cost</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rowsWithCalc.map(row => (
              <tr key={row.id}>
                <td>
                  <input className="cell-input mono" value={row.mark}
                    onChange={e => updateRow(row.id, 'mark', e.target.value)}
                    placeholder="B1" style={{ width: 60 }} />
                </td>
                <td>
                  <input className="cell-input" value={row.description}
                    onChange={e => updateRow(row.id, 'description', e.target.value)}
                    placeholder="Wide Flange Beam" style={{ minWidth: 140 }} />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input className="cell-input mono" value={row.section}
                      onChange={e => updateRow(row.id, 'section', e.target.value)}
                      placeholder="W8x31" style={{ width: 110 }} />
                    {row.unknownSection && <span className="unknown-badge">?</span>}
                  </div>
                </td>
                <td>
                  <CategoryBadge value={row.category}
                    onChange={v => updateRow(row.id, 'category', v)} />
                </td>
                <td>
                  <input className="cell-input mono" value={row.quantity} type="number" min="1"
                    onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                    style={{ width: 52 }} />
                </td>
                <td>
                  <input className="cell-input mono" value={row.length_ft} type="number" min="0" step="0.5"
                    onChange={e => updateRow(row.id, 'length_ft', e.target.value)}
                    placeholder="0.0" style={{ width: 80 }} />
                </td>
                <td className={`td-mono ${row.unknownSection ? 'weight-cell unknown' : 'weight-cell'}`}>
                  {row.lbsPerFt === 'varies' ? 'varies' : row.lbsPerFt !== null ? row.lbsPerFt : row.section ? '?' : '--'}
                </td>
                <td className={`weight-cell ${!row.totalWeight ? 'unknown' : ''}`}>
                  {row.totalWeight ? fmtWeight(row.totalWeight) : '--'}
                </td>
                <td className={`cost-cell ${!row.materialCost ? 'inactive' : ''}`}>
                  {row.materialCost ? fmtMoney(row.materialCost) : '--'}
                </td>
                <td className={`cost-cell ${!row.laborCost ? 'inactive' : ''}`}>
                  {row.laborCost ? fmtMoney(row.laborCost) : '--'}
                </td>
                <td className="notes-cell" title={row.notes}>
                  <input className="cell-input" value={row.notes}
                    onChange={e => updateRow(row.id, 'notes', e.target.value)}
                    placeholder="—" style={{ minWidth: 100, color: 'var(--text3)', fontSize: 12 }} />
                </td>
                <td>
                  <button className="btn btn-sm btn-ghost btn-danger"
                    onClick={() => deleteRow(row.id)}
                    title="Delete row">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="add-row-btn" onClick={addRow}>
        <span>+</span> Add Member
      </button>

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
          {rows.length} member{rows.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
          {rowsWithCalc.filter(r => r.totalWeight).length} with calculated weight
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
          All weights from AISC Steel Construction Manual
        </div>
      </div>
    </div>
  );
}
