'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserTier extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.User);
    }
  }
  UserTier.init({
    name: DataTypes.STRING,
    space_allotted: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'UserTier',
  });
  return UserTier;
};