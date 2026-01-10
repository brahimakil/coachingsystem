import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    
    console.log('Email Service Config:', { 
      user: user ? 'Found' : 'Not Found', 
      pass: pass ? 'Found' : 'Not Found' 
    });

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });
  }

  async sendOtp(email: string, otp: string) {
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
