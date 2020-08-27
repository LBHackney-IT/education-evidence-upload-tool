const {
  getDropbox,
  getDropboxes,
  createEmptyDropbox,
  deleteDocument,
  getSecureUploadUrl,
  getSession,
  createSessionToken,
  templates,
  authorize,
  updateArchiveStatus,
  rejectDropbox
} = require('./lib/Dependencies');
const api = require('lambda-api')();
const log = require('./lib/log')();
const redirectToDropboxesIfAuth = (req, res, next) => {
  if (authorize(req)) return res.redirect('/dropboxes');
  next();
};

const redirectToLoginIfNoAuth = (req, res, next) => {
  if (!authorize(req)) return res.redirect('/login');
  next();
};

api.use(async (req, res, next) => {
  log.info('REQUEST', { method: req.method, path: req.path });
  next();
});

api.get('/assets/:folder/:filename', async (req, res) => {
  res.sendFile(req.params.filename, {
    root: `static/${req.params.folder}/`
  });
});

api.get('/', async (req, res) => {
  res.redirect('/dropboxes/new');
});

api.get('/login', redirectToDropboxesIfAuth, async (req, res) => {
  const html = templates.loginTemplate({
    feedbackFormUrl: process.env.FEEDBACK_FORM_URL,
    isProd: process.env.stage === 'production',
    redirectUrl: process.env.URL_PREFIX
  });
  res.html(html);
});

api.get('/logout', async (req, res) => {
  res
    .clearCookie('hackneyToken', { domain: '.hackney.gov.uk', path: '/' })
    .send();
  res.redirect('/login');
});

api.get('/restart', async (req, res) => {
  res.clearCookie('customerToken').send();
  res.redirect('/dropboxes/new');
});

api.get('/dropboxes', redirectToLoginIfNoAuth, async (req, res) => {
  const dropboxes = await getDropboxes({ submitted: true });
  const html = templates.staffDropboxListTemplate({
    dropboxes,
    feedbackFormUrl: process.env.FEEDBACK_FORM_URL,
    isProd: process.env.stage === 'production'
  });
  res.html(html);
});

api.get('/dropboxes/new', redirectToDropboxesIfAuth, async (req, res) => {
  const session = getSession(req.headers);
  if (session && session.dropboxId) {
    return res.redirect(`/dropboxes/${session.dropboxId}`);
  }

  const dropbox = await createEmptyDropbox();
  res.cookie('customerToken', createSessionToken(dropbox.id), {
    maxAge: 86400 * 30 * 1000
  });
  res.redirect(`/dropboxes/${dropbox.id}`);
});

api.get('/dropboxes/:dropboxId', async (req, res) => {
  const dropboxId = req.params.dropboxId;
  if (authorize(req)) return res.redirect(`/dropboxes/${dropboxId}/view`);
  const session = getSession(req.headers);
  if (!session || (session && session.dropboxId !== dropboxId)) {
    return res.redirect('/dropboxes/new');
  }

  const dropbox = await getDropbox(dropboxId);

  if (!dropbox) {
    res.clearCookie('customerToken');
    return res.redirect('/dropboxes/new');
  }

  if (dropbox.submitted) {
    return res.html(
      templates.readonlyDropboxTemplate({
        dropbox,
        dropboxId,
        feedbackFormUrl: process.env.FEEDBACK_FORM_URL,
        isProd: process.env.stage === 'production'
      })
    );
  }

  const { url, fields, documentId } = await getSecureUploadUrl(dropboxId);

  res.html(
    templates.createDropboxTemplate({
      dropbox,
      dropboxId,
      feedbackFormUrl: process.env.FEEDBACK_FORM_URL,
      isProd: process.env.stage === 'production',
      secureDocumentId: documentId,
      secureUploadUrl: url,
      secureUploadFields: fields
    })
  );
});

api.get(
  '/dropboxes/:dropboxId/view',
  redirectToLoginIfNoAuth,
  async (req, res) => {
    const dropbox = await getDropbox(req.params.dropboxId);
    const html = templates.readonlyDropboxTemplate({
      dropbox,
      dropboxId: req.params.dropboxId,
      feedbackFormUrl: process.env.FEEDBACK_FORM_URL,
      isProd: process.env.stage === 'production',
      isStaff: true
    });
    res.html(html);
  }
);

api.get('/dropboxes/:dropboxId/files/:fileId', async (req, res) => {
  const { dropboxId, fileId } = req.params;
  const session = getSession(req.headers);
  const allowed =
    authorize(req) || (session && session.dropboxId === dropboxId);
  if (!allowed) return res.redirect('/dropboxes/new');

  const dropbox = await getDropbox(dropboxId);

  const file = dropbox.uploads.find(upload => upload.id === fileId);
  if (!file) return res.sendStatus(404);

  res.redirect(file.downloadUrl);
});

api.post('/dropboxes/:dropboxId/files/:fileId', async (req, res) => {
  const session = getSession(req.headers);
  if (session && session.dropboxId === req.params.dropboxId) {
    if (req.body._method === 'DELETE') {
      await deleteDocument(req.params.dropboxId, req.params.fileId);
    }
    return res.redirect(`/dropboxes/${req.params.dropboxId}`);
  }
  return res.redirect('/dropboxes/new');
});

api.post(
  '/dropboxes/:dropboxId/archive',
  redirectToLoginIfNoAuth,
  async (req, res) => {
    const archiveStatus = req.body.archiveStatus === 'true';

    await updateArchiveStatus({
      dropboxId: req.params.dropboxId,
      archiveStatus
    });

    if (archiveStatus) return res.redirect(`/dropboxes`);
    return res.redirect(`/dropboxes/${req.params.dropboxId}/view`);
  }
);

api.post(
  '/dropboxes/:dropboxId/reject',
  redirectToLoginIfNoAuth,
  async (req, res) => {
    await rejectDropbox({
      dropboxId: req.params.dropboxId,
      rejectReason: req.body.rejectReason
    });

    return res.redirect(`/dropboxes/${req.params.dropboxId}/view`);
  }
);

module.exports = {
  handler: async (event, context) => {
    return await api.run(event, context);
  }
};
