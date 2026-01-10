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

  @Post('player/login')
  @HttpCode(HttpStatus.OK)
  async loginPlayer(@Body() loginDto: LoginDto) {
    return this.authService.loginPlayer(loginDto);
  }

  @Post('player/register')
  @HttpCode(HttpStatus.CREATED)
  async registerPlayer(@Body() createPlayerDto: any) {
    return this.authService.registerPlayer(createPlayerDto);
  }

  @Post('player/verify-register')
  @HttpCode(HttpStatus.OK)
  async verifyPlayerRegistration(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyPlayerRegistration(body.email, body.otp);
  }

  @Post('player/verify-login')
  @HttpCode(HttpStatus.OK)
  async verifyPlayerLogin(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyPlayerLogin(body.email, body.otp);
  }

  @Post('player/forgot-password')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('player/verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  async verifyPasswordResetOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyPasswordResetOtp(body.email, body.otp);
  }

  @Post('player/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { email: string; resetToken: string; newPassword: string }) {
    return this.authService.resetPassword(body.email, body.resetToken, body.newPassword);
  }
}
