/* eslint-env jest */
const request = require('supertest')
const { app } = require('../src/app')
const { sequelize } = require('../src/models')
const { fakeUsers, fakeLogs } = require('./mocks')

const authorization = []

const constantDate = new Date('2020-02-15T18:01:01.000Z')

global.Date = class extends Date {
  constructor () {
    return constantDate
  }
}

async function signUp (user) {
  await request(app)
    .post('/user/signup')
    .send(user)
}

async function signIn (user) {
  const { body: { token } } = await request(app)
    .post('/user/signin')
    .send(user)
  authorization.push(token)
}

async function createLog (log) {
  return request(app)
    .post('/logs').send(log)
    .set('Authorization', `Bearer ${authorization[0]}`)
}

async function syncDB () {
  await sequelize.sync({ force: true })
  authorization.pop()
}

beforeAll(async () => {
  await sequelize.sync({ force: true })
})

afterAll(async () => {
  await sequelize.drop()
  await sequelize.close()
})

// tests on user routes
describe('The API on /user/logs Endpoint at GET method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
    await createLog(fakeLogs.create.validLog)
    await createLog(fakeLogs.create.validLog)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('return status 200, total of logs and the logs information', async () => {
    const res = await request(app)
      .get('/user/logs')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual(fakeLogs.expected.getLogsbyUser)
    expect(res.statusCode).toEqual(200)
  })

  test('return status 204 and a message when there is no log', async () => {
    await request(app)
      .delete('/logs/id/1')
      .set('Authorization', `Bearer ${authorization[0]}`)
    await request(app)
      .delete('/logs/id/2')
      .set('Authorization', `Bearer ${authorization[0]}`)

    const res = await request(app)
      .get('/user/logs')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })

  test('return status 401 when authorization is incorrect', async () => {
    const incorrectToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const res = await request(app)
      .get('/user/logs')
      .set('Authorization', `Bearer ${incorrectToken}`)

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('return status 401 when authorization not provided', async () => {
    const res = await request(app)
      .get('/user/logs')
      .set('Authorization', 'Bearer ')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })
})

describe('The API on /user/signup Endpoint at POST method should...', () => {
  afterEach(async () => {
    await syncDB()
  })

  test('return status code 201, the new data created and a message of sucess', async () => {
    const res = await request(app)
      .post('/user/signup')
      .send(fakeUsers.create.validData)

      expect(res.body).toEqual({ message: 'User created successfully' })
      expect(res.statusCode).toEqual(201)
  })

  test('return status code 409 and message when there are 2 users with the same email', async () => {
    await request(app)
      .post('/user/signup')
      .send(fakeUsers.create.validData)

    const secoundRes = await request(app)
      .post('/user/signup')
      .send(fakeUsers.create.validData)

    expect(secoundRes.body).toEqual({ message: 'User email already exists' })
    expect(secoundRes.statusCode).toEqual(409)
  })
  test('return status code 406 and a message when name is invalid', async () => {
    const res = await request(app)
      .post('/user/signup')
      .send(fakeUsers.invalidName)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message when emails is invalid', async () => {
    const res = await request(app)
      .post('/user/signup')
      .send(fakeUsers.createWithInvalidEmail)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message when minimum password length is invalid', async () => {
    const res = await request(app)
      .post('/user/signup')
      .send(fakeUsers.userWithInvalidPassword)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('returns status code 406 and an incorrect password message when the password type is invalid', async () => {
    const res = await request(app)
      .post('/user/signup')
      .send(fakeUsers.create.invalidPasswordType)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message when user has no name', async () => {
    const res = await request(app)
      .post('/user/signup')
      .send(fakeUsers.invalidName)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message when user has no email', async () => {
    const res = await request(app)
      .post('/user/signup')
      .send(fakeUsers.create.invalidEmail)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message when user has no password', async () => {
    const res = await request(app)
      .post('/user/signup')
      .send(fakeUsers.create.blankPassword)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message when invalid keys of the object', async () => {
    const res = await request(app)
      .post('/user/signup')
      .send(fakeUsers.invalidKeys)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })
})

describe('The API on /user/signin Endpoint at POST method should...', () => {
  beforeEach(async () => {
    await request(app)
      .post('/user/signup')
      .send(fakeUsers.create.validData)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('return status code 200 and an object with the authorization', async () => {
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.validData)

    expect(res.body).toMatchObject({})
    expect(res.statusCode).toEqual(200)
  })

  test('return status code 406 and message when email is not correct', async () => {
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.invalidEmail)

    expect(res.body).toEqual({ message: 'Data values are not valid' })
    expect(res.statusCode).toEqual(406)
  })

  test('returns status code 406 and an incorrect password message when the password type is invalid', async () => {
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.invalidPasswordType)

    expect(res.body).toEqual({ message: 'Data values are not valid' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message of error when password is type of number', async () => {
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.userWithTypeNumberPassword)

    expect(res.body).toEqual({ message: 'Data values are not valid' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message of error when user has no email', async () => {
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.invalidEmail)

    expect(res.body).toEqual({ message: 'Data values are not valid' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message of error when user has no password', async () => {
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.invalidPassword)

    expect(res.body).toEqual({ message: 'Data values are not valid' })
    expect(res.statusCode).toEqual(406)
  })
})

describe('The API on /user/restore Endpoint at POST method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('return status code 200 and a message of successfully', async () => {
    const res = await request(app)
      .post('/user/restore')
      .send(fakeUsers.authenticate.validData)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'User restored successfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('return status code 400 and a message when user has deleted hard', async () => {
    await request(app)
      .delete('/user/hard')
      .set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app)
      .post('/user/restore')
      .send(fakeUsers.authenticate.validData)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'User not found' })
    expect(res.statusCode).toEqual(400)
  })

  test('return status code 406 and a message of error when email is incorrect', async () => {
    const res = await request(app)
      .post('/user/restore')
      .send(fakeUsers.authenticate.blankEmail)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Data values are not valid' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message of error when password is incorrect', async () => {
    const res = await request(app)
      .post('/user/restore')
      .send(fakeUsers.authenticate.userWithInvalidPassword)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Data values are not valid'})
    expect(res.statusCode).toEqual(406)
  })
})

