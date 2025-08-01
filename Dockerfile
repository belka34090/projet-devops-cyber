# Sert le site statique avec Nginx
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80