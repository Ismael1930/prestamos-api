import { 
  Controller, 
  Get, 
  Param, 
  UseGuards, 
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Loans v2.0')
@Controller({ path: 'loan', version: '2.0' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoansV2Controller {
  constructor(private readonly loansService: LoansService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener datos de una solicitud con amortización (v2.0)' })
  @ApiResponse({ status: 200, description: 'Detalles del préstamo con tabla de amortización' })
  @ApiResponse({ status: 404, description: 'Préstamo no encontrado' })
  async findOneWithAmortization(@Param('id') id: string, @Request() req) {
    return this.loansService.findOneWithAmortization(id, req.user.userId);
  }
}
