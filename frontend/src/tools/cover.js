// Template-based cover letter text (runs in the browser, no AI/back-end needed).
export function coverLetter(d) {
  const tone = d.tone || 'Professional';
  const co = d.company || 'your company';
  const pos = d.position || 'the open position';
  const open = {
    Professional: `I am writing to express my interest in the ${pos} position at ${co}.`,
    Enthusiastic: `I was thrilled to see the ${pos} opening at ${co}, and I would love to bring my energy and skills to your team.`,
    Concise: `Please accept my application for the ${pos} role at ${co}.`,
  }[tone];
  const skills = d.skills ? `My core strengths include ${d.skills}.` : '';
  const ach = d.achievement ? `In my recent work, ${d.achievement}.` : '';
  const why = d.why ? `I am particularly drawn to ${co} because ${d.why}.` : '';
  const close = {
    Professional: 'I would welcome the opportunity to discuss how my background can contribute to your team. Thank you for your time and consideration.',
    Enthusiastic: `I would love the chance to talk about how I can help ${co} grow — thank you for considering my application!`,
    Concise: 'I would appreciate the chance to discuss my application. Thank you.',
  }[tone];
  const paras = [
    `Dear ${d.recipient || 'Hiring Manager'},`,
    [open, skills].filter(Boolean).join(' '),
    [ach, why].filter(Boolean).join(' '),
    close,
    `Sincerely,\n${d.name || ''}`,
  ].filter(Boolean);
  return { body: paras.join('\n\n') };
}
