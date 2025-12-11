const https = require('https');
const { parse } = require('url');

const TARGET_URL = "https://stream26.y2ksolution.com/quality-education/2025/01/7957.240-33824.mp4";

module.exports = (req, res) => {
    // 1. CORS Handle karo (Zaroori hai)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Target URL parse karo
    const targetUrlParams = parse(TARGET_URL);

    // 3. Request Options (Browser ko poora copy karenge)
    const options = {
        hostname: targetUrlParams.hostname,
        path: targetUrlParams.path,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity;q=1, *;q=0',
            'Connection': 'keep-alive',
            // IMPORTANT: Agar ye Referer galat hai toh video nahi chalegi.
            // Jis website par ye video originally hai, uska link yaha daalna padega.
            // Abhi ke liye main root domain try kar raha hu.
            'Referer': 'https://stream26.y2ksolution.com/', 
            'Origin': 'https://stream26.y2ksolution.com'
        }
    };

    // Range Header forward karna sabse zaroori hai
    if (req.headers.range) {
        options.headers['Range'] = req.headers.range;
    }

    // 4. Request bhejo
    const proxyReq = https.request(options, (proxyRes) => {
        
        // Agar Target ne error diya (Example: 403 Forbidden)
        if (proxyRes.statusCode >= 400) {
            console.error(`Target Error: ${proxyRes.statusCode}`);
            // Frontend ko batao ki error aaya
            return res.status(proxyRes.statusCode).send(`Target Blocked Request: ${proxyRes.statusCode}`);
        }

        // Headers Forward karo
        const headersToCopy = [
            'content-length',
            'content-type',
            'content-range',
            'accept-ranges',
            'last-modified',
            'etag'
        ];

        headersToCopy.forEach(key => {
            if (proxyRes.headers[key]) {
                res.setHeader(key, proxyRes.headers[key]);
            }
        });

        // Response Code set karo (200 ya 206)
        res.status(proxyRes.statusCode);

        // Data Stream karo (Pipe)
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
        console.error('Proxy Request Error:', e);
        res.status(500).send('Internal Proxy Error');
    });

    proxyReq.end();
};
