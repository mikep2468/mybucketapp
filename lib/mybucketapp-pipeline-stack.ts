import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';

export interface PipelineStackProps extends cdk.StackProps { }

export class PipelineStack extends cdk.Stack {
    constructor(app: cdk.App, id: string, props: PipelineStackProps) {
        super(app, id, props);

        /*
        Asset Buckets are used to pass certain directories between stages, such as .git/* cdk.out/* etc. etc. This helps speed up build times between jobs
        */
        const sourceOutput = new codepipeline.Artifact();
        const cdkBuildOutput = new codepipeline.Artifact('mybucketapp-CdkBuildOutput');
        const cdkBuildOutputDiff = new codepipeline.Artifact('mybucketapp-CdkDiffOutput');
        const cdkBuildOutputDeploy = new codepipeline.Artifact('mybucketapp-CdkDeployOutput');

        // Performs a Git clone from the cinch-labs Github org

 
        const sourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
            actionName: 'GitHub',
            connectionArn: 'arn:aws:codestar-connections:eu-west-2:375064697969:connection/1f7d4fe8-df9c-4271-a9ab-4954bb1d060a',
            owner: 'mikep2468',
            repo: 'mybucketapp',
            branch: 'main',
            output: sourceOutput
        });

        /*
        This is the first CodeBuild stage in our pipeline.
        Performs a CDK Synth which generates the underlying CF templates, assumes role into another account.
        */
        const cdkSynthStage = new codebuild.PipelineProject(this, 'mybucketapp-pipeline-CdkSynth', {
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: {
                        commands: [
                            // Install NPM
                            'npm i -g npm',
                            // Perform clean NPM install (requires package-lock.json)
                            'npm ci',
                            // Install AWS CDK
                            'npm i -g aws-cdk',
                        ],
                    },
                    build: {
                        commands: [
                            // cdk synth <stack>
                            'cdk synth MybucketappStack',
                        ],
                    },
                },
                artifacts: {
                    'base-directory': 'cdk.out',
                    files: [
                        '*',
                    ],
                },
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
            },
        });

        /*
        This creates the IAM Service Role which CodeBuild will use for its AWS Permissions.
        */
        const codeBuildCDKRole = new iam.Role(this, 'mybucketapp-codeBuildCDKRole', {
            roleName: "mybucketapp-codeBuildCDKRole",
            assumedBy: new iam.CompositePrincipal(
                new iam.ServicePrincipal('codebuild.amazonaws.com'),
                new iam.ServicePrincipal('codepipeline.amazonaws.com')
            )
        });

        // Gives the Service Role some Permissions it needs, such as CloudFormation and Assuming Role(s).
        codeBuildCDKRole.addToPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: [
                'cloudformation:*',
                'sts:AssumeRole',
                's3:*'
            ],
        }));

        // This is the second build stage in our pipeline with CodeBuild. Performs a CDK Diff to check what changes it wants to make.
        const cdkDiffStage = new codebuild.PipelineProject(this, 'mybucketapp-pipeline-CdkDiff', {
            role: codeBuildCDKRole,
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: {
                        commands: [
                            'npm i -g npm && npm ci && npm i -g aws-cdk',
                            'npm install -g awsudo'
                        ],
                    },
                    build: {
                        commands: [
                            'awsudo arn:aws:iam::375064697969:role/mybucketapp-codeBuildCDKRole cdk diff MybucketappStack'
                        ],
                    },
                },
                artifacts: {
                    'base-directory': 'cdk.out',
                    files: [
                        '*',
                    ],
                },
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
            },
        });

        // This is the third build stage in our pipeline with CodeBuild. Performs a CDK Deploy to make our IaC live in AWS in the account we assume into.
        const cdkDeployStage = new codebuild.PipelineProject(this, 'mybucketapp-pipeline-CdkDeploy', {
            role: codeBuildCDKRole,
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: {
                        commands: [
                            'npm i -g npm && npm ci && npm i -g aws-cdk',
                            'npm install -g awsudo'
                        ]
                    },
                    build: {
                        commands: [
                            'awsudo arn:aws:iam::375064697969:role/mybucketapp-codeBuildCDKRole cdk deploy MybucketappStack'
                        ],
                    },
                },
                artifacts: {
                    'base-directory': 'cdk.out',
                    files: [
                        '*',
                    ],
                },
            }),
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
            },
        });


        // This defines the overall structure of our CodePipeline Pipeline, and the stages it will have inside of it.
        new codepipeline.Pipeline(this, 'MyBucketapp-Pipeline', {
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        sourceAction
                    ],
                },
                {
                    stageName: 'Build',
                    actions: [
                        new codepipeline_actions.CodeBuildAction({
                            actionName: 'CDKSynth',
                            project: cdkSynthStage,
                            input: sourceOutput,
                            outputs: [cdkBuildOutput],
                        }),
                        new codepipeline_actions.CodeBuildAction({
                            actionName: 'CDKDiff',
                            project: cdkDiffStage,
                            input: sourceOutput,
                            outputs: [cdkBuildOutputDiff],
                        }),
                    ],
                },
                {
                    stageName: 'Deploy',
                    actions: [
                        new codepipeline_actions.CodeBuildAction({
                            actionName: 'CDKDeploy',
                            project: cdkDeployStage,
                            input: sourceOutput,
                            outputs: [cdkBuildOutputDeploy],
                        }),
                    ],
                },
            ],
        });
    }
}