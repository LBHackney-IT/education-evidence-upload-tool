const { Customer } = require('../domain/dropbox');

function validValueOrNull(oldValue) {
  if (typeof oldValue === 'string') {
    const newValue = oldValue.trim();
    return newValue.length > 0 ? newValue : null;
  }
  return null;
}

module.exports = ({ gateways: { dropbox: dropboxes } }) => {
  return async (dropboxId, fields) => {
    const dropbox = await dropboxes.get(dropboxId);

    if (!dropbox) {
      throw new Error('Invalid dropbox');
    }

    const { description, firstName, dob, lastName, parentsEmail } = fields;

    dropbox.description = validValueOrNull(description);

    dropbox.assign(
      new Customer({
        firstName: firstName.trim(),
        parentsEmail: parentsEmail.trim(),
        lastName: lastName.trim(),
        dob: dob
      })
    );

    await dropboxes.save(dropbox);
  };
};
