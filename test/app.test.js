/* eslint-env jest */
const request = require('supertest')
const { app } = require('../src/app')
const { sequelize } = require('../src/models')
const { fakeUsers, fakeLogs } = require('./mocks')

const authorization = []

const constantDate = new Date('2020-02-15T18:01:01.000Z')

global.Date = class extends Date {
  constructor() {
    return constantDate
  }
}

async function signUp(user) {
  await request(app)
    .post('/user/signup')
    .send(user)
}

async function signIn(user) {
  const { body: { token } } = await request(app).post('/user/signin').send(user)
  authorization.push(token)
}

async function createLog(log) {
  return request(app).post('/logs').send(log).set('Authorization', `Bearer ${authorization[0]}`)
}

async function syncDB() {
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

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('returns status code 406 and an incorrect password message when the password type is invalid', async () => {
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.invalidPasswordType)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message of error when password is type of number', async () => {
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.userWithTypeNumberPassword)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message of error when user has no email', async () => {
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.invalidEmail)

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message of error when user has no password', async () => {
    const res = await request(app)
      .post('/user/signin')
      .send(fakeUsers.authenticate.invalidPassword)

    expect(res.body).toEqual({ message: 'Invalid data' })
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

    expect(res.body).toEqual({ message: 'Invalid data' })
    expect(res.statusCode).toEqual(406)
  })

  test('return status code 406 and a message of error when password is incorrect', async () => {
    const res = await request(app)
      .post('/user/restore')
      .send(fakeUsers.authenticate.userWithInvalidPassword)
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Invalid data' })
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
    const res = await request(app).patch('/user')
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
    const res = await request(app).delete('/user').set('Authorization', `Bearer ${authorization[0]}`)

    expect(res.body).toEqual({ message: 'Deleted succesfully' })
    expect(res.statusCode).toEqual(200)
  })

  test('return status 406 and a message when user not found or has already been deleted', async () => {
    const resForDeleteFirst = await request(app)
      .delete('/user')
      .set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app)
      .delete('/user')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(resForDeleteFirst.body).toEqual({ message: 'Deleted succesfully' })
    expect(res.body).toEqual({ message: "User not found" })
    expect(resForDeleteFirst.statusCode).toEqual(200)
    expect(res.statusCode).toEqual(406)
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
    const res = await request(app).delete('/user/hard').set('Authorization', `Bearer ${authorization[0]}`)
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
    expect(resForDeleteFirstAgain.body).toEqual({ message: "User not found" })
    expect(resForDeleteFirst.statusCode).toEqual(200)
    expect(resForDeleteFirstAgain.statusCode).toEqual(406)
  })

  test('return status 200 and a message when user not found or has already been deleted', async () => {
    const resForDeleteFirst = await request(app)
      .delete('/user/hard')
      .set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app)
      .delete('/user')
      .set('Authorization', `Bearer ${authorization[0]}`)

    expect(resForDeleteFirst.body).toEqual({ message: 'Deleted successfully, this action cannot be undone' })
    expect(res.body).toEqual({ message: "User not found" })
    expect(resForDeleteFirst.statusCode).toEqual(200)
    expect(res.statusCode).toEqual(406)
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
    const res = await request(app).get('/logs/sender/App_1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 204 and a message when the application name does not exist', async () => {
    const res = await request(app).get('/logs/sender/fake_app').set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })

  test('returns status code 401 and a message of error when authorization is invalid', async () => {
    const res = await request(app).get('/logs/sender/App_1').set('Authorization', 'Beer authorization.not.valid')
    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns the 401 status code and an error message when the authorization was not sent', async () => {
    const res = await request(app).get('/logs/sender/App_1')
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
    const res = await request(app).get('/logs/environment/production').set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 200 and a message when the application environment does not exist', async () => {
    const res = await request(app)
      .get('/logs/environment/fake_environment')
      .set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })

  test('returns status code 401 and a message of error when authorization is invalid', async () => {
    const res = await request(app)
      .get('/logs/environment/production')
      .set('Authorization', 'Beer authorization.not.valid')
    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns the 403 status code and an error message when the authorization was not sent', async () => {
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

  test('returns status code 204 and a message when the application level does not exist', async () => {
    const res = await request(app)
      .get('/logs/level/fake_level')
      .set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })

  test('returns status code 401 and a message of error when authorization is invalid', async () => {
    const res = await request(app)
      .get('/logs/level/fatal')
      .set('Authorization', 'Beer authorization.not.valid')
    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
  })

  test('returns the 403 status code and an error message when the authorization was not sent', async () => {
    const res = await request(app).get('/logs/level/fatal')
    expect(res.body).toEqual({ message: 'Token not provided' })
    expect(res.statusCode).toEqual(403)
  })
})

describe('The API on /logs Endpoint at GET method should...', () => {
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
    const res = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toEqual(fakeLogs.expected.getLogsbyUser)
    expect(res.statusCode).toEqual(200)
  })

  test('return status 204 and a message when there is no log', async () => {
    await request(app).delete('/logs/id/1').set('Authorization', `Bearer ${authorization[0]}`)
    await request(app).delete('/logs/id/2').set('Authorization', `Bearer ${authorization[0]}`)
    const res = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })

  test('return status 401 when authorization is incorrect', async () => {
    const res = await request(app).get('/logs').set('Authorization', 'Bearer ')
    expect(res.body).toEqual({ message: 'Invalid token' })
    expect(res.statusCode).toEqual(401)
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

  test('returns 201 as status code and the result of the new log created', async () => {
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

  test('returns the 403 status code and an error message when the authorization was not sent', async () => {
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
    const res = await request(app).delete('/logs/restore/90').set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(404)
  })

  test('returns status code 404 and an empty obj when log id is missing', async () => {
    const res = await request(app).delete('/logs/restore/').set('Authorization', `Bearer ${authorization[0]}`)
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
    const res = await request(app).delete('/logs/id/1').set('Authorization', `Bearer ${authorization[0]}`)
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
    const res = await request(app).delete('/logs/id/1').set('Authorization', 'Bearer um.authorization.qualquer')
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

  test('returns status code 403 when authorization is not provided', async () => {
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
    const res = await request(app).delete('/logs/hard/1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toMatchObject({ message: 'Deleted successfully, this action cannot be undone' })
    expect(res.statusCode).toEqual(200)
  })

  test('returns status code 204 and a message when the log does not exist', async () => {
    const res = await request(app).delete('/logs/hard/90').set('Authorization', `Bearer ${authorization[0]}`)
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
    const res = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
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

  test('returns status code 403 when authorization is not provided', async () => {
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
    const res = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toEqual({})
    expect(res.statusCode).toEqual(204)
  })
})

describe('Usage test sequence', async () => {

  afterEach(async () => {
    await syncDB()
  })

  test('Create / Show / Delete / Update - User / Logs', async () => {

    const resSignUp = await request(app).post('/user/signup').send(fakeUsers.create.validData)
    expect(resSignUp.body).toEqual({ message: 'User created successfully' })
    expect(resSignUp.statusCode).toEqual(201)

    const resSignIn = await request(app).post('/user/signin').send(fakeUsers.authenticate.validData)
    expect(resSignIn.body).toMatchObject({})
    expect(resSignIn.statusCode).toEqual(200)
    authorization.push(resSignIn.body.token)

    const resPostLog = await request(app).post('/logs').send(fakeLogs.create.validLog).set('Authorization', `Bearer ${authorization[0]}`)
    expect(resPostLog.body).toEqual(fakeLogs.expected.createdLog)
    expect(resPostLog.statusCode).toEqual(201)

    const resPostLogTwo = await request(app).post('/logs').send(fakeLogs.create.validLog).set('Authorization', `Bearer ${authorization[0]}`)
    expect(resPostLogTwo.body).toEqual(fakeLogs.expected.createdLogTwo)
    expect(resPostLogTwo.statusCode).toEqual(201)

    const resSignUpTwo = await request(app).post('/user/signup').send(fakeUsers.create.validData)
    expect(resSignUpTwo.body).toEqual({ message: 'User email already exists' })
    expect(resSignUpTwo.statusCode).toEqual(409)

    const resUpdate = await request(app).patch('/user')
      .send(fakeUsers.update.validName)
      .set('Authorization', `Bearer ${authorization[0]}`)
    expect(resUpdate.body).toEqual({ message: 'Updated sucessfully' })
    expect(resUpdate.statusCode).toEqual(200)

    const resLogsSender = await request(app).get('/logs/sender/App_1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsSender.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(resLogsSender.statusCode).toEqual(200)

    const resLogsLevel = await request(app).get('/logs/level/fatal').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsLevel.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(resLogsLevel.statusCode).toEqual(200)

    const resLogsEnv = await request(app).get('/logs/environment/production').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsEnv.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(resLogsEnv.statusCode).toEqual(200)

    const resLogsAll = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsAll.body).toEqual(fakeLogs.expected.getLogsbyUser)
    expect(resLogsAll.statusCode).toEqual(200)

    // Tests for after deleting log by id
    const resLogsDelId = await request(app).delete('/logs/id/1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsDelId.body).toEqual({ message: 'Deleted successfully' })
    expect(resLogsDelId.statusCode).toEqual(200)

    const resLogsSenderTwo = await request(app).get('/logs/sender/App_1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsSenderTwo.body).toEqual(fakeLogs.expected.getLogsbyParamsTwo)
    expect(resLogsSenderTwo.statusCode).toEqual(200)

    const resLogsLevelTwo = await request(app).get('/logs/level/fatal').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsLevelTwo.body).toEqual(fakeLogs.expected.getLogsbyParamsTwo)
    expect(resLogsLevelTwo.statusCode).toEqual(200)

    const resLogsEnvTwo = await request(app).get('/logs/environment/production').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsEnvTwo.body).toEqual(fakeLogs.expected.getLogsbyParamsTwo)
    expect(resLogsEnvTwo.statusCode).toEqual(200)

    const resLogsAllTwo = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsAllTwo.body).toEqual(fakeLogs.expected.getLogsbyUserTwo)
    expect(resLogsAllTwo.statusCode).toEqual(200)

    // Tests for after restore log by id
    const resRestoreLog = await request(app).post('/logs/restore/id/1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resRestoreLog.body).toEqual({ message: 'Log restored successfully' })
    expect(resRestoreLog.statusCode).toEqual(200)

    const resLogsSenderThree = await request(app).get('/logs/sender/App_1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsSenderThree.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(resLogsSenderThree.statusCode).toEqual(200)

    const resLogsLevelThree = await request(app).get('/logs/level/fatal').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsLevelThree.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(resLogsLevelThree.statusCode).toEqual(200)

    const resLogsEnvThree = await request(app).get('/logs/environment/production').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsEnvThree.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(resLogsEnvThree.statusCode).toEqual(200)

    const resLogsAllThree = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsAllThree.body).toEqual(fakeLogs.expected.getLogsbyUser)
    expect(resLogsAllThree.statusCode).toEqual(200)

    // Tests for after deleting all logs
    const resLogDelAll = await request(app).delete('/logs/all').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogDelAll.body).toEqual({ message: 'Deleted successfully' })
    expect(resLogDelAll.statusCode).toEqual(200)

    const resLogsSenderFour = await request(app).get('/logs/sender/App_1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsSenderFour.body).toEqual({})
    expect(resLogsSenderFour.statusCode).toEqual(204)

    const resLogsLevelFour = await request(app).get('/logs/level/fatal').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsLevelFour.body).toEqual({})
    expect(resLogsLevelFour.statusCode).toEqual(204)

    const resLogsEnvFour = await request(app).get('/logs/environment/production').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsEnvFour.body).toEqual({})
    expect(resLogsEnvFour.statusCode).toEqual(204)

    const resLogsAllFour = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsAllFour.body).toEqual({})
    expect(resLogsAllFour.statusCode).toEqual(204)

    // Tests for after restoring all logs
    const resRestoreLogsAll = await request(app).post('/logs/restore/all').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resRestoreLogsAll.body).toEqual({ message: 'All logs restored successfully' })
    expect(resRestoreLogsAll.statusCode).toEqual(200)

    const resLogsSenderFive = await request(app).get('/logs/sender/App_1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsSenderFive.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(resLogsSenderFive.statusCode).toEqual(200)

    const resLogsLevelFive = await request(app).get('/logs/level/fatal').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsLevelFive.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(resLogsLevelFive.statusCode).toEqual(200)

    const resLogsEnvFive = await request(app).get('/logs/environment/production').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsEnvFive.body).toEqual(fakeLogs.expected.getLogsbyParams)
    expect(resLogsEnvFive.statusCode).toEqual(200)

    const resLogsAllFive = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsAllFive.body).toEqual(fakeLogs.expected.getLogsbyUser)
    expect(resLogsAllFive.statusCode).toEqual(200)

    // Tests for after deleting log by id
    const resLogDelHard = await request(app).delete('/logs/hard/1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogDelHard.body).toMatchObject({ message: 'Deleted successfully, this action cannot be undone' })
    expect(resLogDelHard.statusCode).toEqual(200)

    const resLogsSenderSix = await request(app).get('/logs/sender/App_1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsSenderSix.body).toEqual(fakeLogs.expected.getLogsbyParamsTwo)
    expect(resLogsSenderSix.statusCode).toEqual(200)

    const resLogsLevelSix = await request(app).get('/logs/level/fatal').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsLevelSix.body).toEqual(fakeLogs.expected.getLogsbyParamsTwo)
    expect(resLogsLevelSix.statusCode).toEqual(200)

    const resLogsEnvSix = await request(app).get('/logs/environment/production').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsEnvSix.body).toEqual(fakeLogs.expected.getLogsbyParamsTwo)
    expect(resLogsEnvSix.statusCode).toEqual(200)

    const resLogsAllSix = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsAllSix.body).toEqual(fakeLogs.expected.getLogsbyUserTwo)
    expect(resLogsAllSix.statusCode).toEqual(200)

    // Tests for after permanently deleting all logs
    const resLogsDelHardAll = await request(app).delete('/logs/all/hard').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsDelHardAll.body).toEqual({ message: 'Deleted successfully, this action cannot be undone' })
    expect(resLogsDelHardAll.statusCode).toEqual(200)

    const resLogsSenderSeven = await request(app).get('/logs/sender/App_1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsSenderSeven.body).toEqual({})
    expect(resLogsSenderSeven.statusCode).toEqual(204)

    const resLogsLevelSeven = await request(app).get('/logs/level/fatal').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsLevelSeven.body).toEqual({})
    expect(resLogsLevelSeven.statusCode).toEqual(204)

    const resLogsEnvSeven = await request(app).get('/logs/environment/production').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsEnvSeven.body).toEqual({})
    expect(resLogsEnvSeven.statusCode).toEqual(204)

    const resLogsAllSeven = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsAllSeven.body).toEqual({})
    expect(resLogsAllSeven.statusCode).toEqual(204)

    // Tests for after deleting user
    const resUserSoftDelete = await request(app).delete('/user').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resUserSoftDelete.body).toEqual({ message: 'Deleted succesfully' })
    expect(resUserSoftDelete.statusCode).toEqual(200)

    const resPostLogThree = await request(app).post('/logs').send(fakeLogs.create.validLog).set('Authorization', `Bearer ${authorization[0]}`)
    expect(resPostLogThree.body).toEqual({ message: 'User not found' })
    expect(resPostLogThree.statusCode).toEqual(406)

    const resSignUpThree = await request(app).post('/user/signup').send(fakeUsers.create.validData)
    expect(resSignUpThree.body).toEqual({ message: 'User email already exists' })
    expect(resSignUpThree.statusCode).toEqual(409)

    const resSignInThree = await request(app).post('/user/signin').send(fakeUsers.authenticate.validData)
    expect(resSignInThree.body).toMatchObject({ message: 'User not found' })
    expect(resSignInThree.statusCode).toEqual(400)

    const resUpdateTwo = await request(app).patch('/user')
      .send(fakeUsers.update.allValidData)
      .set('Authorization', `Bearer ${authorization[0]}`)
    expect(resUpdateTwo.body).toEqual({ message: 'User not found' })
    expect(resUpdateTwo.statusCode).toEqual(406)

    const resLogsSenderEight = await request(app).get('/logs/sender/App_1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsSenderEight.body).toEqual({ message: 'User not found' })
    expect(resLogsSenderEight.statusCode).toEqual(406)

    const resLogsLevelEight = await request(app).get('/logs/level/fatal').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsLevelEight.body).toEqual({ message: 'User not found' })
    expect(resLogsLevelEight.statusCode).toEqual(406)

    const resLogsEnvEight = await request(app).get('/logs/environment/production').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsEnvEight.body).toEqual({ message: 'User not found' })
    expect(resLogsEnvEight.statusCode).toEqual(406)

    const resLogsAllEight = await request(app).get('/logs').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsAllEight.body).toEqual({ message: 'User not found' })
    expect(resLogsAllEight.statusCode).toEqual(406)

    const resLogsDelIdTwo = await request(app).delete('/logs/id/1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsDelIdTwo.body).toEqual({ message: 'User not found' })
    expect(resLogsDelIdTwo.statusCode).toEqual(406)

    const resRestoreLogTwo = await request(app).post('/logs/restore/id/1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resRestoreLogTwo.body).toEqual({ message: 'User not found' })
    expect(resRestoreLogTwo.statusCode).toEqual(406)

    const resLogDelAllTwo = await request(app).delete('/logs/all').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogDelAllTwo.body).toEqual({ message: 'User not found' })
    expect(resLogDelAllTwo.statusCode).toEqual(406)

    const resRestoreLogsAllTwo = await request(app).post('/logs/restore/all').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resRestoreLogsAllTwo.body).toEqual({ message: 'User not found' })
    expect(resRestoreLogsAllTwo.statusCode).toEqual(406)

    const resLogsDelHardAllTwo = await request(app).delete('/logs/all/hard').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogsDelHardAllTwo.body).toEqual({ message: 'User not found' })
    expect(resLogsDelHardAllTwo.statusCode).toEqual(406)

    const resLogDelHardTwo = await request(app).delete('/logs/hard/1').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resLogDelHardTwo.body).toMatchObject({ message: 'User not found' })
    expect(resLogDelHardTwo.statusCode).toEqual(406)

    // Tests for after restoring user
    const res = await request(app)
      .post('/user/restore')
      .send(fakeUsers.authenticate.validData)
      .set('Authorization', `Bearer ${authorization[0]}`)
    expect(res.body).toEqual({ message: 'User restored successfully' })
    expect(res.statusCode).toEqual(200)

    // Tests for after permanently deleting user
    const resUserDelHard = await request(app).delete('/user/hard').set('Authorization', `Bearer ${authorization[0]}`)
    expect(resUserDelHard.body).toEqual({ message: 'Deleted successfully, this action cannot be undone' })
    expect(resUserDelHard.statusCode).toEqual(200)



  })
})