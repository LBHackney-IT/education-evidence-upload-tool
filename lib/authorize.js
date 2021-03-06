const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const jwt_secret = process.env.HACKNEY_TOKEN_SECRET;
const allowedGroups = process.env.ALLOWED_GROUPS
  ? process.env.ALLOWED_GROUPS.split(',')
  : [];

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

const isInAllowedGroup = userGroups => {
  if (process.env.stage === 'dev') return true;
  return userGroups.filter(g => allowedGroups.includes(g)).length > 0;
};

const requestAllowed = tokenPayload => {
  return (
    tokenPayload.iss === 'Hackney' && isInAllowedGroup(tokenPayload.groups)
  );
};

module.exports = req => {
  const token = extractTokenFromCookieHeader(req);
  const decodedToken = decodeToken(token);
  return token && decodedToken && requestAllowed(decodedToken);
};
