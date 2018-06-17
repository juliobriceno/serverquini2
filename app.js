var express = require("express");
var app = express();
var path = require("path");
var bodyParser = require('body-parser');
var session = require('client-sessions');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var MyMongo = require('./js/mymongo.js');
var MyMsg = require('./js/mymsg.js');
var MyMail = require('./js/mails.js');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MyConst = require('./js/mymsg.js');
var MyConstantes = require('./js/constantes.js');
var MyLodash = require('./js/lodash.min.js');

// app.use(expressSession({ secret: '#19DieciNueveNoviembre', resave: true, saveUninitialized: true }));

const MongoStore = require('connect-mongo')(expressSession);

app.use(expressSession({
    secret: '#19DieciNueveNoviembre',
    store: new MongoStore({ url: 'mongodb://juliobricenoro:juliobricenoro444@ds163300.mlab.com:63300/quinielaqa' })
, resave: true, saveUninitialized: true}));

app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({limit: '20mb', extended: true}));

// must use cookieParser before expressSession
app.use(cookieParser());

io.on('connection', (socket) => {

  socket.on('set-email', (Email) => {
    socket.nickname = Email;
    io.emit('users-changed', {user: Email, event: 'joined'});
    socket.join('WorldRoomExample');
  });

});

app.use(function (req, res, next) {

  // OJO está fijo que busque un usuario en PRODUCCIÓN SERVER se quita ésto y se descomenta lo de abajo
  // MyMongo.Find('Users', { Email: 'pepepe@pepepe.com' } , function (result) {
  //   if ( result.length > 0 ){
  //     req.session.User = result[0];
  //     // If User is not in session and dont went to autheticate is returned
  //     if (typeof req.session.User == 'undefined' && req.path.indexOf('/public/') == -1){
  //       var Data = {};
  //       Data.result == 'noConnect';
  //       res.end(JSON.stringify(Data));
  //       return 0;
  //     }
  //     else{
  //       next();
  //     }
  //   }
  //   else {
  //       console.log('No encontró nada');
  //   }
  // });

    // If User is not in session and dont went to autheticate is returned
    if (typeof req.session.User == 'undefined' && req.path.indexOf('/public/') == -1){
      var Data = {};
      Data.result == 'noConnect';
      res.end(JSON.stringify(Data));
      return 0;
    }
    else{
      next();
    }
});

// Para enviar resultados
app.get('/public/setResult', function (req, res) {
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var lgame = req.query.game;
  var lhomegoal = req.query.homegoal;
  var lvisitorgoal = req.query.visitorgoal;
  // Busco los dummy games para ver el resto de los datos de los juegos que va a cambiar
  var lGames = MyLodash.clone(MyConstantes.Games);
  var lGame = {};
  lGames.forEach(function(eachGame){
    if (eachGame.game == lgame){
        lGame = { gamedate: '14 Junio', gamedateid: 14, gamehourid: 1, group: 'Grupo A', game: lgame, homename: 'Rusia', visitorname: 'A. Saudita', homeflag: 'assets/flags/flag-rusia.png', visitorflag: 'assets/flags/saudita.png', homegoal: lhomegoal, visitorgoal: lvisitorgoal, isEnded: true  }
    }
  })
  // Guarda el game
  MyMongo.Insert('endedGames', lGame, function (result) {
    var Data = {};
    res.end(JSON.stringify(Data));
    // Le avisa a todos los clientes que un juego terminó
    io.emit('finishedGame', {active: 'active', event: 'finishGame'});
  });
});

// app.post('*', function (req, res, next) {
//
//   if ( req.path.indexOf('/public/') != -1 ){
//     next();
//     return 0;
//   }
//
//   // OJO está fijo que busque un usuario en PRODUCCIÓN SERVER se quita ésto y se descomenta lo de abajo
//   MyMongo.Find('Users', { Email: req.body.User.Email } , function (result) {
//     if ( result.length > 0 ){
//       req.session.User = result[0];
//       // If User is not in session and dont went to autheticate is returned
//       if (typeof req.session.User == 'undefined' && req.path.indexOf('/public/') == -1){
//         var Data = {};
//         Data.result == 'noConnect';
//         res.end(JSON.stringify(Data));
//         return 0;
//       }
//       else{
//         next();
//       }
//     }
//     else {
//         console.log('No encontró nada');
//     }
//   });
// });

