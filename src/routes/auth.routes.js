const router = require('express').Router(); //import router class của express
const controller = require('../controllers/auth.controller'); 

router.post('/register', controller.register); //api đăng kí
router.post('/login', controller.login); //api đăng nhập 

module.exports = router;
