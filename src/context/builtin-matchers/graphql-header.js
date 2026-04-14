const headers = await readRequestHeaders();
return Object.keys(headers).some(k => k.toLowerCase() === 'content-type' && String(headers[k]).includes('graphql'));