app.post('/public/GetUser', function (req, res) {

  // El correo siempre debe venir en minúscula
  req.body.User.Email = req.body.User.Email.toLowerCase();

  MyMongo.Find('Users', { $and: [ { Email: req.body.User.Email }, { Password: req.body.User.Password } ] } , function (result) {
    var Data = {};
    var User = {};
    if (result.length == 0){
      Data.result = 'userDoesNotExist';
      res.end(JSON.stringify(Data));
      return 0;
    }
    else{
      User = result[0];
    }
    // Busca si hay juegos finalizados simulados para que en el cliente bloquee los campos
    MyMongo.Find('endedGames', {}, function (result) {
      var endedGames = result;
      MyMongo.Find('noBet', {}, function (result) {
        Data.result = 'ok';
        Data.User = User;
        req.session.User = Data.User;
        Data.User = MyLodash.clone(req.session.User);
        Data.endedGames = endedGames;
        Data.noBet = result[0].noBet;
        delete Data.User.Password;
        delete Data.User.ConfirmPassword;
        res.end(JSON.stringify(Data));
      });
    });
  });
});

app.post('/api/getGroups', function (req, res) {
  MyMongo.FindDistinct('Users', 'Groups.Name', { 'Groups.Name': { '$regex': req.body.groupLetters, '$options': 'i' } } , function (result) {
    var Data = {};
    Data.result = 'ok';
    Data.Groups = result;
    res.end(JSON.stringify(Data));
  })
});

app.post('/api/closeSession', function (req, res) {
  req.session.User = undefined;
  var Data = {};
  Data.result = 'ok';
  res.end(JSON.stringify(Data));
});

app.post('/api/UpdateUser', function (req, res) {

  // Variable para guardar los grupos donde se unió un usuario (No nuevo grupo)
  var unionGroups = [];

  // Para devolver una respuesta al usuario indicando que se ha creado un nuevo grupo
  var newGroup = false;

  // Para evitar se cambie el Email desde el cliente. Igual coloca Password para que no se pierda al guardar. Lo eliminará antes de enviar la data al cliente
  req.body.User.Email = req.session.User.Email;
  // Le cambia la contraseña al usuario actual si viene (El Email de la sessión de arriba se asegura que sea a un usuario con ese email)
  // Si no viene la contraseña colocará la que tiene en sessión para asegurarse guarde con contraseña
  if (typeof req.body.User.Password == 'undefined')
  {
    req.body.User.Password = req.session.User.Password;
    req.body.User.ConfirmPassword = req.session.User.Password;
  }

  function FinishGroupCheck () {
    MyMongo.Save('Users', {Email: req.session.User.Email}, req.body.User, function (result) {
      var Data = {};
      if (result == true){
        Data.result = 'ok';
        Data.User = req.body.User;
        Data.newGroup = newGroup;
        req.session.User = Data.User;
        Data.User = MyLodash.clone(req.session.User);
        delete Data.User.Password;
        delete Data.User.ConfirmPassword;
      }
      else{
        Data.result = 'error';
      }

      // Emite para informar que se añadió éste usuario al grupo de alguien. Envía Email para que no se tome en cuenta el propio usuario
      io.emit('groupsChange', {Email: req.body.User.Email, punionGroups: unionGroups});

      res.end(JSON.stringify(Data));
    });
  }

  // Si no existe uno de los grups que intenta insertar lo inserta como administrador en ese grupo
  var itemsProcessed = 0;

  // Si no hay grupos guarda al usuario. No hay que revisar en grupos
  if (req.body.User.Groups.length == 0){
    FinishGroupCheck();
  }

  req.body.User.Groups.forEach(function(userGroup){

    // Si ya el grupo existe en la sesión coloca IsAdmin según esté en la sesión
    var sessionUserGroup = req.session.User.Groups.filter(function (sessionuserGroup){
      return sessionuserGroup.Name = userGroup.Name;
    });
    // Si el usuario tenía Grupos en la sesión coloca el que ya tenía IsAdmin o no. Es para evitar se cambie el IsAdmin en Updates...
    if (typeof req.session.User.Groups != 'undefined' && sessionUserGroup.length > 0){
      // Si no tiene IsAdmin es un grupo nuevo lo coloca abajo
      if (typeof userGroup.IsAdmin != 'undefined'){
        userGroup.IsAdmin = sessionUserGroup[0].IsAdmin;
        // Si no es Admin no puede cambiar el tipo de jugada
        if (userGroup.IsAdmin == false){
          // Cualquier puede cambiar el bet type
          var temp1 = '';
          // userGroup.BetType = sessionUserGroup[0].BetType;
        }
      }
    }


    // Sólo al finalizar éste proceso es que sigue con el UpdateUser
    MyMongo.Find('Users', { 'Groups.Name': userGroup.Name } , function (result) {
      if (typeof userGroup.IsAdmin == 'undefined'){
        if (result == 0){
          userGroup.IsAdmin = true;
          userGroup.BetType = 1;
          newGroup = true;
        }
        else {
          unionGroups.push({groupAdded: userGroup.Name});
          userGroup.IsAdmin = false;
        }
      }
      itemsProcessed++;
      if(itemsProcessed === req.body.User.Groups.length) {
        FinishGroupCheck();
      }
    });
  })

});

