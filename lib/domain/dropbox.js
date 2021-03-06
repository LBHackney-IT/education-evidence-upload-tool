const { nanoid } = require('nanoid');

class Document {
  constructor({ id, filename, description, downloadUrl }) {
    this.id = id;
    this.filename = filename;
    this.description = description;
    this.downloadUrl = downloadUrl;
  }
}

class Customer {
  constructor({ firstName, lastName, dob, parentsEmail }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.dob = dob;
    this.parentsEmail = parentsEmail;
  }
}

class Dropbox {
  constructor({
    id,
    created,
    submitted,
    description,
    customer,
    archived,
    rejectReason
  }) {
    this.id = id;
    this.created = created;
    this.submitted = submitted;
    this.description = description;
    this.customer = customer;
    this.archived = archived;
    this.rejectReason = rejectReason;
  }

  /**
   * Assigns a dropbox to a customer, after which the dropbox is considered
   * "submitted" and can no longer be modified.
   * @param {Customer} customer the customer to assign
   */
  assign(customer) {
    if (!(customer instanceof Customer)) {
      throw new Error(
        `expected "Customer", got "${customer.constructor.firstName}"`
      );
    }

    this.customer = customer;
    this.submitted = new Date(Date.now()).toISOString();
  }

  get isSubmitted() {
    return this.submitted !== null;
  }

  static empty() {
    return new Dropbox({
      id: nanoid(20),
      created: new Date(Date.now()).toISOString(),
      submitted: null,
      description: null,
      customer: null,
      archived: null
    });
  }
}

module.exports = { Document, Dropbox, Customer };
