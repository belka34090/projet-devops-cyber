terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

resource "azurerm_resource_group" "bbn_rg" {
  name     = "bbn-rg-vm"
  location = "northeurope"
}

resource "azurerm_virtual_network" "bbn_vnet" {
  name                 = "bbn-vnet"
  address_space        = ["10.1.0.0/16"]
  location             = azurerm_resource_group.bbn_rg.location
  resource_group_name  = azurerm_resource_group.bbn_rg.name
}

resource "azurerm_subnet" "bbn_subnet" {
  name                 = "bbn-subnet"
  resource_group_name  = azurerm_resource_group.bbn_rg.name
  virtual_network_name = azurerm_virtual_network.bbn_vnet.name
  address_prefixes     = ["10.1.1.0/24"]
}

resource "azurerm_network_security_group" "bbn_nsg" {
  name                 = "bbn-nsg"
  location             = azurerm_resource_group.bbn_rg.location
  resource_group_name  = azurerm_resource_group.bbn_rg.name

  security_rule {
    name                       = "Allow-SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefixes    = var.ssh_allowed_ips
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "bbn_subnet_assoc" {
  subnet_id                 = azurerm_subnet.bbn_subnet.id
  network_security_group_id = azurerm_network_security_group.bbn_nsg.id
}

resource "azurerm_public_ip" "bbn_public_ip" {
  name                 = "bbn-public-ip"
  location             = azurerm_resource_group.bbn_rg.location
  resource_group_name  = azurerm_resource_group.bbn_rg.name
  allocation_method    = "Static"
  sku                  = "Standard"
}

resource "azurerm_network_interface" "bbn_nic" {
  name                 = "bbn-nic"
  location             = azurerm_resource_group.bbn_rg.location
  resource_group_name  = azurerm_resource_group.bbn_rg.name

  ip_configuration {
    name                          = "ipconfig1"
    subnet_id                     = azurerm_subnet.bbn_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.bbn_public_ip.id
  }
}

resource "azurerm_linux_virtual_machine" "bbn_vm" {
  name                  = "bbn-vm-ubuntu"
  resource_group_name    = azurerm_resource_group.bbn_rg.name
  location              = azurerm_resource_group.bbn_rg.location
  size                  = "Standard_B1s"
  admin_username        = "dsi34"
  network_interface_ids = [azurerm_network_interface.bbn_nic.id]

  admin_ssh_key {
    username   = "dsi34"
    public_key = file("~/.ssh/id_rsa.pub") # Modifie si ta clé est ailleurs
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    name                 = "bbn-osdisk-ubuntu"
    disk_size_gb         = 70
  }

  custom_data = filebase64("cloud-init.yaml")
}

output "bbn_vm_public_ip" {
  value = azurerm_public_ip.bbn_public_ip.ip_address
}

