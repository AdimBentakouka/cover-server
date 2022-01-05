export type Queue = {
    action: string, // action possible: ["add", "update", "delete"]
    filepath: string,
    errorMsg?: string

}

export type Volume = {
    collectionName: string,
    volumeName: string,
    nbPages: number,
    filesize: number,
    cover: string,
}