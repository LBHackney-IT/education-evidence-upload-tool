const { Customer } = require('../domain/dropbox');

function isValidNonEmptyString(input) {
  if (typeof input === 'string') {
    return input.trim().length > 0;
  }

  return false;
}

function validValueOrNull(input) {
  return isValidNonEmptyString(input) ? input.trim() : null;
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
