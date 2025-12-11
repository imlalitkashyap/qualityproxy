const axios = require('axios');

// Target URL (Hardcoded jaisa tune manga tha)
const TARGET_URL = "https://stream26.y2ksolution.com/quality-education/2025/01/7957.240-33824.mp4";

module.exports = async (req, res) => {
    // 1. Browser se 'Range' header uthao (Seek karne ke liye zaroori hai)
    const range = req.headers.range;

    try {
        // 2. Request options set karo (Spoofing Headers)
        const options = {
            method: 'GET',
            url: TARGET_URL,
            responseType: 'stream', // Zaroori: Stream mode on
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://y2ksolution.com/', // Server ko fool banane ke liye
                'Accept': '*/*',
            }
        };

        // Agar browser ne range mangi hai, toh server se wahi range mango
        if (range) {
            options.headers['Range'] = range;
        }

        // 3. Target Server se data fetch karo
        const response = await axios(options);

        // 4. Target ke response headers copy karo (Content-Type, Length, Range etc.)
        // Ye bohot zaroori hai taaki player ko pata chale video kitni badi hai
        const headersToRelay = [
            'content-type',
            'content-length',
            'content-range',
            'accept-ranges',
            'last-modified'
        ];

        headersToRelay.forEach(header => {
            if (response.headers[header]) {
                res.setHeader(header, response.headers[header]);
            }
        });

        // Status code forward karo (200 OK ya 206 Partial Content)
        res.status(response.status);

        // 5. Data ko seedha browser ko pipe kar do
        response.data.pipe(res);

    } catch (error) {
        console.error('Proxy Error:', error.message);
        res.status(500).send('Error streaming video');
    }
};
