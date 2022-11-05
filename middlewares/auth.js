const { check } = require("express-validator");
const { validateToken } = require("../config/tokens");
const { Users } = require("../models");

function validateAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);

  const { user } = validateToken(token);
  if (!user) return res.sendStatus(401);

  req.user = user;

  next();
}

const validateRegister = [
  check("name").notEmpty().withMessage("Ingrese datos en el campo nombre"),
  check("address")
    .notEmpty()
    .withMessage("Ingrese datos en el campo direccion"),
  check("email")
    .notEmpty()
    .withMessage("Ingrese datos en el campo email")
    .bail()
    .normalizeEmail()
    .isEmail()
    .withMessage("Ingrese un correo valido")
    .custom((value) => {
      return Users.findOne({ where: { email: value } }).then((user) => {
        if (user) {
          return Promise.reject("Este E-mail ya esta utilizado");
        }
      });
    }),
  check("pass")
    .notEmpty()
    .withMessage("Ingrese datos en el campo contraseña")
    .bail()
    .matches(/\d/)
    .withMessage("Debe contener por lo menos un numero")
    .matches(/[A-Z]/)
    .withMessage("Debe contener por lo menos una letra mayuscula")
    .matches(/[a-z]/)
    .withMessage("Debe contener por lo menos una letra minuscula")
    .matches(/\W/)
    .withMessage("Debe contener por lo menos un caracter especial")
    .isLength({ min: 6 })
    .withMessage("Debe contener minimo 6 caracteres"),
];

const validateLogin = [
  check("email")
    .notEmpty()
    .withMessage("Ingrese datos en el campo email")
    .bail()
    .normalizeEmail()
    .isEmail()
    .withMessage("Ingrese un correo valido")
    .bail()
    .custom((value) => {
      return Users.findOne({ where: { email: value } }).then((user) => {
        if (!user) {
          return Promise.reject("Este E-mail no existe");
        }
      });
    }),
  check("pass").notEmpty().withMessage("Ingrese datos en el campo contraseña"),
];

module.exports = { validateAuth, validateRegister, validateLogin };
