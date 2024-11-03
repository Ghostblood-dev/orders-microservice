# Orders microservices

## Steps for start up postgres database with docker

```
docker compose up -d
```

## Steps for dev environment

1. Clone the repository
2. Install dependencies
3. Create file `.env` based on `.env.template`
4. Execute Prisma migrate `npx prisma migrate dev`
5. Execute `npm run start:dev` or `yarn start:dev`
