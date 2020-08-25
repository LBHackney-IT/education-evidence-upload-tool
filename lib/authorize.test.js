process.env.ALLOWED_GROUPS = ['allowed-group'];
jest.mock('jsonwebtoken');
jest.mock('cookie');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const authorize = require('./authorize');

describe('authorize', () => {
  beforeEach(() => {
    cookie.parse.mockImplementationOnce(() => ({ hackneyToken: '123' }));
  });

  describe('requestAllowed', () => {
    it('returns false if user not in allowed groups', () => {
      jwt.verify.mockImplementationOnce(() => ({ iss: 'Hackney', groups: [] }));
      const req = {
        headers: {
          cookie: 'hello'
        }
      };
      const result = authorize(req);
      expect(result).toBe(false);
    });

    it('returns true if user in allowed groups', () => {
      jwt.verify.mockImplementationOnce(() => ({
        iss: 'Hackney',
        groups: ['allowed-group']
      }));
      const req = {
        headers: {
          cookie: 'hello'
        }
      };
      const result = authorize(req);
      expect(result).toBe(true);
    });
  });
});
