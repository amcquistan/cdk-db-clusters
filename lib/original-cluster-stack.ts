import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";

import { Construct } from "constructs";


export interface MyDatabaseClusterProps extends cdk.StackProps {
  readonly vpc: ec2.Vpc;
}


export class MyDatabaseClusterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MyDatabaseClusterProps) {
    super(scope, id, props);

    const cluster = new rds.DatabaseCluster(this, "my-db-cluster", {
      clusterIdentifier: "my-db-original",
      engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_11_13 }),
      instanceProps: {
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
        }
      },
      storageEncrypted: true
    });
    cluster.addRotationSingleUser({
      automaticallyAfter: cdk.Duration.days(1)
    });
    cluster.connections.allowFrom(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(cluster.clusterEndpoint.port)
    );

    new cdk.CfnOutput(this, "cluster-host", {
      value: cluster.clusterEndpoint.hostname
    });
    new cdk.CfnOutput(this, "cluster-port", {
      value: `${cluster.clusterEndpoint.port}`
    });
    new cdk.CfnOutput(this, "cluster-secret", {
      value: cluster.secret?.secretArn!
    });
  }
}
