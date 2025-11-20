import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Loan } from './loan.entity';

@Entity('loan_payments')
export class LoanPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  paymentNumber: number;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 12, scale: 2 })
  principal: number;

  @Column('decimal', { precision: 12, scale: 2 })
  interest: number;

  @Column('decimal', { precision: 12, scale: 2 })
  remainingBalance: number;

  @Column({ type: 'timestamp' })
  paymentDate: Date;

  @ManyToOne(() => Loan, loan => loan.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @CreateDateColumn()
  createdAt: Date;
}
