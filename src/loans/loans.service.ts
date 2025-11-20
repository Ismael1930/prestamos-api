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
    const loan = await this.loansRepository.findOne({
      where: { id, userId },
      relations: ['payments', 'abonos'],
      order: {
        payments: {
          paymentNumber: 'ASC',
        },
        abonos: {
          abonoDate: 'ASC',
        },
      },
    });

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

    // Validar que se estén pagando las cuotas en orden
    if (paymentDto.paymentNumber !== previousPayments + 1) {
      throw new BadRequestException(
        `Must pay cuotas in order. Next payment should be number ${previousPayments + 1}`,
      );
    }

    // Calcular los detalles del pago con base en el saldo ACTUAL (después de abonos)
    const currentBalance = loan.remainingBalance;
    const monthlyRate = loan.interestRate / 100 / 12;
    const remainingMonths = loan.termMonths - previousPayments;
    
    // Calcular interés sobre el saldo actual
    const interest = currentBalance * monthlyRate;
    
    // Usar la cuota mensual actual del préstamo (que se recalcula con cada abono)
    const paymentAmount = loan.monthlyPayment;
    const principal = paymentAmount - interest;
    const newRemainingBalance = currentBalance - principal;

    // Validar que el monto sea suficiente
    if (paymentDto.amount < paymentAmount) {
      throw new BadRequestException(
        `Payment amount must be at least ${paymentAmount.toFixed(2)}`,
      );
    }

    const payment = this.paymentsRepository.create({
      loan: { id: paymentDto.loanId } as Loan,
      paymentNumber: paymentDto.paymentNumber,
      amount: paymentAmount,
      principal: principal,
      interest: interest,
      remainingBalance: newRemainingBalance,
      paymentDate: new Date(),
    });

    await this.paymentsRepository.save(payment);

    // Actualizar el saldo pendiente del préstamo directamente sin cargar la entidad completa
    await this.loansRepository.update(loan.id, {
      remainingBalance: newRemainingBalance,
      status: newRemainingBalance <= 0 ? LoanStatus.PAID : loan.status,
    });

    // Retornar el préstamo actualizado con sus pagos y abonos
    return this.findOne(loan.id, userId);
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
      loan: { id: abonoDto.loanId } as Loan,
      amount: abonoDto.amount,
      remainingBalanceBefore,
      remainingBalanceAfter,
      notes: abonoDto.notes,
      abonoDate: new Date(),
    });

    await this.abonosRepository.save(abono);

    // Calcular nuevos valores
    const newRemainingBalance = remainingBalanceAfter;
    let newMonthlyPayment = loan.monthlyPayment;
    let newStatus: LoanStatus = loan.status;
    
    // Recalcular la cuota mensual si es amortización fija
    if (loan.amortizationType === AmortizationType.FIXED) {
      const paymentsCount = await this.paymentsRepository.count({
        where: { loan: { id: loan.id } },
      });
      
      const remainingMonths = loan.termMonths - paymentsCount;
      
      if (remainingMonths > 0) {
        newMonthlyPayment = this.amortizationService.calculateMonthlyPayment(
          newRemainingBalance,
          loan.interestRate,
          remainingMonths,
        );
      }
    }

    if (newRemainingBalance <= 0) {
      newStatus = LoanStatus.PAID;
    }

    // Actualizar el préstamo directamente sin cargar la entidad completa
    await this.loansRepository.update(loan.id, {
      remainingBalance: newRemainingBalance,
      monthlyPayment: newMonthlyPayment,
      status: newStatus,
    });

    // Retornar el préstamo actualizado con sus pagos y abonos
    return this.findOne(loan.id, userId);
  }
}
