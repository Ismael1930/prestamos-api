import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus, AmortizationType } from './entities/loan.entity';
import { LoanPayment } from './entities/loan-payment.entity';
import { LoanAbono } from './entities/loan-abono.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { PaymentDto } from './dto/payment.dto';
import { AbonoDto } from './dto/abono.dto';
import { AmortizationService } from './services/amortization.service';

@Injectable()
export class LoansService {
  constructor(
    @InjectRepository(Loan)
    private loansRepository: Repository<Loan>,
    @InjectRepository(LoanPayment)
    private paymentsRepository: Repository<LoanPayment>,
    @InjectRepository(LoanAbono)
    private abonosRepository: Repository<LoanAbono>,
    private amortizationService: AmortizationService,
  ) {}

  async create(createLoanDto: CreateLoanDto, userId: string): Promise<Loan> {
    const monthlyPayment = createLoanDto.amortizationType === AmortizationType.FIXED
      ? this.amortizationService.calculateMonthlyPayment(
          createLoanDto.amount,
          createLoanDto.interestRate,
          createLoanDto.termMonths,
        )
      : 0; // Para cuota variable, se calcula dinámicamente

    const loan = this.loansRepository.create({
      ...createLoanDto,
      userId,
      remainingBalance: createLoanDto.amount,
      monthlyPayment,
      status: LoanStatus.PENDING,
    });

    return this.loansRepository.save(loan);
  }

