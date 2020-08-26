module.exports = ({ gateways: { dropbox: dropboxes, notify } }) => {
  return async ({ dropboxId, rejectReason }) => {
    try {
      const dropbox = await dropboxes.get(dropboxId);
      if (!dropbox) throw new Error('Invalid dropbox');

      await notify.send({
        email: dropbox.customer.parentsEmail,
        referenceId: dropboxId,
        templateId: process.env.GOV_NOTIFY_REJECTION_TEMPLATE_ID,
        templateVars: { rejectReason }
      });

      dropbox.rejectReason = rejectReason;
      dropbox.archived = 'true';

      await dropboxes.save(dropbox);
    } catch (err) {
      console.log(`Error rejecting dropbox ${dropboxId}:` + err);
    }
  };
};
