export default interface Hookable {
    callHook(fnName: string, ...params: any[]): any;
}