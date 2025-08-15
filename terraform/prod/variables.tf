variable "resource_group_name" {
  description = "Nom du groupe de ressources"
  type        = string
  default     = "bbn-rg-vm"
}

variable "location" {
  description = "Région Azure"
  type        = string
  default     = "northeurope"
}

variable "vnet_name" {
  description = "Nom du réseau virtuel"
  type        = string
  default     = "bbn-vnet"
}

variable "subnet_name" {
  description = "Nom du sous-réseau"
  type        = string
  default     = "bbn-subnet"
}

variable "nsg_name" {
  description = "Nom du Network Security Group"
  type        = string
  default     = "bbn-nsg"
}

variable "vm_name" {
  description = "Nom de la VM"
  type        = string
  default     = "bbn-vm-ubuntu-prod"
}

variable "vm_size" {
  description = "Taille de la VM"
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "Nom d'utilisateur admin"
  type        = string
  default     = "dsi34"
}

variable "ssh_public_key" {
  description = "Chemin vers la clé publique SSH"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

