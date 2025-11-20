import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LoanPayment } from './loan-payment.entity';
import { LoanAbono } from './loan-abono.entity';

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  PAID = 'PAID',
}

export enum AmortizationType {
  FIXED = 'FIXED', 
  VARIABLE = 'VARIABLE', 
}

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column('int')
  termMonths: number;

  @Column('decimal', { precision: 5, scale: 2 })
  interestRate: number;

  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.PENDING,
  })
  status: LoanStatus;

  @Column({
    type: 'enum',
    enum: AmortizationType,
    default: AmortizationType.FIXED,
  })
  amortizationType: AmortizationType;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  remainingBalance: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  monthlyPayment: number;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  disbursedAt: Date;

  @ManyToOne(() => User, user => user.loans)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => LoanPayment, (payment: LoanPayment) => payment.loan, {
    cascade: true,
  })
  payments: LoanPayment[];

  @OneToMany(() => LoanAbono, (abono: LoanAbono) => abono.loan, {
    cascade: true,
  })
  abonos: LoanAbono[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
