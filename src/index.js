import express from 'express'
import { Server } from 'socket.io'
import handlebars from 'express-handlebars'
import productsRouter from './routers/products.router.js'
import cartsRouter from './routers/carts.router.js'
import viewsRouter from './routers/views.router.js'
import chatRouter from './routers/chat.router.js'
import sessionsRouter from './routers/sessions.router.js'
import viewsUserRouter from './routers/viewsUser.router.js'
import mailPurchaseRouter from './routers/mailPurchase.router.js'
import mockingRouter from './routers/mocking.router.js'
import loggerTestRouter from './routers/logger.router.js'
import apiUsersRouter from './routers/apiUsers.router.js'
import mongoose from 'mongoose'
import Message from './models/message.model.js'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import initializePassport from './config/passport.config.js'
import dotenv from 'dotenv'
import errorHandler from './middlewares/error.middleware.js'
import logger from './logger.js'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUiExpress from 'swagger-ui-express'
import multer from 'multer'


dotenv.config()


const PORT=8080
const app = express(); 

app.use(express.json());

app.use(errorHandler)
app.use(express.static('./src/public')); 
app.use(express.urlencoded({ extended: true }))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      const { type } = req.body;
      if (type === 'profile') {
          cb(null, 'src/public/uploads/profiles');
      } else if (type === 'product') {
          cb(null, 'src/public/uploads/products');
      } else if (type === 'document') {
          cb(null, 'src/public/uploads/documents');
      } else {
          cb(null, 'src/public/uploads/other');
      }
  },
  filename: (req, file, cb) => {
      cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// configuracion de la sesion
app.use(session({
  store: MongoStore.create({
      mongoUrl:"mongodb+srv://aguerorodrigo91:aguerorodrigo91@proyectocoderhouse.pxcbns7.mongodb.net/Ecommerce",
      
  }),
  secret:'coderSecret',
  resave: true,
  saveUninitialized: true
}))

// configuracion de passport
initializePassport();
app.use(passport.initialize());
app.use(passport.session());

// configuracion del motor de plantillas handlebars
app.engine('handlebars', handlebars.engine());
app.set('views', './src/views');
app.set('view engine', 'handlebars');

// Inicialización del servidor
try {
  await mongoose.connect("mongodb+srv://aguerorodrigo91:aguerorodrigo91@proyectocoderhouse.pxcbns7.mongodb.net/Ecommerce") // conecta con la base de datos
  const serverHttp = app.listen(PORT, () => logger.info('server up'))  
  const io = new Server(serverHttp) 
  app.use((req, res, next) => {
    req.io = io;
    next();
  }); // middleware para agregar la instancia de socket.io a la request
  
  // Rutas
  app.get('/', (req, res) => {
    if (req.session.user) {
      // Si el usuario ya está autenticado, redireccionar a la vista de productos
      res.render('index');
    } else {
      // Si el usuario no ha iniciado sesión, redireccionar a la vista de inicio de sesión
      res.redirect('/login');
    }
  })
  
  const swaggerOptions = {
    definition: {
      openapi: '3.0.1',
      info: {
        title: 'Documentación de la API del Ecommerce',
        description: 'descripcion del proyecto...'
      }
    },
    apis: ['./docs/**/*.yaml']
  };
  
  const specs = swaggerJSDoc(swaggerOptions)
  app.use('/docs',swaggerUiExpress.serve, swaggerUiExpress.setup(specs))


  app.use('/', viewsUserRouter); 
  app.use('/chat', chatRouter); 
  app.use('/products', viewsRouter); 
  app.use('/mockingproducts', mockingRouter); 
  app.use('/api/users', upload.array('files', 20), apiUsersRouter); 
  app.use('/api/products', productsRouter); 
  app.use('/api/carts', cartsRouter); 
  app.use('/api/sessions', sessionsRouter); 
  app.use('/sendMailPurchase', mailPurchaseRouter); 
  app.use('/loggerTest', loggerTestRouter); 

  io.on('connection', socket => {
    logger.info('Nuevo cliente conectado!')

    socket.broadcast.emit('Alerta');

    
    Message.find()
      .then(messages => {
        socket.emit('messages', messages);
      })
      .catch(error => {
        logger.error(error.message);
      });

    socket.on('message', data => {
      
      const newMessage = new Message({
        user: data.user,
        message: data.message
      });

      newMessage.save()
        .then(() => {
          
          Message.find()
            .then(messages => {
              io.emit('messages', messages);
            })
            .catch(error => {
              logger.error(error.message);
            });
        })
        .catch(error => {
          logger.error(error.message);
        });
    });

    socket.on('productList', async (data) => {
      io.emit('updatedProducts', data) 
    })
    socket.on('userList', async (data) => {
      io.emit('updatedUserList', data) 
    }) 
    
  }) 
} catch (error) {
  logger.error(error.message)
}