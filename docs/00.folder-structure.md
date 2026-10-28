## Folder Structure

```
src/
├── app.module.ts
├── main.ts
│
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   └── env.validation.ts
│
├── infrastructure/
│   ├── database/
|   ├── database/
|   │   ├── migrations/
|   │   ├── seeds/
|   │   ├── database.module.ts
|   │   └── typeorm.config.ts
│   ├── cache/
│   ├── messaging/
│   └── observability/
│
├── common/
│   ├── constants/
│   ├── decorators/
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── interfaces/
│   └── utils/
│
├── modules/
│   ├── users/
│   │   ├── application/
│   │   │   └── services/
│   │   │
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── enums/
│   │   │   └── repositories/
│   │   │       └── user.repository.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       └── user.repository.impl.ts
│   │   │
│   │   ├── presentation/
│   │   │   ├── controllers/
│   │   │   └── dtos/
│   │   │
│   │   └── users.module.ts
│   │
│   └── orders/
│       └── ...
│
└── health/
    ├── health.controller.ts
    └── health.module.ts
```
