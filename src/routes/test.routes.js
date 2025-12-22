const router = require('express').Router();

// Simple test endpoint to verify Flutter ↔ Node.js connectivity
router.get('/', (req, res) => {
	res.json({ ok: true });
});

module.exports = router;