describe('The API on /user Endpoint at PATCH method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('return status code 200 and a message confirming (name, email, password)', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.allValidData)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Updated sucessfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('return status code 200 and a message confirming (name, email)', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.validNameAndEmail)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Updated sucessfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('return status code 200 and a message confirming (name, password)', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.validNameAndPassword)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Updated sucessfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('return status code 200 and a message confirming (name)', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.validName)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Updated sucessfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('return status code 200 and a message confirming (email, password)', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.validEmailAndPassword)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Updated sucessfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('return status code 200 and a message confirming (email)', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.validEmail)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Updated sucessfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('return status code 200 and and a message confirming (password)', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.validPassword)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Updated sucessfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('return status code 401 and error message', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.InvalidOldPassword)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Password does not match' })
    expect(res.statusCode).toEqual(412)
  })

  test('return status code 406 with not confirmed password and a message', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.invalidConfirmedPassword)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 with a error message of body', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.invalidKeys)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and error message when password is number', async () => {
    const res = await request(app)
      .patch('/user')
      .send(fakeUsers.update.invalidTypeNewPassword)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })
})

describe('The API on /user Endpoint at DELETE method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('return status code 200 and a message od deletation', async () => {
    const res = await request(app)
      .delete('/user')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Deleted succesfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('return status 200 and a message when user not found or has already been deleted', async () => {
    const resForDeleteFirst = await request(app)
      .delete('/user')
      .set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app)
      .delete('/user')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(resForDeleteFirst.body).toEqual({ message: 'Deleted succesfully' })
    expect(res.body).toEqual({})
    expect(resForDeleteFirst.statusCode).toEqual(200)
    expect(res.statusCode).toEqual(204)
  })

  test('return status 401 when authorization is incorrect', async () => {
    const incorrectToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const res = await request(app)
      .delete('/user')
      .set('Authorization', `Bearer ${incorrectToken}`)

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('return status 401 when authorization not provided', async () => {
    const res = await request(app)
      .delete('/user')
      .set('Authorization', 'Bearer ')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })
})

