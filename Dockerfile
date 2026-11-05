# ==========================================
# Stage 1: Build da Aplicação (TypeScript + Vite)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências aproveitando o cache de camadas do Docker
COPY package.json package-lock.json* ./
RUN npm ci

# Copia o código-fonte e gera o bundle otimizado de produção
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Servidor Web de Produção (Nginx Alpine)
# ==========================================
FROM nginx:1.27-alpine AS production

# Remove configuração padrão e aplica a configuração otimizada para SPA
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos compilados do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
