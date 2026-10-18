import { UserEntity } from '../user.entity';

export class UpdateUserResultDto {
  id!: string;
  name!: string;
  email!: string;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(entity: UserEntity): UpdateUserResultDto {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
