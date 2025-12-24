import { runDeterminismScript } from './determinismScript';

const r = runDeterminismScript();
console.log(r.snapshot);
console.log('hash:', r.hash);