describe('The API on /user/hard Endpoint at DELETE method should...', () => {
  beforeEach(async (done) => {
    await request(app).post('/user/signup')
      .send(fakeUsers.create.validData)
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.validData)

    authorization.push(res.body.token)
    done()
  })

  afterEach(async () => {
    await syncDB()
  })

  test('return status code 200 and a message od deletation', async () => {
    const res = await request(app)
      .delete('/user/hard')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Deleted successfully, this action cannot be undone' })
    expect(res.statusCode).toEqual(200)
  })

  test('returns a message stating that there is no such user', async () => {
    const resForDeleteFirst = await request(app)
      .delete('/user/hard')
      .set('Authorization', `Bearer ${authorization[0]}`)
    const resForDeleteFirstAgain = await request(app)
    .delete('/user/hard')
    .set('Authorization', `Bearer ${authorization}`)

    expect(resForDeleteFirst.body).toEqual({ message: 'Deleted successfully, this action cannot be undone' })
    expect(resForDeleteFirstAgain.body).toEqual({})
    expect(resForDeleteFirst.statusCode).toEqual(200)
    expect(resForDeleteFirstAgain.statusCode).toEqual(204)
  })

  test('return status 200 and a message when user not found or has already been deleted', async () => {
    const resForDeleteFirst = await request(app)
      .delete('/user/hard')
      .set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app)
      .delete('/user')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(resForDeleteFirst.body).toEqual({ message: 'Deleted successfully, this action cannot be undone' })
    expect(res.body).toEqual({})
    expect(resForDeleteFirst.statusCode).toEqual(200)
    expect(res.statusCode).toEqual(204)
  })

  test('return status 401 when authorization is incorrect', async () => {
    const incorrectToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const res = await request(app)
      .delete('/user/hard')
      .set('Authorization', `Bearer ${incorrectToken}`)

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('return status 401 when authorization not provided', async () => {
    const res = await request(app)
      .delete('/user/hard')
      .set('Authorization', 'Bearer ')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })
})

// tests on logs routes
describe('The API on /logs/sender/:senderApplication endpoint at GET method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('returns status code 200 and all logs by application name', async () => {
    await createLog(fakeLogs.create.validLog)
    await createLog(fakeLogs.create.validLog)

    const res = await request(app)
      .get('/logs/sender/App_1')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 204 and a message when the application name does not exist', async () => {
    const res = await request(app)
      .get('/logs/sender/fake_app')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })

  test('returns status code 401 and a message of error when authorization is invalid', async () => {
    const res = await request(app)
      .get('/logs/sender/production')
      .set('Authorization', 'Beer authorization.not.valid')
    
    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns the 401 status code and an error message when the authorization was not sent', async () => {
    const res = await request(app)
      .get('/logs/sender/production')

    expect(res.body).toEqual({ message: 'Token not provided' })
    expect(res.statusCode).toEqual(403)
  })
})

describe('The API on /logs/environment/:environment endpoint at GET method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
    await createLog(fakeLogs.create.validLog)
    await createLog(fakeLogs.create.validLog)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('returns status code 200 and all application logs by environment', async () => {
    const res = await request(app)
      .get('/logs/environment/production')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 200 and a message when the application environment does not exist', async () => {
    const res = await request(app)
      .get('/logs/environment/fake_environment')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'There are no logs' })
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 401 and a message of error when authorization is invalid', async () => {
    const res = await request(app)
      .get('/logs/environment/production')
      .set('Authorization', 'Beer authorization.not.valid')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns the 401 status code and an error message when the authorization was not sent', async () => {
    const res = await request(app)
      .get('/logs/environment/production')

    expect(res.body).toEqual({ message: 'Token not provided' })
    expect(res.statusCode).toEqual(403)
  })
})

describe('The API on /logs/level/:level endpoint at GET method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
    await createLog(fakeLogs.create.validLog)
    await createLog(fakeLogs.create.validLog)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('returns status code 200 and all logs by severity level', async () => {
    const res = await request(app)
      .get('/logs/level/fatal')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 200 and a message when the application level does not exist', async () => {
    const res = await request(app)
      .get('/logs/level/fake_level')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })

  test('returns status code 401 and a message of error when authorization is invalid', async () => {
    const res = await request(app)
      .get('/logs/level/production')
      .set('Authorization', 'Beer authorization.not.valid')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns the 401 status code and an error message when the authorization was not sent', async () => {
    const res = await request(app)
      .get('/logs/level/production')

    expect(res.body).toEqual({ message: 'Token not provided' })
    expect(res.statusCode).toEqual(403)
  })
})

