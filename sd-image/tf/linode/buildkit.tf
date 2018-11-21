provider "linode" {
  token = "${var.linode_api_token}"
}

resource "linode_sshkey" "local_key" {
  label = "local_key"
  ssh_key = "${chomp(file("~/.ssh/id_rsa.pub"))}"
}

resource "linode_instance" "sdimage" {
  image  = "${var.linode_image}"
  label  = "electric_buildkit"
  group  = "${var.project_name}"
  region = "${var.linode_region}"

  type      = "${var.linode_machine_type}"
  root_pass = "${var.linode_root_password}"
  authorized_keys = ["${linode_sshkey.local_key.ssh_key}"]

  tags = [ "${var.project_name}" ]
}

output "buildkit_public_ip" {
  value = "${linode_instance.sdimage.ip_address}"
}
