import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { ProductEntity } from '../../src/modules/products/product.entity';
import { ProductVariantEntity } from '../../src/modules/products/product-variant.entity';

export class CheckoutTestData {
  readonly productIds: string[] = [];
  readonly variantIds: string[] = [];
  readonly orderIds: string[] = [];
}

export async function createCheckoutTestApp(): Promise<INestApplication> {
  ensureTestDatabase();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  return app;
}

export async function createProductFixture(
  dataSource: DataSource,
  testData: CheckoutTestData,
  variants: Array<{
    sku: string;
    price: string;
    stock: number;
    size?: string | null;
    color?: string | null;
    isActive?: boolean;
  }>,
): Promise<{ product: ProductEntity; variants: ProductVariantEntity[] }> {
  const productRepository = dataSource.getRepository(ProductEntity);
  const variantRepository = dataSource.getRepository(ProductVariantEntity);

  const product = await productRepository.save(
    productRepository.create({
      name: `Checkout test product ${crypto.randomUUID()}`,
      description: 'Fixture for checkout tests',
    }),
  );
  testData.productIds.push(product.id);

  const savedVariants: ProductVariantEntity[] = [];
  for (const variantData of variants) {
    const variant = await variantRepository.save(
      variantRepository.create({
        productId: product.id,
        sku: variantData.sku,
        price: variantData.price,
        stock: variantData.stock,
        size: variantData.size ?? null,
        color: variantData.color ?? null,
        isActive: variantData.isActive ?? true,
      }),
    );
    testData.variantIds.push(variant.id);
    savedVariants.push(variant);
  }

  return { product, variants: savedVariants };
}

export async function cleanupCheckoutTestData(dataSource: DataSource, testData: CheckoutTestData): Promise<void> {
  if (testData.variantIds.length > 0) {
    await dataSource.query('DELETE FROM order_items WHERE variant_id = ANY($1::uuid[])', [testData.variantIds]);
  }

  if (testData.orderIds.length > 0) {
    await dataSource.query('DELETE FROM orders WHERE id = ANY($1::uuid[])', [testData.orderIds]);
  }

  if (testData.variantIds.length > 0) {
    await dataSource.query('DELETE FROM product_variants WHERE id = ANY($1::uuid[])', [testData.variantIds]);
  }

  if (testData.productIds.length > 0) {
    await dataSource.query('DELETE FROM products WHERE id = ANY($1::uuid[])', [testData.productIds]);
  }
}

function ensureTestDatabase(): void {
  const databaseName = process.env.DB_NAME;

  if (process.env.NODE_ENV !== 'test' || !databaseName?.endsWith('_test')) {
    throw new Error('Checkout tests require NODE_ENV=test and a database name ending in "_test".');
  }
}
