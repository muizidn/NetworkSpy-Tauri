const headers = await readRequestHeaders();
return Object.keys(headers).some(k => k.toLowerCase() === 'authorization' && String(headers[k]).includes('Bearer eyJ'));
