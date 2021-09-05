#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MybucketappStack } from '../lib/mybucketapp-stack';
import { PipelineStack} from '../lib/mybucketapp-pipeline-stack';

const app = new cdk.App();
new MybucketappStack(app, 'MybucketappStack', {
  env: { account: '375064697969', region: 'eu-west-2' }, //deploy only to my personal account, London region

});

new PipelineStack(app, 'PipelineStack', {
  env: { account: '375064697969', region: 'eu-west-2' }, //deploy only to my personal account, London region

});
