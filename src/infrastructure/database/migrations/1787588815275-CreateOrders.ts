import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrders1787588815275 implements MigrationInterface {
  name = 'CreateOrders1787588815275';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" character varying(30) NOT NULL DEFAULT 'pending',
        "total_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "cancelled_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "orders"`);
  }
}
