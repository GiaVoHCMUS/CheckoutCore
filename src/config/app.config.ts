import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME,
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT ?? 3000),
  swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
}));
