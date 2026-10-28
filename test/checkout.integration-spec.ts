import { ConflictException, INestApplication } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { CheckoutUseCase } from '../src/modules/orders/use-cases/checkout.use-case';
import { ProductVariantEntity } from '../src/modules/products/product-variant.entity';
import {
  CheckoutTestData,
  cleanupCheckoutTestData,
  createCheckoutTestApp,
  createProductFixture,
} from './helpers/checkout-test.helper';

describe('CheckoutUseCase (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let checkoutUseCase: CheckoutUseCase;
  let testData: CheckoutTestData;

  beforeAll(async () => {
    app = await createCheckoutTestApp();
    dataSource = app.get(DataSource);
    checkoutUseCase = app.get(CheckoutUseCase);
  });

  beforeEach(() => {
    testData = new CheckoutTestData();
  });

  afterEach(async () => {
    await cleanupCheckoutTestData(dataSource, testData);
  });

  afterAll(async () => {
    await app.close();
  });

  it('merges duplicate variant lines and calculates exact decimal totals', async () => {
    const { variants } = await createProductFixture(dataSource, testData, [
      { sku: `INTEGRATION-MONEY-${crypto.randomUUID()}`, price: '12.34', stock: 5 },
    ]);

    const order = await checkoutUseCase.execute({
      items: [
        { variantId: variants[0].id, quantity: 1 },
        { variantId: variants[0].id, quantity: 2 },
      ],
    });
    testData.orderIds.push(order.id);

    expect(order.totalAmount).toBe('37.02');
    expect(order.items).toEqual([
      expect.objectContaining({ variantId: variants[0].id, quantity: 3, unitPrice: '12.34', lineTotal: '37.02' }),
    ]);

    const storedVariant = await dataSource.getRepository(ProductVariantEntity).findOneByOrFail({ id: variants[0].id });
    expect(storedVariant.stock).toBe(2);
  });

  it('does not decrement any stock when a later item cannot be fulfilled', async () => {
    const { variants } = await createProductFixture(dataSource, testData, [
      { sku: `INTEGRATION-ROLLBACK-A-${crypto.randomUUID()}`, price: '10.00', stock: 3 },
      { sku: `INTEGRATION-ROLLBACK-B-${crypto.randomUUID()}`, price: '20.00', stock: 1 },
    ]);

    await expect(
      checkoutUseCase.execute({
        items: [
          { variantId: variants[0].id, quantity: 1 },
          { variantId: variants[1].id, quantity: 2 },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    const storedVariants = await dataSource.getRepository(ProductVariantEntity).findBy({
      id: In(variants.map((variant) => variant.id)),
    });
    expect(storedVariants.map((variant) => variant.stock).sort()).toEqual([1, 3]);
  });
});
