module.exports = ({ client, log }) => {
  async function send({ email, referenceId, templateId, templateVars }) {
    try {
      log.info('Sending email to', { email });
      const response = await client.sendEmail(templateId, email, {
        personalisation: templateVars,
        reference: referenceId
      });
      log.info('Sending email succeeded', {
        response: JSON.stringify(response.body)
      });
    } catch (err) {
      log.error('Sending email failed', { error: err });
    }
  }
  return { send };
};
