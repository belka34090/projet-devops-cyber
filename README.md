# Projet DevOps Cyber
# Page de présentation du projet sur GitLab ou GitHub
# Projet DevOps - Campagne Cyber

## 🔗 Description
Ce projet met en ligne une mini-campagne de sensibilisation à la cybersécurité (HTML), conteneurise le tout avec Docker, déploie automatiquement via CI/CD GitLab, et ajoute supervision et sécurisation.

## 🌍 Objectifs
- Servir le site via Nginx dans Docker
- Pipeline CI/CD automatisé (GitLab CI)
- Supervision Uptime Kuma ou Prometheus
- Headers sécurité, HTTPS, fail2ban (CP3)

## 🔮 Compétences visées
- CP3 : Sécuriser l'infra (HTTPS, fail2ban, user non-root)
- CP4 : Mettre en prod (Docker, CI/CD)
- CP6 : Gérer les données (logs Nginx, volumes)
- CP7 : Conteneuriser (Dockerfile, compose)
- CP8 : CI/CD (GitLab pipeline)
- CP9 : Supervision (Uptime Kuma ou Prometheus)
- CP10 : Tableaux de bord (Grafana ou Uptime Kuma)

---
# 🔧 FICHIER 5 : checklist_CP.md
# Checklist de validation des compétences RNCP

## 🔒 CP3 - Sécuriser l'infrastructure
- [ ] HTTPS auto-signé avec certbot ou openssl
- [ ] Headers sécurité Nginx (CSP, HSTS...)
- [ ] fail2ban configuré
- [ ] Utilisateur non-root dans container
- [ ] UFW activé

## 🏢 CP4 - Mettre en production
- [x] Application lancée en local via Docker
- [x] Accessible via `http://localhost:8080`

## 📊 CP6 - Stockage et logs
- [ ] Logs Nginx redirigés vers volume
- [ ] Visualisation logs ou JSON (si backend ajouté)

## 🏋️ CP7 - Conteneurisation
- [x] Dockerfile présent
- [x] docker-compose fonctionnel

## ⚖️ CP8 - CI/CD
- [x] `.gitlab-ci.yml` présent
- [ ] Pipeline visible dans GitLab
- [ ] Build + Deploy OK

## 📊 CP9 - Supervision
- [ ] Uptime Kuma ou Prometheus activé
- [ ] Supervision du service Web sur port 8080

## 📊 CP10 - Tableau de bord
- [ ] Uptime Kuma ou Grafana affiche l’état du service
- [ ] Capture d’écran insérée dans le dossier
