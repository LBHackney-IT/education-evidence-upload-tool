const { Customer } = require('../domain/dropbox');

module.exports = ({ gateways: { dropbox: dropboxes } }) => {
  return async (dropboxId, fields) => {
    const dropbox = await dropboxes.get(dropboxId);

    if (!dropbox) {
      throw new Error('Invalid dropbox');
    }

    const { description, firstName, dob, lastName, parentsEmail } = fields;

    dropbox.description = description;

    dropbox.assign(
      new Customer({
        firstName: firstName,
        parentsEmail: parentsEmail,
        lastName: lastName,
        dob: dob
      })
    );

    await dropboxes.save(dropbox);
  };
};
