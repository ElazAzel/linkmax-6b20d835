const https = require('https');
const http = require('http');

const URL_TO_CHECK = 'http://localhost:3000'; // Change to specific slug if needed
const USER_AGENT = 'Googlebot/2.1 (+http://www.google.com/bot.html)';

function checkUrl(url) {
    console.log(`Checking ${url} with User-Agent: ${USER_AGENT}`);

    const client = url.startsWith('https') ? https : http;

    const options = {
        headers: {
            'User-Agent': USER_AGENT
        }
    };

    client.get(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log(`\nStatus Code: ${res.statusCode}`);

            // Check for Title
            const titleMatch = data.match(/<title>(.*?)<\/title>/);
            console.log(`Title: ${titleMatch ? titleMatch[1] : 'NOT FOUND'}`);

            // Check for Meta Description
            const descMatch = data.match(/<meta name="description" content="(.*?)"/);
            console.log(`Description: ${descMatch ? descMatch[1] : 'NOT FOUND'}`);

            // Check for SSR Content (look for common keywords or structure)
            if (data.includes('__next_data__') || data.includes('items-center')) {
                console.log('SSR Content: DETECTED (Basic check)');
            } else {
                console.log('SSR Content: NOT DETECTED (might be static or error)');
            }

            // Check for AI meta tags
            if (data.includes('ai:entity_type')) {
                console.log('AI Metadata: FOUND');
            } else {
                console.log('AI Metadata: NOT FOUND (Check if page expects it)');
            }

        });

    }).on('error', (err) => {
        console.error('Error:', err.message);
        console.log('Make sure the server is running on localhost:3000');
    });
}

checkUrl(URL_TO_CHECK);
