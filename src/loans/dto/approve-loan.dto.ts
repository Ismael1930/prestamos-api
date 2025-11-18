import { IsEnum, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoanStatus } from '../entities/loan.entity';

export class ApproveLoanDto {
  @ApiProperty({ example: 'uuid-here', description: 'ID del préstamo' })
  @IsString()
  @IsNotEmpty()
  loanId: string;

  @ApiProperty({ 
    enum: [LoanStatus.APPROVED, LoanStatus.REJECTED],
    example: LoanStatus.APPROVED,
    description: 'Estado de aprobación'
  })
  @IsEnum([LoanStatus.APPROVED, LoanStatus.REJECTED])
  @IsNotEmpty()
  status: LoanStatus.APPROVED | LoanStatus.REJECTED;

  @ApiProperty({ 
    example: 'No cumple con los requisitos',
    description: 'Razón del rechazo (obligatorio si se rechaza)',
    required: false
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
