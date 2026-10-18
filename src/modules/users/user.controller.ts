import { Body, Controller, Delete, Get, Logger, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResultDto } from './dto/create-user.result.dto';
import { GetUserResultDto } from './dto/get-user.result.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateUserResultDto } from './dto/update-user.result.dto';
import { PaginatedResult } from 'src/common/pagination/paginated-result';
import { CursorPaginationQueryDto } from 'src/common/pagination/dto/cursor-pagination-query.dto';
import { CursorPaginationMeta } from 'src/common/pagination/cursor-pagination.meta';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiCreatedResponse({ type: CreateUserResultDto })
  @ApiBadRequestResponse()
  create(@Body() dto: CreateUserDto): Promise<CreateUserResultDto> {
    return this.userService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: GetUserResultDto, isArray: true })
  getAll(@Query() query: CursorPaginationQueryDto): Promise<PaginatedResult<GetUserResultDto, CursorPaginationMeta>> {
    Logger.debug(`[Query]: ${JSON.stringify(query)}`);
    return this.userService.getAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: GetUserResultDto })
  @ApiNotFoundResponse()
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: UpdateUserResultDto })
  @ApiNotFoundResponse()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse()
  @ApiNotFoundResponse()
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.delete(id);
  }
}
