variable "linode_api_token" {}

variable "linode_region" {
  default = "eu-central"
}

variable "linode_root_password" {
  default = "pa55word!"
}

variable "branch_name" {
  description = "The name of the branch you want to use; this of course impacts the code that is used to initialize the build system."
  default     = "unified-server"
}

variable "linode_image" {
  description = "The type machine you want"
  default     = "linode/ubuntu18.04"
}

variable "linode_machine_type" {
  description = "The type of instance/CPU combo you want"
  default = "g6-nanode-1"
}

variable "project_name" {
  default     = "BuildKit Testing"
  description = "Use something descriptive and unique because this is applied as a tag to all resources constructed in Linode"
}
