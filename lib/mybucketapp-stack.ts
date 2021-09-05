import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';

export class MybucketappStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    
    new s3.Bucket(this, 'mybucketapp-bucket-1-05092021', {
      bucketName: 'mybucketapp-bucket-1-05092021',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: false,
    });

    new s3.Bucket(this, 'mybucketapp-bucket-2-05092021', {
      bucketName: 'mybucketapp-bucket-2-05092021',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: false,
    });
  }
}
