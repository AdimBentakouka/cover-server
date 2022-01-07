export type Queue = {
    action: string; // "add", "update", "remove"
    filepath: string;
}

export type Volume = {
    collectionName: string;
    volumeName: string;
    nbPages: string;
    filesize: string;
    cover: string;
}

export type Collection = {
    name: string;
    cover: string;
}