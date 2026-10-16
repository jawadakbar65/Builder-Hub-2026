import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

function SignSlot({ image, children }) {
  return <span className="sign-slot">{image && <img src={image} alt="" />}{children}</span>;
}

export const lines = (s) => (s || '').split('\n').map((x) => x.trim()).filter(Boolean);
export const list = (s) => (s || '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

export function calc(subjects) {
  const rows = (subjects || []).filter((s) => s.subject);
  const T = rows.reduce((a, s) => a + (+s.total || 0), 0);
  const O = rows.reduce((a, s) => a + (+s.obtained || 0), 0);
  const pct = T ? (O / T) * 100 : 0;
  const pass = rows.length > 0 && rows.every((s) => (+s.obtained || 0) >= 0.33 * (+s.total || 0));
  const grade = !pass ? 'F' : pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'E';
  return { rows, T, O, pct, pass, grade };
}

function QR({ text, size = 120 }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(text || ' ', { margin: 0, width: size * 3, color: { dark: '#000000', light: '#ffffff' } }).then(setSrc);
  }, [text, size]);
  return src ? <img src={src} width={size} height={size} alt="QR" /> : <div style={{ width: size, height: size }} />;
}

export const vcard = (d) =>
  ['BEGIN:VCARD', 'VERSION:3.0', `FN:${d.name || ''}`, `ORG:${d.company || ''}`, `TITLE:${d.title || ''}`,
    `TEL;TYPE=CELL:${d.phone || ''}`, `EMAIL:${d.email || ''}`, `URL:${d.website || ''}`, `ADR:;;${d.address || ''};;;;`, 'END:VCARD'].join('\n');

const Sec = ({ title, children }) => <div className="r-sec"><h3>{title}</h3>{children}</div>;
const Chips = ({ items, ac }) => (
  <div className="chips">{items.map((s, i) => <span key={i} style={ac ? { background: ac + '22' } : null}>{s}</span>)}</div>
);

/* ---------------- Resume ---------------- */
export function Resume({ data: d, tpl }) {
  const ac = d.accent || '#2563eb';
  const exp = (d.experience || []).filter((e) => e.role || e.company).map((e, i) => (
    <div className="r-item" key={i}>
      <div className="r-row"><b>{e.role}</b><span>{e.period}</span></div>
      <div className="r-sub">{e.company}</div>
      {lines(e.details).length > 0 && <ul>{lines(e.details).map((b, j) => <li key={j}>{b}</li>)}</ul>}
    </div>
  ));
  const edu = (d.education || []).filter((e) => e.degree || e.school).map((e, i) => (
    <div className="r-item" key={i}>
      <div className="r-row"><b>{e.degree}</b><span>{e.period}</span></div>
      <div className="r-sub">{e.school}</div>
    </div>
  ));
  const contact = [d.email, d.phone, d.location, d.link].filter(Boolean);
  const skills = list(d.skills);
  const photo = d.photo ? <img className="r-photo" src={d.photo} alt="" /> : null;
  const main = (
    <>
      {d.summary && <Sec title="Summary"><p>{d.summary}</p></Sec>}
      {exp.length > 0 && <Sec title="Experience">{exp}</Sec>}
      {edu.length > 0 && <Sec title="Education">{edu}</Sec>}
    </>
  );

  if (tpl === 'modern' || tpl === 'bold') {
    return (
      <div className={`doc resume ${tpl}`}>
        {tpl === 'bold' && (
          <header className="r-band">
            <div><h1>{d.name}</h1><div className="r-title">{d.title}</div></div>
            {photo}
          </header>
        )}
        <div className="r-cols">
          <aside>
            {tpl === 'modern' && photo}
            <Sec title="Contact"><div className="r-ct">{contact.map((c, i) => <div key={i}>{c}</div>)}</div></Sec>
            {skills.length > 0 && <Sec title="Skills"><Chips items={skills} /></Sec>}
            {d.languages && <Sec title="Languages"><p>{d.languages}</p></Sec>}
          </aside>
          <section className="main">
            {tpl === 'modern' && <><h1>{d.name}</h1><div className="r-title">{d.title}</div></>}
            {main}
          </section>
        </div>
      </div>
    );
  }
  return (
    <div className={`doc resume ${tpl}`}>
      <header>
        <h1>{d.name}</h1>
        <div className="r-title">{d.title}</div>
        <div className="r-contact">{contact.map((c, i) => <span key={i}>{c}</span>)}</div>
      </header>
      {main}
      {skills.length > 0 && <Sec title="Skills"><Chips items={skills} ac={ac} /></Sec>}
      {d.languages && <Sec title="Languages"><p>{d.languages}</p></Sec>}
    </div>
  );
}