function GeneratePassword(){
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 7; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function SendUserPasswordMail(text, mail, callback){
  var msg = MyConst.CorreoHTML;
  msg = msg.replace('@@Email', mail);
  msg = msg.replace('@@Password', text);
  var subject = "Acceso a Acerté.";
  MyMail.SendEmail(msg, mail, subject, function(error){
    return callback(error);
  });
}

app.post('/public/InsertUser', function (req, res) {

  MyMongo.Find('Users', { Email: req.body.User.Email } , function (result) {
    var Data = {};

    if (result.length > 0){
      Data.result = 'userExist';
      res.end(JSON.stringify(Data))
      return 0;
    }

    req.body.User.Alias = req.body.User.Email;
    req.body.User.Games = MyConstantes.Games;
    req.body.User.DummyGames = MyConstantes.Games;
    // Se debe quitar el grupo por defecto
    req.body.User.Groups = [];

    // Convierte a minúscula el correo
    req.body.User.Email = req.body.User.Email.toLowerCase();

    MyMongo.Insert('Users', req.body.User, function (result) {
      if (result == false) {
        Data.result = 'error';
      }
      else{
        Data.result = 'ok';
        req.session.User = req.body.User;
        Data.User = MyLodash.clone(req.session.User);
        delete Data.User.Password;
        delete Data.User.ConfirmPassword;
      }
      res.end(JSON.stringify(Data))
    });

  });

});

app.post('/public/RecoverPassword', function (req, res) {

  req.body.User.Email = req.body.User.Email.toLowerCase();

  MyMongo.Find('Users', {Email: req.body.User.Email}, function (result) {
    var Data = {};
    if (result.length == 0){
      Data.result = 'userExist';
      res.end(JSON.stringify(Data))
      return 0;
    }
    var text = GeneratePassword();
    MyMongo.UpdateCriteria('Users', { Email: req.body.User.Email }, { Password: text }, function (result) {
      if (result == false) {
        Data.result = 'error';
        res.end(JSON.stringify(Data))
        return 0;
      }

      SendUserPasswordMail(text, req.body.User.Email, function(error){
        if (error == true) {
          Data.result = 'ok';
        } else {
          Data.result = 'error';
        }
        res.end(JSON.stringify(Data))
      });

    });
  });
});

// Devuelve todos los participantes de un grupo con sus quinielas
// app.post('/api/GetGroups', function (req, res) {
//   MyMongo.Find('Users', { $or: [ { 'Groups.Name': 'miercolesqueva3@hotmail.es.mx' }, { 'Groups.Name': 'miercolesqueva4@hotmail.es.mx' } ] }, function (result) {
//     Data.result = 'ok';
//     Data.Users = result[0];
//   });
// });

// Devuelve un array con todos los Users de todas los grupos del usuario
app.post('/api/GetUsersGroups', function (req, res) {
  var UsersGroups = [];
  var Users = [];
  var itemsProcessed = 0;

  function SendGroupsUsersToCliente () {
    // Antes de enviar a cliente busca y envía todos los resultados ya grabados.
    MyMongo.Find('endedGames', {}, function (result) {
      var Data = {};
      Data.result = 'ok';
      Data.UsersGroups = UsersGroups;
      Data.endedGames = result;
      res.end(JSON.stringify(Data));
    });
  }

  req.body.User.Groups.forEach(function(eachGroup){
    MyMongo.Find('Users', { 'Groups.Name': eachGroup.Name }, function (result) {
      // A cada usuario se le quita Password y ConfirmarPassword Y le pone el nombre del grupo para poder filtrar en el cliente
      Users = result;
      Users.forEach(function(eachUserInGroup){
        delete eachUserInGroup.Password;
        delete eachUserInGroup.ConfirmPassword;
        eachUserInGroup.GroupName = eachGroup.Name;
        UsersGroups.push(eachUserInGroup);
      })
      itemsProcessed++;

      // Si terminó todas las búsquedas envía al cliente
      if(itemsProcessed === req.body.User.Groups.length) {
        SendGroupsUsersToCliente();
      }

    });
  });
});

function GetCalcs(){
  // Obtiene la data de los usuarios del grupo. Ésto vendría del servidor
  MyMongo.Find('Users', { $or: [ { 'Email': 'nononono@hotmail.es.mx.ud' }, { 'Email': 'nononono2@hotmail.es.mx.ud' } ] }, function (result) {
    var Data = {};
    Data.result = 'ok';
    Data.Users = result;
    // El primer procesamiento es con la data actual del user actual
    processResults(Data.Users, 'nononono@hotmail.es.mx.ud', false );
    // Por cada usuario calcula los resultados basados en todos los resultados faltantes perfectos según su quiniela
    Data.Users.forEach(function(User){
      // Cada juego no terminado lo termina con el resultado igual al pronosticado
      User.DummyGames.forEach(function(usrDummyGame){
        if ( usrDummyGame.IsEnd == false ){
          usrDummyGame.IsEnd = true;
          usrDummyGame.homegoal = User.Games[usrDummyGame.game].homegoal;
          usrDummyGame.visitorgoal = User.Games[usrDummyGame.game].visitorgoal;
        }
      })
      processResults(Data.Users, User.Email, true );
    });
  });
}

// Función temporal para analizar el juego. Ésto correrá es en en el celular
function processResults(pUsers, userEmail, isSimulated){
  var Data = {};
  Data.Users = pUsers;
  // Calcula el tipo de jugada BetType == 1 es que el que pega el ganador o empate gana 1 punto, caso contrario 0 puntos BetType == 2
  // es que el que acierta ganador o empate gana 1 punto (Si además acierta resultado gana 1 punto adicional)
  // Recorre cada usuario del grupo para estimar la cantidad de puntos según el BetType
  var UsersPlayers = [];
  // El usuario de donde se sacará el Dummy Game
  var userDummyGame = Data.Users.filter(function(usr){
    return usr.Email == userEmail;
  });

  Data.Users.forEach(function(User){
    // Verifica el tipo de jugada. Se busca al administrador que es el que la tiene)
    var myBetType = 1
    User.Groups.forEach(function(userGroup){
      if ( userGroup.IsAdmin == true ){
        myBetType = userGroup.BetType;
      }
    })
    var UserPlayer = {};
    UserPlayer.Alias = User.Alias;
    UserPlayer.Score = 0;
    // Recorre todos los pronósticos
    User.Games.forEach(function(UserGame){
      // Por cada pronóstico busca cada resultado si lo acertó y el BetType == 1 (1 punto) si además el BetType == 2 y acertó el resultado 1 punto más. Sólo
      // los juegos que se hayan considerado terminado. Los pronóstico son del usuario que se le pase a ésta función
      var myUserDummyGame = userDummyGame.DummyGames.filter(function(UserDummyGame){
        return UserDummyGame.game == UserGame.game && UserDummyGame.IsEnd == true
      })[0];
      // Si no devolvió nada es que el juego no está finalizado y no aumenta el Score a nadie
      if (typeof myUserDummyGame != 'undefined')
      {
        if
        (
          // Si fue empate el resultado y se predijo empate
          (myUserDummyGame.homegoal == myUserDummyGame.visitorgoal && UserGame.homegoal == UserGame.visitorgoal ) ||
          // Or fue vistoria del local y se predijo victoria del local
          (myUserDummyGame.homegoal > myUserDummyGame.visitorgoal && UserGame.homegoal > UserGame.visitorgoal ) ||
          // Or fue victoria del visitante y se predijo victoria del visitante
          (myUserDummyGame.homegoal < myUserDummyGame.visitorgoal && UserGame.homegoal < UserGame.visitorgoal )
        )
        {
          UserPlayer.Score += 1;
        }
        // Además si acertó el resultado exacto 1 punto adicional
        if (myBetType == 2){
          if
          (
            // Si el resultado pronosticado fue excato al que se dió
            myUserDummyGame.homegoal == UserGame.homegoal && myUserDummyGame.visitorgoal == UserGame.visitorgoal
          )
          {
            UserPlayer.Score += 1;
          }
        }
      }
    })
    UsersPlayers.push(UserPlayer);
  })
  // Ordena de menor a mayor
  UsersPlayers = MyLodash.orderBy(UsersPlayers, ['Score'],['desc']);
  // Calcula la posición de jugador actual y la notifica.
  var positionCount = 1;
  var scoresCount = 0;

  try {
    UsersPlayers.forEach(function(UserPlayer) {
      // Primer recorrido cuántos puntos lleva el primero si es el usuario abandona el ciclo el usuario actual estaría de primero
      if ( scoresCount == 0 ){
        scoresCount = UsersPlayers.Score;
        if ( UserPlayer.Email == userEmail ){
          throw BreakException;
        }
      }
      else{
        // El score bajó de anterior posición baja una posición
        if ( UsersPlayers.Score < scoresCount ){
          positionCount++;
          if ( UserPlayer.Email == userEmail ){
            throw BreakException;
          }
        }
      }
    });
  } catch (e) {
  }

  console.log(UsersPlayers);
}

// GetCalcs();

const portSocket = process.env.PORT || 3000;

http.listen(portSocket, function(){
   console.log('listening socket in http://localhost:' + portSocket);
});
