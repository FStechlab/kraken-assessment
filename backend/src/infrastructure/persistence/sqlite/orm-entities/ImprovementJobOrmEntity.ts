import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("improvement_jobs")
export class ImprovementJobOrmEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  repositorySlug!: string;

  @Column()
  filePath!: string;

  @Column({ default: "PENDING" })
  status!: string;

  @Column({ nullable: true, type: "text" })
  pullRequestUrl!: string | null;

  @Column({ nullable: true, type: "integer" })
  pullRequestNumber!: number | null;

  @Column({ nullable: true, type: "text" })
  branchName!: string | null;

  @Column({ nullable: true, type: "text" })
  errorMessage!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
