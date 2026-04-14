const headers = await readResponseHeaders();
return Object.keys(headers).some(k => k.toLowerCase() === 'content-type' && String(headers[k]).includes('text/event-stream'));
