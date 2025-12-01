import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(@Inject('FIRESTORE') private firestore: Firestore) {}

  private tasksCollection = 'tasks';

  async create(createTaskDto: CreateTaskDto) {
    console.log('Creating task with data:', createTaskDto);

    // Validate that the subscription exists and get its details
    const subscriptionDoc = await this.firestore
      .collection('subscriptions')
      .doc(createTaskDto.subscriptionId)
      .get();

    if (!subscriptionDoc.exists) {
      throw new BadRequestException('Subscription not found');
    }

    const subscriptionData = subscriptionDoc.data();
    if (!subscriptionData) {
      throw new BadRequestException('Subscription has no data');
    }

    // Validate that the subscription is active
    if (subscriptionData.status !== 'active') {
      throw new BadRequestException(
        `Cannot create task for a ${subscriptionData.status} subscription. The subscription must be active.`
      );
    }

    // Get subscription date range
    const subscriptionStart = new Date(subscriptionData.startDate);
    const subscriptionEnd = new Date(subscriptionData.endDate);
    
    // Parse task dates
    const taskStartDate = new Date(createTaskDto.startDate);
    const taskDueDate = new Date(createTaskDto.dueDate);

    // Validate task start date is within subscription period
    if (taskStartDate < subscriptionStart) {
      throw new BadRequestException(
        `Task start date (${createTaskDto.startDate}) must be on or after the subscription start date (${subscriptionData.startDate})`
      );
    }

    if (taskStartDate > subscriptionEnd) {
      throw new BadRequestException(
        `Task start date (${createTaskDto.startDate}) must be on or before the subscription end date (${subscriptionData.endDate})`
      );
    }

    // Validate task due date is within subscription period
    if (taskDueDate > subscriptionEnd) {
      throw new BadRequestException(
        `Task due date (${createTaskDto.dueDate}) must be on or before the subscription end date (${subscriptionData.endDate})`
      );
    }

    // Validate task start date is before due date
    if (taskStartDate >= taskDueDate) {
      throw new BadRequestException('Task start date must be before the due date');
    }

    // Verify player and coach IDs match the subscription
    if (createTaskDto.playerId !== subscriptionData.playerId) {
      throw new BadRequestException('Player ID does not match the subscription');
    }

    if (createTaskDto.coachId !== subscriptionData.coachId) {
      throw new BadRequestException('Coach ID does not match the subscription');
    }

    const taskData: any = {
      ...createTaskDto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Remove undefined fields to prevent Firestore errors
    Object.keys(taskData).forEach(key => taskData[key] === undefined && delete taskData[key]);
    
    // Also clean submission object if it exists
    if (taskData.submission) {
      Object.keys(taskData.submission).forEach(key => taskData.submission[key] === undefined && delete taskData.submission[key]);
    }

    const docRef = await this.firestore
      .collection(this.tasksCollection)
      .add(taskData);

    console.log('Task created with ID:', docRef.id);

    return {
      id: docRef.id,
      ...taskData,
    };
  }

  async findAll(coachId?: string, playerId?: string, status?: string) {
    console.log('Fetching tasks with filters:', { 
      coachId: coachId || 'All', 
      playerId: playerId || 'All', 
      status: status || 'All' 
    });

    try {
      let query: any = this.firestore.collection(this.tasksCollection);

      if (coachId) {
        query = query.where('coachId', '==', coachId);
      }

      if (playerId) {
        query = query.where('playerId', '==', playerId);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('No tasks found');
        return [];
      }

      // Optimization: Fetch unique players and coaches in parallel
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const playerIds = [...new Set(tasksData.map((t: any) => t.playerId).filter(Boolean))] as string[];
      const coachIds = [...new Set(tasksData.map((t: any) => t.coachId).filter(Boolean))] as string[];

      const [players, coaches] = await Promise.all([
        Promise.all(playerIds.map(id => this.firestore.collection('players').doc(id).get())),
        Promise.all(coachIds.map(id => this.firestore.collection('coaches').doc(id).get()))
      ]);

      const playerMap = new Map(players.map(doc => [doc.id, doc.exists ? doc.data()?.name : 'Unknown']));
      const coachMap = new Map(coaches.map(doc => [doc.id, doc.exists ? doc.data()?.name : 'Unknown']));

      const tasks = tasksData.map((task: any) => ({
        ...task,
        playerName: playerMap.get(task.playerId) || task.playerId || 'Unknown',
        coachName: coachMap.get(task.coachId) || task.coachId || 'Unknown',
      }));

      console.log(`Found ${tasks.length} tasks`);
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    console.log('Fetching task with ID:', id);

    try {
      const doc = await this.firestore
        .collection(this.tasksCollection)
        .doc(id)
        .get();

      if (!doc.exists) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      const data = doc.data();
      if (!data) {
        throw new NotFoundException(`Task with ID ${id} has no data`);
      }

      // Fetch player name
      let playerName = data.playerId || 'Unknown';
      if (data.playerId) {
        try {
          const playerDoc = await this.firestore
            .collection('players')
            .doc(data.playerId)
            .get();
          if (playerDoc.exists) {
            playerName = playerDoc.data()?.name || data.playerId;
          }
        } catch (err) {
          console.error('Error fetching player:', err);
        }
      }

      // Fetch coach name
      let coachName = data.coachId || 'Unknown';
      if (data.coachId) {
        try {
          const coachDoc = await this.firestore
            .collection('coaches')
            .doc(data.coachId)
            .get();
          if (coachDoc.exists) {
            coachName = coachDoc.data()?.name || data.coachId;
          }
        } catch (err) {
          console.error('Error fetching coach:', err);
        }
      }

      return {
        id: doc.id,
        ...data,
        playerName,
        coachName,
      };
    } catch (error) {
      console.error('Error in findOne task:', error);
      throw error;
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    console.log('Updating task:', id, updateTaskDto);

    const docRef = this.firestore.collection(this.tasksCollection).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const taskData: any = {
      ...updateTaskDto,
      updatedAt: new Date().toISOString(),
    };

    // Remove undefined fields
    Object.keys(taskData).forEach(key => taskData[key] === undefined && delete taskData[key]);

    // Also clean submission object if it exists
    if (taskData.submission) {
      Object.keys(taskData.submission).forEach(key => taskData.submission[key] === undefined && delete taskData.submission[key]);
    }

    await docRef.update(taskData);

    console.log('Task updated successfully');

    return this.findOne(id);
  }

  async remove(id: string) {
    console.log('Deleting task with ID:', id);

    await this.firestore
      .collection(this.tasksCollection)
      .doc(id)
      .delete();

    console.log('Task deleted successfully');

    return { message: 'Task deleted successfully' };
  }

  // Get all players for a specific coach (from active subscriptions)
  async getCoachPlayers(coachId: string) {
    console.log('Fetching players for coach:', coachId);

    try {
      // Get all active subscriptions for this coach
      const subscriptionsSnapshot = await this.firestore
        .collection('subscriptions')
        .where('coachId', '==', coachId)
        .where('status', '==', 'active')
        .get();

      if (subscriptionsSnapshot.empty) {
        console.log('No active subscriptions found for coach');
        return [];
      }

      // Get unique player IDs
      const playerIds = [
        ...new Set(
          subscriptionsSnapshot.docs.map((doc) => doc.data().playerId)
        ),
      ];

      // Fetch player details
      const players = await Promise.all(
        playerIds.map(async (playerId) => {
          try {
            const playerDoc = await this.firestore
              .collection('players')
              .doc(playerId)
              .get();

            if (playerDoc.exists) {
              const data = playerDoc.data();
              return {
                id: playerDoc.id,
                name: data?.name || 'Unknown',
                email: data?.email || '',
              };
            }
            return null;
          } catch (err) {
            console.error('Error fetching player:', err);
            return null;
          }
        })
      );

      const validPlayers = players.filter((p) => p !== null);
      console.log(`Found ${validPlayers.length} players for coach`);

      return validPlayers;
    } catch (error) {
      console.error('Error fetching coach players:', error);
      throw error;
    }
  }
}
