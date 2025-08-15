variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "ssh_allowed_ips" {
  description = "Liste des IP autorisées pour SSH"
  type        = list(string)
}

