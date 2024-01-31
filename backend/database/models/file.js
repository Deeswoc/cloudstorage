'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User);
      this.belongsTo(models.Folder);
    }
  }
  File.init({
    name: DataTypes.STRING,
    path: DataTypes.STRING,
    size: DataTypes.INTEGER,
    location: DataTypes.STRING,
    s3_uid: DataTypes.UUID,
    s3_etag: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'File',
  });
  return File;
};