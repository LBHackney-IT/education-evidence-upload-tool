process.env.GOV_NOTIFY_API_KEY = 'key';
jest.mock('./lib/Dependencies');
const {
  authorize,
  createEmptyDropbox,
  createSessionToken,
  deleteDocument,
  getDropbox,
  getDropboxes,
  getSecureUploadUrl,
  getSession,
  templates,
  updateArchiveStatus
} = require('./lib/Dependencies');

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
  const handler = require('./index').handler;

  describe('GET /', () => {
    it('redirects to new dropbox', async () => {
      const res = await handler(evt('GET', '/'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/new');
    });
  });

  describe('GET /login', () => {
    it('shows the login page if not logged in', async () => {
      authorize.mockImplementationOnce(() => false);
      await handler(evt('GET', '/login'));
      expect(templates.loginTemplate).toHaveBeenCalled();
    });

    it('redirects to the dropboxes page if logged in', async () => {
      authorize.mockImplementationOnce(() => true);
      const res = await handler(evt('GET', '/login'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes');
    });
  });

  describe('GET /logout', () => {
    it('redirects to login', async () => {
      const res = await handler(evt('GET', '/logout'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/login');
    });
  });

  describe('GET /restart', () => {
    it('redirects to new dropbox', async () => {
      const res = await handler(evt('GET', '/restart'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/new');
    });
  });

  describe('GET /dropboxes', () => {
    it('redirects to login if not logged in', async () => {
      authorize.mockImplementationOnce(() => false);
      const res = await handler(evt('GET', '/dropboxes'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('shows the dropboxes', async () => {
      authorize.mockImplementationOnce(() => true);
      await handler(evt('GET', '/dropboxes'), {});
      expect(getDropboxes).toHaveBeenCalledWith({ submitted: true });
      expect(templates.staffDropboxListTemplate).toHaveBeenCalled();
    });
  });

  describe('GET /dropboxes/new', () => {
    it('redirects to the dropboxes page if logged in', async () => {
      authorize.mockImplementationOnce(() => true);
      const res = await handler(evt('GET', 'dropboxes/new'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes');
    });

    it('redirects to existing dropbox if session', async () => {
      authorize.mockImplementationOnce(() => false);
      getSession.mockImplementationOnce(() => ({ dropboxId: '1' }));
      const res = await handler(evt('GET', 'dropboxes/new'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/1');
    });

    it('creates new dropxbox and redirects if no session', async () => {
      authorize.mockImplementationOnce(() => false);
      getSession.mockImplementationOnce(() => false);
      createEmptyDropbox.mockImplementationOnce(() => ({ id: '2' }));
      const res = await handler(evt('GET', 'dropboxes/new'));
      expect(createEmptyDropbox).toHaveBeenCalled();
      expect(createSessionToken).toHaveBeenCalledWith('2');
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/2');
    });
  });

  describe('GET /dropboxes/:id', () => {
    it('redirects to view page if logged in', async () => {
      authorize.mockImplementationOnce(() => true);
      const res = await handler(evt('GET', '/dropboxes/1'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/1/view');
    });

    it('redirects to new dropbox if no existing session', async () => {
      getSession.mockImplementationOnce(() => false);
      const res = await handler(evt('GET', '/dropboxes/1'));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/new');
    });

    it('redirects to new dropbox if problem getting dropbox', async () => {
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

    it('shows the create dropbox template', async () => {
      getSession.mockImplementationOnce(() => ({ dropboxId: '1' }));
      getDropbox.mockImplementationOnce(() => true);
      getSecureUploadUrl.mockImplementationOnce(() => ({
        url: '',
        fields: '',
        documentId: ''
      }));

      await handler(evt('GET', '/dropboxes/1'));

      expect(templates.createDropboxTemplate).toHaveBeenCalled();
    });
  });

  describe('GET /dropboxes/:id/view', () => {
    it('redirects to login if not logged in', async () => {
      authorize.mockImplementationOnce(() => false);

      const res = await handler(evt('GET', '/dropboxes/1/view'));

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('shows dropbox', async () => {
      const dropbox = { hello: 'hello' };
      authorize.mockImplementationOnce(() => true);
      getDropbox.mockImplementationOnce(() => dropbox);

      await handler(evt('GET', '/dropboxes/1/view'));

      expect(templates.readonlyDropboxTemplate).toHaveBeenCalledWith({
        dropbox,
        dropboxId: '1',
        isProd: false,
        isStaff: true
      });
    });
  });

  describe('GET /dropboxes/:dropboxId/files/:fileId', () => {
    it('redirects to new dropbox if no valid session or login', async () => {
      authorize.mockImplementationOnce(() => false);
      getSession.mockImplementationOnce(() => false);

      const res = await handler(evt('GET', '/dropboxes/12/files/1'));

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/new');
    });

    it('allows it if staff member', async () => {
      authorize.mockImplementationOnce(() => true);
      getSession.mockImplementationOnce(() => false);

      await handler(evt('GET', '/dropboxes/12/files/1'));

      expect(getDropbox).toHaveBeenCalled();
    });

    it('allows it if valid session', async () => {
      authorize.mockImplementationOnce(() => false);
      getSession.mockImplementationOnce(() => ({ dropboxId: '12' }));

      await handler(evt('GET', '/dropboxes/12/files/1'));

      expect(getDropbox).toHaveBeenCalled();
    });

    it('returns a matching file', async () => {
      const dropbox = {
        uploads: [
          {
            id: '1',
            downloadUrl: 'http://link'
          }
        ]
      };
      authorize.mockImplementationOnce(() => true);
      getDropbox.mockImplementationOnce(() => dropbox);

      const res = await handler(evt('GET', '/dropboxes/12/files/1'));

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('http://link');
    });

    it('returns a 404 if no matching file', async () => {
      const dropbox = {
        uploads: []
      };
      authorize.mockImplementationOnce(() => true);
      getDropbox.mockImplementationOnce(() => dropbox);

      const res = await handler(evt('GET', '/dropboxes/12/files/1'));

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /dropboxes/:dropboxId/files/:fileId', () => {
    it('deletes the file if valid session', async () => {
      getSession.mockImplementationOnce(() => ({ dropboxId: '12' }));
      const res = await handler(
        evt('POST', '/dropboxes/12/files/1', { _method: 'DELETE' })
      );
      expect(deleteDocument).toHaveBeenCalledWith('12', '1');
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/12');
    });

    it('redirects to new dropbox if no valid session', async () => {
      getSession.mockImplementationOnce(() => false);
      const res = await handler(evt('POST', '/dropboxes/12/files/1', {}));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/new');
    });
  });

  describe('POST /dropboxes/:id/archive', () => {
    it('redirects to login if not logged in', async () => {
      authorize.mockImplementationOnce(() => false);
      const res = await handler(evt('POST', '/dropboxes/1/archive', {}));
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    it('updates the archive status and redirects to view', async () => {
      authorize.mockImplementationOnce(() => true);
      const res = await handler(
        evt('POST', '/dropboxes/1/archive', { archiveStatus: 'true' })
      );
      expect(updateArchiveStatus).toHaveBeenCalledWith({
        dropboxId: '1',
        archiveStatus: 'true'
      });
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/dropboxes/1/view');
    });
  });
});
