import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AmortizationDto {
  @ApiProperty({ example: 'uuid-here', description: 'ID del préstamo' })
  @IsString()
  @IsNotEmpty()
  loanId: string;
}
