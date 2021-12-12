#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MybucketappStack } from '../lib/mybucketapp-stack';
import { PipelineStack} from '../lib/mybucketapp-pipeline-stack';

const app = new cdk.App();
new MybucketappStack(app, 'MybucketappStack', {
  env: { account: '272914394419', region: 'eu-west-1' }, //deploy only to Sandbox, Ireland region

});

new PipelineStack(app, 'PipelineStack', {
  env: { account: '272914394419', region: 'eu-west-1' }, //deploy only to Sandbox, Ireland region

});
