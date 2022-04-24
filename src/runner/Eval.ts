function sanitize(script: string): string{
    if(/import.*from/.test(script)) throw new Error("unsafe script "+script);
    if(/require\W*\(.*\)/.test(script)) throw new Error("unsafe script "+script);
    return script
}

export function evaluate(script: string, context: any): any {
    script = sanitize(script);
    let evalScript = `{${
        Object.keys(context).map(key=>`const ${key}=${JSON.stringify(context[key])};`).join("")
    }${script}}`;
    return eval(evalScript);
}