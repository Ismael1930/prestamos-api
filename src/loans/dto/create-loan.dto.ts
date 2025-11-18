import { IsNumber, IsEnum, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AmortizationType } from '../entities/loan.entity';

export class CreateLoanDto {
  @ApiProperty({ example: 10000, description: 'Monto del préstamo' })
  @IsNumber()
  @Min(1000)
  @Max(1000000)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 12, description: 'Plazo en meses (1-360)' })
  @IsNumber()
  @Min(1)
  @Max(360)
  @IsNotEmpty()
  termMonths: number;

  @ApiProperty({ example: 5.5, description: 'Tasa de interés anual en porcentaje' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  interestRate: number;

  @ApiProperty({ 
    enum: AmortizationType, 
    example: AmortizationType.FIXED,
    description: 'Tipo de amortización: FIXED (cuota fija) o VARIABLE (cuota variable)'
  })
  @IsEnum(AmortizationType)
  @IsNotEmpty()
  amortizationType: AmortizationType;
}