/* ---------------- Cover letter ---------------- */
export function Cover({ data: d, tpl }) {
  return (
    <div className={`doc cover ${tpl}`}>
      <header>
        <h1>{d.name}</h1>
        <div className="cv-ct">{[d.email, d.phone, d.location].filter(Boolean).join('  •  ')}</div>
      </header>
      <div className="cv-date">{d.date}</div>
      <div className="cv-to"><b>{d.recipient || 'Hiring Manager'}</b><div>{d.company}</div></div>
      <div className="cv-re">Re: Application for {d.position}</div>
      <div className="cv-body">{d.body}</div>
    </div>
  );
}

/* ---------------- Business card (QR) ---------------- */
export function BizCard({ data: d, tpl }) {
  return (
    <div className={`doc biz ${tpl}`}>
      <div className="biz-l">
        {d.photo && <img className="biz-ph" src={d.photo} alt="" />}
        <h2>{d.name}</h2>
        <div className="biz-t">{d.title}</div>
        <div className="biz-c">{d.company}</div>
        {d.tagline && <div className="biz-tag">{d.tagline}</div>}
        <ul className="biz-ct">
          {[['✉', d.email], ['☎', d.phone], ['🌐', d.website], ['📍', d.address]].filter((x) => x[1]).map(([i, v]) => <li key={i}><span>{i}</span>{v}</li>)}
        </ul>
      </div>
      <div className="biz-r">
        <div className="qrbox"><QR text={vcard(d)} size={120} /></div>
        <small>Scan to save contact</small>
      </div>
    </div>
  );
}

/* ---------------- School header ---------------- */
const Head = ({ d, sub }) => (
  <div className="sh">
    <div className="sh-l">{d.logo ? <img src={d.logo} alt="" /> : <div className="sh-logo">🏫</div>}</div>
    <div className="sh-c"><h2>{d.school || d.org}</h2>{d.address && <div>{d.address}</div>}{sub && <div className="sh-sub">{sub}</div>}</div>
  </div>
);