describe('The API on /logs endpoint at POST method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('returns 200 as status code and the result of the new log created', async () => {
    const res = await createLog(fakeLogs.create.validLog)

  expect(res.body).toEqual(fakeLogs.expected.createdLog)
  expect(res.statusCode).toEqual(201)
  })

  test('returns status code 406 and a message of error when a model is invalid', async () => {
    const res = await request(app).post('/logs')
      .send(fakeLogs.create.invalidLogModel)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('returns status code 406 and a message of error when a type is invalid', async () => {
    const res = await request(app).post('/logs')
      .send(fakeLogs.create.invalidLogType)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('returns status code 406 and a message of error when a date is invalid', async () => {
    const res = await request(app).post('/logs')
      .send(fakeLogs.create.invalidLogDate)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('returns the 401 status code and an error message when the authorization is invalid', async () => {
    const res = await request(app).post('/logs')
      .send(fakeLogs.create.validLog)
      .set('Authorization', 'Beer authorization.not.valid')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns the 401 status code and an error message when the authorization was not sent', async () => {
    const res = await request(app).post('/logs')
      .send(fakeLogs.create.validLog)

    expect(res.body).toEqual({ message: 'Token not provided' })
    expect(res.statusCode).toEqual(403)
  })
})

describe('The API on /logs/restore/id/:id Endpoint at POST method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
    await createLog(fakeLogs.create.validLog)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('return status code 200 and a success message', async () => {
    await request(app).delete('/logs/id/1').set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app).post('/logs/restore/id/1').set('Authorization', `Bearer ${authorization[0]}`)

  expect(res.body).toEqual({ message: 'Log restored successfully' })
  expect(res.statusCode).toEqual(200)
  })

  test('return status code 204 and a message when log has deleted hard', async () => {
    await request(app).delete('/logs/hard/1').set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app).post('/logs/restore/id/1').set('Authorization', `Bearer ${authorization[0]}`)

  expect(res.body).toEqual({})
  expect(res.statusCode).toEqual(204)
  })

  test('return status code 401 when authorization not provided', async () => {
    const res = await request(app).post('/logs/restore/id/1').set('Authorization', 'Bearer ')

  expect(res.body).toEqual({ message: 'Invalid token' })
  expect(res.statusCode).toEqual(401)
  })

  test('return status code 401 when authorization are incorrect ', async () => {
    const res = await request(app).post('/logs/restore//id/1').set('Authorization', 'Bearer some.authorization')

  expect(res.body).toEqual({ message: 'Invalid token' })
  expect(res.statusCode).toEqual(401)
  })

  test('returns status code 404 and a message when the log does not exist', async () => {
    const res = await request(app)
      .delete('/logs/restore/90')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(404)
  })

  test('returns status code 404 and an empty obj when log id is missing', async () => {
    const res = await request(app)
      .delete('/logs/restore/')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(404)
  })
})

describe('The API on /logs/restore/all Endpoint at POST method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
    await createLog(fakeLogs.create.validLog)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('return status code 200 and a message successfully', async () => {
    await request(app).delete('/logs/all').set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app).post('/logs/restore/all').set('Authorization', `Bearer ${authorization[0]}`)

  expect(res.body).toEqual({ message: 'All logs restored successfully' })
  expect(res.statusCode).toEqual(200)
  })

  test('return status code 204 and a message when log has deleted hard', async () => {
    await request(app).delete('/logs/all/hard').set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app).post('/logs/restore/all').set('Authorization', `Bearer ${authorization[0]}`)

  expect(res.body).toEqual({})
  expect(res.statusCode).toEqual(204)
  })

  test('return status code 401 when authorization not provided', async () => {
    const res = await request(app).post('/logs/restore').set('Authorization', 'Bearer ')

  expect(res.body).toEqual({ message: 'Invalid token' })
  expect(res.statusCode).toEqual(401)
  })

  test('return status code 401 when authorization are incorrect ', async () => {
    const res = await request(app).post('/logs/restore').set('Authorization', 'Bearer some.authorization')

  expect(res.body).toEqual({ message: 'Invalid token' })
  expect(res.statusCode).toEqual(401)
  })
})

