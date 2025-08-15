terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Réseau existant
data "azurerm_resource_group" "rg" {
  name = "bbn-rg-vm"
}

data "azurerm_virtual_network" "vnet" {
  name                = "bbn-vnet"
  resource_group_name = data.azurerm_resource_group.rg.name
}

data "azurerm_subnet" "subnet" {
  name                 = "bbn-subnet"
  virtual_network_name = data.azurerm_virtual_network.vnet.name
  resource_group_name  = data.azurerm_resource_group.rg.name
}

data "azurerm_network_security_group" "nsg" {
  name                = "bbn-nsg"
  resource_group_name = data.azurerm_resource_group.rg.name
}

# IP publique PROD
resource "azurerm_public_ip" "pip" {
  name                = "bbn-vm-ubuntu-prod-pip"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# NIC PROD
resource "azurerm_network_interface" "nic" {
  name                = "bbn-vm-ubuntu-prod-nic"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = data.azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.pip.id
  }
}

# Association NIC ↔ NSG
resource "azurerm_network_interface_security_group_association" "nic_nsg" {
  network_interface_id      = azurerm_network_interface.nic.id
  network_security_group_id = data.azurerm_network_security_group.nsg.id
}

# VM PROD
resource "azurerm_linux_virtual_machine" "vm" {
  name                  = "bbn-vm-ubuntu-prod"
  resource_group_name   = data.azurerm_resource_group.rg.name
  location              = data.azurerm_resource_group.rg.location
  size                  = "Standard_B2s"
  admin_username        = "dsi34"
  network_interface_ids = [azurerm_network_interface.nic.id]

  admin_ssh_key {
    username   = "dsi34"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }
}

# Output IP publique

