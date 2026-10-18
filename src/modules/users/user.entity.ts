import { BaseEntity } from 'src/infrastructure/database/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
  })
  name!: string;

  @Index({ unique: true })
  @Column({
    type: 'varchar',
    length: 255,
  })
  email!: string;
}
