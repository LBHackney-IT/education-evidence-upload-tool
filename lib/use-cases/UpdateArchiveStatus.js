module.exports = ({ log, gateways: { dropbox: dropboxes } }) => {
  return async ({ dropboxId, archiveStatus }) => {
    try {
      const dropbox = await dropboxes.get(dropboxId);

      if (!dropbox) {
        throw new Error('Invalid dropbox');
      }

      dropbox.archived = archiveStatus;
      await dropboxes.save(dropbox);
    } catch (err) {
      log.error('error', err);
    }
  };
};
