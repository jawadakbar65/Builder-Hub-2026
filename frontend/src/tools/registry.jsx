import * as V from './previews';
import { PortfolioPreview, portfolioHtml } from './portfolio';
import { coverLetter } from './cover';
import { invoiceTerms, voucherInstructions, datesheetInstructions } from './assist';
import ATS from '../components/ATS';

const f = (key, label, type = 'text', x = {}) => ({ key, label, type, ...x });
const tp = (...a) => a.map((s) => { const [id, name, pro] = s.split('|'); return { id, name, pro: !!pro }; });
const A4P = () => [794, 1123];
const A4L = () => [1123, 794];
const FONT_OPTS = ['Inter', 'Space Grotesk', 'Georgia', 'Courier', 'Times New Roman'];
const SCHOOL = 'Green Valley Public School';
const ADDR = 'Block 5, Gulshan-e-Iqbal, Karachi';
const schoolFields = [f('school', 'School Name'), f('address', 'Address'), f('logo', 'Logo', 'image', { max: 300 })];

export const TOOLS = {
  /* ---------------- CAREER ---------------- */
  resume: {
    id: 'resume', icon: '📄', group: 'Career', name: 'Resume / CV Builder',
    desc: '4 templates + ATS score checker', size: A4P, Preview: V.Resume, Extra: ATS,
    templates: tp('classic|Classic', 'modern|Modern', 'elegant|Elegant|1', 'bold|Bold|1'),
    fields: [
      f('name', 'Full Name'), f('title', 'Job Title'), f('photo', 'Photo', 'image'),
      f('email', 'Email', 'email'), f('phone', 'Phone', 'tel'), f('location', 'Location'), f('link', 'LinkedIn / Portfolio link'),
      f('summary', 'Summary', 'textarea'), f('skills', 'Skills', 'textarea', { ph: 'Comma separated' }),
      f('experience', 'Experience', 'list', { item: [f('role', 'Role'), f('company', 'Company'), f('period', 'Period'), f('details', 'Achievements (one per line)', 'textarea', { rows: 4 })] }),
      f('education', 'Education', 'list', { item: [f('degree', 'Degree'), f('school', 'School / University'), f('period', 'Period')] }),
      f('languages', 'Languages'),
    ],
    demo: {
      accent: '#2563eb', name: 'Ayesha Khan', title: 'Frontend Developer', photo: '', email: 'ayesha.khan@example.com', phone: '+92 300 1234567',
      location: 'Karachi, Pakistan', link: 'linkedin.com/in/ayeshakhan',
      summary: 'Frontend developer with 3+ years of experience building fast, accessible React applications. Improved page load time by 40% and led a team of 3 developers.',
      skills: 'React, JavaScript, TypeScript, HTML, CSS, Node.js, REST APIs, Git, Figma, Testing',
      experience: [
        { role: 'Frontend Developer', company: 'TechSoft Pvt Ltd', period: '2023 – Present', details: 'Built a reusable React component library used across 5 products\nReduced bundle size by 35% using code splitting\nMentored 2 junior developers' },
        { role: 'Web Developer Intern', company: 'Webify', period: '2022 – 2023', details: 'Developed 10+ responsive landing pages\nIncreased conversion rate by 18% through A/B testing' },
      ],
      education: [{ degree: 'BS Computer Science', school: 'University of Balochistan', period: '2025 – 2027' }],
      languages: 'English, Urdu',
    },
  },

  cover: {
    id: 'cover', icon: '✉️', group: 'Career', name: 'Cover Letter Generator',
    desc: 'Fill a few details, generate the letter text', size: A4P, Preview: V.Cover,
    templates: tp('classic|Classic', 'modern|Modern', 'minimal|Minimal|1'),
    actions: [{ label: 'Generate letter text', run: coverLetter }],
    fields: [
      f('name', 'Full Name'), f('email', 'Email', 'email'), f('phone', 'Phone', 'tel'), f('location', 'Location'), f('date', 'Date', 'date'),
      f('recipient', 'Recipient (e.g. Ms. Sara)'), f('company', 'Company'), f('position', 'Position'),
      f('tone', 'Tone', 'select', { options: ['Professional', 'Enthusiastic', 'Concise'] }),
      f('skills', 'Key skills', 'text', { ph: 'React, teamwork, problem solving' }),
      f('achievement', 'Top achievement', 'textarea', { ph: 'I reduced page load time by 40%' }),
      f('why', 'Why this company?', 'textarea', { ph: 'of your focus on accessible products' }),
      f('body', 'Letter text (editable)', 'textarea', { rows: 12 }),
    ],
    demo: (() => {
      const d = { accent: '#2563eb', name: 'Jawad Ali', email: 'jawadali@gmail.com', phone: '+92 300 1234567', location: 'Awaran, Balochistan', date: '2026-10-14', recipient: 'Mr. Jawad Ali', company: 'Baloch Dev', position: 'Frontend Developer', tone: 'Professional', skills: 'React, TypeScript, accessibility and performance tuning', achievement: 'I reduced page load time by 40% for a product used by 50,000 people', why: 'of your focus on well-crafted, accessible products' };
      return { ...d, ...coverLetter(d) };
    })(),
  },

  portfolio: {
    id: 'portfolio', icon: '🌐', group: 'Career', name: 'Portfolio Builder',
    desc: 'Export a ready HTML site or share a live link', size: () => [1000, 700], Preview: PortfolioPreview, ownBrand: true,
    noImageExport: true, exportHtml: portfolioHtml,
    templates: tp('dark|Dark', 'light|Light', 'gradient|Gradient|1'),
    fields: [
      f('name', 'Full Name'), f('title', 'Title'), f('photo', 'Photo', 'image'), f('about', 'About', 'textarea', { rows: 4 }),
      f('skills', 'Skills', 'textarea', { ph: 'Comma separated' }), f('email', 'Email', 'email'), f('github', 'GitHub URL'), f('linkedin', 'LinkedIn URL'),
      f('projects', 'Projects', 'list', { item: [f('title', 'Title'), f('desc', 'Description', 'textarea'), f('link', 'Link')] }),
    ],
    demo: {
      accent: '#7c3aed', name: 'Ayesha Khan', title: 'Frontend Developer & UI Designer', photo: '', email: 'jawadali@gmail.com',
      github: 'github.com/ayeshakhan', linkedin: 'linkedin.com/in/jawadali',
      about: 'I build fast, accessible web apps with React and care a lot about details. Currently crafting design systems and dashboards for fintech products.',
      skills: 'React, TypeScript, Node.js, Figma, Tailwind, Testing',
      projects: [
        { title: 'ShopEase', desc: 'E-commerce storefront with cart, checkout and Balochi/English/Urdu support.', link: 'github.com/jawadali/balochdev' },
        { title: 'TaskFlow', desc: 'Kanban board with drag & drop and offline mode.', link: 'github.com/jawadali/taskflow' },
        { title: 'SchoolDesk', desc: 'Attendance and results portal used by 3 schools.', link: '' },
      ],
    },
  },

  /* ---------------- CARDS & DESIGN ---------------- */
  bizcard: {
    id: 'bizcard', icon: '📇', group: 'Cards & Design', name: 'Digital Business Card',
    desc: 'Card with a QR code that saves your contact', size: () => [540, 340], Preview: V.BizCard, bulk: true,
    templates: tp('modern|Modern', 'dark|Dark', 'minimal|Minimal', 'gradient|Gradient|1'),
    fields: [
      f('name', 'Full Name'), f('title', 'Job Title'), f('company', 'Company'), f('tagline', 'Tagline'), f('photo', 'Photo', 'image', { max: 200 }),
      f('phone', 'Phone', 'tel'), f('email', 'Email', 'email'), f('website', 'Website'), f('address', 'Address'),
    ],
    demo: { accent: '#0ea5e9', name: 'Jawad Ali', title: 'Frontend Developer', company: 'TechSoft Pvt Ltd', tagline: 'Fast, accessible web apps', photo: '', phone: '+92 300 1234567', email: 'jawad@techsoft.pk', website: 'techsoft.pk', address: 'Awaran, Balochistan' },
  },

  idcard: {
    id: 'idcard', icon: '🪪', group: 'Cards & Design', name: 'ID Card Generator',
    desc: 'Front + back, student / staff / member cards', size: (d, t) => (t === 'horizontal' ? [580, 740] : [740, 580]), Preview: V.IdCard, bulk: true,
    templates: tp('vertical|Vertical', 'horizontal|Horizontal', 'dark|Dark|1'),
    fields: [
      f('org', 'School / Organization'), f('logo', 'Logo', 'image', { max: 200 }), f('photo', 'Photo', 'image', { max: 400 }),
      f('name', 'Name'), f('role', 'Class / Designation'), f('idNo', 'ID Number'), f('phone', 'Phone', 'tel'),
      f('bloodGroup', 'Blood Group'), f('address', 'Address'), f('validTill', 'Valid Till'),
      f('studentSignature', 'Student Signature', 'image', { max: 300 }), f('issuerSignature', 'Issuer Signature', 'image', { max: 300 }),
      f('issuerName', 'Issuer Name'), f('issuerRole', 'Issuer Role (e.g. Teacher / Headmaster)'),
    ],
    demo: { accent: '#16a34a', org: SCHOOL, logo: '', photo: '', name: 'Jawad Ali', role: 'Class 8 — Section A', idNo: 'GV-2026-0145', phone: '0321 1234567', bloodGroup: 'B+', address: ADDR, validTill: 'March 2027', studentSignature: '', issuerSignature: '', issuerName: '', issuerRole: '' },
  },

  /* ---------------- SCHOOL ---------------- */
  certificate: {
    id: 'certificate', icon: '🏆', group: 'School', name: 'Certificate Generator',
    desc: 'Achievement, completion & appreciation certificates', size: A4L, Preview: V.Certificate, bulk: true,
    templates: tp('classic|Classic', 'modern|Modern', 'simple|Simple', 'royal|Royal|1'),
    fields: [
      f('org', 'School / Organization'), f('logo', 'Logo', 'image', { max: 300 }), f('title', 'Title'), f('subtitle', 'Subtitle'), f('name', 'Recipient Name'),
      f('body', 'Text', 'textarea', { rows: 4 }), f('date', 'Date'), f('studentSignature', 'Student / Recipient Signature', 'image', { max: 300 }),
      f('signImage', 'Teacher / Headmaster Signature', 'image', { max: 300 }), f('signName', 'Signer name'), f('signRole', 'Signer role'),
    ],
    demo: { accent: '#b45309', org: SCHOOL, logo: '', title: 'Certificate of Achievement', subtitle: 'This certificate is proudly presented to', name: 'Jawad Ali', body: 'for outstanding performance and first position in the Annual Science Exhibition 2026. We wish you continued success.', date: '14 October 2026', studentSignature: '', signImage: '', signName: 'Mr. Jawad Ali', signRole: 'Principal' },
  },

  marksheet: {
    id: 'marksheet', icon: '📝', group: 'School', name: 'Marksheet / Report Card',
    desc: 'Auto totals, percentage, grade & pass/fail', size: A4P, Preview: V.Marksheet, bulk: true,
    templates: tp('classic|Classic', 'modern|Modern', 'formal|Formal|1'),
    fields: [
      ...schoolFields, f('exam', 'Exam'), f('name', 'Name'), f('fatherName', 'Father Name'), f('roll', 'Roll No'), f('className', 'Class'), f('session', 'Session'),
      f('subjects', 'Subject', 'list', { item: [f('subject', 'Subject'), f('total', 'Total', 'number'), f('obtained', 'Obtained', 'number')] }),
      f('remarks', 'Remarks', 'textarea'), f('studentSignature', 'Student Signature', 'image', { max: 300 }),
      f('issuerSignature', 'Teacher / Headmaster Signature', 'image', { max: 300 }), f('issuerName', 'Issuer Name'), f('issuerRole', 'Issuer Role'),
    ],
    demo: {
      accent: '#1d4ed8', school: SCHOOL, address: ADDR, logo: '', exam: 'Annual Examination 2026', name: 'Jawad Ali', fatherName: 'Muhammad Akbar', roll: '101', className: '8-A', session: '2026–27',
      subjects: [
        { subject: 'English', total: '100', obtained: '82' }, { subject: 'Urdu', total: '100', obtained: '76' }, { subject: 'Mathematics', total: '100', obtained: '91' },
        { subject: 'Science', total: '100', obtained: '88' }, { subject: 'Islamiat', total: '100', obtained: '90' }, { subject: 'Computer', total: '50', obtained: '44' },
      ],
      remarks: 'Excellent performance. Keep it up!', studentSignature: '', issuerSignature: '', issuerName: '', issuerRole: '',
    },
  },

  attendance: {
    id: 'attendance', icon: '📅', group: 'School', name: 'Attendance Sheet',
    desc: 'Monthly register with Sundays marked', size: A4L, Preview: V.Attendance,
    templates: tp('classic|Classic'),
    fields: [f('school', 'School Name'), f('className', 'Class'), f('teacher', 'Teacher'), f('month', 'Month', 'month'), f('students', 'Students (one per line)', 'textarea', { rows: 12 })],
    demo: { accent: '#0f766e', school: SCHOOL, className: '8-A', teacher: 'Mr. Jawad Ali', month: '2026-10', students: 'Nabeel Khan\nYousuf Arif\nAdnan khan\nMuhammad Arif\nmuhammad Nasir\nMuhammad Qadeer\nHamid Ali\nShams Ud Din\nZarshan Shah\nHammad Qadeer\nJalal Khan\nSlal Khan' },
  },

  receipt: {
    id: 'receipt', icon: '🧾', group: 'School', name: 'Fee Receipt',
    desc: 'Fee items, total, paid-by and signatures', size: () => [794, 640], Preview: V.Receipt, bulk: true,
    templates: tp('classic|Classic', 'modern|Modern'),
    fields: [
      ...schoolFields, f('receiptNo', 'Receipt No'), f('date', 'Date', 'date'), f('name', 'Name'), f('roll', 'Roll No'), f('className', 'Class'), f('month', 'Month'), f('currency', 'Currency'),
      f('items', 'Fee items', 'list', { item: [f('desc', 'Description'), f('amount', 'Amount', 'number')] }),
      f('paidBy', 'Paid by', 'select', { options: ['Cash', 'Bank Transfer', 'Online / Easypaisa / JazzCash', 'Cheque'] }), f('receivedBy', 'Received by'),
      f('studentSignature', 'Student / Guardian Signature', 'image', { max: 300 }), f('issuerSignature', 'Cashier / Issuer Signature', 'image', { max: 300 }),
    ],
    demo: {
      accent: '#7c3aed', school: SCHOOL, address: ADDR, logo: '', receiptNo: 'FR-2026-0457', date: '2026-10-14', name: 'Nabeel Khan', roll: '101', className: '8-A', month: 'October 2026', currency: 'Rs.',
      items: [{ desc: 'Tuition Fee', amount: '4500' }, { desc: 'Computer Lab Fee', amount: '500' }, { desc: 'Exam Fee', amount: '300' }], paidBy: 'Cash', receivedBy: 'Accounts Office', studentSignature: '', issuerSignature: '',
    },
  },

  timetable: {
    id: 'timetable', icon: '🗓️', group: 'School', name: 'Class Timetable',
    desc: 'Weekly timetable, break rows highlighted', size: A4L, Preview: V.Timetable,
    templates: tp('classic|Classic'),
    fields: [
      f('school', 'School Name'), f('className', 'Class'), f('term', 'Term / Session'),
      f('periods', 'Periods', 'list', { item: [f('time', 'Time'), f('mon', 'Mon'), f('tue', 'Tue'), f('wed', 'Wed'), f('thu', 'Thu'), f('fri', 'Fri'), f('sat', 'Sat')] }),
    ],
    demo: {
      accent: '#ea580c', school: SCHOOL, className: '8-A', term: '2026–27',
      periods: [
        { time: '08:00–08:40', mon: 'English', tue: 'Maths', wed: 'Urdu', thu: 'Science', fri: 'Islamiat', sat: 'Maths' },
        { time: '08:40–09:20', mon: 'Maths', tue: 'English', wed: 'Science', thu: 'Urdu', fri: 'Computer', sat: 'English' },
        { time: '09:20–10:00', mon: 'Urdu', tue: 'Science', wed: 'Maths', thu: 'English', fri: 'Maths', sat: 'Science' },
        { time: '10:00–10:30', mon: 'BREAK', tue: 'BREAK', wed: 'BREAK', thu: 'BREAK', fri: 'BREAK', sat: 'BREAK' },
        { time: '10:30–11:10', mon: 'Science', tue: 'Islamiat', wed: 'English', thu: 'Maths', fri: 'Urdu', sat: 'Games' },
        { time: '11:10–11:50', mon: 'Computer', tue: 'Urdu', wed: 'Islamiat', thu: 'Computer', fri: 'English', sat: 'Art' },
      ],
    },
  },

  admit: {
    id: 'admit', icon: '🎫', group: 'School', name: 'Admit Card',
    desc: 'Roll number slip with photo & datesheet', size: () => [794, 780], Preview: V.Admit, bulk: true,
    templates: tp('classic|Classic', 'modern|Modern'),
    fields: [
      ...schoolFields, f('exam', 'Exam'), f('name', 'Name'), f('fatherName', 'Father Name'), f('roll', 'Roll No'), f('className', 'Class'), f('center', 'Exam Center'), f('photo', 'Photo', 'image', { max: 300 }),
      f('subjects', 'Datesheet', 'list', { item: [f('subject', 'Subject'), f('date', 'Date'), f('time', 'Time')] }),
      f('instructions', 'Instructions (one per line)', 'textarea', { rows: 4 }), f('studentSignature', 'Student Signature', 'image', { max: 300 }),
      f('issuerSignature', 'Teacher / Headmaster Signature', 'image', { max: 300 }), f('issuerName', 'Issuer Name'), f('issuerRole', 'Issuer Role (e.g. Teacher / Headmaster)'),
    ],
    demo: {
      accent: '#be123c', school: SCHOOL, address: ADDR, logo: '', exam: 'Annual Examination 2027', name: 'Shams Ud Din', fatherName: 'Basher Ahmed', roll: '102', className: '8-A', center: 'Main Campus Hall B', photo: '',
      subjects: [{ subject: 'English', date: '10 Mar 2027', time: '09:00 AM' }, { subject: 'Mathematics', date: '12 Mar 2027', time: '09:00 AM' }, { subject: 'Science', date: '15 Mar 2027', time: '09:00 AM' }, { subject: 'Urdu', date: '17 Mar 2027', time: '09:00 AM' }],
      instructions: 'Bring this card to every paper\nReach the center 15 minutes early\nMobile phones are not allowed', studentSignature: '', issuerSignature: '', issuerName: '', issuerRole: '',
    },
  },

  progress: {
    id: 'progress', icon: '📈', group: 'School', name: 'Progress Report',
    desc: 'Term-wise marks, averages, chart & trend', size: A4P, Preview: V.Progress, bulk: true,
    templates: tp('classic|Classic', 'modern|Modern'),
    fields: [
      ...schoolFields, f('name', 'Name'), f('roll', 'Roll No'), f('className', 'Class'), f('session', 'Session'), f('attendance', 'Attendance'),
      f('subjects', 'Subjects (marks out of 100)', 'list', { item: [f('subject', 'Subject'), f('t1', 'Term 1', 'number'), f('t2', 'Term 2', 'number'), f('t3', 'Term 3', 'number')] }),
      f('remarks', 'Remarks', 'textarea'), f('teacher', 'Teacher'), f('studentSignature', 'Student Signature', 'image', { max: 300 }),
      f('issuerSignature', 'Teacher / Headmaster Signature', 'image', { max: 300 }), f('issuerName', 'Issuer Name'), f('issuerRole', 'Issuer Role'),
    ],
    demo: {
      accent: '#0891b2', school: SCHOOL, address: ADDR, logo: '', name: 'Muhammad Nasir', roll: '103', className: '8-A', session: '2025–26', attendance: '94%',
      subjects: [{ subject: 'English', t1: '70', t2: '76', t3: '82' }, { subject: 'Urdu', t1: '68', t2: '72', t3: '76' }, { subject: 'Mathematics', t1: '80', t2: '86', t3: '91' }, { subject: 'Science', t1: '75', t2: '82', t3: '88' }, { subject: 'Islamiat', t1: '85', t2: '88', t3: '90' }],
      remarks: 'Steady improvement in every term. Needs a little more focus on Urdu writing.', teacher: 'Mr. Imran Sheikh', studentSignature: '', issuerSignature: '', issuerName: '', issuerRole: '',
    },
  },

  /* ---------------- BUSINESS ---------------- */
  invoice: {
    id: 'invoice', icon: '🧾', group: 'Business', name: 'Invoice Generator',
    desc: 'Auto totals, tax, discount & balance due', size: A4P, Preview: V.Invoice, bulk: true,
    remember: ['company', 'address', 'logo', 'phone', 'email', 'taxId'],
    templates: tp('modern|Modern', 'classic|Classic', 'minimal|Minimal', 'bold|Bold|1'),
    actions: [{ label: 'AI assist: terms & notes', run: invoiceTerms }],
    fields: [
      f('company', 'Business / Your name', 'text', { req: true }), f('logo', 'Logo', 'image', { max: 300 }), f('address', 'Address'),
      f('phone', 'Phone', 'tel'), f('email', 'Email', 'email'), f('taxId', 'Tax / NTN No'),
      f('customer', 'Bill To (Customer)', 'text', { req: true }), f('customerAddress', 'Customer Address'), f('customerPhone', 'Customer Phone', 'tel'),
      f('invoiceNo', 'Invoice No', 'text', { req: true }), f('date', 'Invoice Date', 'date', { req: true }), f('dueDate', 'Due Date', 'date'), f('currency', 'Currency'),
      f('items', 'Items', 'list', { item: [f('desc', 'Description'), f('qty', 'Qty', 'number'), f('rate', 'Rate', 'number')] }),
      f('discount', 'Discount %', 'number'), f('tax', 'Tax %', 'number'), f('shipping', 'Shipping / Other', 'number'), f('amountPaid', 'Amount Paid', 'number'),
      f('notes', 'Notes', 'textarea'), f('terms', 'Terms & Conditions', 'textarea', { rows: 3 }),
      f('font', 'Font', 'select', { options: FONT_OPTS }), f('signature', 'Signature / Stamp', 'image', { max: 300 }),
    ],
    demo: {
      accent: '#0f766e', company: 'TechSoft Pvt Ltd', logo: '', address: 'Suite 12, Shahrah-e-Faisal, Karachi',
      phone: '+92 300 1234567', email: 'billing@techsoft.pk', taxId: 'NTN 1234567-8', customer: 'Ayesha Traders',
      customerAddress: 'Shop 22, Saddar, Karachi', customerPhone: '+92 321 7654321', invoiceNo: 'INV-2026-0042',
      date: '2026-10-14', dueDate: '2026-10-29', currency: 'Rs.',
      items: [
        { desc: 'Website design & development', qty: '1', rate: '45000' },
        { desc: 'Domain & hosting (1 year)', qty: '1', rate: '8000' },
        { desc: 'Content writing', qty: '5', rate: '1500' },
      ],
      discount: '5', tax: '17', shipping: '0', amountPaid: '20000',
      notes: 'Thank you for your business!', terms: 'Payment is due within 15 days of the invoice date.\nBank: Meezan Bank, Acct 0123456789.',
      font: 'Inter', signature: '',
    },
  },

  /* ---------------- SCHOOL (fee voucher + date sheet) ---------------- */
  feevoucher: {
    id: 'feevoucher', icon: '🏦', group: 'School', name: 'Fee Voucher',
    desc: 'Bank challan with fees, arrears & due date', size: A4P, Preview: V.FeeVoucher, bulk: true,
    templates: tp('classic|Classic', 'modern|Modern', 'bank|Bank Challan', 'compact|Compact|1'),
    actions: [{ label: 'AI assist: instructions', run: voucherInstructions }],
    fields: [
      ...schoolFields, f('voucherNo', 'Voucher No'), f('issueDate', 'Issue Date', 'date'), f('dueDate', 'Due Date', 'date'),
      f('name', 'Student Name'), f('fatherName', 'Father Name'), f('roll', 'Roll No'), f('className', 'Class'), f('session', 'Session'), f('month', 'Fee Month'), f('currency', 'Currency'),
      f('items', 'Fee items', 'list', { item: [f('desc', 'Description'), f('amount', 'Amount', 'number')] }),
      f('arrears', 'Previous Arrears', 'number'), f('lateFee', 'Late Fee', 'number'), f('discount', 'Discount / Scholarship', 'number'),
      f('bankName', 'Bank Name'), f('accountTitle', 'Account Title'), f('accountNo', 'Account No / IBAN'),
      f('instructions', 'Instructions (one per line)', 'textarea', { rows: 4 }),
      f('font', 'Font', 'select', { options: FONT_OPTS }),
      f('studentSignature', 'Student / Guardian Signature', 'image', { max: 300 }), f('signature', 'Authorized Signature', 'image', { max: 300 }), f('issuedBy', 'Issued By'),
    ],
    demo: {
      accent: '#1d4ed8', school: SCHOOL, address: ADDR, logo: '', voucherNo: 'FV-2026-1024', issueDate: '2026-10-01', dueDate: '2026-10-15',
      name: 'Nabeel Khan', fatherName: 'Muhammad Akbar', roll: '101', className: '8-A', session: '2026–27', month: 'November 2026', currency: 'Rs.',
      items: [{ desc: 'Tuition Fee', amount: '4500' }, { desc: 'Computer Lab Fee', amount: '500' }, { desc: 'Transport Fee', amount: '1500' }],
      arrears: '0', lateFee: '0', discount: '0',
      bankName: 'Meezan Bank Ltd', accountTitle: 'Green Valley Public School', accountNo: 'PK36MEZN0001234567890123',
      instructions: 'Pay before the due date to avoid a late fee.\nKeep this voucher safe — bring it when paying at the bank.\nFees once paid are non-refundable.',
      font: 'Inter', studentSignature: '', signature: '', issuedBy: 'Accounts Office',
    },
    remember: ['school', 'address', 'logo', 'bankName', 'accountTitle', 'accountNo'],
  },

  datesheet: {
    id: 'datesheet', icon: '📆', group: 'School', name: 'Date Sheet / Exam Schedule',
    desc: 'Subject-wise exam timetable with dates & venues', size: A4P, Preview: V.DateSheet,
    templates: tp('classic|Classic', 'modern|Modern', 'striped|Striped', 'minimal|Minimal|1'),
    actions: [{ label: 'AI assist: instructions', run: datesheetInstructions }],
    fields: [
      ...schoolFields, f('title', 'Title / Exam'), f('className', 'Class'), f('session', 'Session'), f('center', 'Exam Center'),
      f('papers', 'Papers', 'list', { item: [f('subject', 'Subject'), f('date', 'Date'), f('day', 'Day'), f('time', 'Time'), f('duration', 'Duration'), f('venue', 'Venue')] }),
      f('instructions', 'Instructions (one per line)', 'textarea', { rows: 4 }),
      f('font', 'Font', 'select', { options: FONT_OPTS }),
      f('signature', 'Authorized Signature', 'image', { max: 300 }), f('issuedBy', 'Issued By'),
    ],
    demo: {
      accent: '#7c3aed', school: SCHOOL, address: ADDR, logo: '', title: 'Annual Examination 2027', className: '8-A', session: '2026–27', center: 'Main Campus Hall B',
      papers: [
        { subject: 'English', date: '10 Mar 2027', day: 'Wednesday', time: '09:00 AM', duration: '2 hrs', venue: 'Hall B' },
        { subject: 'Mathematics', date: '12 Mar 2027', day: 'Friday', time: '09:00 AM', duration: '3 hrs', venue: 'Hall B' },
        { subject: 'Science', date: '15 Mar 2027', day: 'Monday', time: '09:00 AM', duration: '2 hrs', venue: 'Lab 1' },
        { subject: 'Urdu', date: '17 Mar 2027', day: 'Wednesday', time: '09:00 AM', duration: '2 hrs', venue: 'Hall A' },
        { subject: 'Islamiat', date: '19 Mar 2027', day: 'Friday', time: '09:00 AM', duration: '2 hrs', venue: 'Hall A' },
      ],
      instructions: 'Bring this date sheet and your admit card to every paper.\nReach the exam center at least 30 minutes before the start time.\nMobile phones and smart devices are not allowed in the exam hall.',
      font: 'Inter', signature: '', issuedBy: 'Controller of Examinations',
    },
    remember: ['school', 'address', 'logo'],
  },
};

