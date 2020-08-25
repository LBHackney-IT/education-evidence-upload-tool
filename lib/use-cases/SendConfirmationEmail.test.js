describe('use-case/send confirmation email', () => {
  process.env.GOV_NOTIFY_CONFIRMATION_TEMPLATE_ID = 'template-1';
  process.env.FEEDBACK_FORM_URL = 'http://feedback-form';
  const options = {
    gateways: {
      dropbox: {
        get: jest.fn(() => ({ customer: { parentsEmail: 'parent@email.com' } }))
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
      templateId: 'template-1',
      templateVars: { feedbackFormUrl: 'http://feedback-form' }
    });
  });
});
