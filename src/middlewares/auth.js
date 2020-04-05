const { User } = require('../models')
const { generateToken, decodeToken } = require('../utils/auth')
const { compareHash } = require('../utils/hashing')
const { schemaValidationForAuthenticate } = require('../utils/validators')

module.exports = {

  authenticate: async (req, res) => {
    try {
      const body = req.body
      const isValid = (await schemaValidationForAuthenticate(body))

      if (!isValid) {
        return res.status(406).json({ message: 'Data values are not valid' })
      }
      const { email, password } = body
      const user = await User.findOne({
        where: { email }
      })

      if (!user) {
        return res.status(400).json({ message: 'User not found' })
      }

      const isValidPassword = await compareHash(password, user.password)
      if (isValidPassword) {
        const token = generateToken({ id: user.id })
        return res.status(200).json({ token })
      } else {
        return res.status(401).json({ message: 'Incorrect password' })
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error' })
    }
  },
  
  authenticateForRestoreUser: async (req, res, next) => {
    try {

      const body = req.body

      const isValid = (await schemaValidationForAuthenticate(body))

      if (!isValid) {
        return res.status(406).json({ message: 'Data values are not valid' })
      }

      const { email, password } = body

      const user = await User.findOne({
        where: {
          email
        },
        paranoid: false
      })

      if (!user) {
        return res.status(400).json({ message: 'User not found' })
      }

      const isValidPassword = await compareHash(password, user.password)
      if (isValidPassword) {
        const token = generateToken({ id: user.id })

        req.locals = {
          token: `Bearer ${token}`
        }
        next()
      } else {
        return res.status(401).json({ message: 'Incorrect password' })
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error' })
    }
  },

  authorizeForRestoreUser: (req, res, next) => {
    try {
      const { locals: { token } } = req
      if (!token) {
        return res.status(401).json({ error: 'Token not provided' })
      }

      const validatedToken = decodeToken(token)
      if (validatedToken) {
        next()
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error' })
    }
  },

  authorize: (req, res, next) => {
    try {
      const token = req.headers.authorization

      if (!token) {
        return res.status(403).json({ message: 'Token not provided' })
      }

      const { userId: { id } } = decodeToken(token)
      if (id === 0) {
        return res.status(401).json({ message: 'Invalid token' })
      } else {
        req.locals = id
        next()
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error' })
    }
  }
}
