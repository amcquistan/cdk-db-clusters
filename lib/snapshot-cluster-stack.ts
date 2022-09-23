import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";

import { Construct } from "constructs";


export interface MySnapshotDatabaseClusterProps extends cdk.StackProps {
  readonly vpc: ec2.Vpc;
  readonly snapshotId: string;
}


export class MySnapshotDatabaseClusterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MySnapshotDatabaseClusterProps) {
    super(scope, id, props);
    
    const cluster = new rds.DatabaseClusterFromSnapshot(this, "my-snapshot-db-cluster", {
      snapshotIdentifier: props.snapshotId,
      snapshotCredentials: rds.SnapshotCredentials.fromGeneratedSecret("postgres"),
      clusterIdentifier: "my-snapshot-db",
      engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_11_13 }),
      instanceProps: {
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
        }
      }
    });
    cluster.connections.allowFrom(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(cluster.clusterEndpoint.port)
    );

    new cdk.CfnOutput(this, "snapshot-cluster-host", {
      value: cluster.clusterEndpoint.hostname
    });
    new cdk.CfnOutput(this, "snapshot-cluster-port", {
      value: `${cluster.clusterEndpoint.port}`
    });
    new cdk.CfnOutput(this, "snapshot-cluster-secret", {
      value: cluster.secret?.secretArn!
    });
  }
}