describe('The API on /logs/id/:id endpoint at DELETE method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
    await createLog(fakeLogs.create.validLog)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('returns status code 200 and a successfull message', async () => {
    const res = await request(app)
      .delete('/logs/id/1')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Deleted successfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 204 and a message when the log does not exist', async () => {
    const res = await request(app).delete('/logs/id/90').set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })

  test('returns status code 404 and an empty obj when log id is missing', async () => {
    const res = await request(app).delete('/logs/id').set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(404)
  })

  test('returns status code 401 and a message of error when authorization is invalid', async () => {
    const res = await request(app)
      .delete('/logs/id/1')
      .set('Authorization', 'Bearer um.authorization.qualquer')

  expect(res.body).toEqual({ message: 'Invalid token' })
  expect(res.statusCode).toEqual(401)
  })

  test('returns status code 401 and a message of error when authorization is missing', async () => {
    const res = await request(app).delete('/logs/id/1').set('Authorization', 'Bearer')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })
})

describe('The API on /logs/all endpoint at DELETE method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('returns status code 200 and a success message', async () => {
    await createLog(fakeLogs.create.validLog)

    const res = await request(app).delete('/logs/all').set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Deleted successfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 204 when there is no log to delete', async () => {
    const res = await request(app).delete('/logs/all').set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })

  test('returns status code 401 when authorization is missing', async () => {
    const res = await request(app).delete('/logs/all').set('Authorization', 'Bearer ')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns status code 401 when authorization is not provided', async () => {
    const res = await request(app).delete('/logs/all')

    expect(res.body).toEqual({ message: 'Token not provided' })
    expect(res.statusCode).toEqual(403)
  })

  test('returns status code 401 when authorization is invalid', async () => {
    const res = await request(app).delete('/logs/all').set('Authorization', 'Bearer um.authorization.qualquer')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })
})

describe('The API on /logs/hard/:id endpoint at DELETE method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
    await createLog(fakeLogs.create.validLog)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('returns status code 200 and a successfull message', async () => {
    const res = await request(app)
      .delete('/logs/hard/1')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toMatchObject({ message: 'Deleted successfully, this action cannot be undone' })
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 204 and a message when the log does not exist', async () => {
    const res = await request(app)
      .delete('/logs/hard/90')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toMatchObject({})
    expect(res.statusCode).toEqual(204)
  })

  test('returns status code 404 and an empty obj when log id is missing', async () => {
    const res = await request(app).delete('/logs/hard').set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(404)
  })

  test('returns status code 401 and a message of error when authorization is invalid', async () => {
    const res = await request(app).delete('/logs/hard/1').set('Authorization', 'Bearer um.authorization.qualquer')

    expect(res.body).toMatchObject({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns status code 401 and a message of error when authorization is missing', async () => {
    const res = await request(app).delete('/logs/hard/1').set('Authorization', 'Bearer')

    expect(res.body).toMatchObject({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns status 204 and an empty object which means that there are no logs', async () => {
    await request(app).delete('/logs/hard/1').set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app).get('/user/logs').set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })
})

describe('The API on /logs/all/hard endpoint at DELETE method should...', () => {
  beforeEach(async () => {
    await signUp(fakeUsers.create.validData)
    await signIn(fakeUsers.authenticate.validData)
  })

  afterEach(async () => {
    await syncDB()
  })

  test('returns status code 200 and a successfull message', async () => {
    await createLog(fakeLogs.create.validLog)

    const res = await request(app).delete('/logs/all/hard').set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Deleted successfully, this action cannot be undone' })
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 204 when there is no log to delete', async () => {
    const res = await request(app).delete('/logs/all/hard').set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })

  test('returns status code 401 when authorization is missing', async () => {
    const res = await request(app).delete('/logs/all/hard').set('Authorization', 'Bearer ')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns status code 401 when authorization is not provided', async () => {
    const res = await request(app).delete('/logs/all/hard')

    expect(res.body).toEqual({ message: 'Token not provided' })
    expect(res.statusCode).toEqual(403)
  })

  test('returns status code 401 when authorization is invalid', async () => {
    const res = await request(app).delete('/logs/all/hard').set('Authorization', 'Bearer um.authorization.qualquer')

    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns status 204 and an empty object which means that there are no logs', async () => {
    await createLog(fakeLogs.create.validLog)
    await createLog(fakeLogs.create.validLog)

    await request(app).delete('/logs/all/hard').set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app).get('/user/logs').set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })
})
