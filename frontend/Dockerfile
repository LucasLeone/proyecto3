FROM node:20-alpine

WORKDIR /app

# Copia package.json y package-lock.json
COPY package.json package-lock.json* ./

# Instala dependencias
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]