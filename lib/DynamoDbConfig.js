module.exports = ({ stage, dropboxesTable }) => {
  const dbConfig = {};
  if (stage === 'dev' || stage === 'test') {
    dbConfig.region = 'localhost';
    dbConfig.endpoint = 'http://localhost:8000';
    dbConfig.accessKeyId = 'AWS_ACCESS_KEY_ID';
    dbConfig.secretAccessKey = 'AWS_SECRET_ACCESS_KEY';
    dbConfig.sslEnabled = false;
  }
  return {
    dbConfig,
    tables: {
      dropboxes: dropboxesTable
    }
  };
};
