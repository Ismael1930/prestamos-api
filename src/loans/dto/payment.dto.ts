import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentDto {
  @ApiProperty({ example: 'uuid-here', description: 'ID del préstamo' })
  @IsString()
  @IsNotEmpty()
  loanId: string;

  @ApiProperty({ example: 1, description: 'Número de cuota a pagar' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  paymentNumber: number;

  @ApiProperty({ example: 500, description: 'Monto del pago' })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;
}
