import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResultDto } from './dto/product.result.dto';
import { CreateProductUseCase } from './use-cases/create-product.use-case';
import { GetProductUseCase } from './use-cases/get-product.use-case';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: ProductResultDto })
  create(@Body() dto: CreateProductDto): Promise<ProductResultDto> {
    return this.createProductUseCase.execute(dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: ProductResultDto })
  @ApiNotFoundResponse()
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResultDto> {
    return this.getProductUseCase.execute(id);
  }
}
