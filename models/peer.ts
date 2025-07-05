import randomAnimalName from "random-animal-name";

export default class Peer {
    id: string;
    name: string;
    roomId: string;
    lastActive: Date;
    createdAt: Date;

    constructor(id: string) {
        this.id = id;
        this.name = randomAnimalName();
        this.roomId = "";
        this.lastActive = this.createdAt = new Date();
    }
}
