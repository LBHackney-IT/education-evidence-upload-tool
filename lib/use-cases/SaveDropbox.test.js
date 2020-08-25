const { Dropbox } = require('../domain/dropbox');

describe('use-case/save dropbox', () => {
  const options = {
    gateways: {
      dropbox: {
        get: jest.fn(),
        save: jest.fn(dropbox => Promise.resolve(dropbox))
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const saveDropbox = require('./SaveDropbox')(options);

  describe('with an invalid dropbox id', () => {
    beforeEach(() => {
      options.gateways.dropbox.get.mockImplementation(() => {
        return Promise.resolve(null);
      });
    });

    it('throws an "invalid dropbox" error', async () => {
      expect(saveDropbox('db123456', {})).rejects.toBeInstanceOf(Error);
    });
  });

  describe('with a valid dropbox id', () => {
    const expectedDropbox = new Dropbox({
      id: 'abc123456',
      created: '2020-04-26T18:00:00+0000',
      description: 'A test dropbox'
    });

    beforeEach(() => {
      options.gateways.dropbox.get.mockImplementation(() => {
        return Promise.resolve(expectedDropbox);
      });
    });

    it('assigns a customer to the dropbox if customer name is set', async () => {
      const assign = jest.spyOn(expectedDropbox, 'assign');

      await saveDropbox(expectedDropbox.id, {
        firstName: 'Tess',
        lastName: 'Ting',
        parentsEmail: '1',
        dob: '1-1-1990'
      });

      expect(assign).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Tess',
          lastName: 'Ting',
          parentsEmail: '1',
          dob: '1-1-1990'
        })
      );
    });

    it('sets the description field when provided', async () => {
      const expectedDescription = 'Hello world';
      await saveDropbox(expectedDropbox.id, {
        firstName: 'Tess',
        lastName: 'Ting',
        parentsEmail: '1',
        dob: '1-1-1993',
        description: expectedDescription
      });

      expect(expectedDropbox.description).toBe(expectedDescription);
    });

    it('saves the updated dropbox', async () => {
      await saveDropbox(expectedDropbox.id, {
        firstName: 'Tess',
        lastName: 'Ting',
        parentsEmail: '1',
        dob: '1-1-1993'
      });

      expect(options.gateways.dropbox.save).toHaveBeenCalledWith(
        expectedDropbox
      );
    });
  });
});