  async findAll(userId: string): Promise<Loan[]> {
    return this.loansRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Loan> {
    const loan = await this.loansRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.payments', 'payments')
      .leftJoinAndSelect('loan.abonos', 'abonos')
      .where('loan.id = :id', { id })
      .andWhere('loan.userId = :userId', { userId })
      .orderBy('payments.paymentNumber', 'ASC')
      .addOrderBy('abonos.abonoDate', 'ASC')
      .getOne();

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    return loan;
  }

  async findOneWithAmortization(id: string, userId: string) {
    const loan = await this.findOne(id, userId);

    const amortization = this.amortizationService.calculateAmortization(
      loan.amount,
      loan.interestRate,
      loan.termMonths,
      loan.amortizationType,
    );

    return {
      ...loan,
      amortizationSchedule: amortization,
    };
  }

  async approve(approveLoanDto: ApproveLoanDto): Promise<Loan> {
    const loan = await this.loansRepository.findOne({
      where: { id: approveLoanDto.loanId },
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException('Loan is not in pending status');
    }

    if (approveLoanDto.status === LoanStatus.REJECTED && !approveLoanDto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting a loan');
    }

    loan.status = approveLoanDto.status;
    loan.approvedAt = new Date();
    
    if (approveLoanDto.status === LoanStatus.REJECTED) {
      loan.rejectionReason = approveLoanDto.rejectionReason || 'No reason provided';
    }

    if (approveLoanDto.status === LoanStatus.APPROVED) {
      loan.disbursedAt = new Date();
      loan.status = LoanStatus.DISBURSED;
    }

    return this.loansRepository.save(loan);
  }

  async calculateAmortization(loanId: string, userId: string) {
    const loan = await this.findOne(loanId, userId);

    if (loan.status !== LoanStatus.DISBURSED && loan.status !== LoanStatus.PAID) {
      throw new BadRequestException('Loan must be disbursed to calculate amortization');
    }

    const amortization = this.amortizationService.calculateAmortization(
      loan.amount,
      loan.interestRate,
      loan.termMonths,
      loan.amortizationType,
    );

    return {
      loanId: loan.id,
      amount: loan.amount,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      amortizationType: loan.amortizationType,
      monthlyPayment: loan.monthlyPayment,
      amortizationSchedule: amortization,
    };
  }

  async registerPayment(paymentDto: PaymentDto, userId: string): Promise<Loan> {
    const loan = await this.findOne(paymentDto.loanId, userId);

    if (loan.status !== LoanStatus.DISBURSED) {
      throw new BadRequestException('Loan must be disbursed to register payments');
    }

    // Verificar si ya existe un pago para este número de cuota
    const existingPayment = await this.paymentsRepository.findOne({
      where: {
        loan: { id: paymentDto.loanId },
        paymentNumber: paymentDto.paymentNumber,
      },
    });

    if (existingPayment) {
      throw new ConflictException('Payment for this period already exists');
    }

    // Obtener todos los pagos anteriores
    const previousPayments = await this.paymentsRepository.count({
      where: { loan: { id: paymentDto.loanId } },
    });

    // Calcular la amortización para obtener los detalles de la cuota
    const amortization = this.amortizationService.calculateAmortization(
      loan.amount,
      loan.interestRate,
      loan.termMonths,
      loan.amortizationType,
    );

    const scheduleItem = amortization.find(item => item.paymentNumber === paymentDto.paymentNumber);

    if (!scheduleItem) {
      throw new BadRequestException('Invalid payment number');
    }

    // Validar que se estén pagando las cuotas en orden
    if (paymentDto.paymentNumber !== previousPayments + 1) {
      throw new BadRequestException(
        `Must pay cuotas in order. Next payment should be number ${previousPayments + 1}`,
      );
    }

    // Validar que el monto sea suficiente
    if (paymentDto.amount < scheduleItem.paymentAmount) {
      throw new BadRequestException(
        `Payment amount must be at least ${scheduleItem.paymentAmount}`,
      );
    }

    const payment = this.paymentsRepository.create({
      loan: loan,
      paymentNumber: paymentDto.paymentNumber,
      amount: scheduleItem.paymentAmount,
      principal: scheduleItem.principal,
      interest: scheduleItem.interest,
      remainingBalance: scheduleItem.remainingBalance,
      paymentDate: new Date(),
    });

    await this.paymentsRepository.save(payment);

    // Actualizar el saldo pendiente del préstamo
    loan.remainingBalance = scheduleItem.remainingBalance;
    
    if (loan.remainingBalance <= 0) {
      loan.status = LoanStatus.PAID;
    }

    await this.loansRepository.save(loan);

    // Retornar el préstamo actualizado con sus pagos y abonos
    const updatedLoan = await this.loansRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.payments', 'payments')
      .leftJoinAndSelect('loan.abonos', 'abonos')
      .where('loan.id = :id', { id: loan.id })
      .orderBy('payments.paymentNumber', 'ASC')
      .addOrderBy('abonos.abonoDate', 'ASC')
      .getOne();
    
    if (!updatedLoan) {
      throw new NotFoundException('Loan not found after update');
    }
    
    return updatedLoan;
  }

  async registerAbono(abonoDto: AbonoDto, userId: string): Promise<Loan> {
    const loan = await this.findOne(abonoDto.loanId, userId);

    if (loan.status !== LoanStatus.DISBURSED) {
      throw new BadRequestException('Loan must be disbursed to register abonos');
    }

    if (abonoDto.amount > loan.remainingBalance) {
      throw new BadRequestException('Abono amount cannot exceed remaining balance');
    }

    const remainingBalanceBefore = loan.remainingBalance;
    const remainingBalanceAfter = loan.remainingBalance - abonoDto.amount;

    const abono = this.abonosRepository.create({
      loan: loan,
      amount: abonoDto.amount,
      remainingBalanceBefore,
      remainingBalanceAfter,
      notes: abonoDto.notes,
      abonoDate: new Date(),
    });

    await this.abonosRepository.save(abono);

    // Actualizar el préstamo
    loan.remainingBalance = remainingBalanceAfter;
    
    // Recalcular la cuota mensual si es amortización fija
    if (loan.amortizationType === AmortizationType.FIXED) {
      const paymentsCount = await this.paymentsRepository.count({
        where: { loan: { id: loan.id } },
      });
      
      const remainingMonths = loan.termMonths - paymentsCount;
      
      if (remainingMonths > 0) {
        loan.monthlyPayment = this.amortizationService.calculateMonthlyPayment(
          loan.remainingBalance,
          loan.interestRate,
          remainingMonths,
        );
      }
    }

    if (loan.remainingBalance <= 0) {
      loan.status = LoanStatus.PAID;
    }

    await this.loansRepository.save(loan);

    // Retornar el préstamo actualizado con sus pagos y abonos
    const updatedLoan = await this.loansRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.payments', 'payments')
      .leftJoinAndSelect('loan.abonos', 'abonos')
      .where('loan.id = :id', { id: loan.id })
      .orderBy('payments.paymentNumber', 'ASC')
      .addOrderBy('abonos.abonoDate', 'ASC')
      .getOne();
    
    if (!updatedLoan) {
      throw new NotFoundException('Loan not found after update');
    }
    
    return updatedLoan;
  }
}
