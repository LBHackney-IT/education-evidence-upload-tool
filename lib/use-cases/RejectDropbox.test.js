describe('use-case/reject dropbox', () => {
  const options = {
    gateways: {
      dropbox: {
        get: jest.fn(() => ({})),
        save: jest.fn()
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

  it('archives a dropbox when rejected', async () => {
    await rejectDropbox({ dropboxId: '123', rejectReason: 'i dont like it' });
    expect(options.gateways.dropbox.save).toHaveBeenCalledWith(
      expect.objectContaining({
        archived: 'true'
      })
    );
  });
});
