const fakeUsers = {
  create: {
    validData: {
      name: 'User Example',
      email: 'user@email.com',
      password: '123456'
    },
    invalidName: {
      name: 123,
      email: 'User@email.com',
      password: '123456'
    },
    createWithInvalidEmail: {
      name: 'User Example',
      email: 'useremail.com',
      password: '123456'
    },
    invalidPasswordType: {
      name: 'User Example',
      email: 'user@email.com',
      password: 123456
    },
    invalidName: {
      name: '',
      email: 'user@email.com',
      password: '12345'
    },
    invalidEmail: {
      name: 'User Example',
      email: '',
      password: '12345'
    },
    invalidPassword: {
      name: 'User Example',
      email: 'user@email.com',
      password: ''
    },
    invalidKeys: {
      name: 'User Example',
      mail: 'user@email.com',
      password: '123456'
    }
  },
  authenticate: {
    validData: {
      email: 'user@email.com',
      password: '123456'
    },
    invalidEmail: {
      email: 'useremail.com',
      password: '123456'
    },
    userWithMoreData: {
      name: 'User Example',
      email: 'user@email.com',
      password: '123456'
    },
    userWithInvalidPassword: {
      email: 'user@email.com',
      password: '12345'
    },
    invalidPasswordType: {
      email: 'user@email.com',
      password: 123456
    },
    blankEmail: {
      email: '',
      password: '12345'
    },
    blankPassword: {
      email: 'user@email.com',
      password: ''
    }
  },
  update: {
    allValidData: {
      name: 'New Raul Seixas',
      email: 'raulzito123@gmail.com',
      oldPassword: '123456',
      newPassword: '12345678',
      confirmPassword: '12345678'
    },
    validNameAndEmail: {
      name: 'New Raul Seixas',
      email: 'raulzito123@gmail.com'
    },
    validNameAndPassword: {
      name: 'New Raul Seixas',
      oldPassword: '123456',
      newPassword: '12345678',
      confirmPassword: '12345678'
    },
    validName: {
      name: 'New User Example'
    },
    validEmailAndPassword: {
      email: 'raulzito123@gmail.com',
      oldPassword: '123456',
      newPassword: '12345678',
      confirmPassword: '12345678'
    },
    validEmail: {
      email: 'raulzito123@gmail.com'
    },
    validPassword: {
      oldPassword: '123456',
      newPassword: '12345678',
      confirmPassword: '12345678'
    },
    InvalidOldPassword: {
      oldPassword: '123456789',
      newPassword: '12345678',
      confirmPassword: '12345678'
    },
    invalidConfirmedPassword: {
      oldPassword: '12345678',
      newPassword: '12345678',
      confirmPassword: ''
    },
    invalidTypeNewPassword: {
      oldPassword: '123456',
      newPassword: 12345678,
      confirmPassword: '12345678'
    },
    invalidKeys: {
      ame: 'New Raul Seixas',
      email: 'raulzito123@gmail.com',
      oldPassword: '123456',
      newPassword: '12345678',
      confirmPassword: '12345678'
    }
  }
}

const fakeLogs = {
  create: {
    validLog: {
      level: 'FATAL',
      description: 'Aplicattion down',
      senderApplication: 'App_1',
      sendDate: '10/10/2019 15:00',
      environment: 'production'
    },
    validLogAnotherSenderApp: {
      level: 'FATAL',
      description: 'Aplicattion down',
      senderApplication: 'App_2',
      sendDate: '10/10/2019 15:00',
      environment: 'production'
    },
    invalidLogModel: {
      level: 'FATAL',
      description: 'Aplicattion down',
      senderpplication: 'App_1',
      sendDate: '10/10/2019 15:00',
      environment: 'production'
    },
    invalidLogType: {
      level: 'FATAL',
      description: 'Aplicattion down',
      senderpplication: 'App_1',
      sendDate: '10/10/2019 15:00',
      environment: 23
    },
    invalidLogDate: {
      level: 'FATAL',
      description: 'Aplicattion down',
      senderApplication: 'App_1',
      sendDate: '25/25/2019 25:00',
      environment: 'production'
    }
  },
  expected: {
    createdLog: {
      createdLog: {
        UserId: 1,
        createdAt: '2020-02-15T18:01:01.000Z',
        description: 'Aplicattion down',
        environment: 'production',
        id: 1,
        level: 'FATAL',
        sendDate: '10/10/2019 15:00',
        senderApplication: 'App_1',
        updatedAt: '2020-02-15T18:01:01.000Z'
      }
    },
    getLogsbyUser: {
      total: 2,
      Logs: [{
        UserId: 1,
        createdAt: '2020-02-15T18:01:01.000Z',
        deletedAt: null,
        description: 'Aplicattion down',
        environment: 'production',
        id: 1,
        level: 'FATAL',
        sendDate: '10/10/2019 15:00',
        senderApplication: 'App_1',
        updatedAt: '2020-02-15T18:01:01.000Z'
      },
      {
        UserId: 1,
        createdAt: '2020-02-15T18:01:01.000Z',
        deletedAt: null,
        description: 'Aplicattion down',
        environment: 'production',
        id: 2,
        level: 'FATAL',
        sendDate: '10/10/2019 15:00',
        senderApplication: 'App_1',
        updatedAt: '2020-02-15T18:01:01.000Z'
      }]
    },
    getLogsbyParams: [{
      UserId: 1,
      createdAt: '2020-02-15T18:01:01.000Z',
      deletedAt: null,
      description: 'Aplicattion down',
      environment: 'production',
      id: 1,
      level: 'FATAL',
      sendDate: '10/10/2019 15:00',
      senderApplication: 'App_1',
      updatedAt: '2020-02-15T18:01:01.000Z'
    },
    {
      UserId: 1,
      createdAt: '2020-02-15T18:01:01.000Z',
      deletedAt: null,
      description: 'Aplicattion down',
      environment: 'production',
      id: 2,
      level: 'FATAL',
      sendDate: '10/10/2019 15:00',
      senderApplication: 'App_1',
      updatedAt: '2020-02-15T18:01:01.000Z'
    }]
  }
}

module.exports = {
  fakeLogs,
  fakeUsers
}
