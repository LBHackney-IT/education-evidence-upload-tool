describe('use-case/send confirmation email', () => {
  process.env.GOV_NOTIFY_REPLY_TO_ID = '123';
  process.env.GOV_NOTIFY_CONFIRMATION_TEMPLATE_ID = 'template-1';
  process.env.FEEDBACK_FORM_URL = 'http://feedback-form';
  const options = {
    gateways: {
      dropbox: {
        get: jest.fn(() => ({ parentsEmail: 'parent@email.com' }))
      },
      notify: {
        send: jest.fn()
      }
    }
  };
  const sendConfirmationEmail = require('./SendConfirmationEmail')(options);

  it('sends an email', async () => {
    await sendConfirmationEmail('my-dropbox-id');
    expect(options.gateways.notify.send).toHaveBeenCalledWith({
      email: 'parent@email.com',
      referenceId: 'my-dropbox-id',
      replyToId: '123',
      templateId: 'template-1',
      templateVars: { feedbackFormUrl: 'http://feedback-form' }
    });
  });
});
