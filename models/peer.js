const randomAnimalName = require("random-animal-name");

module.exports = class Peer {
  constructor(id) {
    this.id = id;
    this.name = randomAnimalName();
    this.roomId = "";
    this.lastActive = this.createdAt = new Date();
  }
};
