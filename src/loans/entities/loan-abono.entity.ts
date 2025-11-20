import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Loan } from './loan.entity';

@Entity('loan_abonos')
export class LoanAbono {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 12, scale: 2 })
  remainingBalanceBefore: number;

  @Column('decimal', { precision: 12, scale: 2 })
  remainingBalanceAfter: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp' })
  abonoDate: Date;

  @ManyToOne(() => Loan, loan => loan.abonos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @CreateDateColumn()
  createdAt: Date;
}
