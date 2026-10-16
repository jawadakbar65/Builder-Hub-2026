import React, { forwardRef } from 'react';

// The sized "sheet" every tool renders into. Handles RTL, accent color and watermarks.
const Paper = forwardRef(function Paper({ tool, data, tpl, brand = true }, ref) {
  const [W, H] = tool.size(data, tpl);
  const P = tool.Preview;
  return (
    <div ref={ref} className="paper" dir={data.__rtl ? 'rtl' : 'ltr'} style={{ width: W, height: H, '--ac': data.accent || '#2563eb' }}>
      <P data={data} tpl={tpl} brand={brand} />
      {data.__wmText && <div className="wm-diag">{data.__wmText}</div>}
      {brand && !tool.ownBrand && <div className="wm-brand">Made with BuilderHub</div>}
    </div>
  );
});

export default Paper;
