FROM nginx:1.23.4-alpine
RUN mkdir /app
COPY dist /app
COPY nginx.conf /etc/nginx/nginx.conf