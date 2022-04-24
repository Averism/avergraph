import { strictEqual, throws } from "assert";
import { evaluate } from "../src/runner/Eval";

describe("eval", ()=>{
    it("should evaluate correctly", ()=>{
        strictEqual(evaluate("a+b+c",{a:1, b:2, c:3}),6);
        let r = evaluate("Math.random()*c",{a:1, b:2, c:3});
        strictEqual(r>0 && r<3,true);
    })
    it("should sanitize import correctly", ()=>{
        throws(()=>evaluate('import { readdirSync } from "fs"; readdirSync(.)',{a:1, b:2, c:3}));
        throws(()=>evaluate('const fs = require("fs"); console.log(fs.readdirSync("."))',{a:1, b:2, c:3}));
    })
});