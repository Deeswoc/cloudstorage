'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.File);
      this.hasMany(models.Folder);
      this.belongsTo(models.UserTier)
    }
  }
  User.init({
    uid: {
      type: DataTypes.STRING,
      unique: true
    },
    displayname: DataTypes.STRING,
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    email: DataTypes.STRING,
    profile_photo: DataTypes.STRING,
    used_space: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};