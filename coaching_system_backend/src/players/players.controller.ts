import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPlayerDto: CreatePlayerDto) {
    console.log('=== CREATE PLAYER REQUEST ===');
    console.log('DTO:', createPlayerDto);
    return this.playersService.create(createPlayerDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('status') status?: string) {
    console.log('=== GET PLAYERS REQUEST ===');
    console.log('Search:', search || 'none');
    console.log('Status filter:', status || 'all');
    return this.playersService.findAll(search, status);
  }

  @Get(':id/dashboard')
  getPlayerDashboard(@Param('id') id: string) {
    return this.playersService.getPlayerDashboard(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) {
    console.log('=== UPDATE PLAYER REQUEST ===');
    console.log('Player ID:', id);
    console.log('DTO:', updatePlayerDto);
    return this.playersService.update(id, updatePlayerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playersService.remove(id);
  }
}
