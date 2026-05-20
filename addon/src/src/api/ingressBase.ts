const m = location.pathname.match(/^(\/api\/hassio_ingress\/[^/]+)/);
export const ingressBase = m ? m[1] : '';
