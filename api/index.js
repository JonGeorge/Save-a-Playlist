const path = require('path');
const fs = require('fs');

const log = require('../services/log');

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const filePath = path.join(__dirname, '..', 'public', 'index_wip.html');
        const htmlContent = fs.readFileSync(filePath, 'utf8');

        log.debug('GET /  ->', 'serving index_wip.html');

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(htmlContent);
    } catch (error) {
        log.debug('Error serving index:', error);
        res.status(500).send('Internal Server Error');
    }
};
