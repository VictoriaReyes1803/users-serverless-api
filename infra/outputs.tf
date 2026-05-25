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

output "rds_endpoint" {
  description = "RDS MySQL endpoint (without port)"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "RDS MySQL port"
  value       = aws_db_instance.main.port
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "db_secret_arn" {
  description = "ARN of the Secrets Manager secret holding the RDS master-user credentials"
  value       = aws_db_instance.main.master_user_secret[0].secret_arn
}
