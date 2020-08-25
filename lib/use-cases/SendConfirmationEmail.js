module.exports = ({ gateways: { dropbox: dropboxes, notify } }) => {
  return async dropboxId => {
    try {
      const dropbox = await dropboxes.get(dropboxId);
      if (!dropbox) throw new Error('Invalid dropbox');
      await notify.send({
        email: dropbox.parentsEmail,
        referenceId: dropboxId,
        replyToId: process.env.GOV_NOTIFY_REPLY_TO_ID,
        templateId: process.env.GOV_NOTIFY_CONFIRMATION_TEMPLATE_ID,
        templateVars: {}
      });
    } catch (err) {
      console.log('Could not send confirmation email:' + err);
    }
  };
};
