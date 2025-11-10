import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('FIREBASE_ADMIN') private firebaseApp: admin.app.App,
    @Inject('FIRESTORE') private firestore: Firestore,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { email, password, displayName } = registerDto;

      // Create user in Firebase Auth
      const userRecord = await this.firebaseApp.auth().createUser({
        email,
        password,
        displayName,
      });

      // Save admin to Firestore admins collection
      await this.firestore.collection('admins').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'admin',
      });

      // Generate custom token for the user
      const customToken = await this.firebaseApp.auth().createCustomToken(userRecord.uid);

      return {
        success: true,
        message: 'Admin registered successfully',
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          token: customToken,
        },
      };
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new BadRequestException('Email already exists');
      }
      throw new BadRequestException(error.message);
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      // Get user by email from Firebase Auth
      const userRecord = await this.firebaseApp.auth().getUserByEmail(email);

      if (!userRecord) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user exists in admins collection
      const adminDoc = await this.firestore.collection('admins').doc(userRecord.uid).get();

      if (!adminDoc.exists) {
        throw new UnauthorizedException('Access denied. You are not an admin.');
      }

      // Generate custom token
      const customToken = await this.firebaseApp.auth().createCustomToken(userRecord.uid);

      // Update last login
      await this.firestore.collection('admins').doc(userRecord.uid).update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          token: customToken,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async verifyToken(token: string) {
    try {
      const decodedToken = await this.firebaseApp.auth().verifyIdToken(token);
      
      // Also verify user is in admins collection
      const adminDoc = await this.firestore.collection('admins').doc(decodedToken.uid).get();
      
      if (!adminDoc.exists) {
        throw new UnauthorizedException('Access denied. You are not an admin.');
      }
      
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
