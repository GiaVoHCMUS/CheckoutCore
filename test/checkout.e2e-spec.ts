import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource, In } from 'typeorm';
import { ProductVariantEntity } from '../src/modules/products/product-variant.entity';
import {
  CheckoutTestData,
  cleanupCheckoutTestData,
  createCheckoutTestApp,
  createProductFixture,
} from './helpers/checkout-test.helper';

describe('Checkout APIs (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testData: CheckoutTestData;

  beforeAll(async () => {
    app = await createCheckoutTestApp();
    dataSource = app.get(DataSource);
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

  it('creates an order, stores snapshots, and decrements stock', async () => {
    const { variants } = await createProductFixture(dataSource, testData, [
      { sku: `E2E-CHECKOUT-${crypto.randomUUID()}`, price: '199000.00', stock: 10, size: 'M', color: 'Black' },
    ]);

    const response = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send({ items: [{ variantId: variants[0].id, quantity: 3 }] })
      .expect(201);
    testData.orderIds.push(response.body.data.id);

    expect(response.body.data).toMatchObject({
      status: 'pending',
      totalAmount: '597000.00',
      items: [
        expect.objectContaining({
          variantId: variants[0].id,
          sku: variants[0].sku,
          unitPrice: '199000.00',
          quantity: 3,
          lineTotal: '597000.00',
        }),
      ],
    });

    const storedVariant = await dataSource.getRepository(ProductVariantEntity).findOneByOrFail({ id: variants[0].id });
    expect(storedVariant.stock).toBe(7);
  });

  it('rolls back every stock change when one checkout item has insufficient stock', async () => {
    const { variants } = await createProductFixture(dataSource, testData, [
      { sku: `E2E-ROLLBACK-A-${crypto.randomUUID()}`, price: '100.00', stock: 5 },
      { sku: `E2E-ROLLBACK-B-${crypto.randomUUID()}`, price: '200.00', stock: 1 },
    ]);

    await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send({
        items: [
          { variantId: variants[0].id, quantity: 2 },
          { variantId: variants[1].id, quantity: 2 },
        ],
      })
      .expect(409);

    const storedVariants = await dataSource.getRepository(ProductVariantEntity).findBy({
      id: In(variants.map((variant) => variant.id)),
    });
    expect(storedVariants.map((variant) => variant.stock).sort()).toEqual([1, 5]);

    const orderItemCount = await dataSource.query(
      'SELECT count(*)::int AS count FROM order_items WHERE variant_id = ANY($1::uuid[])',
      [variants.map((variant) => variant.id)],
    );
    expect(orderItemCount[0].count).toBe(0);
  });

  it('allows only one concurrent checkout when stock is one', async () => {
    const { variants } = await createProductFixture(dataSource, testData, [
      { sku: `E2E-CONCURRENCY-${crypto.randomUUID()}`, price: '100.00', stock: 1 },
    ]);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .post('/api/v1/checkout')
          .send({ items: [{ variantId: variants[0].id, quantity: 1 }] }),
      ),
    );
    const successfulResponses = responses.filter((response) => response.status === 201);
    testData.orderIds.push(...successfulResponses.map((response) => response.body.data.id));

    expect(successfulResponses).toHaveLength(1);
    expect(responses.filter((response) => response.status === 409)).toHaveLength(4);

    const storedVariant = await dataSource.getRepository(ProductVariantEntity).findOneByOrFail({ id: variants[0].id });
    expect(storedVariant.stock).toBe(0);
  });

  it('cancels a pending order, restores stock, and rejects a second cancellation', async () => {
    const { variants } = await createProductFixture(dataSource, testData, [
      { sku: `E2E-CANCEL-${crypto.randomUUID()}`, price: '500.00', stock: 5 },
    ]);
    const checkoutResponse = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send({ items: [{ variantId: variants[0].id, quantity: 2 }] })
      .expect(201);
    const orderId = checkoutResponse.body.data.id as string;
    testData.orderIds.push(orderId);

    const cancelResponse = await request(app.getHttpServer()).post(`/api/v1/orders/${orderId}/cancel`).expect(200);
    expect(cancelResponse.body.data).toMatchObject({ status: 'cancelled' });
    expect(cancelResponse.body.data.cancelledAt).toEqual(expect.any(String));

    await request(app.getHttpServer()).post(`/api/v1/orders/${orderId}/cancel`).expect(409);

    const storedVariant = await dataSource.getRepository(ProductVariantEntity).findOneByOrFail({ id: variants[0].id });
    expect(storedVariant.stock).toBe(5);
  });

  it('returns an order detail and cursor-paginates its order list', async () => {
    const { variants } = await createProductFixture(dataSource, testData, [
      { sku: `E2E-READ-${crypto.randomUUID()}`, price: '10.00', stock: 10 },
    ]);

    const firstCheckout = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send({ items: [{ variantId: variants[0].id, quantity: 1 }] })
      .expect(201);
    const secondCheckout = await request(app.getHttpServer())
      .post('/api/v1/checkout')
      .send({ items: [{ variantId: variants[0].id, quantity: 1 }] })
      .expect(201);
    testData.orderIds.push(firstCheckout.body.data.id, secondCheckout.body.data.id);

    const detailResponse = await request(app.getHttpServer())
      .get(`/api/v1/orders/${firstCheckout.body.data.id}`)
      .expect(200);
    expect(detailResponse.body.data.items).toEqual([
      expect.objectContaining({ variantId: variants[0].id, quantity: 1, lineTotal: '10.00' }),
    ]);

    const listResponse = await request(app.getHttpServer()).get('/api/v1/orders?limit=1').expect(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.meta).toMatchObject({ limit: 1, hasNext: true });
    expect(listResponse.body.meta.nextCursor).toEqual(expect.any(String));

    const nextPageResponse = await request(app.getHttpServer())
      .get(`/api/v1/orders?limit=1&cursor=${encodeURIComponent(listResponse.body.meta.nextCursor)}`)
      .expect(200);
    expect(nextPageResponse.body.data).toHaveLength(1);
    expect(nextPageResponse.body.data[0].id).not.toBe(listResponse.body.data[0].id);
  });
});
