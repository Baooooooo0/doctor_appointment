const router = require('express').Router();

// Route test kết nối server – không cần auth
router.get('/', (req, res) => {
    res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

module.exports = router;
