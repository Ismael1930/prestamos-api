import { IsString, IsNumber, Min, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AbonoDto {
  @ApiProperty({ example: 'uuid-here', description: 'ID del préstamo' })
  @IsString()
  @IsNotEmpty()
  loanId: string;

  @ApiProperty({ example: 1000, description: 'Monto del abono a capital' })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ 
    example: 'Abono extraordinario',
    description: 'Notas adicionales',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
