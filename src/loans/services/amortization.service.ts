import { Injectable } from '@nestjs/common';
import { AmortizationType } from '../entities/loan.entity';

export interface AmortizationScheduleItem {
  paymentNumber: number;
  paymentAmount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

@Injectable()
export class AmortizationService {
  /**
   * Calcula la tabla de amortización para un préstamo
   */
  calculateAmortization(
    principal: number,
    annualRate: number,
    termMonths: number,
    amortizationType: AmortizationType,
    abonoAmount: number = 0,
    abonoAfterPayment: number = 0,
  ): AmortizationScheduleItem[] {
    if (amortizationType === AmortizationType.FIXED) {
      return this.calculateFixedAmortization(principal, annualRate, termMonths, abonoAmount, abonoAfterPayment);
    } else {
      return this.calculateVariableAmortization(principal, annualRate, termMonths, abonoAmount, abonoAfterPayment);
    }
  }

  /**
   * Calcula amortización con cuota fija (método francés)
   */
  private calculateFixedAmortization(
    principal: number,
    annualRate: number,
    termMonths: number,
    abonoAmount: number = 0,
    abonoAfterPayment: number = 0,
  ): AmortizationScheduleItem[] {
    const schedule: AmortizationScheduleItem[] = [];
    const monthlyRate = annualRate / 100 / 12;
    
    // Aplicar abono al principal si es al inicio
    let remainingBalance = principal - (abonoAfterPayment === 0 ? abonoAmount : 0);
    
    // Calcular cuota fija usando la fórmula de anualidad
    const monthlyPayment = 
      (remainingBalance * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;

      // Aplicar abono después del pago especificado
      if (i === abonoAfterPayment && abonoAmount > 0) {
        remainingBalance -= abonoAmount;
      }

      schedule.push({
        paymentNumber: i,
        paymentAmount: parseFloat(monthlyPayment.toFixed(2)),
        principal: parseFloat(principalPayment.toFixed(2)),
        interest: parseFloat(interestPayment.toFixed(2)),
        remainingBalance: parseFloat(Math.max(0, remainingBalance).toFixed(2)),
      });

      if (remainingBalance <= 0) break;
    }

    return schedule;
  }

  /**
   * Calcula amortización con cuota variable (método alemán)
   * El capital se amortiza de forma constante, los intereses varían
   */
  private calculateVariableAmortization(
    principal: number,
    annualRate: number,
    termMonths: number,
    abonoAmount: number = 0,
    abonoAfterPayment: number = 0,
  ): AmortizationScheduleItem[] {
    const schedule: AmortizationScheduleItem[] = [];
    const monthlyRate = annualRate / 100 / 12;
    
    // Aplicar abono al principal si es al inicio
    let remainingBalance = principal - (abonoAfterPayment === 0 ? abonoAmount : 0);
    
    // Capital constante por periodo
    const constantPrincipal = remainingBalance / termMonths;

    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = constantPrincipal;
      const totalPayment = principalPayment + interestPayment;
      
      remainingBalance -= principalPayment;

      // Aplicar abono después del pago especificado
      if (i === abonoAfterPayment && abonoAmount > 0) {
        remainingBalance -= abonoAmount;
      }

      schedule.push({
        paymentNumber: i,
        paymentAmount: parseFloat(totalPayment.toFixed(2)),
        principal: parseFloat(principalPayment.toFixed(2)),
        interest: parseFloat(interestPayment.toFixed(2)),
        remainingBalance: parseFloat(Math.max(0, remainingBalance).toFixed(2)),
      });

      if (remainingBalance <= 0) break;
    }

    return schedule;
  }

  /**
   * Calcula la cuota mensual para un préstamo con cuota fija
   */
  calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
    const monthlyRate = annualRate / 100 / 12;
    
    const monthlyPayment = 
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    return parseFloat(monthlyPayment.toFixed(2));
  }
}
