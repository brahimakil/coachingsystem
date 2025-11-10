import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: (configService: ConfigService) => {
        const serviceAccount = {
          type: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_TYPE'),
          project_id: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PROJECT_ID'),
          private_key_id: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_ID'),
          private_key: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
          client_email: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL'),
          client_id: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_CLIENT_ID'),
          auth_uri: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_AUTH_URI'),
          token_uri: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_TOKEN_URI'),
          auth_provider_x509_cert_url: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL'),
          client_x509_cert_url: configService.get<string>('FIREBASE_SERVICE_ACCOUNT_CLIENT_CERT_URL'),
        };
        
        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          storageBucket: configService.get<string>('FIREBASE_STORAGE_BUCKET'),
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'FIRESTORE',
      useFactory: (firebaseApp: admin.app.App) => {
        return firebaseApp.firestore();
      },
      inject: ['FIREBASE_ADMIN'],
    },
  ],
  exports: ['FIREBASE_ADMIN', 'FIRESTORE'],
})
export class FirebaseModule {}
