import { ConfigService, registerAs } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

export default registerAs('logger', () => ({
  level: process.env.LOG_LEVEL ?? 'debug',
  redactEnabled: process.env.LOG_REDACT_ENABLED !== 'false',
}));

const sensitiveFields = [
  'password',
  'oldPassword',
  'newPassword',
  'currentPassword',
  'confirmPassword',

  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',

  'secret',
  'secretKey',
  'apiKey',
  'clientSecret',
  'client_secret',

  'otp',
  'otpCode',
  'pin',

  'cardNumber',
  'cvv',

  'connectionString',
  'connection_string',
];

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',

  ...sensitiveFields.map((field) => `*.${field}`),
  ...sensitiveFields.map((field) => `req.body.${field}`),
];

export const PinoLoggerModule = LoggerModule.forRootAsync({
  inject: [ConfigService],

  useFactory: (configService: ConfigService) => {
    const nodeEnv = configService.getOrThrow<string>('app.nodeEnv');
    const appName = configService.getOrThrow<string>('app.name');

    const level = configService.getOrThrow<string>('logger.level');

    const redactEnabled = configService.getOrThrow<boolean>('logger.redactEnabled');

    return {
      pinoHttp: {
        level,

        base: {
          service: `service-${appName}`,
        },

        genReqId: (req, res) => {
          const incomingRequestId = req.headers['x-request-id'];

          const requestId =
            typeof incomingRequestId === 'string' && incomingRequestId.length <= 128 ? incomingRequestId : randomUUID();

          res.setHeader('x-request-id', requestId);

          return requestId;
        },

        customProps: (req) => ({
          requestId: req.id,
        }),

        redact: redactEnabled
          ? {
              paths: redactPaths,
              censor: '[REDACTED]',
            }
          : undefined,

        autoLogging: {
          ignore: (req) => {
            const url = req.url ?? '';

            const path = url.split('?')[0].replace(/\/+$/, '');

            return /(^|\/)health\/(live|ready)$/.test(path);
          },
        },

        transport:
          nodeEnv !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:HH:MM:ss.l',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
      },
    };
  },
});
