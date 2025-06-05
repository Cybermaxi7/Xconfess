import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRelationships1717597200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add user_id column to anonymous_confessions table
    await queryRunner.query(`
      ALTER TABLE anonymous_confessions 
      ADD COLUMN IF NOT EXISTS user_id integer NULL,
      ADD CONSTRAINT fk_anonymous_confessions_user 
        FOREIGN KEY (user_id) 
        REFERENCES "user"(id) 
        ON DELETE SET NULL
    `);

    // Add user_id column to reaction table
    await queryRunner.query(`
      ALTER TABLE reaction 
      ADD COLUMN IF NOT EXISTS user_id integer NULL,
      ADD CONSTRAINT fk_reaction_user 
        FOREIGN KEY (user_id) 
        REFERENCES "user"(id) 
        ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints
    await queryRunner.query(`
      ALTER TABLE anonymous_confessions 
      DROP CONSTRAINT IF EXISTS fk_anonymous_confessions_user
    `);
    
    await queryRunner.query(`
      ALTER TABLE reaction 
      DROP CONSTRAINT IF EXISTS fk_reaction_user
    `);
    
    // Drop columns
    await queryRunner.query(`
      ALTER TABLE anonymous_confessions 
      DROP COLUMN IF EXISTS user_id
    `);
    
    await queryRunner.query(`
      ALTER TABLE reaction 
      DROP COLUMN IF EXISTS user_id
    `);
  }
}
