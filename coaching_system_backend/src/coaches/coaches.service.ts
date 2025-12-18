import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { CreateCoachDto, CoachStatus } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

@Injectable()
export class CoachesService {
  constructor(
    @Inject('FIREBASE_ADMIN') private firebaseApp: admin.app.App,
    @Inject('FIRESTORE') private firestore: Firestore,
  ) {}

  async create(createCoachDto: CreateCoachDto, files: { cv?: Express.Multer.File[]; profilePicture?: Express.Multer.File[]; passportPicture?: Express.Multer.File[] }) {
    try {
      console.log('=== COACHES SERVICE CREATE ===');
      console.log('CreateCoachDto:', JSON.stringify(createCoachDto, null, 2));
      console.log('Files received:', {
        cv: files?.cv ? `${files.cv.length} file(s)` : 'none',
        profilePicture: files?.profilePicture ? `${files.profilePicture.length} file(s)` : 'none',
        passportPicture: files?.passportPicture ? `${files.passportPicture.length} file(s)` : 'none',
      });

      const { email, password, name, dateOfBirth, profession, pricePerSession, availableDays, availableHours, status } = createCoachDto;
      
      console.log('=== PARSED VALUES ===');
      console.log('availableDays:', availableDays);
      console.log('availableDays type:', typeof availableDays);
      console.log('availableHours:', JSON.stringify(availableHours, null, 2));
      console.log('availableHours type:', typeof availableHours);
      console.log('availableHours keys:', Object.keys(availableHours));

      console.log('Creating Firebase Auth user...');
      // Create user in Firebase Auth
      const userRecord = await this.firebaseApp.auth().createUser({
        email,
        password,
        displayName: name,
      });
      console.log('Firebase Auth user created:', userRecord.uid);

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

      let cvUrl = '';
      let profilePictureUrl = '';
      let passportPictureUrl = '';

      if (files.cv && files.cv[0]) {
        cvUrl = await uploadFile(files.cv[0], 'coaches/cvs');
      }

      if (files.profilePicture && files.profilePicture[0]) {
        profilePictureUrl = await uploadFile(files.profilePicture[0], 'coaches/profiles');
      }

      if (files.passportPicture && files.passportPicture[0]) {
        passportPictureUrl = await uploadFile(files.passportPicture[0], 'coaches/passports');
      }

      console.log('Saving coach to Firestore...');
      // Save coach to Firestore
      const coachData = {
        uid: userRecord.uid,
        email: userRecord.email,
        name,
        dateOfBirth,
        profession,
        pricePerSession,
        availableDays,
        availableHours,
        status: status || CoachStatus.PENDING,
        cvUrl,
        profilePictureUrl,
        passportPictureUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await this.firestore.collection('coaches').doc(userRecord.uid).set(coachData);
      console.log('Coach saved to Firestore successfully');

      return {
        success: true,
        message: 'Coach created successfully',
        data: coachData,
      };
    } catch (error) {
      console.error('=== ERROR IN COACHES SERVICE ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.code === 'auth/email-already-exists') {
        throw new BadRequestException('Email already exists');
      }
      throw new BadRequestException(error.message);
    }
  }

  async getFilterOptions() {
    const snapshot = await this.firestore.collection('coaches').where('status', '==', 'active').get();
    
    const professions = new Set<string>();
    const prices: number[] = [];
    const days = new Set<string>();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.profession) professions.add(data.profession);
      if (data.pricePerSession) prices.push(data.pricePerSession);
      if (data.availableHours) {
        Object.keys(data.availableHours).forEach(day => {
          if (data.availableHours[day]?.length > 0) {
            days.add(day);
          }
        });
      }
    });

    return {
      success: true,
      data: {
        professions: Array.from(professions).sort(),
        priceRange: prices.length > 0 ? {
          min: Math.min(...prices),
          max: Math.max(...prices),
        } : { min: 0, max: 100 },
        days: Array.from(days).sort(),
      },
    };
  }

  async findAll(search?: string, statusFilter?: string, profession?: string, minPrice?: string, maxPrice?: string, day?: string) {
    console.log('=== COACHES SERVICE FIND ALL ===');
    console.log('Search term:', search);
    console.log('Status filter:', statusFilter);
    console.log('Profession:', profession);
    console.log('Price range:', minPrice, '-', maxPrice);
    console.log('Day:', day);
    
    let query: any = this.firestore.collection('coaches');
    
    // Apply status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      query = query.where('status', '==', statusFilter);
    }
    
    const snapshot = await query.get();
    let coaches: any[] = [];
    
    snapshot.forEach(doc => {
      coaches.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Apply search filter
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      coaches = coaches.filter(coach => 
        coach.name?.toLowerCase().includes(searchLower) ||
        coach.email?.toLowerCase().includes(searchLower) ||
        coach.profession?.toLowerCase().includes(searchLower)
      );
    }

    // Apply profession filter
    if (profession && profession.trim() !== '') {
      coaches = coaches.filter(coach => coach.profession === profession);
    }

    // Apply price range filter
    if (minPrice) {
      const min = parseFloat(minPrice);
      coaches = coaches.filter(coach => coach.pricePerSession >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      coaches = coaches.filter(coach => coach.pricePerSession <= max);
    }

    // Apply day filter
    if (day && day.trim() !== '') {
      coaches = coaches.filter(coach => {
        if (!coach.availableHours) return false;
        const dayLower = day.toLowerCase();
        return Object.keys(coach.availableHours).some(
          availableDay => availableDay.toLowerCase() === dayLower && coach.availableHours[availableDay]?.length > 0
        );
      });
    }

    console.log(`Found ${coaches.length} coaches`);

    return {
      success: true,
      data: coaches,
    };
  }

  async findOne(id: string) {
    const doc = await this.firestore.collection('coaches').doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Coach not found');
    }

    return {
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
      },
    };
  }

  async update(id: string, updateCoachDto: UpdateCoachDto, files?: { cv?: Express.Multer.File[]; profilePicture?: Express.Multer.File[]; passportPicture?: Express.Multer.File[] }) {
    console.log('=== UPDATE COACH SERVICE ===');
    console.log('Coach ID:', id);
    console.log('Update DTO:', JSON.stringify(updateCoachDto, null, 2));
    
    const doc = await this.firestore.collection('coaches').doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Coach not found');
    }

    const bucket = this.firebaseApp.storage().bucket();
    const uploadFile = async (file: Express.Multer.File, folder: string) => {
      const fileName = `${folder}/${id}_${Date.now()}_${file.originalname}`;
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

    // Build update data, removing undefined values
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Only add defined fields from updateCoachDto
    if (updateCoachDto.name !== undefined) updateData.name = updateCoachDto.name;
    if (updateCoachDto.dateOfBirth !== undefined) updateData.dateOfBirth = updateCoachDto.dateOfBirth;
    if (updateCoachDto.profession !== undefined) updateData.profession = updateCoachDto.profession;
    if (updateCoachDto.pricePerSession !== undefined) updateData.pricePerSession = updateCoachDto.pricePerSession;
    if (updateCoachDto.availableDays !== undefined) updateData.availableDays = updateCoachDto.availableDays;
    if (updateCoachDto.availableHours !== undefined) updateData.availableHours = updateCoachDto.availableHours;
    if (updateCoachDto.status !== undefined) updateData.status = updateCoachDto.status;

    if (files?.cv && files.cv[0]) {
      updateData.cvUrl = await uploadFile(files.cv[0], 'coaches/cvs');
    }

    if (files?.profilePicture && files.profilePicture[0]) {
      updateData.profilePictureUrl = await uploadFile(files.profilePicture[0], 'coaches/profiles');
    }

    if (files?.passportPicture && files.passportPicture[0]) {
      updateData.passportPictureUrl = await uploadFile(files.passportPicture[0], 'coaches/passports');
    }

    console.log('Final update data:', JSON.stringify(updateData, null, 2));
    await this.firestore.collection('coaches').doc(id).update(updateData);
    console.log('Coach updated in Firestore successfully');

    return {
      success: true,
      message: 'Coach updated successfully',
    };
  }

  async remove(id: string) {
    const doc = await this.firestore.collection('coaches').doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Coach not found');
    }

    // Delete user from Firebase Auth
    await this.firebaseApp.auth().deleteUser(id);

    // Delete from Firestore
    await this.firestore.collection('coaches').doc(id).delete();

    return {
      success: true,
      message: 'Coach deleted successfully',
    };
  }
}
