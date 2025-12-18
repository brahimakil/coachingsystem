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
          role: 'admin',
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async registerCoach(createCoachDto: any, files?: any) {
    try {
      const { email, password, name, availableHours, ...otherData } = createCoachDto;

      console.log('=== COACH REGISTRATION ===');
      console.log('Data received:', JSON.stringify(createCoachDto, null, 2));
      console.log('Files received:', {
        cv: files?.cv ? `${files.cv.length} file(s)` : 'none',
        profilePicture: files?.profilePicture ? `${files.profilePicture.length} file(s)` : 'none',
        passportPicture: files?.passportPicture ? `${files.passportPicture.length} file(s)` : 'none',
      });

      // Parse availableHours if it's a string
      let parsedAvailableHours = availableHours;
      if (typeof availableHours === 'string') {
        try {
          parsedAvailableHours = JSON.parse(availableHours);
          console.log('Parsed availableHours:', parsedAvailableHours);
        } catch (e) {
          console.error('Error parsing availableHours:', e);
          parsedAvailableHours = {};
        }
      }

      // Create user in Firebase Auth
      const userRecord = await this.firebaseApp.auth().createUser({
        email,
        password,
        displayName: name,
      });

      console.log('Firebase Auth user created:', userRecord.uid);

      // Prepare coach data
      const coachData: any = {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        ...otherData,
        availableHours: parsedAvailableHours,
        status: 'pending_activation',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'coach',
      };

      // Upload files to Firebase Storage if provided
      if (files) {
        const bucket = this.firebaseApp.storage().bucket();
        console.log('Storage bucket:', bucket.name);

        const uploadFile = async (file: Express.Multer.File, folder: string) => {
          const fileName = `${folder}/${userRecord.uid}_${Date.now()}_${file.originalname}`;
          console.log(`Uploading file to: ${fileName}`);
          const fileUpload = bucket.file(fileName);
          
          await fileUpload.save(file.buffer, {
            metadata: {
              contentType: file.mimetype,
            },
          });

          await fileUpload.makePublic();
          const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          console.log(`File uploaded: ${url}`);
          return url;
        };

        if (files.cv?.[0]) {
          coachData.cvUrl = await uploadFile(files.cv[0], 'coaches/cvs');
        }
        if (files.profilePicture?.[0]) {
          coachData.profilePictureUrl = await uploadFile(files.profilePicture[0], 'coaches/profiles');
        }
        if (files.passportPicture?.[0]) {
          coachData.passportPictureUrl = await uploadFile(files.passportPicture[0], 'coaches/passports');
        }
      }

      console.log('Saving coach data to Firestore...');
      console.log('Final coach data:', JSON.stringify(coachData, null, 2));
      // Save coach to Firestore coaches collection
      await this.firestore.collection('coaches').doc(userRecord.uid).set(coachData);

      return {
        success: true,
        message: 'Coach registered successfully. Please wait for admin activation.',
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          status: 'pending_activation',
        },
      };
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new BadRequestException('Email already exists');
      }
      throw new BadRequestException(error.message);
    }
  }

  async loginPlayer(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      // Get user by email from Firebase Auth
      const userRecord = await this.firebaseApp.auth().getUserByEmail(email);

      if (!userRecord) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user exists in players collection
      const playerDoc = await this.firestore.collection('players').doc(userRecord.uid).get();

      if (!playerDoc.exists) {
        throw new UnauthorizedException('Access denied. You are not a player.');
      }

      const playerData = playerDoc.data();

      if (!playerData) {
        throw new UnauthorizedException('Player data not found.');
      }

      // Check if player is active
      if (playerData.status !== 'active') {
        throw new UnauthorizedException('Your account is not active. Please contact support.');
      }

      // Generate custom token
      const customToken = await this.firebaseApp.auth().createCustomToken(userRecord.uid);

      // Update last login
      await this.firestore.collection('players').doc(userRecord.uid).update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: 'Login successful',
        access_token: customToken,
        player: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: playerData.name,
          dateOfBirth: playerData.dateOfBirth,
          status: playerData.status,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async loginCoach(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;

      // Get user by email from Firebase Auth
      const userRecord = await this.firebaseApp.auth().getUserByEmail(email);

      if (!userRecord) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user exists in coaches collection
      const coachDoc = await this.firestore.collection('coaches').doc(userRecord.uid).get();

      if (!coachDoc.exists) {
        throw new UnauthorizedException('Access denied. You are not a coach.');
      }

      const coachData = coachDoc.data();
      
      if (!coachData) {
        throw new UnauthorizedException('Coach data not found.');
      }

      if (coachData.status === 'pending_activation') {
        throw new UnauthorizedException('Your account is pending activation. Please contact the administrator.');
      }

      if (coachData.status === 'rejected') {
        throw new UnauthorizedException('Your account has been rejected. Please contact the administrator.');
      }

      // Generate custom token
      const customToken = await this.firebaseApp.auth().createCustomToken(userRecord.uid);

      // Update last login
      await this.firestore.collection('coaches').doc(userRecord.uid).update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: coachData.name,
          token: customToken,
          role: 'coach',
          status: coachData.status,
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
