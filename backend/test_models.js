async function listModels() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const apiKey = 'AFZdQf8W4sbavitOwwdCkMdGef4j3T5ra0N3fY37';
    const response = await fetch('https://api.cohere.com/v1/models', {
        headers: {
            'Authorization': `bearer ${apiKey}`,
            'accept': 'application/json'
        }
    });
    const data = await response.json();
    const commandModels = data.models.filter(m => m.name.includes('command')).map(m => m.name);
    console.log('Available Command Models:');
    commandModels.forEach(m => console.log(m));
}
listModels();
