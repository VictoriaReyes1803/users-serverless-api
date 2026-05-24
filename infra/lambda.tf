locals {
  lambda_env = {
    DB_HOST                = aws_db_instance.main.address
    DB_PORT                = tostring(aws_db_instance.main.port)
    DB_NAME                = var.db_name
    DB_USER                = var.db_username
    DB_PASSWORD            = var.db_password
    AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    SES_SENDER_EMAIL       = var.ses_sender_email
    SES_NOTIFICATION_EMAIL = var.ses_notification_email
    NODE_ENV               = var.environment
  }

  lambda_vpc_config = {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  functions = {
    createUser = { handler = "handlers/createUser.handler", description = "Create a new user" }
    getUser    = { handler = "handlers/getUser.handler",    description = "Get a user by ID" }
    listUsers  = { handler = "handlers/listUsers.handler",  description = "List users paginated" }
    updateUser = { handler = "handlers/updateUser.handler", description = "Update a user" }
    deleteUser = { handler = "handlers/deleteUser.handler", description = "Delete a user" }
  }
}

resource "aws_lambda_function" "functions" {
  for_each = local.functions

  function_name = "${var.project_name}-${each.key}"
  description   = each.value.description
  role          = aws_iam_role.lambda.arn
  filename      = var.lambda_zip_path
  handler       = each.value.handler
  runtime       = "nodejs20.x"
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds

  # try() allows `terraform plan` to run without the zip; the hash is required for apply
  source_code_hash = try(filebase64sha256(var.lambda_zip_path), null)

  environment {
    variables = local.lambda_env
  }

  vpc_config {
    subnet_ids         = local.lambda_vpc_config.subnet_ids
    security_group_ids = local.lambda_vpc_config.security_group_ids
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_vpc_access,
    aws_iam_role_policy_attachment.lambda_logs,
    aws_iam_role_policy_attachment.lambda_ses,
  ]
}

resource "aws_lambda_permission" "api_gateway" {
  for_each = local.functions

  statement_id  = "AllowAPIGatewayInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = local.functions
  name              = "/aws/lambda/${var.project_name}-${each.key}"
  retention_in_days = 14
}
