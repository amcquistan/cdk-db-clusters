
## aws-rds: aurora postgres cluster from snapshot admin secret not correct (wrong secret and wrong password)

When creating an Aurora Postgres database cluster from a snap of another Aurora Postgres cluster the cluster being created does not get associated with the correct secret or password for the admin (ie, default postgres) user. 

Here is a [CDK typescript project in my GitHub account](https://github.com/amcquistan/cdk-db-clusters) that can be used to consistently recreate the problem. 

You can deploy the network and original cluster stacks first to create a fresh VPC and an initial Aurora Postgres cluster with rotating secret integration for admin creds to create a snapshot with.

```
yarn && yarn build && yarn synth
yarn cdk deploy --require-approval=never db-network db-original-cluster
```

The output of the db-original-cluster stack deploy (along with the db-snapshot-cluster used later) will give you the ARN of the secret associated with the db clsuter. The network stack deploys a linux bastion host to connect to and work with the database clusters.

Issue the following within the bastion host to retrieve the secret with db creds and verify the ability to connect to original db cluster. 

```
sudo su - ec2-user
sudo amazon-linux-extras enable postgresql11
sudo yum install postgresql jq -y

SECRET_ARN="INSERT-SECRET-ARN-FROM-CDK-STACK-OUTPUT"

export PGHOST=$(aws secretsmanager get-secret-value --secret-id $SECRET_ARN --region us-east-1 | jq -r '.SecretString' | jq -r '.host')

export PGPORT=$(aws secretsmanager get-secret-value --secret-id $SECRET_ARN --region us-east-1 | jq -r '.SecretString' | jq -r '.port')

export PGUSER=$(aws secretsmanager get-secret-value --secret-id $SECRET_ARN --region us-east-1 | jq -r '.SecretString' | jq -r '.username')

export PGPASSWORD=$(aws secretsmanager get-secret-value --secret-id $SECRET_ARN --region us-east-1 | jq -r '.SecretString' | jq -r '.password')

psql

postgres=> create database words;
postgres=> \c words
words=> create table words (id serial primary key, word varchar(100));
```

Next create a snapshot of the original database cluster using the AWS CLI from the bastion host.

```
aws rds create-db-cluster-snapshot --region us-east-1 \
  --db-cluster-identifier my-db-original \
  --db-cluster-snapshot-identifier my-db-original-snapshot
```

Check the status of it and once it reports available proceed.

```
aws rds describe-db-cluster-snapshots --region us-east-1 \
  --db-cluster-identifier my-db-original \
  --db-cluster-snapshot-identifier my-db-original-snapshot | jq '.DBClusterSnapshots[].Status'
```

Deploy the final stack named db-snapshot-cluster which uses the my-db-original-snapshot to generate 
a new Aurora Postgres cluster. See the snapshot-cluster-stack.ts which initially has the following property commented out.

```
// snapshotCredentials: rds.SnapshotCredentials.fromGeneratedSecret("postgres"),
```

I interpret the behavior while this is commented out as intending to create the new cluster but using the same creds and secret as the original cluster that was used to create the snapshot.

```
yarn cdk deploy --require-approval=never db-snapshot-cluster
```

This will again output the ARN of the secret associated. So at this point I have two secrets.

```
$ aws secretsmanager list-secrets --query 'SecretList[][Name,Description]'
[
    [
        "mydbclusterSecret0915EA2D-tfd5oXZ1u7ln",
        "Generated by the CDK for stack: db-original-cluster"
    ],
    [
        "mysnapshotdbclusterSecretC0-vLOmRhdTugRo",
        "Generated by the CDK for stack: db-snapshot-cluster"
    ]
]
```

If you try to connect to this newly created cluster based off the snapshot you'll get the following error indicating the secret and associated password is incorrect with the secret associated with this snapshot cluster.

```
psql
psql: FATAL:  password authentication failed for user "postgres"
FATAL:  password authentication failed for user "postgres"
```

However if I use the password associated with the original cluster (in secret mydbclusterSecret0915EA2D-tfd5oXZ1u7ln) secret I can connect.

Next destroy the db-snapshot-cluster stack to try with the snapshotCredentials property.

```
yarn cdk destroy db-snapshot-cluster
```

Then uncomment the following line which I interpret this property's use as generating a new secret with a different password

```
snapshotCredentials: rds.SnapshotCredentials.fromGeneratedSecret("postgres"),
```

redeploy the stack

```
yarn cdk deploy --require-approval=never db-snapshot-cluster
```

You'll see this creates two secrets but neither of them have the correct password. 

```
$ aws secretsmanager list-secrets --query 'SecretList[][Name,Description]'
[
    [
        "mydbclusterSecret0915EA2D-tfd5oXZ1u7ln",
        "Generated by the CDK for stack: db-original-cluster"
    ],
    [
        "mysnapshotdbclusterSecretC0-76diLsVlNMF7",
        "Generated by the CDK for stack: db-snapshot-cluster"
    ],
    [
        "dbsnapshotclustermysnapshot-eERV4eBlar2q",
        "Generated by the CDK for stack: db-snapshot-cluster"
    ]
]
```

However, if you try the password in the original cluster's secret that will successfully connect to this new cluster generated from a snapshot.











I expect the database cluster to be created from a snapshot and to have a secret that has the appropriate password in it to connect to the database and I also expect the secret will still be automatically rotated.













