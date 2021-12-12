import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';

export class MybucketappStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    
    new s3.Bucket(this, 'mybucketapp-bucket-1-10112021', {
      bucketName: 'mikestestbucketapp-bucket-111',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: false,
    });

    new s3.Bucket(this, 'mybucketapp-bucket-2-', {
      bucketName: 'mikestestbucketapp-bucket-222',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: false,
    });
    
  
  }
}
