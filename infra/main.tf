# Root orchestration file.
# All resources are defined in their respective files:
#   vpc.tf        – VPC, subnets, NAT, security groups
#   rds.tf        – RDS MySQL instance
#   iam.tf        – Lambda IAM role and policies
#   cognito.tf    – Cognito User Pool and App Client
#   ses.tf        – SES sender identity
#   lambda.tf     – Lambda functions and CloudWatch log groups
#   api-gateway.tf – HTTP API, JWT authorizer, routes and integrations
#   outputs.tf    – Stack outputs

# Data sources used across modules
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
