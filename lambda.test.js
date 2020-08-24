jest.mock('./lib/Dependencies');
const { getDropbox, getSession, templates } = require('./lib/Dependencies');

const evt = (method, path, body, query) => {
  let mvq = {};
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      mvq[k] = [v];
    });
  } else {
    mvq = null;
    query = null;
  }

  return {
    body,
    httpMethod: method,
    path,
    multiValueQueryStringParameters: mvq,
    queryStringParameters: query
  };
};

describe('handler routes', () => {
  const handler = require('./lambda').appHandler;

  describe('GET /login', () => {
    it('shows the login page if not logged in', async () => {
      await handler(evt('GET', '/login'), {});
      expect(templates.loginTemplate).toHaveBeenCalled();
    });
  });

  describe('GET /logout', () => {});

  describe('GET /restart', () => {});

  describe('GET /dropboxes', () => {});

  describe('GET /dropboxes/new', () => {});

  describe('GET /dropboxes/:id', () => {
    // it('shows the new dropbox template', async () => {
    //   getSession.mockImplementationOnce(() => ({ dropboxId: '1' }));
    //   getDropbox.mockImplementationOnce(() => true);
    //   getEvidenceStoreUrl.mockImplementationOnce(() => ({
    //     url: '',
    //     fields: '',
    //     documentId: '',
    //   }));
    //   await handler(evt('GET', '/dropboxes/1'));
    //   expect(templates.createDropboxTemplate).toHaveBeenCalled();
    // });

    it('redirects to new dropbox if no existing session', async () => {
      getSession.mockImplementationOnce(() => false);
      const res = await handler(evt('GET', '/dropboxes/1'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/new');
    });

    it('redirects to new dropbox if no existing dropbox', async () => {
      getSession.mockImplementationOnce(() => ({ dropboxId: '1' }));
      getDropbox.mockImplementationOnce(() => false);
      const res = await handler(evt('GET', '/dropboxes/1'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/new');
    });

    it('shows the submitted dropbox page if a dropbox is submitted', async () => {
      getSession.mockImplementationOnce(() => ({ dropboxId: '1' }));
      getDropbox.mockImplementationOnce(() => ({ submitted: true }));
      await handler(evt('GET', '/dropboxes/1'));
      expect(templates.readonlyDropboxTemplate).toHaveBeenCalled();
    });

    it('shows the submitted dropbox page if a dropbox is submitted', async () => {
      getSession.mockImplementationOnce(() => ({ dropboxId: '1' }));
      getDropbox.mockImplementationOnce(() => ({ submitted: true }));
      await handler(evt('GET', '/dropboxes/1'));
      expect(templates.readonlyDropboxTemplate).toHaveBeenCalled();
    });
  });

  describe('GET /dropboxes/:id/view', () => {});

  describe('GET /dropboxes/:dropboxId/files/:fileId', () => {});

  describe('POST /dropboxes/:dropboxId/files/:fileId', () => {});

  describe('POST /dropboxes/:id/archive', () => {});
});