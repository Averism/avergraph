import { existsSync, mkdirSync } from "fs";
import { readdir, readFile, unlink, writeFile } from "fs/promises";
import { resolve } from "path";
import { KeyValuePersistance, PersistanceAccessor } from "./GraphSerializer";

export default class FilePersistor implements PersistanceAccessor {
    basePath: string;
    
    constructor(basePath: string) {
        this.basePath = basePath;
    }

    async doPersist(key: string[], value: string): Promise<void> {
        let p = Array.from(key);
        p.pop();
        let pString = resolve(this.basePath, ...p);
        if(!existsSync(pString)) mkdirSync(pString, {recursive: true});
        return writeFile(resolve(this.basePath,...key), value);
    }
    revert(key: string[]): Promise<void> {
        return unlink(resolve(this.basePath,...key));
    }
    load(key: string[]): Promise<KeyValuePersistance> {
        let v = readFile(resolve(this.basePath,...key));
        return new Promise((res, rej)=>{
            v.then(x=>{res({key, value: x.toString()})})
            .catch(e=>rej(e))
        });
    }
    async getKeys(): Promise<string[][]> {
        let vFiles = readdir(resolve(this.basePath,"vertex"))
        let eFiles = readdir(resolve(this.basePath,"edge"))
        return [
            ...(await vFiles).map(x=>["vertex",x]),
            ...(await eFiles).map(x=>["edge",x])
        ]
    }
    
}