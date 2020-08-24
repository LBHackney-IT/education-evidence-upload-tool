const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const jwt_secret = process.env.HACKNEY_TOKEN_SECRET;

const extractTokenFromCookieHeader = req => {
  if (!(req.headers && (req.headers.Cookie || req.headers.cookie))) return null;
  const cookies = cookie.parse(req.headers.Cookie || req.headers.cookie);
  return cookies['hackneyToken'];
};

const decodeToken = token => {
  try {
    return jwt.verify(token, jwt_secret);
  } catch (err) {
    return false;
  }
};

const requestAllowed = tokenPayload => {
  if (tokenPayload.iss === 'Hackney' && tokenPayload.groups) {
    return true;
  }

  return false;
};

module.exports = req => {
  const token = extractTokenFromCookieHeader(req);
  const decodedToken = decodeToken(token);
  return token && decodedToken && requestAllowed(decodedToken);
};