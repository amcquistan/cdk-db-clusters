import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";

import { Construct } from "constructs";


export class MyNetworkStack extends cdk.Stack {
  readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "vpc", { maxAzs: 2 });
    const bastion = new ec2.BastionHostLinux(this, "bastion", { vpc: this.vpc });
    bastion.role.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ["secretsmanager:GetSecretValue", "rds:*"],
      effect: iam.Effect.ALLOW,
      resources: ["*"]
    }));

    new cdk.CfnOutput(this, "vpcId", {
      value: this.vpc.vpcId
    });
  }
}
