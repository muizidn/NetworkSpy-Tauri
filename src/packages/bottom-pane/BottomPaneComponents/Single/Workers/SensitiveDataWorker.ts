onmessage = function (e) {
    const { script, body, headers, name } = e.data;

    try {
        const checkerFunc = new Function('body', 'headers', `
            try {
                ${script}
            } catch (err) {
                return [{ 
                    type: 'Script Error (' + '${name}' + ')', 
                    value: err.message, 
                    risk: 'None', 
                    solution: 'Check your script syntax or logic.',
                    isError: true 
                }];
            }
        `);

        const results = checkerFunc(body, headers);
        postMessage({
            results: (Array.isArray(results) ? results : []).map(r => ({ ...r, scriptName: name })),
            name
        });
    } catch (err: any) {
        postMessage({
            results: [{
                type: 'Execution Error',
                value: err.message,
                risk: 'None',
                solution: 'The script could not be compiled. Check for syntax errors.',
                isError: true,
                scriptName: name
            }],
            name
        });
    }
};

export {};
