import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1775796797724 implements MigrationInterface {
  name = 'Migration1775796797724';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "flashcard_user_state" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "flashcardId" uuid NOT NULL, "nextReviewAt" TIMESTAMP WITH TIME ZONE, "intervalDays" integer NOT NULL DEFAULT '1', "easeFactor" double precision NOT NULL DEFAULT '2.5', "isStarred" boolean NOT NULL DEFAULT false, "correctCount" integer NOT NULL DEFAULT '0', "incorrectCount" integer NOT NULL DEFAULT '0', "confidenceLevel" double precision NOT NULL DEFAULT '0', "lastReviewedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1b1d3bfc1a3f00c040998699917" UNIQUE ("userId", "flashcardId"), CONSTRAINT "PK_616340a0e26f88788bcf446b11b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "test_attempt" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "studySetId" uuid NOT NULL, "score" double precision NOT NULL DEFAULT '0', "totalQuestions" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e9fb46f732ef63877b65484637a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "test_question_attempt" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "testAttemptId" uuid NOT NULL, "flashcardId" uuid NOT NULL, "userAnswer" text, "isCorrect" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_4b0beed24cd6196f6c6905183e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "flashcard" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "term" character varying NOT NULL, "definition" character varying NOT NULL, "orderIndex" integer NOT NULL DEFAULT '0', "imageUrl" character varying, "hint" text, "status" character varying, "studySetId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e0aba0501d3bc532951efc9f791" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "comment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "studySetId" uuid NOT NULL, "parentCommentId" uuid, "isDeleted" boolean NOT NULL DEFAULT false, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "study_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "studySetId" uuid NOT NULL, "cardsStudied" integer NOT NULL DEFAULT '0', "correctAnswers" integer NOT NULL DEFAULT '0', "incorrectAnswers" integer NOT NULL DEFAULT '0', "durationSeconds" integer NOT NULL DEFAULT '0', "mode" character varying(16) NOT NULL, "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "completedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_d09225f8e9d2b6682e3b13c46e0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "favorite_study_set" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "studySetId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e04868fdb69256d192700fdf8da" UNIQUE ("userId", "studySetId"), CONSTRAINT "PK_3f3f685650d3229b9517ebdc278" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "study_set_collaborator" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "studySetId" uuid NOT NULL, "role" character varying(16) NOT NULL DEFAULT 'VIEWER', CONSTRAINT "UQ_a5c6d999e33723374d2e4aa2015" UNIQUE ("userId", "studySetId"), CONSTRAINT "PK_60ff544bfe147cbe883f4aa87de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "folder" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6278a41a706740c94c02e288df8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "folder_study_set" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "folderId" uuid NOT NULL, "studySetId" uuid NOT NULL, CONSTRAINT "UQ_9fdfdcb170b1cbd892ed5b7aa80" UNIQUE ("folderId", "studySetId"), CONSTRAINT "PK_9553258bfa14b6f6cae98bac7c5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tag" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "UQ_6a9775008add570dc3e5a0bab7b" UNIQUE ("name"), CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "study_set_tag" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studySetId" uuid NOT NULL, "tagId" uuid NOT NULL, CONSTRAINT "UQ_52ef84d30832295d7c31dc3eafd" UNIQUE ("studySetId", "tagId"), CONSTRAINT "PK_64842c32f244afa237bbc2ce4c8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "study_set" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "title" character varying NOT NULL, "description" text, "visibility" character varying(16) NOT NULL DEFAULT 'PUBLIC', "language" character varying, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a59cb36418d32ca7c5b5f2813f2" UNIQUE ("slug"), CONSTRAINT "PK_9ffbc0a95bdd09c53487260fba9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "magic_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "userId" character varying NOT NULL, "purpose" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "createdBy" character varying NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedBy" character varying NOT NULL, CONSTRAINT "UQ_e57353c37140f4ad45bc900e1fa" UNIQUE ("key"), CONSTRAINT "PK_6c609d48037f164e7ae5b744b18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "userType"`);
    await queryRunner.query(`DROP TYPE "public"."enum_user_userType"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "firstName"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lastName"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "username" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "status" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "role" character varying NOT NULL DEFAULT 'user'`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "profilePicture" text`);
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "user_pkey"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "user_email_key"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "password" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "flashcard_user_state" ADD CONSTRAINT "FK_63ed592856c8db355ea434c3cbc" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flashcard_user_state" ADD CONSTRAINT "FK_a168b4e675d13b5d20362f7a099" FOREIGN KEY ("flashcardId") REFERENCES "flashcard"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_attempt" ADD CONSTRAINT "FK_12ad94b633cfe94f5705cd81528" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_attempt" ADD CONSTRAINT "FK_7442aa5893c27827502192d93f3" FOREIGN KEY ("studySetId") REFERENCES "study_set"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_question_attempt" ADD CONSTRAINT "FK_1671b351bbfaf5bc03dadb6fa01" FOREIGN KEY ("testAttemptId") REFERENCES "test_attempt"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_question_attempt" ADD CONSTRAINT "FK_bcd9941d20c108b9224043ad231" FOREIGN KEY ("flashcardId") REFERENCES "flashcard"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "flashcard" ADD CONSTRAINT "FK_b42ea01d9110a4e9857ff516425" FOREIGN KEY ("studySetId") REFERENCES "study_set"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "FK_c0354a9a009d3bb45a08655ce3b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "FK_0352665830817a91c1a8f416429" FOREIGN KEY ("studySetId") REFERENCES "study_set"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" ADD CONSTRAINT "FK_73aac6035a70c5f0313c939f237" FOREIGN KEY ("parentCommentId") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_session" ADD CONSTRAINT "FK_7c6cc9077553bf81d77ac1259f8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_session" ADD CONSTRAINT "FK_adebfdbe1f2c27dc578a5c04d6d" FOREIGN KEY ("studySetId") REFERENCES "study_set"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_study_set" ADD CONSTRAINT "FK_e7813407c9137c6af4c63c8f6d3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_study_set" ADD CONSTRAINT "FK_77650c7ed4977ef82c69125ac0f" FOREIGN KEY ("studySetId") REFERENCES "study_set"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_set_collaborator" ADD CONSTRAINT "FK_f4156e1b2c729cbe38639118c83" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_set_collaborator" ADD CONSTRAINT "FK_b23f64ce7c8dbb8de4fe508eb20" FOREIGN KEY ("studySetId") REFERENCES "study_set"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "folder" ADD CONSTRAINT "FK_a0ef64d088bc677d66b9231e90b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "folder_study_set" ADD CONSTRAINT "FK_dc48e16633e73ebaa39fa2f6954" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "folder_study_set" ADD CONSTRAINT "FK_14cf834808333cd987e58a6982a" FOREIGN KEY ("studySetId") REFERENCES "study_set"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_set_tag" ADD CONSTRAINT "FK_bc5d7ca5bd5159da2978e951f3d" FOREIGN KEY ("studySetId") REFERENCES "study_set"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_set_tag" ADD CONSTRAINT "FK_4567e3c357e5ae5d77ecca55923" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_set" ADD CONSTRAINT "FK_86244dbfa6a1305ab6de6c22ecf" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "study_set" DROP CONSTRAINT "FK_86244dbfa6a1305ab6de6c22ecf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_set_tag" DROP CONSTRAINT "FK_4567e3c357e5ae5d77ecca55923"`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_set_tag" DROP CONSTRAINT "FK_bc5d7ca5bd5159da2978e951f3d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "folder_study_set" DROP CONSTRAINT "FK_14cf834808333cd987e58a6982a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "folder_study_set" DROP CONSTRAINT "FK_dc48e16633e73ebaa39fa2f6954"`,
    );
    await queryRunner.query(
      `ALTER TABLE "folder" DROP CONSTRAINT "FK_a0ef64d088bc677d66b9231e90b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_set_collaborator" DROP CONSTRAINT "FK_b23f64ce7c8dbb8de4fe508eb20"`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_set_collaborator" DROP CONSTRAINT "FK_f4156e1b2c729cbe38639118c83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_study_set" DROP CONSTRAINT "FK_77650c7ed4977ef82c69125ac0f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "favorite_study_set" DROP CONSTRAINT "FK_e7813407c9137c6af4c63c8f6d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_session" DROP CONSTRAINT "FK_adebfdbe1f2c27dc578a5c04d6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "study_session" DROP CONSTRAINT "FK_7c6cc9077553bf81d77ac1259f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "FK_73aac6035a70c5f0313c939f237"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "FK_0352665830817a91c1a8f416429"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "FK_c0354a9a009d3bb45a08655ce3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flashcard" DROP CONSTRAINT "FK_b42ea01d9110a4e9857ff516425"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_question_attempt" DROP CONSTRAINT "FK_bcd9941d20c108b9224043ad231"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_question_attempt" DROP CONSTRAINT "FK_1671b351bbfaf5bc03dadb6fa01"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_attempt" DROP CONSTRAINT "FK_7442aa5893c27827502192d93f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "test_attempt" DROP CONSTRAINT "FK_12ad94b633cfe94f5705cd81528"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flashcard_user_state" DROP CONSTRAINT "FK_a168b4e675d13b5d20362f7a099"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flashcard_user_state" DROP CONSTRAINT "FK_63ed592856c8db355ea434c3cbc"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "password" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "email" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "user_email_key" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "PK_cace4a159ff9f2512dd42373760"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "profilePicture"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status"`);
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "username"`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "lastName" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "firstName" character varying(255)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."enum_user_userType" AS ENUM('0', '1', '2')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "userType" "public"."enum_user_userType"`,
    );
    await queryRunner.query(`DROP TABLE "magic_links"`);
    await queryRunner.query(`DROP TABLE "study_set"`);
    await queryRunner.query(`DROP TABLE "study_set_tag"`);
    await queryRunner.query(`DROP TABLE "tag"`);
    await queryRunner.query(`DROP TABLE "folder_study_set"`);
    await queryRunner.query(`DROP TABLE "folder"`);
    await queryRunner.query(`DROP TABLE "study_set_collaborator"`);
    await queryRunner.query(`DROP TABLE "favorite_study_set"`);
    await queryRunner.query(`DROP TABLE "study_session"`);
    await queryRunner.query(`DROP TABLE "comment"`);
    await queryRunner.query(`DROP TABLE "flashcard"`);
    await queryRunner.query(`DROP TABLE "test_question_attempt"`);
    await queryRunner.query(`DROP TABLE "test_attempt"`);
    await queryRunner.query(`DROP TABLE "flashcard_user_state"`);
  }
}
