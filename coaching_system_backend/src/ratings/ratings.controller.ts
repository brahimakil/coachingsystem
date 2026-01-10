import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRatingDto: CreateRatingDto) {
    return this.ratingsService.create(createRatingDto);
  }

  @Get()
  findAll(@Query('coachId') coachId?: string, @Query('playerId') playerId?: string) {
    return this.ratingsService.findAll(coachId, playerId);
  }

  @Get('coach/:coachId/stats')
  getCoachRatingStats(@Param('coachId') coachId: string) {
    return this.ratingsService.getCoachRatingStats(coachId);
  }

  @Get('coach/:coachId/player/:playerId')
  findByCoachAndPlayer(@Param('coachId') coachId: string, @Param('playerId') playerId: string) {
    return this.ratingsService.findByCoachAndPlayer(coachId, playerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ratingsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRatingDto: UpdateRatingDto) {
    return this.ratingsService.update(id, updateRatingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingsService.remove(id);
  }
}
