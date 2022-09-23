#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MyNetworkStack } from '../lib/network-stack';
import { MyDatabaseClusterStack } from '../lib/original-cluster-stack';
import { MySnapshotDatabaseClusterStack } from '../lib/snapshot-cluster-stack';

const app = new cdk.App();
const networkStack = new MyNetworkStack(app, 'db-network', {
  stackName: "db-network"
});
new MyDatabaseClusterStack(app, "db-original-cluster", {
  vpc: networkStack.vpc,
  stackName: "db-original-cluster"
});
new MySnapshotDatabaseClusterStack(app, "db-snapshot-cluster", {
  vpc: networkStack.vpc,
  snapshotId: "my-db-original-snapshot",
  stackName: "db-snapshot-cluster"
});
