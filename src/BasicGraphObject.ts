import Hookable from "./Hookable";
import { Propable, BasicProps, Props } from "./Propable";
const keyIndex=["id","class","vIn","vOut","edgeType","source","target","props"];


export default abstract class BasicGraphObject implements Propable {
    props: BasicProps;
    hook: Hookable;
    setProp(key: string, value: string): void {
        if(!this.props) this.props = new BasicProps(key, value);
        else this.props.set(key,value);
        if(this.hook) this.hook.callHook("addProp",this,key);
    }
    getProp(key: string): string {
        if(!this.props) return;
        return this.props.get(key);
    }
    deleteProp(key: string): boolean {
        if(!this.props) return false;
        if(Object.keys(this.props.items).length==1 && typeof this.props.get(key) !== "undefined") 
            return delete this.props;
        if(this.hook) this.hook.callHook("removeProp",this,key);
        return this.props.delete(key);
    }
    getProps(): Props {
        return this.props;
    }
    abstract getId(): string;
}