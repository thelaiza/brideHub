# Usa uma imagem oficial do Node.js baseada em Alpine
FROM node:18-alpine

# Instala o OpenSSL necessário para o Prisma funcionar no Alpine
RUN apk add --no-cache openssl

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependência e o schema do Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instala as dependências
RUN npm install

# Copia o restante do código fonte do backend
COPY . .

# Gera o cliente do Prisma
RUN npx prisma generate

# Expõe a porta que o backend roda
EXPOSE 3333

# Comando para iniciar o servidor
CMD ["npm", "run", "dev"]