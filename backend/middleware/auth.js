const jwt = require('jsonwebtoken')

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const parts = authHeader.split(' ')
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = parts[1]
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) 
        req.userId = decoded.userId
        
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

module.exports = authenticate;