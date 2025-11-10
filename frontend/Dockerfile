# 1. Estágio de Build (Builder)
FROM node:20-alpine AS builder
WORKDIR /app

# Copia package.json e lockfile
COPY package*.json ./

# Instala TODAS as dependências (incluindo devDependencies) para o build
# [CORREÇÃO AQUI]
RUN npm ci --legacy-peer-deps

# Copia o restante do código-fonte
COPY . .

# Executa o build
RUN npm run build

# 2. Estágio de Produção (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

# Instala apenas o 'curl' (para health checks, etc.)
RUN apk add --no-cache curl

# Copia package.json e lockfile
COPY package*.json ./

# Instala APENAS dependências de produção
# [CORREÇÃO AQUI]
RUN npm ci --only=production --legacy-peer-deps

# Copia os arquivos de build do estágio anterior
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expor a porta
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
