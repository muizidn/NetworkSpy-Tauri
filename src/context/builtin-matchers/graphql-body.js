const body = await readRequestBody();
return String(body).includes('query');