// blank = empty version of the form (lists keep one empty row)
Object.values(TOOLS).forEach((t) => {
  t.blank = Object.fromEntries(t.fields.map((x) => [x.key,
    x.type === 'list' ? [Object.fromEntries(x.item.map((s) => [s.key, '']))] : x.type === 'select' ? x.options[0] : '']));
  t.blank.accent = t.demo.accent || '#2563eb';
});

/* Pages that have their own custom UI */
export const PAGES = [
  { route: '/photo', icon: '🖼️', group: 'Photos & AI', name: 'Photo Studio', desc: 'Background remover & color, passport photo, social sizes, watermark, ID layout' },
  { route: '/imagegen', icon: '🎨', group: 'Photos & AI', name: 'AI Image Generator', desc: 'Generative designs + AI image from a text prompt' },
  { route: '/linkedin', icon: '💼', group: 'Career', name: 'LinkedIn Optimizer', desc: 'Score your headline & About, get suggestions' },
  { route: '/students', icon: '📋', group: 'School', name: 'Student Data Table', desc: 'Name, Age, Roll No, Result — saved, searchable, CSV' },
  { route: '/bulk', icon: '📦', group: 'School', name: 'Bulk Generate', desc: 'One PDF for a whole class (ID cards, admit cards, certificates…)', pro: true },
];

export const CATALOG = [
  ...Object.values(TOOLS).map((t) => ({ route: '/tool/' + t.id, icon: t.icon, group: t.group, name: t.name, desc: t.desc })),
  ...PAGES,
];
export const GROUPS = ['Career', 'School', 'Business', 'Cards & Design', 'Photos & AI'];
