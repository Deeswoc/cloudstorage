'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Folder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Folder);
      this.hasMany(models.File);
      this.hasMany(models.File);
      this.belongsTo(models.User);
    }
  }
  Folder.init({
    uid: DataTypes.UUID,
    name: DataTypes.STRING,
    path: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Folder',
  });
  return Folder;
};