jest.mock('./lib/Dependencies');
const { getSession, saveDropbox } = require('./lib/Dependencies');

describe('save dropbox handler', () => {
  const handler = require('./saveDropbox').handler;

  it('decodes the body if encoded', async () => {
    const from = jest.fn();
    global.Buffer = { from };
    const event = { isBase64Encoded: true };
    await handler(event);
    expect(from).toHaveBeenCalled();
  });

  it('does not decode the body if not encoded', async () => {
    const from = jest.fn();
    global.Buffer = { from };
    const event = { isBase64Encoded: false };
    await handler(event);
    expect(from).not.toHaveBeenCalled();
  });

  it('returns unauthorized if no valid session', async () => {
    getSession.mockImplementationOnce(() => false);
    const event = {
      isBase64Encoded: false,
      pathParameters: { dropboxId: '1' }
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(403);
  });

  it('saves the dropbox', async () => {
    getSession.mockImplementationOnce(() => ({ dropboxId: '1' }));
    const event = {
      isBase64Encoded: false,
      pathParameters: { dropboxId: '1' }
    };
    const res = await handler(event);
    expect(saveDropbox).toHaveBeenCalled();
    expect(res.statusCode).toBe(302);
    expect(res.headers.Location).toBe('/dropboxes/1');
  });
});
