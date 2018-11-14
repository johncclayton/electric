variable "aws_access_key" {}
variable "aws_secret_key" {}

variable "branch_name" {
  description = "The name of the branch you want to use; this of course impacts the code that is used to initialize the build system."
  default     = "master"
}

variable "aws_vpc_cidr" {
  description = "CIDR for the VPC"
  default     = "10.0.0.0/16"
}

variable "aws_public_subnet_cidr" {
  description = "CIDR for the public subnet"
  default     = "10.0.1.0/24"
}

variable "aws_ami" {
  description = "Amazon AMI - type machine you want, is region specific - this specifies eu-west-1 Ubuntu"
  default     = "ami-00035f41c82244dab"
}

variable "aws_instance_type" {
  description = "I hope you have enough money to pay for this"
  default     = "t2.micro"
}

variable "project_name" {
  default     = "BuildKit Testing"
  description = "Use something descriptive and unique because this is applied as a tag to all resources constructed in AWS"
}
