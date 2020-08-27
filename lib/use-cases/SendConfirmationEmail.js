const log = require('../log')();
module.exports = ({ gateways: { dropbox: dropboxes, notify } }) => {
  return async dropboxId => {
    try {
      const dropbox = await dropboxes.get(dropboxId);
      if (!dropbox) throw new Error('Invalid dropbox');
      await notify.send({
        email: dropbox.customer.parentsEmail,
        referenceId: dropboxId,
        templateId: process.env.GOV_NOTIFY_CONFIRMATION_TEMPLATE_ID,
        templateVars: { feedbackFormUrl: process.env.FEEDBACK_FORM_URL }
      });
    } catch (err) {
      log.error('Could not send confirmation email', err);
    }
  };
};
