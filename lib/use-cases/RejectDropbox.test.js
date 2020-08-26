describe('use-case/reject dropbox', () => {
  process.env.GOV_NOTIFY_REJECTION_TEMPLATE_ID = 'template-1';
  const options = {
    gateways: {
      dropbox: {
        get: jest.fn(() => ({
          customer: { parentsEmail: 'parent@email.com' }
        })),
        save: jest.fn()
      },
      notify: {
        send: jest.fn()
      }
    }
  };

  const rejectDropbox = require('./RejectDropbox')(options);

  it('can reject a dropbox with a reject reason', async () => {
    const dropboxId = 'dropbox-1';
    const rejectReason = 'blurry photos';

    await rejectDropbox({ dropboxId, rejectReason });
    expect(options.gateways.dropbox.get).toHaveBeenCalledWith(dropboxId);
    expect(options.gateways.dropbox.save).toHaveBeenCalledWith(
      expect.objectContaining({
        rejectReason
      })
    );
  });

  it('sends an email with the rejected reason', async () => {
    const dropboxId = 'dropbox-1';
    const rejectReason = 'blurry photos';

    await rejectDropbox({ dropboxId, rejectReason });
    expect(options.gateways.notify.send).toHaveBeenCalledWith({
      email: 'parent@email.com',
      referenceId: dropboxId,
      templateId: 'template-1',
      templateVars: { rejectReason }
    });
  });

  it('archives a dropbox when rejected', async () => {
    await rejectDropbox({ dropboxId: '123', rejectReason: 'i dont like it' });
    expect(options.gateways.dropbox.save).toHaveBeenCalledWith(
      expect.objectContaining({
        archived: 'true'
      })
    );
  });
});
