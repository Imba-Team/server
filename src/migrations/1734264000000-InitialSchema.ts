import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1734264000000 implements MigrationInterface {
  name = 'InitialSchema1734264000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user table
    await queryRunner.query(`
      CREATE TYPE "user_status_enum" AS ENUM('active', 'inactive', 'suspended');
    `);

    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM('admin', 'user');
    `);

    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying,
        "username" character varying NOT NULL,
        "name" character varying,
        "status" "user_status_enum" NOT NULL DEFAULT 'active',
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "profilePicture" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "UQ_user_username" UNIQUE ("username"),
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
      )
    `);

    // Create magic_links table
    await queryRunner.query(`
      CREATE TABLE "magic_links" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "purpose" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying NOT NULL,
        CONSTRAINT "UQ_magic_links_key" UNIQUE ("key"),
        CONSTRAINT "PK_magic_links_id" PRIMARY KEY ("id")
      )
    `);

    // Create module table (v1)
    await queryRunner.query(`
      CREATE TABLE "module" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" character varying,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        CONSTRAINT "UQ_module_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_module_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "module"
      ADD CONSTRAINT "FK_module_userId"
      FOREIGN KEY ("userId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create term table (v1)
    await queryRunner.query(`
      CREATE TABLE "term" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "term" character varying NOT NULL,
        "definition" character varying NOT NULL,
        "moduleId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        CONSTRAINT "PK_term_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "term"
      ADD CONSTRAINT "FK_term_moduleId"
      FOREIGN KEY ("moduleId") REFERENCES "module"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create user_module table (v2)
    await queryRunner.query(`
      CREATE TABLE "user_module" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" character varying,
        "termCount" integer NOT NULL DEFAULT 0,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        CONSTRAINT "UQ_user_module_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_user_module_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user_module"
      ADD CONSTRAINT "FK_user_module_userId"
      FOREIGN KEY ("userId") REFERENCES "user"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create user_term_progress table (v2)
    await queryRunner.query(`
      CREATE TABLE "user_term_progress" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "term" character varying NOT NULL,
        "definition" character varying NOT NULL,
        "correctCount" integer NOT NULL DEFAULT 0,
        "incorrectCount" integer NOT NULL DEFAULT 0,
        "lastReviewed" TIMESTAMP,
        "userModuleId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdBy" character varying,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedBy" character varying,
        CONSTRAINT "PK_user_term_progress_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user_term_progress"
      ADD CONSTRAINT "FK_user_term_progress_userModuleId"
      FOREIGN KEY ("userModuleId") REFERENCES "user_module"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(
      `ALTER TABLE "user_term_progress" DROP CONSTRAINT "FK_user_term_progress_userModuleId"`,
    );
    await queryRunner.query(`DROP TABLE "user_term_progress"`);

    await queryRunner.query(
      `ALTER TABLE "user_module" DROP CONSTRAINT "FK_user_module_userId"`,
    );
    await queryRunner.query(`DROP TABLE "user_module"`);

    await queryRunner.query(
      `ALTER TABLE "term" DROP CONSTRAINT "FK_term_moduleId"`,
    );
    await queryRunner.query(`DROP TABLE "term"`);

    await queryRunner.query(
      `ALTER TABLE "module" DROP CONSTRAINT "FK_module_userId"`,
    );
    await queryRunner.query(`DROP TABLE "module"`);

    await queryRunner.query(`DROP TABLE "magic_links"`);
    await queryRunner.query(`DROP TABLE "user"`);

    await queryRunner.query(`DROP TYPE "user_role_enum"`);
    await queryRunner.query(`DROP TYPE "user_status_enum"`);
  }
}
