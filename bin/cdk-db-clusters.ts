#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkDbClustersStack } from '../lib/cdk-db-clusters-stack';

const app = new cdk.App();
new CdkDbClustersStack(app, 'CdkDbClustersStack');
