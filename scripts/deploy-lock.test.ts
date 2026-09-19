import { test, expect } from "bun:test";
import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
const helper = resolve("scripts/deploy-lock.sh");
const pause = () => new Promise(r => setTimeout(r, 10));
test("contender cannot acquire or remove another deployment's regular-file lock", async () => {
 const dir=mkdtempSync(join(tmpdir(),"deploy-lock-")), lock=join(dir,"lock"), ready=join(dir,"ready");
 const owner=spawn("bash",["-c",'source "$1"; acquire_deploy_lock "$2" || exit; touch "$3"; read -r finish',"test",helper,lock,ready]);
 try {
  for(let i=0;i<200&&!existsSync(ready);i++) await pause(); expect(existsSync(ready)).toBe(true);
  const original=readFileSync(lock,"utf8");
  const contender=Bun.spawnSync(["bash","-c",'source "$1"; acquire_deploy_lock "$2"',"test",helper,lock]);
  expect(contender.exitCode).toBe(1);expect(readFileSync(lock,"utf8")).toBe(original);
  const done=new Promise(r=>owner.on("exit",r));owner.stdin.end("done\n");await done;expect(existsSync(lock)).toBe(false);
 } finally {owner.kill();rmSync(dir,{recursive:true,force:true});}
});
test("cleanup refuses a replacement lock it does not own", () => {
 const dir=mkdtempSync(join(tmpdir(),"deploy-lock-")),lock=join(dir,"lock");
 const result=Bun.spawnSync(["bash","-c",'source "$1"; acquire_deploy_lock "$2"; rm "$2"; printf replacement > "$2"',"test",helper,lock]);
 expect(result.exitCode).toBe(0);expect(readFileSync(lock,"utf8")).toBe("replacement");rmSync(dir,{recursive:true});
});
