provider "linode" {
  token = "${var.linode_api_token}"
}

resource "linode_instance" "sdimage" {
  image  = "${var.linode_image}"
  label  = "electric_buildkit"
  group  = "${var.project_name}"
  region = "${var.linode_region}"

  type      = "${var.linode_machine_type}"
  root_pass = "${var.root_password}"

  tags = [ "${var.project_name}" ]

  lifecycle {
    create_before_destroy = true
  }
}

output "buildkit_public_ip" {
  value = "${linode_instance.sdimage.ip_address}"
}
