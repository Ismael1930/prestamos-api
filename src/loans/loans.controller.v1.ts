import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { PaymentDto } from './dto/payment.dto';
import { AbonoDto } from './dto/abono.dto';
import { AmortizationDto } from './dto/amortization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Loans')
@Controller({ path: 'loan', version: '1.0' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar una nueva solicitud de préstamo' })
  @ApiResponse({ status: 201, description: 'Préstamo creado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async create(@Body() createLoanDto: CreateLoanDto, @Request() req) {
    return this.loansService.create(createLoanDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar solicitudes de préstamos del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de préstamos' })
  async findAll(@Request() req) {
    return this.loansService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener datos de una solicitud sin amortización (v1.0)' })
  @ApiResponse({ status: 200, description: 'Detalles del préstamo' })
  @ApiResponse({ status: 404, description: 'Préstamo no encontrado' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.loansService.findOne(id, req.user.userId);
  }

  @Post('approval')
  @ApiOperation({ summary: 'Aprobar o rechazar una solicitud de préstamo' })
  @ApiResponse({ status: 200, description: 'Préstamo procesado exitosamente' })
  @ApiResponse({ status: 400, description: 'Solicitud inválida' })
  @ApiResponse({ status: 404, description: 'Préstamo no encontrado' })
  async approve(@Body() approveLoanDto: ApproveLoanDto) {
    return this.loansService.approve(approveLoanDto);
  }

  @Post('amor')
  @ApiOperation({ summary: 'Obtener tabla de amortización de un préstamo' })
  @ApiResponse({ status: 200, description: 'Tabla de amortización' })
  @ApiResponse({ status: 404, description: 'Préstamo no encontrado' })
  async calculateAmortization(@Body() amortizationDto: AmortizationDto, @Request() req) {
    return this.loansService.calculateAmortization(amortizationDto.loanId, req.user.userId);
  }

  @Post('payment')
  @ApiOperation({ summary: 'Registrar el pago de una cuota' })
  @ApiResponse({ status: 201, description: 'Pago registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Solicitud inválida' })
  @ApiResponse({ status: 409, description: 'Pago duplicado' })
  async registerPayment(@Body() paymentDto: PaymentDto, @Request() req) {
    return this.loansService.registerPayment(paymentDto, req.user.userId);
  }

  @Post('abono')
  @ApiOperation({ summary: 'Realizar un abono adicional a capital' })
  @ApiResponse({ status: 201, description: 'Abono registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Solicitud inválida' })
  async registerAbono(@Body() abonoDto: AbonoDto, @Request() req) {
    return this.loansService.registerAbono(abonoDto, req.user.userId);
  }
}
