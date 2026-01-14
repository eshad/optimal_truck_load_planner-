import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe - enforces DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // Enable CORS for frontend applications
  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js default port
      'http://localhost:5173', // Vite default port
      'http://localhost:5174', // Vite alternate port
      'http://localhost:4200', // Angular default port
      'http://localhost:8080', // Vue CLI default port
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('SmartLoad Optimizer API')
    .setDescription(
      'Optimal Truck Load Planner - REST API for maximizing shipment profitability using advanced optimization algorithms. ' +
        'This stateless backend service selects the best combination of orders for a truck while respecting weight, volume, hazmat, route, and time constraints.',
    )
    .setVersion('1.0.0')
    .addTag('Load Optimizer', 'Endpoints for truck load optimization')
    .setContact(
      'SmartLoad Team',
      'https://github.com/yourusername/smartload-optimizer',
      'support@smartload.example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'SmartLoad Optimizer API',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
    },
  });

  // Listen on port 8080 as required
  const port = process.env.PORT || 8080;
  await app.listen(port);

  console.log('');
  console.log('========================================');
  console.log('  SmartLoad Optimizer API - READY');
  console.log('========================================');
  console.log(`🚀 Server running on: ${await app.getUrl()}`);
  console.log(`📚 Swagger docs: ${await app.getUrl()}/api`);
  console.log(
    `🔌 Optimization endpoint: POST ${await app.getUrl()}/api/v1/load-optimizer/optimize`,
  );
  console.log(`✅ Port: ${port}`);
  console.log(`🔐 CORS enabled for development`);
  console.log('========================================');
  console.log('');
}

bootstrap();
