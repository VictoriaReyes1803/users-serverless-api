output "api_url" {
  description = "Base URL of the API Gateway endpoint"
  value       = "${aws_apigatewayv2_api.main.api_endpoint}/users"
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "aurora_endpoint" {
  description = "Aurora cluster writer endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "aurora_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.main.port
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret holding the RDS master-user credentials"
  value       = aws_rds_cluster.main.master_user_secret[0].secret_arn
}
