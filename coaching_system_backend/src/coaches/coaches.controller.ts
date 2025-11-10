import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CoachesService } from './coaches.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

@Controller('coaches')
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cv', maxCount: 1 },
      { name: 'profilePicture', maxCount: 1 },
      { name: 'passportPicture', maxCount: 1 },
    ]),
  )
  create(
    @Body() createCoachDto: CreateCoachDto,
    @UploadedFiles()
    files: {
      cv?: Express.Multer.File[];
      profilePicture?: Express.Multer.File[];
      passportPicture?: Express.Multer.File[];
    },
  ) {
    console.log('=== CREATE COACH REQUEST ===');
    console.log('DTO:', createCoachDto);
    console.log('Files:', {
      cv: files?.cv?.[0]?.originalname,
      profilePicture: files?.profilePicture?.[0]?.originalname,
      passportPicture: files?.passportPicture?.[0]?.originalname,
    });
    return this.coachesService.create(createCoachDto, files);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('status') status?: string) {
    console.log('=== GET COACHES REQUEST ===');
    console.log('Search:', search);
    console.log('Status filter:', status);
    return this.coachesService.findAll(search, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coachesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cv', maxCount: 1 },
      { name: 'profilePicture', maxCount: 1 },
      { name: 'passportPicture', maxCount: 1 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() updateCoachDto: UpdateCoachDto,
    @UploadedFiles()
    files?: {
      cv?: Express.Multer.File[];
      profilePicture?: Express.Multer.File[];
      passportPicture?: Express.Multer.File[];
    },
  ) {
    console.log('=== UPDATE COACH REQUEST ===');
    console.log('Coach ID:', id);
    console.log('DTO:', updateCoachDto);
    console.log('Files:', {
      cv: files?.cv?.[0]?.originalname,
      profilePicture: files?.profilePicture?.[0]?.originalname,
      passportPicture: files?.passportPicture?.[0]?.originalname,
    });
    return this.coachesService.update(id, updateCoachDto, files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coachesService.remove(id);
  }
}
