module.exports = ({ gateways: { dropbox: dropboxes } }) => {
  return async ({ dropboxId, rejectReason }) => {
    try {
      const dropbox = await dropboxes.get(dropboxId);
      if (!dropbox) throw new Error('Invalid dropbox');
      dropbox.rejectReason = rejectReason;
      dropbox.archived = 'true';
      await dropboxes.save(dropbox);
    } catch (err) {
      console.log(`Error rejecting dropbox ${dropboxId}:` + err);
    }
  };
};
