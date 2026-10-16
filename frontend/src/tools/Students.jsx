import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../ctx';
import { Icon } from '../components/Icons';
import { getStudents, setStudents, syncStudents, hasApi } from '../store';
import { parseCsv, toCsv } from '../utils/csv';
import { saveBlob } from '../utils/export';

const COLS = [{ key: 'name', label: 'Name' }, { key: 'age', label: 'Age' }, { key: 'roll', label: 'Roll No' }, { key: 'result', label: 'Result' }];
const DEMO = [
  ['Nabeel Khan', 13, '101', 'Pass'], ['Shams Ud Din', 12, '102', 'Pass'], ['Muhammad Nasir', 13, '103', 'Fail'],
  ['Yousuf', 12, '104', 'Pass'], ['Adnan Khan', 14, '105', 'Pass'],
].map(([name, age, roll, result]) => ({ name, age, roll, result }));
const uid = () => Math.random().toString(36).slice(2, 9);

export default function Students() {
  const { t, toast, user } = useApp();
  const [rows, setRows] = useState(() => getStudents());
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ key: 'roll', dir: 1 });
  const [nw, setNw] = useState({ name: '', age: '', roll: '', result: 'Pass' });
  const file = useRef(null);

  useEffect(() => {
    let active = true;
    syncStudents().then((remote) => { if (active) setRows(remote); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const commit = (r) => { setRows(r); setStudents(r); };
  const upd = (id, k, v) => commit(rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const add = () => {
    if (!nw.name.trim()) { toast('Enter a name'); return; }
    commit([...rows, { ...nw, id: uid() }]); setNw({ name: '', age: '', roll: '', result: 'Pass' });
  };

  const view = useMemo(() => {
    const s = q.toLowerCase();
    return rows
      .filter((r) => COLS.some((c) => String(r[c.key] ?? '').toLowerCase().includes(s)))
      .sort((a, b) => String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), undefined, { numeric: true }) * sort.dir);
  }, [rows, q, sort]);

  const importCsv = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const parsed = parseCsv(await f.text()).map((r) => {
      const o = {};
      for (const [k, v] of Object.entries(r)) {
        const key = k.toLowerCase().replace(/[^a-z]/g, '');
        const m = { name: 'name', studentname: 'name', age: 'age', rollno: 'roll', roll: 'roll', rollnumber: 'roll', result: 'result' }[key];
        if (m) o[m] = v;
      }
      return { name: '', age: '', roll: '', result: '', ...o, id: uid() };
    }).filter((r) => r.name);
    commit([...rows, ...parsed]); toast(`Imported ${parsed.length} rows`); e.target.value = '';
  };

  const stats = { total: rows.length, pass: rows.filter((r) => r.result === 'Pass').length };

  return (
    <div className="page">
      <div className="row between">
        <h1><Icon name="table" /> {t('Student Data Table')}</h1>
        <div className="row">
          <button className="btn ghost sm" onClick={() => commit([...rows, ...DEMO.map((d) => ({ ...d, id: uid() }))])}><Icon name="sparkles" className="sm" /> {t('Demo data')}</button>
          <button className="btn ghost sm" onClick={() => file.current.click()}><Icon name="upload" className="sm" /> Import CSV</button>
          <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={importCsv} />
          <button className="btn ghost sm" onClick={() => saveBlob(new Blob([toCsv(rows, COLS)], { type: 'text/csv' }), 'students.csv')}><Icon name="download" className="sm" /> Export CSV</button>
          <button className="btn ghost sm" onClick={() => { if (confirm('Delete all students?')) commit([]); }}><Icon name="trash" className="sm" /> {t('Clear')}</button>
          <a className="btn sm" href="#/bulk"><Icon name="package" className="sm" /> {t('Bulk Generate')}</a>
        </div>
      </div>
      <p className="muted">Saved in this browser. Total: <b>{stats.total}</b> · Pass: <b>{stats.pass}</b> · Fail/Other: <b>{stats.total - stats.pass}</b></p>
      <input className="search" style={{ maxWidth: 320, marginTop: 0 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search') + '…'} />
      <table className="dtable">
        <thead>
          <tr>
            <th />
            {COLS.map((c) => (
              <th key={c.key} onClick={() => setSort({ key: c.key, dir: sort.key === c.key ? -sort.dir : 1 })}>
                {t(c.label)} {sort.key === c.key ? (sort.dir === 1 ? '▲' : '▼') : ''}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><Icon name="plus" className="sm" /></td>
            <td><input value={nw.name} placeholder={t('Name')} onChange={(e) => setNw({ ...nw, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add()} /></td>
            <td><input type="number" value={nw.age} placeholder={t('Age')} onChange={(e) => setNw({ ...nw, age: e.target.value })} /></td>
            <td><input value={nw.roll} placeholder={t('Roll No')} onChange={(e) => setNw({ ...nw, roll: e.target.value })} /></td>
            <td><select value={nw.result} onChange={(e) => setNw({ ...nw, result: e.target.value })}><option>Pass</option><option>Fail</option><option>Absent</option></select></td>
            <td><button className="btn sm" onClick={add}>{t('Add')}</button></td>
          </tr>
          {view.map((r, i) => (
            <tr key={r.id}>
              <td>{i + 1}</td>
              <td><input value={r.name} onChange={(e) => upd(r.id, 'name', e.target.value)} /></td>
              <td><input type="number" value={r.age} onChange={(e) => upd(r.id, 'age', e.target.value)} /></td>
              <td><input value={r.roll} onChange={(e) => upd(r.id, 'roll', e.target.value)} /></td>
              <td>
                <select value={r.result} onChange={(e) => upd(r.id, 'result', e.target.value)}>
                  <option>Pass</option><option>Fail</option><option>Absent</option>
                </select>
              </td>
              <td><button className="btn ghost sm" onClick={() => commit(rows.filter((x) => x.id !== r.id))}><Icon name="x" className="sm" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
