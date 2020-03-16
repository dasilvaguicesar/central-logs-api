const express = require('express')
const router = express.Router()
const controller = require('../controllers/UserController')
const { authenticate } = require('../middlewares/auth');

router.get('/:id', controller.getById)

router.get('/logs/:id', controller.getAllLogsFromUser)

router.post('/signup', controller.create)

router.post('/signin', authenticate)

router.patch('/:id', controller.update)

router.delete('/:id', controller.deleteById)

module.exports = router;