/* ---------------- Certificate ---------------- */
export function Certificate({ data: d, tpl }) {
  return (
    <div className={`doc cert ${tpl}`}>
      <div className="cert-in">
        {d.logo && <img className="cert-logo" src={d.logo} alt="" />}
        <div className="cert-org">{d.org}</div>
        <h1>{d.title}</h1>
        <div className="cert-sub">{d.subtitle}</div>
        <div className="cert-name">{d.name}</div>
        <p>{d.body}</p>
        <div className="cert-foot">
          <div><b>{d.date}</b><span>Date</span></div>
          <div><SignSlot image={d.studentSignature}>Student / Recipient</SignSlot></div>
          <div><SignSlot image={d.signImage}><b>{d.signName}</b><span>{d.signRole}</span></SignSlot></div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Marksheet / report card ---------------- */
export function Marksheet({ data: d, tpl }) {
  const c = calc(d.subjects);
  return (
    <div className={`doc ms ${tpl}`}>
      <Head d={d} sub={d.exam} />
      <div className="ms-info">
        {[['Student Name', d.name], ['Father Name', d.fatherName], ['Roll No', d.roll], ['Class', d.className], ['Session', d.session]].map(([k, v]) => (
          <div key={k}><span>{k}</span><b>{v}</b></div>
        ))}
      </div>
      <table className="tbl">
        <thead><tr><th>#</th><th style={{ textAlign: 'left' }}>Subject</th><th>Total</th><th>Obtained</th><th>%</th></tr></thead>
        <tbody>
          {c.rows.map((s, i) => (
            <tr key={i}>
              <td>{i + 1}</td><td style={{ textAlign: 'left' }}>{s.subject}</td><td>{s.total}</td><td>{s.obtained}</td>
              <td>{(+s.total ? ((+s.obtained || 0) / +s.total) * 100 : 0).toFixed(0)}%</td>
            </tr>
          ))}
          <tr className="tot"><td colSpan={2}>Total</td><td>{c.T}</td><td>{c.O}</td><td>{c.pct.toFixed(1)}%</td></tr>
        </tbody>
      </table>
      <div className="ms-sum">
        <div>Percentage <b>{c.pct.toFixed(2)}%</b></div>
        <div>Grade <b>{c.grade}</b></div>
        <div>Result <b className={c.pass ? 'ok' : 'bad'}>{c.pass ? 'PASS' : 'FAIL'}</b></div>
      </div>
      {d.remarks && <p className="rem"><b>Remarks:</b> {d.remarks}</p>}
      <div className="sign"><SignSlot image={d.studentSignature}>Student</SignSlot><SignSlot image={d.issuerSignature}><b>{d.issuerName || 'Class Teacher'}</b><small>{d.issuerRole || 'Teacher / Headmaster'}</small></SignSlot></div>
    </div>
  );
}

/* ---------------- Attendance ---------------- */
export function Attendance({ data: d }) {
  const [y, m] = (d.month || '2026-10').split('-').map(Number);
  const n = new Date(y, m, 0).getDate();
  const names = (d.students || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 34);
  const days = [...Array(n)].map((_, i) => i + 1);
  const sun = (x) => new Date(y, m - 1, x).getDay() === 0;
  const mn = new Date(y, m - 1, 1).toLocaleString('en', { month: 'long' });
  return (
    <div className="doc att">
      <h2>{d.school}</h2>
      <div className="att-meta"><span>Class: <b>{d.className}</b></span><span>Teacher: <b>{d.teacher}</b></span><span>Month: <b>{mn} {y}</b></span></div>
      <table className="tbl att-t">
        <thead>
          <tr>
            <th style={{ width: 24 }}>#</th><th style={{ width: 150, textAlign: 'left' }}>Student Name</th>
            {days.map((x) => <th key={x} className={sun(x) ? 'sun' : ''}>{x}</th>)}
            <th style={{ width: 28 }}>P</th><th style={{ width: 28 }}>A</th>
          </tr>
        </thead>
        <tbody>
          {names.map((nm, i) => (
            <tr key={i}>
              <td>{i + 1}</td><td style={{ textAlign: 'left' }}>{nm}</td>
              {days.map((x) => <td key={x} className={sun(x) ? 'sun' : ''}>{sun(x) ? 'S' : ''}</td>)}
              <td /><td />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Fee receipt ---------------- */
export function Receipt({ data: d, tpl }) {
  const items = (d.items || []).filter((i) => i.desc);
  const total = items.reduce((a, i) => a + (+i.amount || 0), 0);
  return (
    <div className={`doc rc ${tpl}`}>
      <Head d={d} sub="FEE RECEIPT" />
      <div className="rc-meta">
        <div>Receipt No: <b>{d.receiptNo}</b></div><div>Date: <b>{d.date}</b></div>
        <div>Student: <b>{d.name}</b></div><div>Roll No: <b>{d.roll}</b></div>
        <div>Class: <b>{d.className}</b></div><div>Fee Month: <b>{d.month}</b></div>
      </div>
      <table className="tbl">
        <thead><tr><th>#</th><th style={{ textAlign: 'left' }}>Description</th><th>Amount ({d.currency})</th></tr></thead>
        <tbody>
          {items.map((it, i) => <tr key={i}><td>{i + 1}</td><td style={{ textAlign: 'left' }}>{it.desc}</td><td>{(+it.amount || 0).toLocaleString()}</td></tr>)}
          <tr className="tot"><td colSpan={2}>Total Paid</td><td>{d.currency} {total.toLocaleString()}</td></tr>
        </tbody>
      </table>
      <div className="rc-foot"><span>Paid by: <b>{d.paidBy}</b></span><span>Received by: <b>{d.receivedBy}</b></span></div>
      <div className="sign"><SignSlot image={d.studentSignature}>Student / Guardian</SignSlot><SignSlot image={d.issuerSignature}><b>{d.receivedBy || 'Cashier'}</b><small>Cashier / Issuer</small></SignSlot></div>
    </div>
  );
}

/* ---------------- Timetable ---------------- */
export function Timetable({ data: d }) {
  const cols = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday']];
  return (
    <div className="doc tt">
      <h2>{d.school}</h2>
      <div className="tt-sub">Class Timetable — {d.className} {d.term && `(${d.term})`}</div>
      <table className="tbl">
        <thead><tr><th>Time</th>{cols.map(([k, n]) => <th key={k}>{n}</th>)}</tr></thead>
        <tbody>
          {(d.periods || []).filter((p) => p.time).map((p, i) => {
            const brk = /break|recess|lunch/i.test(Object.values(p).join(' '));
            return (
              <tr key={i} className={brk ? 'brk' : ''}>
                <td><b>{p.time}</b></td>
                {cols.map(([k]) => <td key={k}>{p[k]}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Admit card ---------------- */
export function Admit({ data: d, tpl }) {
  return (
    <div className={`doc ad ${tpl}`}>
      <Head d={d} sub={d.exam} />
      <div className="ad-title">ADMIT CARD / ROLL NUMBER SLIP</div>
      <div className="ad-top">
        <div className="ms-info">
          {[['Student Name', d.name], ['Father Name', d.fatherName], ['Roll No', d.roll], ['Class', d.className], ['Exam Center', d.center]].map(([k, v]) => (
            <div key={k}><span>{k}</span><b>{v}</b></div>
          ))}
        </div>
        {d.photo ? <img className="ad-ph" src={d.photo} alt="" /> : <div className="ad-ph ph">Photo</div>}
      </div>
      <table className="tbl">
        <thead><tr><th style={{ textAlign: 'left' }}>Subject</th><th>Date</th><th>Time</th></tr></thead>
        <tbody>{(d.subjects || []).filter((s) => s.subject).map((s, i) => <tr key={i}><td style={{ textAlign: 'left' }}>{s.subject}</td><td>{s.date}</td><td>{s.time}</td></tr>)}</tbody>
      </table>
      {d.instructions && <div className="ad-ins"><b>Instructions:</b><ul>{lines(d.instructions).map((l, i) => <li key={i}>{l}</li>)}</ul></div>}
      <div className="sign"><SignSlot image={d.studentSignature}>Student Signature</SignSlot><SignSlot image={d.issuerSignature}><b>{d.issuerName || 'Controller of Exams'}</b><small>{d.issuerRole || 'Teacher / Headmaster'}</small></SignSlot></div>
    </div>
  );
}

/* ---------------- Progress report (term-wise) ---------------- */
export function Progress({ data: d, tpl }) {
  const rows = (d.subjects || []).filter((s) => s.subject).map((s) => {
    const t = [+s.t1 || 0, +s.t2 || 0, +s.t3 || 0];
    return { ...s, t, avg: (t[0] + t[1] + t[2]) / 3 };
  });
  const term = (i) => rows.reduce((a, r) => a + r.t[i], 0) / (rows.length || 1);
  const overall = rows.reduce((a, r) => a + r.avg, 0) / (rows.length || 1);
  const trend = term(2) - term(0);
  return (
    <div className={`doc pr ${tpl}`}>
      <Head d={d} sub={`Term-wise Progress Report ${d.session || ''}`} />
      <div className="ms-info">
        {[['Student Name', d.name], ['Roll No', d.roll], ['Class', d.className], ['Attendance', d.attendance]].map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
      </div>
      <table className="tbl">
        <thead><tr><th style={{ textAlign: 'left' }}>Subject</th><th>Term 1</th><th>Term 2</th><th>Term 3</th><th>Average</th><th style={{ width: 160 }}>Progress</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ textAlign: 'left' }}>{r.subject}</td><td>{r.t1}</td><td>{r.t2}</td><td>{r.t3}</td><td><b>{r.avg.toFixed(1)}</b></td>
              <td><div className="bar"><i style={{ width: Math.min(100, r.avg) + '%' }} /></div></td>
            </tr>
          ))}
          <tr className="tot"><td style={{ textAlign: 'left' }}>Average</td><td>{term(0).toFixed(1)}</td><td>{term(1).toFixed(1)}</td><td>{term(2).toFixed(1)}</td><td>{overall.toFixed(1)}</td><td /></tr>
        </tbody>
      </table>
      <div className="pr-chart">
        {[0, 1, 2].map((i) => <div key={i}><div className="col" style={{ height: Math.min(100, term(i)) * 1.6 }} /><span>Term {i + 1}</span><b>{term(i).toFixed(0)}%</b></div>)}
        <div className="pr-trend">{trend >= 0 ? '📈 Improving' : '📉 Needs attention'} ({trend >= 0 ? '+' : ''}{trend.toFixed(1)} pts from Term 1 to Term 3)</div>
      </div>
      {d.remarks && <p className="rem"><b>Teacher's Remarks:</b> {d.remarks}</p>}
      <div className="sign"><SignSlot image={d.studentSignature}>Student / Parent</SignSlot><SignSlot image={d.issuerSignature}><b>{d.issuerName || d.teacher || 'Class Teacher'}</b><small>{d.issuerRole || 'Teacher / Headmaster'}</small></SignSlot></div>
    </div>
  );
}

/* ---------------- ID card ---------------- */
export function IdCard({ data: d, tpl }) {
  const h = tpl === 'horizontal';
  const cls = `idc ${h ? 'h' : 'v'} ${tpl}`;
  return (
    <div className={`doc idpair ${h ? 'col' : 'row'}`}>
      <div className={cls}>
        <div className="idc-top">{d.logo && <img src={d.logo} alt="" />}<b>{d.org}</b></div>
        <div className="idc-body">
          {d.photo ? <img className="idc-ph" src={d.photo} alt="" /> : <div className="idc-ph ph">👤</div>}
          <div className="idc-txt"><h3>{d.name}</h3><div className="idc-role">{d.role}</div><div className="idc-id">ID: {d.idNo}</div></div>
        </div>
      </div>
      <div className={`${cls} back`}>
        <div className="idc-det">
          {[['Phone', d.phone], ['Blood Group', d.bloodGroup], ['Address', d.address], ['Valid Till', d.validTill]].map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
        </div>
        <div className="idc-signatures">
          <div className="idc-sign-slot">{d.studentSignature && <img src={d.studentSignature} alt="" />}<span>Student</span></div>
          <div className="idc-sign-slot">{d.issuerSignature && <img src={d.issuerSignature} alt="" />}<span>{d.issuerName || 'Authorized'}<small>{d.issuerRole || 'Teacher / Headmaster'}</small></span></div>
        </div>
        <div className="idc-ft">If found, please return to {d.org}</div>
      </div>
    </div>
  );
}

/* ---------------- Shared helpers (invoice / voucher / datesheet) ---------------- */
export const FONTS = {
  Inter: 'Inter, system-ui, sans-serif',
  'Space Grotesk': '"Space Grotesk", Inter, sans-serif',
  Georgia: 'Georgia, "Times New Roman", serif',
  Courier: 'ui-monospace, "Courier New", monospace',
  'Times New Roman': '"Times New Roman", Georgia, serif',
};

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function words(n) {
  n = Math.floor(Math.abs(+n || 0));
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + words(n % 100) : '');
  if (n < 100000) return words(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + words(n % 1000) : '');
  if (n < 10000000) return words(Math.floor(n / 100000)) + ' lakh' + (n % 100000 ? ' ' + words(n % 100000) : '');
  return words(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 ? ' ' + words(n % 10000000) : '');
}
export function amountWords(n) {
  const whole = Math.floor(Math.abs(+n || 0));
  const paise = Math.round((Math.abs(+n || 0) - whole) * 100);
  let s = words(whole);
  if (paise) s += ' and ' + words(paise) + ' paise';
  return s.replace(/\w/, (c) => c.toUpperCase()) + ' only';
}

const initials = (s) => (s || '').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
const money = (cur) => (n) => `${cur || 'Rs.'} ${(Math.round((+n || 0) * 100) / 100).toLocaleString()}`;

/* ---------------- Invoice ---------------- */
export function Invoice({ data: d, tpl }) {
  const items = (d.items || []).filter((i) => i.desc || +i.rate);
  const subtotal = items.reduce((a, i) => a + (+i.qty || 0) * (+i.rate || 0), 0);
  const discPct = +d.discount || 0;
  const taxPct = +d.tax || 0;
  const ship = +d.shipping || 0;
  const paid = +d.amountPaid || 0;
  const disc = subtotal * discPct / 100;
  const taxable = subtotal - disc;
  const tax = taxable * taxPct / 100;
  const total = taxable + tax + ship;
  const due = total - paid;
  const m = money(d.currency);
  return (
    <div className={`doc inv ${tpl}`} style={{ fontFamily: FONTS[d.font] }}>
      <header className="inv-head">
        <div className="inv-from">
          {d.logo ? <img className="inv-logo" src={d.logo} alt="" /> : <div className="inv-logo ph">{initials(d.company) || 'IN'}</div>}
          <div>
            <h2>{d.company}</h2>
            {d.address && <div>{d.address}</div>}
            {(d.phone || d.email) && <div>{[d.phone, d.email].filter(Boolean).join(' · ')}</div>}
            {d.taxId && <div>NTN / Tax No: {d.taxId}</div>}
          </div>
        </div>
        <div className="inv-meta">
          <h1>INVOICE</h1>
          <div>No: <b>{d.invoiceNo}</b></div>
          <div>Date: {d.date}</div>
          {d.dueDate && <div>Due: {d.dueDate}</div>}
        </div>
      </header>

      <section className="inv-bill">
        <div>
          <span>Bill To</span>
          <b>{d.customer}</b>
          {d.customerAddress && <div>{d.customerAddress}</div>}
          {d.customerPhone && <div>{d.customerPhone}</div>}
        </div>
        <div className={`inv-status ${due <= 0 ? 'paid' : ''}`}>{due <= 0 ? 'PAID' : 'BALANCE DUE'}</div>
      </section>

      <table className="tbl inv-tbl">
        <thead>
          <tr>
            <th style={{ width: 34, textAlign: 'left' }}>#</th>
            <th style={{ textAlign: 'left' }}>Description</th>
            <th style={{ width: 60 }}>Qty</th>
            <th style={{ width: 110 }}>Rate</th>
            <th style={{ width: 120 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const amt = (+it.qty || 0) * (+it.rate || 0);
            return (
              <tr key={i}>
                <td style={{ textAlign: 'left' }}>{i + 1}</td>
                <td style={{ textAlign: 'left' }}>{it.desc}</td>
                <td>{it.qty}</td>
                <td>{(+it.rate || 0).toLocaleString()}</td>
                <td>{amt ? amt.toLocaleString() : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="inv-foot">
        <div className="inv-notes">
          {d.notes && <div><b>Notes</b><p>{d.notes}</p></div>}
          {d.terms && <div><b>Terms &amp; Conditions</b><p>{d.terms}</p></div>}
          <div className="inv-words"><b>Amount in words</b><p>{amountWords(total)}</p></div>
        </div>
        <div className="inv-totals">
          <div><span>Subtotal</span><b>{m(subtotal)}</b></div>
          {discPct > 0 && <div><span>Discount ({discPct}%)</span><b>- {m(disc)}</b></div>}
          {taxPct > 0 && <div><span>Tax ({taxPct}%)</span><b>{m(tax)}</b></div>}
          {ship > 0 && <div><span>Shipping / Other</span><b>{m(ship)}</b></div>}
          <div className="grand"><span>Total</span><b>{m(total)}</b></div>
          {paid > 0 && <div><span>Amount Paid</span><b>{m(paid)}</b></div>}
          {paid > 0 && <div className="grand"><span>Balance Due</span><b>{m(due)}</b></div>}
        </div>
      </div>

      <div className="inv-sign">
        <SignSlot image={d.signature}><span>Authorized Signature</span></SignSlot>
      </div>
    </div>
  );
}

/* ---------------- Fee voucher ---------------- */
export function FeeVoucher({ data: d, tpl }) {
  const items = (d.items || []).filter((i) => i.desc || +i.amount);
  const fees = items.reduce((a, i) => a + (+i.amount || 0), 0);
  const arrears = +d.arrears || 0;
  const late = +d.lateFee || 0;
  const disc = +d.discount || 0;
  const payable = fees + arrears + late - disc;
  const cur = d.currency || 'Rs.';
  const m = money(cur);
  return (
    <div className={`doc fv ${tpl}`} style={{ fontFamily: FONTS[d.font] }}>
      <Head d={d} sub="FEE VOUCHER" />
      <div className="fv-meta">
        <div><span>Voucher No:</span><b>{d.voucherNo}</b></div>
        <div><span>Issue Date:</span><b>{d.issueDate}</b></div>
        <div><span>Student Name:</span><b>{d.name}</b></div>
        <div><span>Father Name:</span><b>{d.fatherName}</b></div>
        <div><span>Class:</span><b>{d.className}</b></div>
        <div><span>Roll No:</span><b>{d.roll}</b></div>
        <div><span>Session:</span><b>{d.session}</b></div>
        <div><span>Fee Month:</span><b>{d.month}</b></div>
        <div className="fv-due"><span>Due Date:</span><b>{d.dueDate}</b></div>
      </div>
      <table className="tbl">
        <thead>
          <tr><th style={{ width: 34, textAlign: 'left' }}>#</th><th style={{ textAlign: 'left' }}>Particulars</th><th style={{ width: 150 }}>Amount ({cur})</th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}><td style={{ textAlign: 'left' }}>{i + 1}</td><td style={{ textAlign: 'left' }}>{it.desc}</td><td>{(+it.amount || 0).toLocaleString()}</td></tr>
          ))}
          {arrears > 0 && <tr><td /><td style={{ textAlign: 'left' }}>Previous Arrears</td><td>{arrears.toLocaleString()}</td></tr>}
          {late > 0 && <tr><td /><td style={{ textAlign: 'left' }}>Late Fee</td><td>{late.toLocaleString()}</td></tr>}
          {disc > 0 && <tr><td /><td style={{ textAlign: 'left' }}>Discount / Scholarship</td><td>- {disc.toLocaleString()}</td></tr>}
          <tr className="tot"><td colSpan={2}>Total Payable</td><td>{m(payable)}</td></tr>
        </tbody>
      </table>
      <div className="fv-words">Amount in words: <b>{amountWords(payable)}</b></div>
      <div className="fv-bank">
        <h4>Bank Details</h4>
        <div>Bank: <b>{d.bankName}</b></div>
        <div>Account Title: <b>{d.accountTitle}</b></div>
        <div>Account No / IBAN: <b>{d.accountNo}</b></div>
        {d.dueDate && <div>Pay before: <b>{d.dueDate}</b></div>}
      </div>
      {d.instructions && (
        <div className="fv-ins"><b>Instructions</b><ul>{lines(d.instructions).map((l, i) => <li key={i}>{l}</li>)}</ul></div>
      )}
      <div className="sign">
        <SignSlot image={d.studentSignature}>Student / Guardian</SignSlot>
        <SignSlot image={d.signature}><b>{d.issuedBy || 'Accounts Office'}</b><small>Authorized Signature</small></SignSlot>
      </div>
    </div>
  );
}

/* ---------------- Date sheet / exam schedule ---------------- */
export function DateSheet({ data: d, tpl }) {
  const rows = (d.papers || []).filter((p) => p.subject);
  const info = [['Class', d.className], ['Session', d.session], ['Exam Center', d.center], ['Total Papers', rows.length || '']].filter(([, v]) => v);
  return (
    <div className={`doc ds ${tpl}`} style={{ fontFamily: FONTS[d.font] }}>
      <Head d={d} sub={d.title || 'DATE SHEET'} />
      <div className="ds-info">
        {info.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
      </div>
      <table className="tbl ds-tbl">
        <thead>
          <tr>
            <th style={{ width: 34 }}>#</th>
            <th style={{ textAlign: 'left' }}>Subject</th>
            <th style={{ width: 100 }}>Date</th>
            <th style={{ width: 70 }}>Day</th>
            <th style={{ width: 100 }}>Time</th>
            <th style={{ width: 80 }}>Duration</th>
            <th style={{ width: 110 }}>Venue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td style={{ textAlign: 'left' }}>{p.subject}</td>
              <td>{p.date}</td>
              <td>{p.day}</td>
              <td>{p.time}</td>
              <td>{p.duration}</td>
              <td>{p.venue}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {d.instructions && (
        <div className="ds-ins"><b>Important Instructions</b><ul>{lines(d.instructions).map((l, i) => <li key={i}>{l}</li>)}</ul></div>
      )}
      <div className="sign">
        <SignSlot image={d.signature}><b>{d.issuedBy || 'Controller of Examinations'}</b><small>Authorized Signature</small></SignSlot>
      </div>
    </div>
  );
}
