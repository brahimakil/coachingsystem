import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('coach/register')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cv', maxCount: 1 },
      { name: 'profilePicture', maxCount: 1 },
      { name: 'passportPicture', maxCount: 1 },
    ]),
  )
  async registerCoach(
    @Body() createCoachDto: any,
    @UploadedFiles()
    files?: {
      cv?: Express.Multer.File[];
      profilePicture?: Express.Multer.File[];
      passportPicture?: Express.Multer.File[];
    },
  ) {
    return this.authService.registerCoach(createCoachDto, files);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('coach/login')
  @HttpCode(HttpStatus.OK)
  async loginCoach(@Body() loginDto: LoginDto) {
    return this.authService.loginCoach(loginDto);
  }
}
