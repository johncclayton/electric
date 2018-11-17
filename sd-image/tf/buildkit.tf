provider "aws" {
  access_key = "${var.aws_access_key}"
  secret_key = "${var.aws_secret_key}"
  region     = "eu-west-1"
}

data "aws_availability_zones" "available" {}

resource "aws_vpc" "main" {
  cidr_block = "${var.aws_vpc_cidr}"

  enable_dns_hostnames = true

  tags {
    ProjectName = "${var.project_name}"
  }
}

resource "aws_subnet" "public-subnet" {
  vpc_id            = "${aws_vpc.main.id}"
  cidr_block        = "${var.aws_public_subnet_cidr}"
  availability_zone = "${data.aws_availability_zones.available.names[0]}"

  tags {
    ProjectName = "${var.project_name}"
  }
}

# to make the public subnet addressable to the internet, we need an internet gateway
resource "aws_internet_gateway" "gw" {
  vpc_id = "${aws_vpc.main.id}"

  tags {
    ProjectName = "${var.project_name}"
  }
}

# and to allow traffic through the gateway we need a route table
resource "aws_route_table" "public-rt" {
  vpc_id = "${aws_vpc.main.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.gw.id}"
  }

  tags {
    ProjectName = "${var.project_name}"
  }
}

resource "aws_route_table_association" "web-public-rt" {
  subnet_id      = "${aws_subnet.public-subnet.id}"
  route_table_id = "${aws_route_table.public-rt.id}"
}

resource "aws_security_group" "instance-sg" {
  vpc_id = "${aws_vpc.main.id}"
  name   = "sdimage-sg-${var.project_name}"

  tags {
    ProjectName = "${var.project_name}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# resource "aws_s3_bucket" "sd-image" {
#   bucket = "sd-image-${var.project_name}"
#    versioning {
#     enabled = true
#   }

#   # lifecycle_rule {
#   #   prefix = "/"
#   #   enabled = true
#   #   noncurrent_version_transition {
#   #     days          = 30
#   #     storage_class = "STANDARD_IA"
#   #   }
#   # }
# }

resource "aws_instance" "sdimage" {
  ami           = "${var.aws_ami}"
  instance_type = "${var.aws_instance_type}"

  vpc_security_group_ids = ["${aws_security_group.instance-sg.id}"]
  subnet_id              = "${aws_subnet.public-subnet.id}"
  key_name               = "${var.aws_key_name}"

  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp2"
    volume_size = "20"
  }

  tags {
    ProjectName = "${var.project_name}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "allow_all" {
  type              = "egress"
  security_group_id = "${aws_security_group.instance-sg.id}"
  from_port         = 0
  to_port           = 0
  protocol          = -1
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "allow_ssh" {
  type              = "ingress"
  security_group_id = "${aws_security_group.instance-sg.id}"
  from_port         = 22
  to_port           = 22
  protocol          = -1
  cidr_blocks       = ["0.0.0.0/0"]
}

output "aws_buildkit_public_dns" {
  value = "${aws_instance.sdimage.public_dns}"
}

output "aws_buildkit_public_ip" {
  value = "${aws_instance.sdimage.public_ip}"
}
