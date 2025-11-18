import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller.v1';
import { LoansV2Controller } from './loans.controller.v2';
import { Loan } from './entities/loan.entity';
import { LoanPayment } from './entities/loan-payment.entity';
import { LoanAbono } from './entities/loan-abono.entity';
import { AmortizationService } from './services/amortization.service';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanPayment, LoanAbono])],
  controllers: [LoansController, LoansV2Controller],
  providers: [LoansService, AmortizationService],
  exports: [LoansService],
})
export class LoansModule {}
