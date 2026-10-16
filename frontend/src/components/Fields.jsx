import React from 'react';
import { useApp } from '../ctx';
import { Icon } from './Icons';
import { fileToDataUrl } from '../utils/image';

const blankItem = (sub) => Object.fromEntries(sub.map((s) => [s.key, '']));

export function Field({ f, value, onChange }) {
  const { t } = useApp();
  const label = t(f.label);

  if (f.type === 'list') {
    const arr = value || [];
    const upd = (i, k, v) => onChange(arr.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
    return (
      <div className="field">
        <label>{label}</label>
        {arr.map((it, i) => (
          <div className="li" key={i}>
            <div className="li-grid">
              {f.item.map((s) => (
                <Field key={s.key} f={s} value={it[s.key]} onChange={(v) => upd(i, s.key, v)} />
              ))}
            </div>
            <button className="x" title="Remove" onClick={() => onChange(arr.filter((_, j) => j !== i))}><Icon name="x" className="sm" /></button>
          </div>
        ))}
        <button className="btn ghost sm" onClick={() => onChange([...arr, blankItem(f.item)])}><Icon name="plus" className="sm" /> {t('Add')}</button>
      </div>
    );
  }

  let input;
  if (f.type === 'textarea') {
    input = <textarea rows={f.rows || 3} value={value || ''} placeholder={f.ph || ''} required={f.req} onChange={(e) => onChange(e.target.value)} />;
  } else if (f.type === 'select') {
    input = (
      <select value={value || f.options[0]} required={f.req} onChange={(e) => onChange(e.target.value)}>
        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  } else if (f.type === 'image') {
    input = (
      <div className="row">
        {value && <img className="thumb" src={value} alt="" />}
        <input type="file" accept="image/*" onChange={async (e) => {
          const file = e.target.files[0];
          if (file) onChange(await fileToDataUrl(file, f.max || 500));
        }} />
        {value && <button className="btn ghost sm" onClick={() => onChange('')}><Icon name="x" className="sm" /></button>}
      </div>
    );
  } else {
    input = <input type={f.type || 'text'} required={f.req} value={value ?? ''} placeholder={f.ph || ''} onChange={(e) => onChange(e.target.value)} />;
  }
  return <div className="field"><label>{label}{f.req && <span className="req"> *</span>}</label>{input}</div>;
}

export function FieldsForm({ fields, data, set }) {
  return (
    <>
      {fields.map((f) => <Field key={f.key} f={f} value={data[f.key]} onChange={(v) => set(f.key, v)} />)}
    </>
  );
}
