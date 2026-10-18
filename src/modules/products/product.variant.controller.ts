import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { ProductVariantResultDto } from './dto/product-variant.result.dto';
import { UpdateProductVariantStockDto } from './dto/update-product-variant-stock.dto';
import { CreateProductVariantUseCase } from './use-cases/create-product-variant.use-case';
import { GetProductVariantsUseCase } from './use-cases/get-product-variants.use-case';
import { UpdateProductVariantStockUseCase } from './use-cases/update-product-variant-stock.use-case';

@ApiTags('Product variants')
@Controller()
export class ProductVariantController {
  constructor(
    private readonly getProductVariantsUseCase: GetProductVariantsUseCase,
    private readonly createProductVariantUseCase: CreateProductVariantUseCase,
    private readonly updateProductVariantStockUseCase: UpdateProductVariantStockUseCase,
  ) {}

  @Get('products/:productId/variants')
  @ApiOkResponse({ type: ProductVariantResultDto, isArray: true })
  @ApiNotFoundResponse()
  getByProductId(@Param('productId', ParseUUIDPipe) productId: string): Promise<ProductVariantResultDto[]> {
    return this.getProductVariantsUseCase.execute(productId);
  }

  @Post('products/:productId/variants')
  @ApiCreatedResponse({ type: ProductVariantResultDto })
  @ApiNotFoundResponse()
  create(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateProductVariantDto,
  ): Promise<ProductVariantResultDto> {
    return this.createProductVariantUseCase.execute(productId, dto);
  }

  @Patch('variants/:id/stock')
  @ApiOkResponse({ type: ProductVariantResultDto })
  @ApiNotFoundResponse()
  updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductVariantStockDto,
  ): Promise<ProductVariantResultDto> {
    return this.updateProductVariantStockUseCase.execute(id, dto);
  }
}
