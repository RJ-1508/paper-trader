const internalAuthenticate = (req, res, next) => {
    try {
        const authHeader = req.headers['x-internal-secret'];
        if (!process.env.INTERNAL_SECRET) {
            return res.status(500).json({ error: 'Internal secret not configured' });
        }
        if (authHeader !== process.env.INTERNAL_SECRET) {
            return res.status(401).json({ error: 'Auth failed' });
        }

        next();

    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong'})
    }
}

module.exports = internalAuthenticate;