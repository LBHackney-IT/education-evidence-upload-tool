const { JsonWebTokenError } = require('jsonwebtoken');

describe('gateway/notification/notify', () => {
  const options = {
    client: { sendEmail: jest.fn() },
    log: {
      info: jest.fn(),
      error: jest.fn()
    }
  };
  const notifyGateway = require('./notify')(options);

  it('sends an email', async () => {
    const params = {
      email: 'me@me.com',
      referenceId: 'dropbox-1',
      templateId: 'template-1',
      templateVars: {}
    };

    await notifyGateway.send(params);

    expect(options.client.sendEmail).toHaveBeenCalledWith(
      'template-1',
      'me@me.com',
      {
        personalisation: {},
        reference: 'dropbox-1'
      }
    );
  });
});
