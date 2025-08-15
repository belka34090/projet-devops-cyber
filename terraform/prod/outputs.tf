output "vm_public_ip" {
  description = "Adresse IP publique de la VM"
  value       = azurerm_public_ip.pip.ip_address
}

output "vm_admin_username" {
  description = "Nom de l'utilisateur admin"
  value       = var.admin_username
}

output "vm_name" {
  description = "Nom de la machine virtuelle"
  value       = var.vm_name
}

