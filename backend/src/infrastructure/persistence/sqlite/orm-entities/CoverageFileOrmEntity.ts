import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("coverage_files")
export class CoverageFileOrmEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  repositorySlug!: string;

  @Column()
  filePath!: string;

  @Column("float")
  linesPct!: number;

  @Column("int")
  linesTotal!: number;

  @Column("int")
  linesCovered!: number;

  @Column("float")
  statementsPct!: number;

  @Column("int")
  statementsTotal!: number;

  @Column("int")
  statementsCovered!: number;

  @Column("float")
  functionsPct!: number;

  @Column("int")
  functionsTotal!: number;

  @Column("int")
  functionsCovered!: number;

  @Column("float")
  branchesPct!: number;

  @Column("int")
  branchesTotal!: number;

  @Column("int")
  branchesCovered!: number;

  @Column()
  commitSha!: string;

  @CreateDateColumn()
  analyzedAt!: Date;
}
