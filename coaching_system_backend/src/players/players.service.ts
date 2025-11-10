import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import { CreatePlayerDto, PlayerStatus } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @Inject('FIREBASE_ADMIN') private firebaseApp: admin.app.App,
    @Inject('FIRESTORE') private firestore: Firestore,
  ) {}

  async create(createPlayerDto: CreatePlayerDto) {
    try {
      console.log('=== PLAYERS SERVICE CREATE ===');
      console.log('CreatePlayerDto:', JSON.stringify(createPlayerDto, null, 2));

      const { email, password, name, dateOfBirth, status } = createPlayerDto;

      console.log('Creating Firebase Auth user...');
      // Create user in Firebase Auth
      const userRecord = await this.firebaseApp.auth().createUser({
        email,
        password,
        displayName: name,
      });
      console.log('Firebase Auth user created:', userRecord.uid);

      console.log('Saving player to Firestore...');
      // Save player to Firestore
      const playerData = {
        uid: userRecord.uid,
        email: userRecord.email,
        name,
        dateOfBirth,
        status: status || PlayerStatus.PENDING,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await this.firestore.collection('players').doc(userRecord.uid).set(playerData);
      console.log('Player saved to Firestore successfully');

      return {
        success: true,
        message: 'Player created successfully',
        data: playerData,
      };
    } catch (error) {
      console.error('=== ERROR IN PLAYERS SERVICE ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.code === 'auth/email-already-exists') {
        throw new BadRequestException('Email already exists');
      }
      throw new BadRequestException(error.message);
    }
  }

  async findAll(search?: string, statusFilter?: string) {
    console.log('=== PLAYERS SERVICE FIND ALL ===');
    console.log('Search term:', search);
    console.log('Status filter:', statusFilter);
    
    let query: any = this.firestore.collection('players');
    
    // Apply status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      query = query.where('status', '==', statusFilter);
    }
    
    const snapshot = await query.get();
    let players: any[] = [];
    
    snapshot.forEach(doc => {
      players.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Apply search filter on results (client-side filtering for multiple fields)
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      players = players.filter(player => 
        player.name?.toLowerCase().includes(searchLower) ||
        player.email?.toLowerCase().includes(searchLower)
      );
    }

    console.log(`Found ${players.length} players`);

    return {
      success: true,
      data: players,
    };
  }

  async findOne(id: string) {
    const doc = await this.firestore.collection('players').doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Player not found');
    }

    return {
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
      },
    };
  }

  async update(id: string, updatePlayerDto: UpdatePlayerDto) {
    console.log('=== UPDATE PLAYER SERVICE ===');
    console.log('Player ID:', id);
    console.log('Update DTO:', JSON.stringify(updatePlayerDto, null, 2));
    
    const doc = await this.firestore.collection('players').doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Player not found');
    }

    // Build update data, removing undefined values
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Only add defined fields from updatePlayerDto
    if (updatePlayerDto.name !== undefined) updateData.name = updatePlayerDto.name;
    if (updatePlayerDto.dateOfBirth !== undefined) updateData.dateOfBirth = updatePlayerDto.dateOfBirth;
    if (updatePlayerDto.status !== undefined) updateData.status = updatePlayerDto.status;

    console.log('Final update data:', JSON.stringify(updateData, null, 2));
    await this.firestore.collection('players').doc(id).update(updateData);
    console.log('Player updated in Firestore successfully');

    return {
      success: true,
      message: 'Player updated successfully',
    };
  }

  async remove(id: string) {
    const doc = await this.firestore.collection('players').doc(id).get();

    if (!doc.exists) {
      throw new NotFoundException('Player not found');
    }

    // Delete from Firestore
    await this.firestore.collection('players').doc(id).delete();

    // Delete from Firebase Auth
    try {
      await this.firebaseApp.auth().deleteUser(id);
    } catch (error) {
      console.error('Error deleting user from Firebase Auth:', error);
    }

    return {
      success: true,
      message: 'Player deleted successfully',
    };
  }
}
