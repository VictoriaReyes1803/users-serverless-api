variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "besta-users"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# VPC
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (Lambda + RDS)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (NAT Gateway)"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "availability_zones" {
  description = "Availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# RDS
variable "db_name" {
  description = "MySQL database name"
  type        = string
  default     = "besta_users"
}

variable "db_username" {
  description = "MySQL master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "MySQL master password (min 8 characters)"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# SES
variable "ses_sender_email" {
  description = "Verified SES sender email address"
  type        = string
}

variable "ses_notification_email" {
  description = "Email to notify when a new user is created"
  type        = string
  default     = "besta-test@mailinator.com"
}

# Lambda
variable "lambda_zip_path" {
  description = "Path to the Lambda deployment package zip"
  type        = string
  default     = "../function.zip"
}

variable "lambda_memory_mb" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout_seconds" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}
