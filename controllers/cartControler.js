const { Users, OrderItem, Product, CartItem } = require("../models");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
/* Para hacer con bulkcreate tienes que pasar un array de objetos
1.- Desde el front cuando esta deslogueado guarda en localstorage un array de objetos
El array debe estar de la siguiente forma ejemplo: [{ id : 'product id', quantity : '1'}]
2.- Cuando se loguea al back se le pasa estes array de localstorage
3.- A este array se le hace un map:
array.map( (item)  => return { productId: item.id, userId: userId, quantity: item.quantity })


*/

const addProduct = (req, res, next) => {
  const userId = req.user.id;
  const { id, quantity } = req.body;
  Users.findOne({ where: { id: userId } })
    .then((user) =>
      Product.findOne({ where: { id: id } }).then((product) => {
        CartItem.create({
          productId: product.id,
          userId: user.id,
          quantity: quantity,
        }).then((cart) => res.send(cart));
      })
    )
    .catch(next);
};

const addMultiProduct = (req, res, next) => {
  const userId = req.user.id;
  const { products } = req.body;
  Users.findOne({ where: { id: userId } })
    .then((user) =>
      products.map((product) => {
        Product.findOne({ where: { id: product.id } }).then((productDb) => {
          CartItem.findOne({
            where: {
              [Op.and]: [{ userId: user.id }, { productId: productDb.id }],
            },
          }).then((productDbCart) => {
            if (productDbCart) {
              CartItem.update(
                { quantity: product.quantity + productDbCart.quantity },
                { where: { id: productDbCart.id }, returning: true }
              ).then(([afect, update]) => console.log(update[0]));
            } else {
              CartItem.create({
                productId: productDb.id,
                userId: user.id,
                quantity: product.quantity,
              }).then((cart) => console.log(cart));
            }
          });
        });
      })
    )
    .then(res.sendStatus(200))
    .catch(next);
};

const editProduct = (req, res, next) => {
  const { id } = req.params;
  const { quantity } = req.body;
  CartItem.update({ quantity: quantity }, { where: { productId: id } })
    .then(() => res.send(201))
    .catch(next);
};

const deleteCart = (req, res, next) => {
  const { id } = req.params;
  CartItem.destroy({ where: { productId: id } })
    .then(() => res.send(200))
    .catch(next);
};

const buyProducts = (req, res, next) => {
  const { id } = req.user;

  const testAccount = nodemailer.createTestAccount();

  let trasporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  Users.findOne({ where: { id: id } })
    .then((user) => {
      CartItem.findAll({ where: { userId: id } }).then((items) => {
        const history = items.map((item) => {
          const { productId, userId, quantity } = item;
          return { productId, userId, quantity };
        });
        let sendInfo = {
          from: "remitente",
          to: user.email,
          subject: "Compra realizada",
          text: "su compra se realizo con exito",
        };

        OrderItem.bulkCreate(history).then(() =>
          CartItem.destroy({
            where: { userId: id },
          }).then(() => {
            trasporter.sendMail(sendInfo, (err, info) => {
              err ? res.sendStatus(500) : console.log("enviado");
            });
            res.send(204);
          })
        );
      });
    })
    .catch(next);
};

const cartStory = (req, res, next) => {
  const { id } = req.user;
  OrderItem.findAll({ where: { userId: id } })
    .then((items) => res.status(200).send(items))
    .catch(next);
};

module.exports = {
  addProduct,
  deleteCart,
  editProduct,
  buyProducts,
  cartStory,
  addMultiProduct,
};
