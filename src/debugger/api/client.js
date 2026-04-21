const BASE = 'https://data-debugging-tool-production.up.railway.app/api';

const CLEANER = process.env.REACT_APP_CLEANER_URL || 'https://cleaning-agent-v2-production.up.railway.app';

async function cleanerReq(path, form) {
  let res;
  try { res = await fetch(CLEANER + path, { method: 'POST', body: form }); }
  catch { throw new Error('Cannot reach the cleaning agent. Make sure it is running.'); }
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) { const b = await res.json(); throw new Error(b.detail || 'Cleaner error'); }
    throw new Error('Cleaner error ' + res.status);
  }
  return res.json();
}

export async function predictCleaning(file) {
  const form = new FormData(); form.append('file', file);
  return cleanerReq('/predict-with-template', form);
}

export async function cleanColumns(file, columnNames) {
  const form = new FormData(); form.append('file', file); form.append('column_names', columnNames.join(','));
  return cleanerReq('/clean-columns', form);
}

export async function cleanAllColumns(file) {
  const form = new FormData(); form.append('file', file);
  return cleanerReq('/clean', form);
}

export async function analyzeFile(file) {
  const form = new FormData(); form.append('file', file);
  return cleanerReq('/analyze', form);
}

async function req(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, { headers: {'Content-Type':'application/json',...(options.headers||{})}, ...options });
  } catch(e) { throw new Error('Cannot reach the debugger backend.'); }
  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  if (!res.ok) {
    if (isJson) { const b = await res.json(); throw new Error(b.detail || JSON.stringify(b)); }
    const t = await res.text();
    throw new Error('Error ' + res.status + ': ' + t.replace(/<[^>]+>/g,'').trim().slice(0,200));
  }
  return isJson ? res.json() : res.text().then(t => { try { return JSON.parse(t); } catch { return t; } });
}

export async function uploadDataset(file) {
  const form = new FormData(); form.append('file', file);
  let res;
  try { res = await fetch(BASE + '/datasets/upload', { method:'POST', body:form }); }
  catch { throw new Error('Cannot reach the debugger backend.'); }
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) { const b = await res.json(); throw new Error(b.detail || 'Upload failed'); }
    const t = await res.text();
    throw new Error('Upload failed (' + res.status + '): ' + t.replace(/<[^>]+>/g,'').trim().slice(0,200));
  }
  return res.json();
}

export const listDatasets = () => req('/datasets');
export const getDataset = id => req('/datasets/' + id);
export const deleteDataset = id => req('/datasets/' + id, { method:'DELETE' });
export const listUploads = () => req('/uploads');
export const createPipeline = (name, dataset_id) => req('/pipelines', { method:'POST', body:JSON.stringify({name,dataset_id}) });
export const listPipelines = dataset_id => req('/pipelines' + (dataset_id ? '?dataset_id=' + dataset_id : ''));
export const getPipeline = id => req('/pipelines/' + id);
export const deletePipeline = id => req('/pipelines/' + id, { method:'DELETE' });
export const listSteps = pid => req('/pipelines/' + pid + '/steps');
export const createStep = (pid, step) => req('/pipelines/' + pid + '/steps', { method:'POST', body:JSON.stringify({enabled:true,...step}) });
export const updateStep = (id, patch) => req('/steps/' + id, { method:'PUT', body:JSON.stringify(patch) });
export const deleteStep = id => req('/steps/' + id, { method:'DELETE' });
export const reorderSteps = (pid, steps) => req('/pipelines/' + pid + '/reorder', { method:'POST', body:JSON.stringify({steps}) });
export const runPipeline = pid => req('/pipelines/' + pid + '/run', { method:'POST' });
export const getRun = id => req('/runs/' + id);
export const listRuns = pid => req('/pipelines/' + pid + '/runs');
export const listSnapshots = rid => req('/runs/' + rid + '/snapshots');
export const getSnapshot = id => req('/snapshots/' + id);
