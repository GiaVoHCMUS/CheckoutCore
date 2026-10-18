import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderItems1787588815276 implements MigrationInterface {
  name = 'CreateOrderItems1787588815276';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "variant_id" uuid NOT NULL,
        "product_name" character varying(255) NOT NULL,
        "sku" character varying(100) NOT NULL,
        "size" character varying(50),
        "color" character varying(50),
        "unit_price" numeric(12,2) NOT NULL,
        "quantity" integer NOT NULL,
        "line_total" numeric(12,2) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_order_items_variant" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_items"`);
  }
}
