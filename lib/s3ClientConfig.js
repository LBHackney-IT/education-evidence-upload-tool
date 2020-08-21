const AWS = require('aws-sdk');

module.exports = ({ bucket, stage }) => {
  const s3Config = { s3ForcePathStyle: true };
  if (stage === 'dev' || stage === 'test') {
    s3Config.endpoint = new AWS.Endpoint('http://localhost:8100');
    s3Config.accessKeyId = 'S3RVER';
    s3Config.secretAccessKey = 'S3RVER';
  }
  const client = new AWS.S3(s3Config);
  return { client, bucket, bucketName: bucket };
};
