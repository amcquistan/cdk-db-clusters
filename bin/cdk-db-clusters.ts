#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MyNetworkStack } from '../lib/network-stack';
import { MyDatabaseClusterStack } from '../lib/original-cluster-stack';
import { MySnapshotDatabaseClusterStack } from '../lib/snapshot-cluster-stack';

const app = new cdk.App();
const networkStack = new MyNetworkStack(app, 'MyNetworkStack');
new MyDatabaseClusterStack(app, "MyDatabaseClusterStack", {
  vpc: networkStack.vpc
});
new MySnapshotDatabaseClusterStack(app, "MySnapshotDatabaseClusterStack", {
  vpc: networkStack.vpc,
  snapshotId: "my-db-original-snapshot"
});
