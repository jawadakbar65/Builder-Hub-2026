import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '../ctx';
import { TOOLS } from './registry';
import Paper from '../components/Paper';
import { Icon } from '../components/Icons';
import { getStudents, listProjects, syncStudents } from '../store';
import { parseCsv } from '../utils/csv';
import { nodeToCanvas, pdfFromCanvases } from '../utils/export';

const ALIAS = { rollno: 'roll', rollnumber: 'roll', class: 'className', classname: 'className', fathername: 'fatherName', father: 'fatherName', idno: 'idNo', id: 'idNo', studentname: 'name' };
const FREE_LIMIT = 3;

export default function Bulk() {
  const { t, plan, toast } = useApp();
  const bulkTools = Object.values(TOOLS).filter((x) => x.bulk);
  const [tid, setTid] = useState('idcard');
  const [src, setSrc] = useState('students');
  const [csv, setCsv] = useState('name,roll,className\nJawad Ali,101,8-A\nJawad Ali,102,8-A\nJawad Ali,103,8-A');
  const [projects, setProjects] = useState([]);
  const [studentRows, setStudentRows] = useState(() => getStudents());
  const [base, setBase] = useState('demo');
  const [busy, setBusy] = useState(0);
  const tool = TOOLS[tid];

  useEffect(() => { listProjects().then((l) => setProjects(l.filter((p) => p.tool === tid))).catch(() => setProjects([])); setBase('demo'); }, [tid]);
  useEffect(() => { syncStudents().then(setStudentRows).catch(() => {}); }, []);

  const norm = (r) => {
    const o = {};
    for (const [k, v] of Object.entries(r)) {
      const key = k.toLowerCase().replace(/[^a-z]/g, '');
      const fk = tool.fields.find((x) => x.key.toLowerCase() === key)?.key;
      o[ALIAS[key] || fk || k] = v;
    }
    return o;
  };
  const rows = src === 'students' ? studentRows.map((s) => ({ name: s.name, age: s.age, roll: s.roll, result: s.result })) : parseCsv(csv).map(norm);
  const limit = plan === 'pro' ? rows.length : Math.min(FREE_LIMIT, rows.length);

  async function run() {
    if (!rows.length) { toast('No records found'); return; }
    const proj = projects.find((p) => p.id === base);
    const baseData = proj ? proj.data : tool.demo;
    const tpl = proj ? proj.tpl : tool.templates[0].id;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-99999px;top:0';
    document.body.appendChild(host);
    const root = createRoot(host);
    const canv = [];
    setBusy(1);
    try {
      for (let i = 0; i < limit; i++) {
        const d = { ...baseData, ...rows[i] };
        const ref = React.createRef();
        root.render(<Paper ref={ref} tool={tool} data={d} tpl={tpl} brand={plan !== 'pro'} />);
        await new Promise((r) => setTimeout(r, 150));
        canv.push(await nodeToCanvas(ref.current, 2));
        setBusy(i + 1);
      }
      const [W, H] = tool.size(baseData, tpl);
      pdfFromCanvases(canv, W, H).save(`${tid}-bulk.pdf`);
      toast(`✅ PDF created with ${canv.length} page(s)`);
    } catch (e) { toast('Bulk failed: ' + e.message); }
    finally { root.unmount(); host.remove(); setBusy(0); }
  }

  return (
    <div className="page narrow">
      <h1><Icon name="package" /> {t('Bulk Generate')}</h1>
      <p className="muted">Create one page per student in a single PDF — ID cards, admit cards, certificates, marksheets, receipts and progress reports.</p>
      <div className="panel">
        <div className="field"><label>Document</label>
          <select value={tid} onChange={(e) => setTid(e.target.value)}>{bulkTools.map((x) => <option key={x.id} value={x.id}>{t(x.name)}</option>)}</select>
        </div>
        <div className="field"><label>Base design (school name, logo, subjects, etc.)</label>
          <select value={base} onChange={(e) => setBase(e.target.value)}>
            <option value="demo">Demo template</option>
            {projects.map((p) => <option key={p.id} value={p.id}>My project: {p.name}</option>)}
          </select>
          <div className="muted">Tip: design it in the tool, press Save, then pick it here.</div>
        </div>
        <div className="field"><label>Students from</label>
          <select value={src} onChange={(e) => setSrc(e.target.value)}>
            <option value="students">Student Data Table ({studentRows.length} saved)</option>
            <option value="csv">Paste CSV</option>
          </select>
        </div>
        {src === 'csv' && (
          <div className="field"><label>CSV (first row = column names matching the form fields, e.g. name, roll, className, fatherName)</label>
            <textarea rows={6} value={csv} onChange={(e) => setCsv(e.target.value)} />
          </div>
        )}
        <p><b>{rows.length}</b> record(s) found{plan !== 'pro' && rows.length > FREE_LIMIT && <> — Free plan generates the first {FREE_LIMIT}. <a href="#/pricing">Upgrade to Pro</a> for all.</>}</p>
        <button className="btn block" disabled={!!busy} onClick={run}>{busy ? `Generating ${busy}/${limit}…` : <><Icon name="download" className="sm" /> Generate PDF ({limit} page{limit === 1 ? '' : 's'})</>}</button>
      </div>
    </div>
  );
}
