const { Dropbox, Customer } = require('../../domain/dropbox');
const createDocumentGateway = require('./dynamodb');

describe('gateway/dropbox/DynamoDB', () => {
  const options = {
    client: {
      get: jest.fn(),
      put: jest.fn(),
      scan: jest.fn()
    },
    configuration: {
      tables: {
        dropboxes: 'DropboxesTable'
      }
    },
    log: { info: jest.fn(), error: jest.fn() }
  };

  const dropboxRecord = {
    dropboxId: 'dropbox-1',
    created: '2020-04-26T16:00:00+0000',
    submitted: '2020-04-26T18:00:00+0000',
    description: 'A test dropbox',
    firstName: 'Bob',
    lastName: 'Sleigh',
    parentsEmail: 'bob@example.com',
    dob: '2020-04-26'
  };

  describe('get', () => {
    it('returns null if nothing is found', async () => {
      options.client.get.mockImplementation((_, cb) => {
        cb(null, { Item: null });
      });

      const gateway = createDocumentGateway(options);
      const dropbox = await gateway.get('dropbox-1');

      expect(dropbox).toBeNull();
    });

    it('returns a dropbox', async () => {
      options.client.get.mockImplementation((_, cb) => {
        cb(null, { Item: dropboxRecord });
      });

      const gateway = createDocumentGateway(options);
      const dropbox = await gateway.get('dropbox-1');

      expect(dropbox).toBeInstanceOf(Dropbox);
      expect(dropbox).toStrictEqual(
        expect.objectContaining({
          id: dropboxRecord.dropboxId,
          created: dropboxRecord.created,
          submitted: dropboxRecord.submitted,
          description: dropboxRecord.description,
          customer: expect.objectContaining({
            firstName: dropboxRecord.firstName,
            lastName: dropboxRecord.lastName,
            parentsEmail: dropboxRecord.parentsEmail,
            dob: dropboxRecord.dob
          })
        })
      );
    });
  });

  describe('list', () => {
    it('returns a list of dropboxes', async () => {
      options.client.scan.mockImplementation((_, cb) => {
        cb(null, {
          Items: [dropboxRecord, dropboxRecord]
        });
      });

      const gateway = createDocumentGateway(options);
      const dropboxes = await gateway.list();

      expect(dropboxes.length).toBe(2);
      expect(dropboxes.every(db => expect(db).toBeInstanceOf(Dropbox)));
    });
  });

  describe('save', () => {
    let dropbox;

    beforeEach(() => {
      dropbox = Dropbox.empty();
      dropbox.description = 'A test dropbox';
      dropbox.assign(
        new Customer({
          firstName: 'Tom',
          lastName: 'Tom',
          parentsEmail: 'tom@example.org',
          dob: '1991-09-09'
        })
      );

      options.client.put.mockImplementation((_, cb) => cb(null, {}));
    });

    it('persists a dropbox', async () => {
      const gateway = createDocumentGateway(options);
      await gateway.save(dropbox);

      expect(options.client.put).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: options.configuration.tables.dropboxes,
          Item: expect.objectContaining({
            dropboxId: dropbox.id,
            created: dropbox.created,
            submitted: dropbox.submitted,
            description: dropbox.description,
            firstName: dropbox.customer.firstName,
            lastName: dropbox.customer.lastName,
            dob: dropbox.customer.dob,
            parentsEmail: dropbox.customer.parentsEmail
          })
        }),
        expect.any(Function)
      );
    });

    describe('with empty dropbox', () => {
      it('persists a dropbox still', async () => {
        const dropbox = Dropbox.empty();
        const gateway = createDocumentGateway(options);
        await gateway.save(dropbox);

        expect(options.client.put).toHaveBeenCalledWith(
          expect.objectContaining({
            TableName: options.configuration.tables.dropboxes,
            Item: expect.objectContaining({
              dropboxId: dropbox.id,
              created: dropbox.created,
              submitted: null,
              description: dropbox.description
            })
          }),
          expect.any(Function)
        );
      });
    });
  });
});
