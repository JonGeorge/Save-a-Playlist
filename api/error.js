const { middleware } = require('../security');

module.exports = async (req, res) => {
    return middleware.pages(req, res, async () => {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        res.status(200).send('There has been an error.');
    });
};
