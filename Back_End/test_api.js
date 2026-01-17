import http from 'http';

http.get('http://localhost:5000/api/products?page=1&limit=12', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('--- Products API Debug ---');
        console.log('Status:', res.statusCode);
        console.log('Data:', data.substring(0, 500) + '...');
    });
}).on('error', (err) => {
    console.log('Error:', err.message);
});
