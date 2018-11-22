provider "aws" {
  access_key = "${var.aws_access_key}"
  secret_key = "${var.aws_secret_key}"
  region     = "eu-west-1"
}

resource "aws_s3_bucket" "bucket" {
  bucket = "electric-binaries-bucket"
  acl    = "public-read"

   lifecycle_rule {
    id      = "master"
    enabled = true

    prefix = "/"

    tags {
      "rule"      = "master"
      "autoclean" = "true"
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA" # or "ONEZONE_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER"
    }

    expiration {
      days = 90
    }
}

